# Use the official Node.js 20 slim image as the base
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present) to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose port 3000 (assuming a web server or API for the marketplace)
EXPOSE 3000

# Define the command to run the application
CMD ["node", "src/index.js"]
