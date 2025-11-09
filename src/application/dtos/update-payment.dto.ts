import { IsString, IsOptional, IsNumber, IsPositive, IsEnum, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@domain/enums';

export class UpdatePaymentDto {
  @ApiPropertyOptional({
    description: 'CPF do pagador',
    example: '123.456.789-00',
    pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$|^\\d{11}$',
  })
  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, { 
    message: 'CPF deve estar no formato 000.000.000-00 ou 00000000000' 
  })
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Descrição do pagamento',
    example: 'Pagamento atualizado',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Valor do pagamento em centavos',
    example: 15000,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @IsPositive({ message: 'Valor deve ser maior que zero' })
  amount?: number;

  @ApiPropertyOptional({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { 
    message: `Método de pagamento deve ser: ${Object.values(PaymentMethod).join(', ')}` 
  })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Status do pagamento',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { 
    message: `Status deve ser: ${Object.values(PaymentStatus).join(', ')}` 
  })
  status?: PaymentStatus;
}