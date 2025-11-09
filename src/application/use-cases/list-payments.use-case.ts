import { Injectable, Inject } from '@nestjs/common';
import { Payment } from '@domain/entities';
import { PaymentRepository, PaymentFilters } from '@domain/repositories';
import { PaymentMethod, PaymentStatus } from '@domain/enums';

export interface ListPaymentsInput {
  cpf?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  limit?: number;
  offset?: number;
  page?: number;
}

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(input: ListPaymentsInput = {}): Promise<Payment[]> {
    // Converter page para offset se page foi fornecido
    let offset = input.offset || 0;
    if (input.page && input.page > 0) {
      const limit = input.limit || 50;
      offset = (input.page - 1) * limit;
    }

    const filters: PaymentFilters = {
      cpf: input.cpf,
      paymentMethod: input.paymentMethod,
      status: input.status,
      limit: input.limit || 50, // Default limit
      offset: offset,
    };

    return await this.paymentRepository.findAll(filters);
  }
}