import { proxyActivities } from '@temporalio/workflow';
import type { OrderActivities } from '../activities/order-saga.activities';

const { createOrder, processPayment, confirmOrder, cancelOrder } =
  proxyActivities<OrderActivities>({
    startToCloseTimeout: '30s',
    retry: {
      maximumAttempts: 3,
    },
  });

export async function orderSagaWorkflow(userId: string, orderId: string) {
  await createOrder(userId, orderId);
  const payment = await processPayment(orderId);

  if (payment.success) {
    await confirmOrder(orderId);
  } else {
    await cancelOrder(orderId);
  }
}
