import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { OrderEventType } from "./event-store.enum";

@Entity()
export class OrderEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    orderId: string

    @Column()
    type: OrderEventType

    @Column('json')
    payload: Record<string, any>

    @CreateDateColumn()
    createdAt: Date
}