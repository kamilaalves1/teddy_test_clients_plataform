# Back-end — Teddy Client Manager

API NestJS com autenticação JWT, gestão de clientes e observabilidade básica.

## Dependências de runtime

- PostgreSQL
- Variáveis de ambiente definidas em `.env`

## Setup local

```bash
copy .env.example .env
docker compose up -d postgres
```

## Subir a API

```bash
npm run build:api
npm run start:api
```

## Migrations

O fluxo atual usa o `data-source` compilado em JavaScript, sem depender de
`ts-node`.

```bash
npm run migration:show
npm run migration:run
npm run migration:revert
```

## Endpoints expostos

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `GET /v1/clients`
- `POST /v1/clients`
- `GET /v1/clients/:id`
- `PUT /v1/clients/:id`
- `DELETE /v1/clients/:id`
- `GET /healthz`
- `GET /metrics`
- `GET /docs`

## Observabilidade

- Logs JSON com `requestId`, operação normalizada e contexto de domínio.
- Métricas Prometheus em `/metrics`.
- Tracing OpenTelemetry quando `OTEL_ENABLED=true`.

## Testes

```bash
npm run test:api
```
