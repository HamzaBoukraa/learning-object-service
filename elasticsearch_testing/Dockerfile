FROM node:8

COPY package.json jest.config.js jest.setup.js babel.config.js /opt/app/
WORKDIR /opt/app/
RUN mkdir elasticsearch-data
RUN mkdir gateways
COPY elasticsearch-data ./elasticsearch-data
COPY gateways ./gateways
RUN npm install && npm cache clean --force
RUN ls

CMD npm test