# Description

A finance ledger project developed with NestJS and TypeScript, following a direction that includes Kafka, GraphQL, and microservices architecture.

## Dependency Versions

- npm: 11.12.1
- nvm: 1.2.2
- node: 24.15.0

## Project Setup

```bash
npm install
```

> `postinstall` runs `prisma generate`, producing the Prisma 7 client in
> `src/generated/prisma` (git-ignored). Behind a TLS-intercepting corporate
> proxy, the Prisma engine download may fail with a self-signed certificate
> error; set `NODE_EXTRA_CA_CERTS` to your corporate CA bundle (preferred) or,
> as a local-only workaround, `NODE_TLS_REJECT_UNAUTHORIZED=0` for the install.

## Database

PostgreSQL is the source of truth. The ledger is append-only: records are never
updated or deleted, and corrections are modeled as new compensating
transactions. Balances are derived from the posting history, never stored as a
mutable column.

```bash
# 1. Configure the connection (see .env.example)
cp .env.example .env   # then set DATABASE_URL

# 2. Regenerate the Prisma client (also runs on postinstall)
npm run prisma:generate

# 3. Apply migrations
npm run db:deploy      # production: applies prisma/migrations
npm run db:migrate     # development: create/apply a new migration
```

Prisma 7 is "Rust-free": the runtime client connects through the
`@prisma/adapter-pg` driver adapter, and connection URLs live in
`prisma.config.ts` (not in `schema.prisma`).

## Compile and Run

```bash
# build
npm run build

# development
npm run start

# watch mode
npm run start:dev

# debug mode
npm run start:debug

# production mode
npm run start:prod
```

## Lint and Format

```bash
# lint
npm run lint

# format
npm run format
```

## Run Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## API

Interactive Swagger UI is served at `http://localhost:3000/docs`.

### Command Service — Transactions

Append a transaction to the immutable ledger (CQRS write side).

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 1f3c9b6e-7a2d-4e51-9b0a-2c8d4e6f1a23" \
  -d '{
    "type": "TRANSFER",
    "sourceAccountId": "acc_checking_001",
    "destinationAccountId": "acc_savings_002",
    "amount": 1000,
    "currency": "USD"
  }'
```

- `amount` is an integer in the currency minor units (e.g. cents).
- The `Idempotency-Key` header is **required**. Replaying the same key returns
  the originally posted transaction (HTTP `200`) instead of creating a duplicate
  (first post returns HTTP `201`).
- Each transaction writes balanced double-entry ledger lines (one `DEBIT`, one
  `CREDIT`) atomically.

## Run with Docker

```bash
# build image
docker build -t finance-ledger:local .

# run container
docker run --rm -p 3000:3000 --name finance-ledger finance-ledger:local
```

The API will be available at `http://localhost:3000`.

## Run Published Image from Docker Hub

```bash
docker pull caiohseniuk/finance-ledger:v.0.0.1
docker run --rm -p 3000:3000 caiohseniuk/finance-ledger:v0.0.1
```

