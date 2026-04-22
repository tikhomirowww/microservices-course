import { ORDER_STATUS_ENUM } from "src/orders/entities/enums";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class OrderSummary {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    orderId: string

    @Column()
    userId: string
    
    @Column()
    userEmail: string
    
    @Column()
    status: ORDER_STATUS_ENUM
}
