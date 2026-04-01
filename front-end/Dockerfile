FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npx", "vite", "web", "--config", "web/vite.config.mts", "--host", "0.0.0.0"]
