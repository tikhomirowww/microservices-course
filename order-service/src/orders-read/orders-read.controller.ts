import { Controller, Get } from '@nestjs/common';
import { OrdersReadService } from './orders-read.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('orders')
export class OrdersReadController {
  constructor(private readonly ordersService: OrdersReadService) {}

  @Get()
  async findAll() {
    return await this.ordersService.findAll()
  }

}
