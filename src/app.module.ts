import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '#src/app.controller';
import { AppService } from '#src/app.service';
import { PrismaModule } from '#src/prisma/prisma.module';
import { TransactionsModule } from '#src/command-service/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
