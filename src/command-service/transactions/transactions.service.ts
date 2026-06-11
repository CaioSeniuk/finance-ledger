import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EntryDirection, Prisma } from '#src/generated/prisma/client';
import { PrismaService } from '#src/prisma/prisma.service';
import { CreateTransactionDto } from '#src/command-service/transactions/dto/create-transaction.dto';
import { TransactionWithEntries } from '#src/command-service/transactions/dto/transaction-response.dto';

/** Result of a write, flagging whether it was a fresh post or an idempotent replay. */
export interface PostTransactionResult {
  transaction: TransactionWithEntries;
  replayed: boolean;
}

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/**
 * Append-only transaction intake.
 *
 * Invariants enforced here:
 * - The ledger is immutable: we only ever INSERT a transaction together with
 *   its double-entry lines, never UPDATE/DELETE financial history.
 * - Idempotency: the unique `idempotencyKey` is the guard against duplicate
 *   financial effects under client retries / network instability. A replay
 *   returns the already-posted transaction instead of creating a new one.
 * - Atomicity: the transaction and its entries are written in a single nested
 *   write, so a partial posting can never be observed.
 */
@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async postTransaction(
    dto: CreateTransactionDto,
    idempotencyKey: string,
  ): Promise<PostTransactionResult> {
    if (dto.sourceAccountId === dto.destinationAccountId) {
      throw new BadRequestException(
        'sourceAccountId and destinationAccountId must be different',
      );
    }

    const amount = BigInt(dto.amount);

    try {
      const transaction = await this.prisma.transaction.create({
        data: {
          idempotencyKey,
          type: dto.type,
          sourceAccountId: dto.sourceAccountId,
          destinationAccountId: dto.destinationAccountId,
          amount,
          currency: dto.currency,
          ...(dto.metadata !== undefined
            ? { metadata: dto.metadata as Prisma.InputJsonValue }
            : {}),
          entries: {
            create: [
              {
                accountId: dto.sourceAccountId,
                direction: EntryDirection.DEBIT,
                amount,
                currency: dto.currency,
              },
              {
                accountId: dto.destinationAccountId,
                direction: EntryDirection.CREDIT,
                amount,
                currency: dto.currency,
              },
            ],
          },
        },
        include: { entries: true },
      });

      return { transaction, replayed: false };
    } catch (error) {
      if (this.isIdempotentReplay(error)) {
        const existing = await this.prisma.transaction.findUnique({
          where: { idempotencyKey },
          include: { entries: true },
        });

        if (existing) {
          this.logger.warn(
            `Idempotent replay for key ${idempotencyKey}; returning existing transaction ${existing.id}`,
          );
          return { transaction: existing, replayed: true };
        }
      }

      throw error;
    }
  }

  private isIdempotentReplay(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_CONSTRAINT_VIOLATION
    );
  }
}
