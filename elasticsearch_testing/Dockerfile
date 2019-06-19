FROM node:8

COPY package.json package-lock.json* jest.config.js jest.setup.js babel.config.js ./
RUN mkdir elasticsearch-data
RUN mkdir gateways
COPY elasticsearch-data ./elasticsearch-data
COPY gateways ./gateways
RUN npm install && npm cache clean --force


CMD [ "node_modules/.bin/jest", "--verbose", "--coverage", "--detectOpenHandles" ] 