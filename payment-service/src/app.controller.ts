import { Controller, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy, EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Inject('ORDERS_SERVICE')
  private readonly client: ClientProxy;

  @EventPattern('order_created_payment')
  async handleOrderCreated(
    @Payload() data: { orderId: string; userId: string },
  ) {
    const success = this.appService.handlePayment(); // 80% успех

    if (success) {
      this.client.emit('payment_completed', { orderId: data.orderId });
    } else {
      this.client.emit('payment_failed', { orderId: data.orderId });
    }
  }

  @MessagePattern('process_payment')
  async handleConfirmOrder(@Payload() data: { orderId: string }) {
    return { success: this.appService.handlePayment(), orderId: data.orderId };
  }
}
