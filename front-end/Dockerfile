FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build:web

FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/front-end/dist ./front-end/dist

EXPOSE 5173

CMD ["serve", "-s", "front-end/dist", "-l", "5173"]
