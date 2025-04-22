# Use the official Node.js 16 image as the base image
FROM node:16

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port from the .env file
ARG PORT
ENV PORT=$PORT
EXPOSE $PORT

# Start the application
CMD ["npm", "run", "start"]
