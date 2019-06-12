# Heads-Up: This Dockerfile is *exclusively* used for CI. It is referenced by
# Jenkinsfile and should not be used by any other means.

FROM node:10.12.0

USER root

RUN curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose
COPY package.json package-lock.json pnpm-lock.yaml /
RUN npm install
RUN ln -f -s /node_modules/.bin/* /usr/local/bin/
WORKDIR /app
