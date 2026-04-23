import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export function createActivities(
  orderClient: ClientProxy,
  paymentClient: ClientProxy,
) {
  return {
    async createOrder(userId: string, orderId: string) {
      return await firstValueFrom(orderClient.send('create_order', { userId, orderId }));
    },

    async processPayment(orderId: string) {
      return await firstValueFrom(
        paymentClient.send('process_payment', { orderId }),
      );
    },

    async confirmOrder(orderId: string) {
      return await firstValueFrom(
        orderClient.send('confirm_order', { orderId }),
      );
    },

    async cancelOrder(orderId: string) {
      return await firstValueFrom(
        orderClient.send('cancel_order', { orderId }),
      );
    },
  };
}

export type OrderActivities = ReturnType<typeof createActivities>;
