import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { ORDER_STATUS_ENUM } from './entities/enums';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  @InjectRepository(Order)
  private readonly orderRepository: Repository<Order>;

  @Inject('NOTIFICATION_SERVICE')
  private readonly notificationClient: ClientProxy;

  @Inject('PAYMENT_SERVICE')
  private readonly paymentsClient: ClientProxy;

  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
    userEmail: string,
  ) {
    const saved = await this.orderRepository.save(
      this.orderRepository.create({
        ...createOrderDto,
        userId,
        status: ORDER_STATUS_ENUM.PENDING,
      }),
    );

    this.notificationClient.emit('order_created', {
      orderId: saved.id,
      userId: saved.userId,
      email: userEmail,
    });
    this.paymentsClient.emit('order_created', {
      orderId: saved.id,
      userId: saved.userId,
    });
    return saved;
  }

  async createPending(userId: string) {
    return await this.orderRepository.save(
      this.orderRepository.create({
        userId,
        status: ORDER_STATUS_ENUM.PENDING,
      }),
    );
  }

  async updateStatus(orderId: string, status: ORDER_STATUS_ENUM) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
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
