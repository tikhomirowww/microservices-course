import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Outbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  event: string

  @Column('json')
  payload: object

  @Column({default: false})
  published: boolean
}
