import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('orders')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  createOrder(@Body() body: { userId: string }) {
    return this.appService.publish(body.userId);
  }
}
