# Use an official Node runtime as a parent image (alpine tag is lighter-weight)
FROM node:8.7.0-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the files needed for production into the container at /app
ADD package.json .
ADD taxonomy.json taxonomy.json
ADD js js/

# Install any needed packages specified in package.json
RUN npm install --only=prod

# set default values for clark environment variables
#   change at runtime with "-e key=value" options
ENV CLARK_DB="172.17.0.2:27017"

# NOTE: consider using "-e NODE_ENV=production" for live instances

# Make port 3000 available to the world outside this container
# TODO: decide which port lo-suggestion should use
EXPOSE 3000

# Run app when the container launches
# TODO: ultimately this should be 'npm start' which package.json
#       should configure to run 'node lo-suggestion.service.js'.
#       But for now package.json is still targeted at development convenience.
CMD ["npm", "start"]