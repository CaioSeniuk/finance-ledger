---
name: Command Service Guidelines
description: "Use when writing command-side financial flows, REST write endpoints, transaction intake, idempotent commands, append-only ledger persistence, or NestJS command services in a fintech system."
applyTo: ["apps/command-service/**", "services/command-service/**", "src/command-service/**"]
---

# Command Service Guidelines

- Accept intent to write, not derived state mutations.
- Require idempotency keys for every financial write.
- Validate DTOs before any side effect.
- Persist append-only ledger entries as the source of truth.
- Never update balances directly as authoritative state.
- Publish downstream events only after durable write guarantees are satisfied.
- Prefer explicit domain commands and invariants over generic CRUD handlers.
- Surface concurrency strategy clearly when multiple writes may race.

## Expected Output
- Portuguese explanation to the user.
- English code and repository artifacts.

## Avoid
- CRUD-style mutation of financial records
- Silent retry behavior without idempotency guarantees
- Controllers containing business rules