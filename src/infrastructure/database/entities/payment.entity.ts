import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethod, PaymentStatus } from '@domain/enums';

@Entity('payment')
export class PaymentEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 11 })
  cpf: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ 
    type: 'varchar', 
    length: 20,
    name: 'payment_method'
  })
  paymentMethod: PaymentMethod;

  @Column({ 
    type: 'varchar',
    length: 20,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}