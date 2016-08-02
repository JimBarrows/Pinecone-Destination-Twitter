/**
 * Created by JimBarrows on 7/8/16.
 */
'use strict';
import amqp from "amqplib";
import moment from "moment";
import mongoose from "mongoose";
import promise from "bluebird";
import Twitter from "twitter";
import Account from "pinecone-models/src/Account";
import Content from "pinecone-models/src/Content";
import Channel from "pinecone-models/src/Channel";
import Configuration from "./configurations";

const env    = process.env.NODE_ENV || "development";
const config = Configuration[env];

console.log("config: ", config);

mongoose.Promise = promise;
mongoose.connect(config.mongoose.url);

const connection = amqp.connect(config.rabbitMq.url);
const channel    = connection.then((conn) =>conn.createChannel());

require('es6-promise').polyfill();
require('promise.prototype.finally');

promise.join(connection, channel, (con, ch) => {
			ch.assertQueue(config.rabbitMq.queueName, {durable: true})
					.then(() => ch.consume(config.rabbitMq.queueName, function (msg) {

								let transmissionReport           = {
									timeStart: moment()
								};
								let contentId                    = msg.content.toString();
								let contentFindbyIdPromise       = Content.findById(mongoose.Types.ObjectId(contentId));
								let findChannelForContentPromise = contentFindbyIdPromise.then((content)=>Channel.findById(content.channel));
								let accountPromise               = contentFindbyIdPromise.then((content) => Account.findById(content.owner));

								promise.join(contentFindbyIdPromise, findChannelForContentPromise, accountPromise, (content, channel, account) => {
									if (!content) {
										console.log("Content with id ", contentId, " could not be found.  Message was: ", msg);
									}
									if (channel && account) {

										channel.twitterDestinations.forEach((destination) => {
											transmissionReport.channel     = channel._id;
											transmissionReport.destination = destination._id;
											transmissionReport.status      = 'started';
											let {consumer_key, consumer_secret} = config.twitter;
											const client                   = new Twitter({
												consumer_key,
												consumer_secret,
												access_token_key: destination.accessToken,
												access_token_secret: destination.accessTokenSecret

											});
											client.post('statuses/update', {status: content.twitter.status}, (error, tweet, response) => {
												if (error) {
													console.log("Twitter error ", error);
													transmissionReport.timeEnd = moment();
													transmissionReport.status  = "failure";
													transmissionReport.error   = error;
												} else {
													console.log("Twitter response: ", response);
													transmissionReport.timeEnd = moment();
													transmissionReport.status  = "success";
												}
												content.transmissionReports.push(transmissionReport);
												content.save()
														.then((updatedContent) => {
															if (updatedContent.status === "failure") {
																channel.reject(msg, false);
															}
														});
											})

										});

									} else {
										transmissionReport.timeEnd = moment();
										transmissionReport.status  = "failure";
										transmissionReport.error   = "No channel or account found for conent " + contentId + "message: " + JSON.stringify(msg);
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
