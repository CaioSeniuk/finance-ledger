import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateTransactionDto } from '#src/command-service/transactions/dto/create-transaction.dto';
import { TransactionResponseDto } from '#src/command-service/transactions/dto/transaction-response.dto';
import { TransactionsService } from '#src/command-service/transactions/transactions.service';

const IDEMPOTENCY_HEADER = 'Idempotency-Key';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Post a transaction to the immutable ledger',
    description:
      'Appends a transaction and its double-entry ledger lines. The write is ' +
      'idempotent: replaying the same Idempotency-Key returns the originally ' +
      'posted transaction (HTTP 200) instead of creating a duplicate.',
  })
  @ApiHeader({
    name: IDEMPOTENCY_HEADER,
    description:
      'Unique key that guards against duplicate financial effects on retry.',
    required: true,
  })
  @ApiCreatedResponse({
    description: 'Transaction posted to the ledger.',
    type: TransactionResponseDto,
  })
  @ApiOkResponse({
    description:
      'Idempotent replay: the transaction for this key was already posted.',
    type: TransactionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload or missing Idempotency-Key header.',
  })
  async create(
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: CreateTransactionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TransactionResponseDto> {
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new BadRequestException(`${IDEMPOTENCY_HEADER} header is required`);
    }

    const { transaction, replayed } =
      await this.transactionsService.postTransaction(
        dto,
        idempotencyKey.trim(),
      );

    res.status(replayed ? HttpStatus.OK : HttpStatus.CREATED);
    return TransactionResponseDto.fromEntity(transaction);
  }
}
