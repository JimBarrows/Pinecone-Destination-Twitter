/**
 * Created by JimBarrows on 7/23/16.
 */
'use strict';
import Account from "pinecone-models/src/Account";
import amqp from "amqplib";
import axios from "axios";
import Channel from "pinecone-models/src/Channel";
import Content from "pinecone-models/src/Content";
import moment from "moment";
import promise from "bluebird";

const queueName = 'twitter';

describe("Twitter posting services", function () {

	let defaultUser = {
		username: "ChesterTester@testy.com",
		password: "ChestyTesty"
	};

	beforeAll((done) => {
		Account.remove({})
				.then(() => Channel.remove({}))
				.then(() => Content.remove({}))
				.then(() => done())
				.catch((error)=> console.log("Error: ", error));
	});

	beforeEach(function (done) {
		this.axios = axios.create({
			baseURL: 'http://localhost:3000/api',
			timeout: 10000
		});

		this.axios.post('/user/register', defaultUser)
				.then((response) => {
					if (!this.axios.defaults.headers) {
						this.axios.defaults.headers = {}
					}
					this.axios.defaults.headers.cookie = response.headers['set-cookie'];
					this.user                          = response.data;
				})
				.then(()=> Channel.create({
							name: "Twitter Test Channel",
							owner: this.user.id,
							twitterDestinations: [{
								name: "Test twitter destination",
								ownerId: "124838668",
								owner: "Jim_Barrows",
								accessToken: "124838668-ODhcaZyYl4wcAUxdihxOP0OAvKHZTC4GOzj2VyW1",
								accessTokenSecret: "Y8yhdbBh2nlwub2fPBVSCXVi2iLHbgfh1idKEE3QUCg6K"
							}]
						})
				)
				.then((newChannel) => {
					this.channel = newChannel;
					return Content.create({
						body: "This is a test body ",
						channel: this.channel._id,
						owner: this.user.id,
						publishDate: moment(),
						slug: "bug",
						title: "This is not a test title.",
						twitter: {
							status: "This is a test"
						}
					});

				})
				.then((newContent)=> {
					this.content = newContent;
				})
				.then(()=> done())
				.catch((error) => console.log("Twitter posting services: ", error));

	});

	it("should send content to twitter", function (done) {

		const connectionPromise = amqp.connect('amqp://localhost');
		const channelPromise    = connectionPromise.then((connection) =>connection.createChannel());
		promise.join(connectionPromise, channelPromise, (connection, channel) => {
			channel.sendToQueue(queueName, new Buffer(this.content._id.toString()));
			return channel.close().finally(() =>connection.close()).finally(()=> done());
		});
	});
});
