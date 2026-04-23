import { Controller, Get, Param } from '@nestjs/common';
import { OrdersReadService } from './orders-read.service';
import { EventStoreService } from 'src/event-store/event-store.service';

@Controller('orders')
export class OrdersReadController {
  constructor(
    private readonly ordersService: OrdersReadService,
    private readonly eventStoreService: EventStoreService,
  ) {}

  @Get()
  async findAll() {
    return await this.ordersService.findAll()
  }

  @Get(':id/events')                                                                                                                         
  getEvents(@Param('id') id: string) {                                                                                                       
    return this.eventStoreService.getEvents(id);                                                                                             
  }
}
