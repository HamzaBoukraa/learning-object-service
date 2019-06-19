FROM node:8

RUN mkdir -p /opt

WORKDIR /opt
COPY package.json package-lock.json* jest.config.js jest.setup.js babel.config.js ./
RUN mkdir elasticsearch-data
RUN mkdir gateways
COPY elasticsearch-data ./elasticsearch-data
COPY gateways ./gateways
RUN ls
RUN npm install && npm cache clean --force

# Jest will automatically set NODE_ENV to testing

RUN npm test