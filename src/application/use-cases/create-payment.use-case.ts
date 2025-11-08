import { Injectable, Inject } from '@nestjs/common';
import { Payment } from '@domain/entities';
import { PaymentRepository } from '@domain/repositories';
import { PaymentMethod } from '@domain/enums';

export interface CreatePaymentInput {
  cpf: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(input: CreatePaymentInput): Promise<Payment> {
    const payment = new Payment(
      input.cpf,
      input.description,
      input.amount,
      input.paymentMethod,
    );

    return await this.paymentRepository.save(payment);
  }
}