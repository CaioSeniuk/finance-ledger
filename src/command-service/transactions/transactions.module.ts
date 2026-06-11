import { Module } from '@nestjs/common';
import { TransactionsController } from '#src/command-service/transactions/transactions.controller';
import { TransactionsService } from '#src/command-service/transactions/transactions.service';

/**
 * Command-side bounded context for transaction intake (CQRS write model).
 * Owns the authoritative append-only ledger writes.
 */
@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
