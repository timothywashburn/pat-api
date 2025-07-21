FROM node:18-alpine
WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy server source
COPY server/ .

# Build the server
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

EXPOSE 3000
CMD ["npm", "start"]