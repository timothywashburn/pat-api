FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm run install:all

COPY . .

RUN mkdir -p /etc/nginx
COPY nginx.conf /etc/nginx/nginx.conf

CMD ["npm", "start"]