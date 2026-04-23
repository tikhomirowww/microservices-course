import { ORDER_STATUS_ENUM } from "src/orders/entities/enums";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class OrderSummary {
    @PrimaryColumn('uuid')
    orderId: string

    @Column()
    userId: string

    @Column({ nullable: true })
    userEmail: string

    @Column()
    status: ORDER_STATUS_ENUM
}
