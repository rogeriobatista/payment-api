import { PaymentMethod, PaymentStatus } from '@domain/enums';

export class PaymentResponseDto {
  id: string;
  cpf: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(payment: any) {
    this.id = payment.id;
    this.cpf = payment.cpf;
    this.description = payment.description;
    this.amount = payment.amount;
    this.paymentMethod = payment.paymentMethod;
    this.status = payment.status;
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;
  }
}