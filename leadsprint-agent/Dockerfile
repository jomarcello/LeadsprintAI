FROM node:18-alpine

WORKDIR /app

# Install git and other dependencies
RUN apk add --no-cache git openssh-client rsync

# Copy package.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Set default environment variables
ENV NODE_ENV=production

# Start the agent
CMD ["node", "autonomous-agent.js"]