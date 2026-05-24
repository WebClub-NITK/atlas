# Use node.js as base image
FROM node:23.1-alpine3.19

# Install pnpm (pinned to v9 for Node 23.1 compatibility)
RUN npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Copy package files and pnpm lock
COPY package.json pnpm-lock.yaml ./

# INstall dependencies
RUN pnpm install --no-frozen-lockfile

# Copy rest of the application
COPY . .

RUN pnpm run build

#  Expose port for frontend
EXPOSE 4173

# Start frontend
CMD ["pnpm","run","preview","--host"]
