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

