FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && \
    mkdir -p app && \
    cd app && \
    curl -L -o patapp.tar.gz https://github.com/timothywashburn/pat-app/releases/latest/download/patapp.tar.gz && \
    tar -xzf patapp.tar.gz && \
    rm patapp.tar.gz

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm run install:all

COPY . .

RUN cd server && npm run build
CMD ["npm", "start"]