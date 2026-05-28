---
name: Worker Service Guidelines
description: "Use when writing worker-side financial processing, Kafka consumers, asynchronous ledger pipelines, compensation handlers, retries, or event-driven background execution in a fintech system."
applyTo: ["apps/worker-service/**", "services/worker-service/**", "src/worker-service/**"]
---

# Worker Service Guidelines

- Treat workers as asynchronous processors of durable business events.
- Make handlers idempotent and replay-safe.
- Model compensation explicitly for downstream failures.
- Avoid hidden coupling to request-time transactions.
- Preserve event ordering assumptions only when technically guaranteed.
- Record processing state without mutating ledger history.
- Keep side effects observable and auditable.

## Expected Output
- Portuguese explanation to the user.
- English code and repository artifacts.

## Avoid
- Non-idempotent consumers
- Business-critical flows that depend on cache correctness
- Implicit exactly-once claims without infrastructure support