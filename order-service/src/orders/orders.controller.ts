import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ORDER_STATUS_ENUM } from './entities/enums';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @EventPattern('payment_completed')                                                                                                   
  async handlePaymentCompleted(@Payload() data: { orderId: string }) {                                                                 
    await this.ordersService.updateStatus(data.orderId, ORDER_STATUS_ENUM.CONFIRMED);                                                  
  }                                                                                                                                    
   
  @EventPattern('payment_failed')                                                                                                      
  async handlePaymentFailed(@Payload() data: { orderId: string }) {
    await this.ordersService.updateStatus(data.orderId, ORDER_STATUS_ENUM.CANCELLED);                                                  
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
