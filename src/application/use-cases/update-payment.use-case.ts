import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Payment } from '@domain/entities';
import { PaymentRepository } from '@domain/repositories';
import { PaymentMethod, PaymentStatus } from '@domain/enums';

export interface UpdatePaymentInput {
  cpf?: string;
  description?: string;
  amount?: number;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
}

@Injectable()
export class UpdatePaymentUseCase {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(id: string, input: UpdatePaymentInput): Promise<Payment> {
    const existingPayment = await this.paymentRepository.findById(id);
    
    if (!existingPayment) {
      throw new NotFoundException(`Pagamento com ID ${id} não encontrado`);
    }

    // Se apenas o status está sendo atualizado
    if (input.status && Object.keys(input).length === 1) {
      existingPayment.updateStatus(input.status);
    } else {
      // Atualizar outros campos
      const updateData = {
        cpf: input.cpf,
        description: input.description,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
      };
      
      existingPayment.update(updateData);
      
      // Atualizar status se fornecido
      if (input.status) {
        existingPayment.updateStatus(input.status);
      }
    }

    return await this.paymentRepository.save(existingPayment);
  }
}