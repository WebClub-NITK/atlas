# Use node.js as base image (Node 22 LTS: ships node:sqlite, which pnpm needs)
FROM node:22-alpine

# Install pnpm — pinned to match the committed lockfile (v9.0) and local toolchain
RUN npm install -g pnpm@11.5.1

# Set working directory
WORKDIR /app

# Copy package files, pnpm lock and workspace config (build-script approvals)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# INstall dependencies
RUN pnpm install

# Copy rest of the application
COPY . .

# Cap V8's heap so the Vite build uses the available RAM instead of V8's
# (lower) in-container default. Raise this if you give Docker more memory.
RUN NODE_OPTIONS=--max-old-space-size=768 pnpm run build

#  Expose port for frontend
EXPOSE 4173

# Start frontend
CMD ["pnpm","run","preview","--host"]
