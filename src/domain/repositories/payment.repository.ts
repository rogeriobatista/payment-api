import { Payment } from '../entities';
import { PaymentMethod, PaymentStatus } from '../enums';

export interface PaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByCpf(cpf: string): Promise<Payment[]>;
  findByPaymentMethod(paymentMethod: PaymentMethod): Promise<Payment[]>;
  findAll(filters?: PaymentFilters): Promise<Payment[]>;
  update(id: string, payment: Partial<Payment>): Promise<Payment | null>;
}

export interface PaymentFilters {
  cpf?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  limit?: number;
  offset?: number;
}