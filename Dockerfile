FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN cp -r public dist/
RUN npm prune --production

EXPOSE 3000
CMD ["npm", "start"]