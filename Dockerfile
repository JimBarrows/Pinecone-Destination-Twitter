FROM node

ARG NPM_TOKEN
ENV NODE_ENV="production"

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .
COPY index.js .
COPY configurations.js .
COPY .npmrc .npmrc

RUN npm install --production --no-optional
RUN rm -f .npmrc


CMD [ "npm", "start" ]