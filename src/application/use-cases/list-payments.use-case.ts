import { Injectable, Inject } from '@nestjs/common';
import { Payment } from '@domain/entities';
import { PaymentRepository, PaymentFilters } from '@domain/repositories';
import { PaymentMethod } from '@domain/enums';

export interface ListPaymentsInput {
  cpf?: string;
  paymentMethod?: PaymentMethod;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(input: ListPaymentsInput = {}): Promise<Payment[]> {
    const filters: PaymentFilters = {
      cpf: input.cpf,
      paymentMethod: input.paymentMethod,
      limit: input.limit || 50, // Default limit
      offset: input.offset || 0, // Default offset
    };

    return await this.paymentRepository.findAll(filters);
  }
}