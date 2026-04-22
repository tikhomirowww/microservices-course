import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { ORDER_STATUS_ENUM } from './entities/enums';
import { Outbox } from './entities';
import { OrderSummary } from 'src/orders-read/order-summary.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderSummary)
    private readonly orderSummaryRepository: Repository<OrderSummary>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
    userEmail: string,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        ...createOrderDto,
        userId,
        status: ORDER_STATUS_ENUM.PENDING,
      });
      const saved = await manager.save(order);

      await manager.save(Outbox, {
        event: 'order_created_notification',
        payload: { orderId: saved.id, userId: saved.userId, email: userEmail },
      });
      await manager.save(Outbox, {
        event: 'order_created_payment',
        payload: { orderId: saved.id, userId: saved.userId },
      });
      await manager.save(OrderSummary, {
        orderId: saved.id,
        userId: saved.userId,
        userEmail: userEmail,
        status: ORDER_STATUS_ENUM.PENDING,
      });

      return saved;
    });
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
    console.log('updateStatus called', orderId, status);
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) throw new BadRequestException('Order not found');
    await this.orderRepository.update({ id: orderId }, { status });
    await this.orderSummaryRepository.update({ orderId }, { status });
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
