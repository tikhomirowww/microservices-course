import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEvent } from './event-store.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class EventStoreService {
  constructor(
    @InjectRepository(OrderEvent)
    private readonly eventStoreRepository: Repository<OrderEvent>,
  ) {}

  async append(
    event: Pick<OrderEvent, 'orderId' | 'type' | 'payload'>,
    manager?: EntityManager,
  ) {
    const repo = manager                                                                                                                     
      ? manager.getRepository(OrderEvent)
      : this.eventStoreRepository;                                                                                                           
    return await repo.save(event); 
  }

  async getEvents(orderId: string) {
    return await this.eventStoreRepository.find({
      where: {
        orderId,
      },
    });
  }
}
