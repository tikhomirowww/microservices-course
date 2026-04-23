import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { randomUUID } from 'crypto';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  publish(userId: string) {
    const orderId = randomUUID();
    this.kafka.emit('order_created', { orderId, userId, timestamp: new Date() });
    console.log(`Published order_created: ${orderId}`);
    return { orderId, status: 'published' };
  }
}
