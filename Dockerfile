FROM node:18-alpine
WORKDIR /app

# Copy server package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ .

# Build the server
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]