# Use node.js as base image
FROM node:20-slim

# Install pnpm 
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files and pnpm lock
COPY package.json pnpm-lock.yaml ./

# INstall dependencies
RUN pnpm install

# Copy rest of the application
COPY . .

#  Expose port for frontend
EXPOSE 3000

# Start frontend
CMD ["pnpm","run","dev","--host"]