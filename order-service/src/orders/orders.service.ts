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
import CircuitBreaker from 'opossum';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  @InjectRepository(Order)
  private readonly orderRepository: Repository<Order>;
  private readonly userServiceUrl: string;
  private readonly breaker: CircuitBreaker;
  
  @Inject('NOTIFICATION_SERVICE')                                                                                      
  private readonly notificationClient: ClientProxy

  @Inject('PAYMENT_SERVICE')                                                                                      
  private readonly paymentsClient: ClientProxy
  
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.userServiceUrl = this.config.getOrThrow<string>('USER_SERVICE_URL');
    this.breaker = new CircuitBreaker((id: string) => this.getUsers(id), {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    }); 
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
      user = await this.breaker.fire(createOrderDto.userId);
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
    this.paymentsClient.emit('order_created', {
      orderId: saved.id,
      userId: saved.userId,
    });
    return saved;
  }

  async createPending(userId: string) {
    let user;
    try {
      user = await this.breaker.fire(userId);
    } catch {
      throw new BadRequestException('User not found');
    }
    return await this.orderRepository.save(
      this.orderRepository.create({
        userId,
        status: ORDER_STATUS_ENUM.PENDING,
      }),
    );
  }

  async updateStatus(orderId: string, status: ORDER_STATUS_ENUM) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new BadRequestException('Order not found');
    await this.orderRepository.update({ id: orderId }, { status });
    return { id: orderId, status };
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
