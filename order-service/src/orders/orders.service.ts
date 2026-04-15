import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { ORDER_STATUS_ENUM } from './entities/enums';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  @InjectRepository(Order)
  private readonly orderRepository: Repository<Order>;
  private readonly userServiceUrl: string;

  @Inject('NOTIFICATION_SERVICE')                                                                                      
  private readonly notificationClient: ClientProxy
  
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.userServiceUrl = this.config.getOrThrow<string>('USER_SERVICE_URL');
  }

  private async getUsers(id: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/users/${id}`),
      );
      return data;
    } catch (error) {
      this.logger.error(error.response?.data);
      throw error;
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    let user;                                                                                                                          
    try {                                                                                                                              
      user = await this.getUsers(createOrderDto.userId);
    } catch {                                                                                                                          
      throw new BadRequestException('User not found');
    }
    const saved = await this.orderRepository.save(
      this.orderRepository.create({                                                                                                    
        ...createOrderDto,
        status: ORDER_STATUS_ENUM.PENDING,                                                                                             
      }),                                                                                                                              
    );

    this.notificationClient.emit('order_created', {
      orderId: saved.id,
      userId: saved.userId,
      email: user.email,
    });
    return saved;
  }

  async findAll() {
    return await this.orderRepository.find();
  }

  async findOne(id: string) {
    return await this.orderRepository.findOne({ where: { id } });
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}
