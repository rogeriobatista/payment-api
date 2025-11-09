import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@domain/enums';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'ID único do pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'CPF do pagador',
    example: '123.456.789-00',
  })
  cpf: string;

  @ApiProperty({
    description: 'Descrição do pagamento',
    example: 'Pagamento de produto X',
  })
  description: string;

  @ApiProperty({
    description: 'Valor do pagamento em centavos',
    example: 10000,
  })
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento utilizado',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Status atual do pagamento',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Data de criação do pagamento',
    example: '2025-11-08T17:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do pagamento',
    example: '2025-11-08T17:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
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