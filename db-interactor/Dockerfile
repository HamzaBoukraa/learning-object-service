# Use an official Node runtime as a parent image (alpine tag is lighter-weight)
FROM node:alpine

# Set the working directory to /app
WORKDIR /app

# Copy all required JavaScript files from dist into root
ADD dist/*.js* ./
ADD dist/db-interactor/ db-interactor/
ADD dist/entity/ entity/
ADD dist/schema/ schema/
ADD dist/taxonomy/ taxonomy/
# Copy any other required files
ADD taxonomy/taxonomy.json taxonomy/

# Install any needed packages specified in package.json
ENV NODE_ENV=production
ADD package.json .
# alpine is so light-weight we need to add a couple things for our dependencies to work
RUN apk add --no-cache --virtual .gyp python make g++
RUN npm install
RUN apk del .gyp

# set default values for clark environment variables
#   change at runtime with "-e key=value" options
ENV CLARK_DB_IP="172.17.0.2"
ENV CLARK_DB_PORT="27017"
ENV CLARK_DB_INTERACTOR_PORT="27016"

# NOTE: consider using "-e NODE_ENV=production" for live instances

# run the scripts to setup the database
CMD ["node", "db-interactor/db-interaction.service.js"]