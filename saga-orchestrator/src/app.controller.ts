import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('orders')
export class AppController {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
  ) {}

  @Get('ping')
  async ping() {
    return await firstValueFrom(this.orderClient.send('ping', {}));
  }

  @Post()
  async createOrder(@Body() body: { userId: string }) {
      // Шаг 1: создать заказ
      const order = await firstValueFrom(
        this.orderClient.send('create_order', { userId: body.userId }),
      );

      // Шаг 2: обработать платёж
      const payment = await firstValueFrom(
        this.paymentClient.send('process_payment', { orderId: order.id }),
      );

      // Шаг 3: подтвердить или отменить
      if (payment.success) {
        await firstValueFrom(
          this.orderClient.send('confirm_order', { orderId: order.id }),
        );
        return { orderId: order.id, status: 'confirmed' };
      } else {
        await firstValueFrom(
          this.orderClient.send('cancel_order', { orderId: order.id }),
        );
        return { orderId: order.id, status: 'cancelled' };
      }
    }
}
