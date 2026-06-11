import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  EntryDirection,
  LedgerEntry,
  Transaction,
  TransactionStatus,
} from '#src/generated/prisma/client';

/** A Transaction aggregate loaded together with its immutable ledger entries. */
export type TransactionWithEntries = Transaction & { entries: LedgerEntry[] };

/** Serializable view of a single immutable double-entry ledger line. */
export class LedgerEntryResponseDto {
  @ApiProperty({ example: '6f9619ff-8b86-d011-b42d-00cf4fc964ff' })
  id!: string;

  @ApiProperty({ example: 'acc_checking_001' })
  accountId!: string;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'], example: 'DEBIT' })
  direction!: EntryDirection;

  @ApiProperty({
    description: 'Amount in minor units, serialized as a string (BigInt-safe).',
    example: '1000',
  })
  amount!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/**
 * Serializable view of a posted transaction. BigInt amounts are exposed as
 * strings so the JSON contract stays precise and portable.
 */
export class TransactionResponseDto {
  @ApiProperty({ example: '6f9619ff-8b86-d011-b42d-00cf4fc964ff' })
  id!: string;

  @ApiProperty({
    description: 'Idempotency key that uniquely identifies this write intent.',
    example: 'b3f1c2d4-...-key',
  })
  idempotencyKey!: string;

  @ApiProperty({ example: 'TRANSFER' })
  type!: string;

  @ApiProperty({ enum: ['POSTED'], example: 'POSTED' })
  status!: TransactionStatus;

  @ApiProperty({ example: 'acc_checking_001' })
  sourceAccountId!: string;

  @ApiProperty({ example: 'acc_savings_002' })
  destinationAccountId!: string;

  @ApiProperty({
    description: 'Amount in minor units, serialized as a string (BigInt-safe).',
    example: '1000',
  })
  amount!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: [LedgerEntryResponseDto] })
  entries!: LedgerEntryResponseDto[];

  /** Maps a persisted aggregate to its API representation (BigInt -> string). */
  static fromEntity(tx: TransactionWithEntries): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = tx.id;
    dto.idempotencyKey = tx.idempotencyKey;
    dto.type = tx.type;
    dto.status = tx.status;
    dto.sourceAccountId = tx.sourceAccountId;
    dto.destinationAccountId = tx.destinationAccountId;
    dto.amount = tx.amount.toString();
    dto.currency = tx.currency;
    dto.metadata = (tx.metadata as Record<string, unknown> | null) ?? null;
    dto.createdAt = tx.createdAt;
    dto.entries = tx.entries.map((entry) => {
      const entryDto = new LedgerEntryResponseDto();
      entryDto.id = entry.id;
      entryDto.accountId = entry.accountId;
      entryDto.direction = entry.direction;
      entryDto.amount = entry.amount.toString();
      entryDto.currency = entry.currency;
      entryDto.createdAt = entry.createdAt;
      return entryDto;
    });
    return dto;
  }
}
