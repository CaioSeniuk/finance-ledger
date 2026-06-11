import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '#src/app.module';
import { PrismaService } from '#src/prisma/prisma.service';
import { Prisma } from '#src/generated/prisma/client';

type LedgerEntryRow = {
  id: string;
  transactionId: string;
  accountId: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: bigint;
  currency: string;
  createdAt: Date;
};

type TransactionRow = {
  id: string;
  idempotencyKey: string;
  type: string;
  status: 'POSTED';
  sourceAccountId: string;
  destinationAccountId: string;
  amount: bigint;
  currency: string;
  metadata: unknown;
  createdAt: Date;
  entries: LedgerEntryRow[];
};

function buildTransactionRow(
  overrides: Partial<TransactionRow> = {},
): TransactionRow {
  const id = overrides.id ?? 'tx-1';
  const amount = overrides.amount ?? 1000n;
  const createdAt = overrides.createdAt ?? new Date('2024-01-01T00:00:00.000Z');
  return {
    id,
    idempotencyKey: overrides.idempotencyKey ?? 'key-1',
    type: overrides.type ?? 'TRANSFER',
    status: 'POSTED',
    sourceAccountId: overrides.sourceAccountId ?? 'acc_a',
    destinationAccountId: overrides.destinationAccountId ?? 'acc_b',
    amount,
    currency: overrides.currency ?? 'USD',
    metadata: overrides.metadata ?? null,
    createdAt,
    entries: overrides.entries ?? [
      {
        id: 'entry-debit',
        transactionId: id,
        accountId: 'acc_a',
        direction: 'DEBIT',
        amount,
        currency: 'USD',
        createdAt,
      },
      {
        id: 'entry-credit',
        transactionId: id,
        accountId: 'acc_b',
        direction: 'CREDIT',
        amount,
        currency: 'USD',
        createdAt,
      },
    ],
  };
}

const validBody = {
  type: 'TRANSFER',
  sourceAccountId: 'acc_a',
  destinationAccountId: 'acc_b',
  amount: 1000,
  currency: 'USD',
};

interface TransactionResponseBody {
  id: string;
  idempotencyKey: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  entries: Array<{
    id: string;
    accountId: string;
    direction: string;
    amount: string;
    currency: string;
  }>;
}

describe('TransactionsController (e2e)', () => {
  let app: INestApplication<App>;
  const prismaMock = {
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts a transaction on a valid request (201)', async () => {
    const row = buildTransactionRow({
      id: 'tx-success',
      idempotencyKey: 'k-1',
    });
    prismaMock.transaction.create.mockResolvedValueOnce(row);

    const response = await request(app.getHttpServer())
      .post('/transactions')
      .set('Idempotency-Key', 'k-1')
      .send(validBody)
      .expect(201);

    expect(prismaMock.transaction.create).toHaveBeenCalledTimes(1);
    const body = response.body as TransactionResponseBody;
    expect(body).toMatchObject({
      id: 'tx-success',
      status: 'POSTED',
      amount: '1000',
      currency: 'USD',
    });
    expect(body.entries).toHaveLength(2);
    expect(body.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ direction: 'DEBIT', amount: '1000' }),
        expect.objectContaining({ direction: 'CREDIT', amount: '1000' }),
      ]),
    );
  });

  it('is idempotent when the same key is used twice (replay returns 200)', async () => {
    const row = buildTransactionRow({ id: 'tx-idem', idempotencyKey: 'k-dup' });

    // First request posts the transaction.
    prismaMock.transaction.create.mockResolvedValueOnce(row);
    const first = await request(app.getHttpServer())
      .post('/transactions')
      .set('Idempotency-Key', 'k-dup')
      .send(validBody)
      .expect(201);

    // Second request with the same key hits the unique constraint and replays.
    prismaMock.transaction.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.8.0',
        meta: { target: ['idempotency_key'] },
      }),
    );
    prismaMock.transaction.findUnique.mockResolvedValueOnce(row);

    const second = await request(app.getHttpServer())
      .post('/transactions')
      .set('Idempotency-Key', 'k-dup')
      .send(validBody)
      .expect(200);

    expect(prismaMock.transaction.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.transaction.findUnique).toHaveBeenCalledTimes(1);
    const firstBody = first.body as TransactionResponseBody;
    const secondBody = second.body as TransactionResponseBody;
    expect(secondBody.id).toBe(firstBody.id);
    expect(secondBody.id).toBe('tx-idem');
  });

  it('rejects an invalid payload with 400 and never touches the ledger', async () => {
    const invalidBody = {
      type: '',
      sourceAccountId: 'acc_a',
      // destinationAccountId missing
      amount: -5,
      currency: 'US',
      unexpectedField: 'nope',
    };

    await request(app.getHttpServer())
      .post('/transactions')
      .set('Idempotency-Key', 'k-invalid')
      .send(invalidBody)
      .expect(400);

    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });

  it('rejects a request without the Idempotency-Key header with 400', async () => {
    await request(app.getHttpServer())
      .post('/transactions')
      .send(validBody)
      .expect(400);

    expect(prismaMock.transaction.create).not.toHaveBeenCalled();
  });

  it('documents the endpoint in the OpenAPI (Swagger) schema', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Finance Ledger API')
        .setVersion('0.0.2')
        .addTag('transactions')
        .build(),
    );

    const postOperation = document.paths['/transactions']?.post;
    expect(postOperation).toBeDefined();

    const hasIdempotencyHeader = postOperation?.parameters?.some(
      (parameter) =>
        'name' in parameter && parameter.name === 'Idempotency-Key',
    );
    expect(hasIdempotencyHeader).toBe(true);

    expect(postOperation?.responses['201']).toBeDefined();
    expect(postOperation?.responses['200']).toBeDefined();
    expect(document.components?.schemas?.TransactionResponseDto).toBeDefined();
    expect(document.components?.schemas?.CreateTransactionDto).toBeDefined();
  });
});
