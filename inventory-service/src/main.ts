import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,                                                                                                                      
      options: {
        package: 'inventory',                                                                                                                         
        protoPath: join(__dirname, '../../proto/inventory.proto'),
        url: `0.0.0.0:${process.env.GRPC_PORT ?? 5000}`                                                                                                                     
      },
  });
  await app.listen();
}
bootstrap();
