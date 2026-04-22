import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersReadService } from './orders-read.service';
import { OrdersReadController } from './orders-read.controller';
import { OrderSummary } from './order-summary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderSummary])],
  controllers: [OrdersReadController],
  providers: [OrdersReadService],
})
export class OrdersReadModule {}
