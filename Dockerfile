# Use an official Node runtime as a parent image (alpine tag is lighter-weight)
FROM node:8.7.0-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the files needed for production into the container at /app
ADD package.json .
ADD config config
ADD taxonomy.json taxonomy.json
ADD js .

# Install any needed packages specified in package.json
# TODO: It may be more 'correct' to leave off the --only flag
#       and set NODE_ENV to 'production' (whatever *that* means)
# I think it's something like this, but no guarantees:
#   ENV NODE_ENV=production
RUN npm install --only=prod

# Make port 3000 available to the world outside this container
# TODO: decide which port lo-suggestion should use
EXPOSE 3000

# Run app when the container launches
# TODO: ultimately this should be 'npm start' which package.json
#       should configure to run 'node lo-suggestion.service.js'.
#       But for now package.json is still targeted at development convenience.
CMD ["node", "script/lo-suggestion.service.js"]