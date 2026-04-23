import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OrderSummary } from './order-summary.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ORDER_STATUS_ENUM } from 'src/orders/entities/enums';

@Injectable()
export class OrdersReadService {
  constructor(
    @InjectRepository(OrderSummary)
    private readonly orderSummaryRepository: Repository<OrderSummary>,
  ) {}

  async findAll() {
    return await this.orderSummaryRepository.find({
      select: ['orderId', 'userId', 'status'],
    });
  }
}
