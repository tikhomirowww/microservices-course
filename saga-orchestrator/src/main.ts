import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { bootstrapWorker } from './worker';

async function bootstrap() {
  bootstrapWorker().catch((err) => {
    console.error('Temporal worker failed:', err);
    process.exit(1);
  });

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3003);
}
bootstrap();
