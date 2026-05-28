---
name: Query Service Guidelines
description: "Use when writing query-side financial APIs, GraphQL read models, reports, statements, balance projections, or read-optimized services derived from an immutable ledger."
applyTo: ["apps/query-service/**", "services/query-service/**", "src/query-service/**"]
---

# Query Service Guidelines

- Treat read models as derived views, never as the primary source of truth.
- Optimize for queries, reports, and statements without feeding mutable state back into write logic.
- Make it clear when data may be eventually consistent.
- Use cache as an accelerator, not as an authority.
- Keep projections reproducible from ledger history or durable events.
- Prefer GraphQL or dedicated read APIs for complex reporting scenarios.

## Expected Output
- Portuguese explanation to the user.
- English code and repository artifacts.

## Avoid
- Writing business mutations from query handlers
- Treating cached balances as canonical truth
- Hiding projection lag or staleness semantics