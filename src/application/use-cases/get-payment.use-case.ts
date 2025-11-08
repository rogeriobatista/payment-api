import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Payment } from '@domain/entities';
import { PaymentRepository } from '@domain/repositories';

@Injectable()
export class GetPaymentUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(id);
    
    if (!payment) {
      throw new NotFoundException(`Pagamento com ID ${id} não encontrado`);
    }

    return payment;
  }
}