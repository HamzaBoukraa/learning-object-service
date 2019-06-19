# Anything beyond local dev should pin this to a specific version at https://hub.docker.com/_/node/
FROM node:8

ARG ELASTIC_SEARCH_TEST_NODE_URI

RUN mkdir -p /opt

WORKDIR /opt
COPY package.json package-lock.json* jest.config.js jest.setup.js babel.config.js ./
RUN npm install && npm cache clean --force

WORKDIR /opt/app
COPY . /opt/app

ARG KEY=TEST_SECRET
ARG ISSUER=TEST_ISSUER

WORKDIR /opt
ARG NODE_ENV=development
RUN npm test


ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=80
ENV PORT $PORT
EXPOSE $PORT 5858 9229

WORKDIR /opt/app/dist

CMD [ "npm", "test" ] 