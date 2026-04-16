import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [ClientsModule.register([
        {
          name: 'ORDER_SERVICE',
          transport: Transport.RMQ,
          options: {
            urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
            queue: 'orders_queue',
            queueOptions: { durable: true },
            noAck: true,
          },
        },
        {
          name: 'PAYMENT_SERVICE',
          transport: Transport.RMQ,
          options: {
            urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
            queue: 'payments_queue',
            queueOptions: { durable: true },
            noAck: true,
          },
        },        
      ]),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
