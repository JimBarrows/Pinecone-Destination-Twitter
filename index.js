/**
 * Created by JimBarrows on 7/8/16.
 */
'use strict';
import amqp from "amqplib";
import moment from "moment";
import mongoose from "mongoose";
import promise from "bluebird";
import Account from "pinecone-models/src/Account";
import Content from "pinecone-models/src/Content";
import Channel from "pinecone-models/src/Channel";

mongoose.Promise = promise;
mongoose.connect('mongodb://localhost/pinecone');

const queueName  = 'twitter';
const connection = amqp.connect('amqp://localhost');
const channel    = connection.then((conn) =>conn.createChannel());

require('es6-promise').polyfill();
require('promise.prototype.finally');

promise.join(connection, channel, (con, ch) => {
			ch.assertQueue(queueName, {durable: true})
					.then(() => ch.consume(queueName, function (msg) {

								let transmissionReport           = {
									timeStart: moment()
								};
								let contentId                    = msg.content.toString();
								let contentFindbyIdPromise       = Content.findById(mongoose.Types.ObjectId(contentId));
								let findChannelForContentPromise = contentFindbyIdPromise.then((content)=>Channel.findById(content.channel));
								let accountPromise               = contentFindbyIdPromise.then((content) => Account.findById(content.owner));

								promise.join(contentFindbyIdPromise, findChannelForContentPromise, accountPromise, (content, channel, account) => {
									if (channel) {

										channel.twitterDestinations.forEach((destination) => {
											transmissionReport.channel     = channel._id;
											transmissionReport.destination = destination._id;
											transmissionReport.status      = 'started';
										});

									} else {
										transmissionReport.timeEnd = moment();
										transmissionReport.status  = "failure";
										transmissionReport.error   = "No channel provided.";
										content.transmissionReports.push(transmissionReport);
										content.save()
												.then((updatedContent) => {
													if (updatedContent.status === "failure") {
														channel.reject(msg, false);
													}
												});
									}
								});
							},
							{
								noAck: true
							}
					))
		})
		.catch((error) => console.log("Error receiving twitter: ", error));
