import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  @EventPattern('order_created')
  handle(@Payload() data: { orderId: string; userId: string }) {
    console.log(`[PAYMENT] Processing payment for order ${data.orderId}, user ${data.userId}`);
  }
}
