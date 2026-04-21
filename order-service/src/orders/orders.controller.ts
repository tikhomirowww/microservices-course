import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
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

  @MessagePattern('ping')
  async handlePing() {
    return { pong: true };
  }

  @MessagePattern('create_order')
  async handleCreateOrder(@Payload() data: { userId: string }) {
    return this.ordersService.createPending(data.userId);
  }

  @MessagePattern('confirm_order')
  async handleConfirmOrder(@Payload() data: { orderId: string }) {
    return this.ordersService.updateStatus(data.orderId, ORDER_STATUS_ENUM.CONFIRMED);
  }

  @MessagePattern('cancel_order')
  async handleCancelOrder(@Payload() data: { orderId: string }) {
    return this.ordersService.updateStatus(data.orderId, ORDER_STATUS_ENUM.CANCELLED);
  }

  @Post()                                                                                                                              
  create(@Body() createOrderDto: CreateOrderDto, @Headers('x-user-id') userId: string, @Headers('x-user-email') userEmail: string) {   
    return this.ordersService.create(createOrderDto, userId, userEmail);                                                               
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
