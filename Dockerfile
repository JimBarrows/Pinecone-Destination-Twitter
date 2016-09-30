FROM node

ARG NPM_TOKEN
ENV NODE_ENV="production"

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY node_modules /usr/src/app/node_modules
COPY index.js /usr/src/app
COPY configurations.js /usr/src/app

CMD [ "npm", "start" ]