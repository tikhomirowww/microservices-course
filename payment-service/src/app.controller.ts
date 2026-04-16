import { Controller, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Inject('ORDERS_SERVICE')                                                                                      
  private readonly client: ClientProxy

  @EventPattern('order_created')                                                                                                       
  async handleOrderCreated(@Payload() data: { orderId: string; userId: string }) {                                                     
    const success = Math.random() > 0.2; // 80% успех                                                                                  
                                                                                                                                       
    if (success) {                                                                                                                     
      this.client.emit('payment_completed', { orderId: data.orderId });                                                                
    } else {                                                                                                                           
      this.client.emit('payment_failed', { orderId: data.orderId });                                                                   
    }                                                                                                                                  
  }
}
