import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '#src/generated/prisma/client';

/**
 * Thin wrapper around the generated PrismaClient that participates in the
 * Nest lifecycle. Prisma 7 is "Rust-free": the client talks to PostgreSQL
 * through a driver adapter (node-postgres) instead of a query engine binary.
 *
 * The ledger is treated like an aircraft black box: this service only ever
 * appends records; corrections are modeled as new compensating transactions.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
