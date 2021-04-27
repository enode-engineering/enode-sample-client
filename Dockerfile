FROM node:lts-buster as base

WORKDIR /sample-client

COPY tsconfig.json .
COPY package.json .
COPY package-lock.json .
COPY nodemon.json .
COPY config/custom-environment-variables.json config/custom-environment-variables.json
COPY src src
COPY views views

FROM node:lts-buster as base-dev
COPY --from=base /sample-client /sample-client
WORKDIR /sample-client
ARG GH_TOKEN
RUN echo "@enode-engineering:registry=https://npm.pkg.github.com/\n//npm.pkg.github.com/:_authToken=\${GH_TOKEN}" > .npmrc
RUN npm ci && rm .npmrc

FROM node:lts-buster as dev
COPY --from=base-dev /sample-client /sample-client
COPY ./docker_utils/wait-for-it.sh /usr/bin/wait-for-it.sh
WORKDIR /sample-client

FROM node:lts-buster as base-prod
COPY --from=base /sample-client /sample-client
WORKDIR /sample-client
COPY docker_utils/npmrc .npmrc
ARG GH_TOKEN
RUN npm ci --production && rm .npmrc

FROM node:lts-buster as production
COPY --from=base-prod /sample-client /sample-client
WORKDIR /sample-client
