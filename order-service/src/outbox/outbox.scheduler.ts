import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Outbox } from 'src/orders/entities';
import { Repository } from 'typeorm';

@Injectable()
export class OutboxScheduler {
  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,

    @Inject('PAYMENT_SERVICE')
    private readonly paymentsClient: ClientProxy,
  ) {}
  @Interval(5000)
  async publishEvents() {
    const events = await this.outboxRepository.find({
      where: { published: false },
    });
    for (const event of events) {
      if (event.event === 'order_created_notification') {
        this.notificationClient.emit('order_created', event.payload);
      } else if (event.event === 'order_created_payment') {
        this.paymentsClient.emit('order_created', event.payload);
      }
      await this.outboxRepository.update(event.id, { published: true });
    }
  }
}
