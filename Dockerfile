FROM node:9.8.0

USER root

ADD package.json yarn.lock /
RUN yarn install
RUN ln -f -s /node_modules/.bin/* /usr/local/bin/
WORKDIR /app
