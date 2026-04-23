import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEvent } from './event-store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEvent])],
  providers: [EventStoreService],
  exports: [EventStoreService]
})
export class EventStoreModule {}
