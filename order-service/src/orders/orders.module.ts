import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Order, Outbox } from './entities';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxScheduler } from 'src/outbox/outbox.scheduler';
import { OrderSummary } from 'src/orders-read/order-summary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Outbox, OrderSummary]),
    ScheduleModule.forRoot(),
    HttpModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
          ],
          queue: 'notifications_queue',
          queueOptions: { durable: true },
        },
      },
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
          ],
          queue: 'payments_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OutboxScheduler],
})
export class OrdersModule {}
