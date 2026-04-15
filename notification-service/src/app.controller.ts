import { Controller, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)
  constructor(private readonly appService: AppService) {}

  @EventPattern('order_created')                                                                                                       
  handleOrderCreated(@Payload() data: { orderId: string; userId: string; email: string }) {                                            
    this.logger.log(`Sending email to ${data.email} for order ${data.orderId}`);                                                       
  }
}
