import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ORDER_STATUS_ENUM } from "./enums";

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    userId: string

    @Column()
    status: ORDER_STATUS_ENUM
}
