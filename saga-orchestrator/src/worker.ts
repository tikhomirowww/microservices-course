import { NativeConnection, Worker } from '@temporalio/worker';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { createActivities } from './activities/order-saga.activities';

export async function bootstrapWorker() {
  const rmqUrl =
    process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

  const orderClient = ClientProxyFactory.create({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'orders_queue',
      queueOptions: { durable: true },
      noAck: true,
    },
  });

  const paymentClient = ClientProxyFactory.create({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'payments_queue',
      queueOptions: { durable: true },
      noAck: true,
    },
  });

  await orderClient.connect();
  await paymentClient.connect();

  const temporalAddress = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
  let connection: NativeConnection | undefined;

  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      connection = await NativeConnection.connect({ address: temporalAddress });
      break;
    } catch {
      console.log(`Temporal not ready, retry ${attempt}/10...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (!connection) throw new Error('Could not connect to Temporal after 10 attempts');

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'order-saga',
    workflowsPath: require.resolve('./workflows/order-saga.workflow'),
    activities: createActivities(orderClient, paymentClient),
  });

  await worker.run();
}
