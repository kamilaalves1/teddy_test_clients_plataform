# Front-end — Teddy Client Manager

React + Vite + TypeScript

## Pré-requisitos

- Node.js 20+

## Setup

```bash
copy .env.example .env
```

## Rodar em desenvolvimento

```bash
# Na raiz do monorepo:
npm run dev:web
```

Acesse: http://localhost:5173

## Build

```bash
npm run build:web
```

O build é gerado em `front-end/dist/`.

## Testes

```bash
npm run test:web
npm run test:e2e
```

## Rotas

| Rota                | Descrição             |
| ------------------- | --------------------- |
| `/`                 | Login                 |
| `/register`         | Cadastro              |
| `/home`             | Dashboard             |
| `/clients`          | Lista de clientes     |
| `/selected-clients` | Clientes selecionados |
