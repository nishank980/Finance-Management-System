FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . ./
EXPOSE 3004
CMD ["node", "services/budget/server.js"]