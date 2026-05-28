---
name: Financial Transaction Operation
description: "Generate or review a financial transaction operation for immutable-ledger systems. Use for debit, credit, reversal, compensation, settlement, idempotent commands, and Kafka event publication."
argument-hint: "Describe the operation, actors, amount, currency, and business rule"
agent: "agent"
---

Generate a production-grade financial operation for this repository's architecture.

## Required behavior
- Answer the user in Portuguese.
- Generate repository artifacts in English.
- Treat the ledger as append-only.
- Never mutate financial history with `UPDATE` or `DELETE`.
- Require idempotency for any write with financial effects.
- Derive balances from transaction history, not mutable state.
- Prefer NestJS, TypeScript, Prisma, PostgreSQL, Kafka, and Redis when relevant.

## Task
Based on the user input, produce the requested operation, such as:
- debit
- credit
- reversal
- compensation
- transfer
- settlement

## Output contract
1. Brief architectural explanation in Portuguese.
2. English repository artifacts only when needed, such as:
- DTOs
- command handlers or services
- Prisma models
- event contracts
- controller or resolver endpoints
- sequence of append-only ledger entries
3. Explicit notes on:
- idempotency strategy
- concurrency handling
- event publication
- failure and compensation flow

## Quality bar
- Production-oriented output only
- No mutable financial state as source of truth
- No tight synchronous dependency chain for critical financial flow
- Prefer compensating transactions over in-place correction