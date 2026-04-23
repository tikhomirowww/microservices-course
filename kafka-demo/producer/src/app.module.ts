import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ClientsModule.register([{
      name: 'KAFKA_CLIENT',
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'producer',
          brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
        },
      },
    }]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
