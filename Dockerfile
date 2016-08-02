FROM node

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY node_modules /usr/src/app/node_modules
COPY index.js /usr/src/app
COPY configurations.js /usr/src/app

ENV NODE_ENV="production"

CMD [ "npm", "start" ]