import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Write intent accepted by the Command Service. It expresses the intention to
 * post a transfer to the ledger; it is never a mutation of derived state.
 *
 * Amounts are integers in the currency's minor units (e.g. cents) to avoid
 * floating-point rounding errors in financial calculations.
 */
export class CreateTransactionDto {
  @ApiProperty({
    description: 'Business transaction type.',
    example: 'TRANSFER',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  type!: string;

  @ApiProperty({
    description: 'Account debited by this transaction.',
    example: 'acc_checking_001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sourceAccountId!: string;

  @ApiProperty({
    description: 'Account credited by this transaction.',
    example: 'acc_savings_002',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  destinationAccountId!: string;

  @ApiProperty({
    description:
      'Amount in the currency minor units (e.g. cents). Must be > 0.',
    example: 1000,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'ISO 4217 currency code (3 uppercase letters).',
    example: 'USD',
  })
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a valid ISO 4217 code (3 uppercase letters)',
  })
  currency!: string;

  @ApiPropertyOptional({
    description: 'Free-form auditable context attached to the transaction.',
    example: { reference: 'invoice-42', channel: 'mobile' },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
