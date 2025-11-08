import { IsString, IsOptional, IsNumber, IsPositive, IsEnum, Matches } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@domain/enums';

export class UpdatePaymentDto {
  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, { 
    message: 'CPF deve estar no formato 000.000.000-00 ou 00000000000' 
  })
  cpf?: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @IsPositive({ message: 'Valor deve ser maior que zero' })
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod, { 
    message: `Método de pagamento deve ser: ${Object.values(PaymentMethod).join(', ')}` 
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus, { 
    message: `Status deve ser: ${Object.values(PaymentStatus).join(', ')}` 
  })
  status?: PaymentStatus;
}