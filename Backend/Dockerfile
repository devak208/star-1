FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy the entrypoint script from src/lib/ to /app
COPY src/lib/entrypoint.sh /app/entrypoint.sh

# Set permissions for the entrypoint script
RUN chmod +x /app/entrypoint.sh

# Default entrypoint (this will be overridden by docker-compose if needed)
ENTRYPOINT ["/bin/sh", "-c", "/app/entrypoint.sh"]
