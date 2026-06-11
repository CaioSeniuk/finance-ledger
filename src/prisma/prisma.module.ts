import { Global, Module } from '@nestjs/common';
import { PrismaService } from '#src/prisma/prisma.service';

/**
 * Shared persistence module. Marked global so every bounded context can inject
 * the same PrismaService (single connection pool) without re-importing it.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
