import {
  Controller,
  Get,
  Headers,
  Inject,
  OnModuleInit,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Client, Connection } from '@temporalio/client';
import { firstValueFrom } from 'rxjs';
import { orderSagaWorkflow } from './workflows/order-saga.workflow';

@Controller('orders')
export class AppController implements OnModuleInit {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
  ) {}

  private temporalClient: Client;

  async onModuleInit() {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
    });
    this.temporalClient = new Client({ connection });
  }

  @Get('ping')
  async ping() {
    return await firstValueFrom(this.orderClient.send('ping', {}));
  }

  @Post()
  async createOrder(@Headers('x-user-id') userId: string) {
    const orderId = crypto.randomUUID();

    await this.temporalClient.workflow.start(orderSagaWorkflow, {
      args: [userId, orderId],
      taskQueue: 'order-saga',
      workflowId: `order-saga-${orderId}`,
    });

    return { orderId, status: 'pending' };
  }

  //? replaced by temporal approach
  // @Post()
  // async createOrder(@Body() body: { userId: string }) {
  //   // Шаг 1: создать заказ
  //   const order = await firstValueFrom(
  //     this.orderClient.send('create_order', { userId: body.userId }),
  //   );

  //   // Шаг 2: обработать платёж
  //   const payment = await firstValueFrom(
  //     this.paymentClient.send('process_payment', { orderId: order.id }),
  //   );

  //   // Шаг 3: подтвердить или отменить
  //   if (payment.success) {
  //     await firstValueFrom(
  //       this.orderClient.send('confirm_order', { orderId: order.id }),
  //     );
  //     return { orderId: order.id, status: 'confirmed' };
  //   } else {
  //     await firstValueFrom(
  //       this.orderClient.send('cancel_order', { orderId: order.id }),
  //     );
  //     return { orderId: order.id, status: 'cancelled' };
  //   }
  // }
}
