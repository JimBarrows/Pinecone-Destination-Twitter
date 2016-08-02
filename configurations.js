'use strict';

export  default {
	development: {
		mongoose: {
			url: 'mongodb://localhost/pinecone'
		},
		rabbitMq: {
			url: 'amqp://localhost',
			queueName: 'twitter'
		},
		twitter: {
			consumer_key: 'CEmmg8lwj4OQsTEw9orBF7VAc',
			consumer_secret: 'YrKdLxTB74VPrg1o4wsaK8moPEKG4bNmK6vawvlAgmSUoVuGBY',
		}
	},
	production: {
		mongoose: {
			url: 'mongodb://mongo/pinecone'
		},
		rabbitMq: {
			url: 'amqp://rabbitmq',
			queueName: 'twitter'
		},
		twitter: {
			consumer_key: 'CEmmg8lwj4OQsTEw9orBF7VAc',
			consumer_secret: 'YrKdLxTB74VPrg1o4wsaK8moPEKG4bNmK6vawvlAgmSUoVuGBY',
		}
	}
}