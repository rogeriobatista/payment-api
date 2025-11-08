import { IsString, IsNotEmpty, IsNumber, IsPositive, IsEnum, Matches } from 'class-validator';
import { PaymentMethod } from '@domain/enums';

export class CreatePaymentDto {
  @IsString({ message: 'CPF deve ser uma string' })
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, { 
    message: 'CPF deve estar no formato 000.000.000-00 ou 00000000000' 
  })
  cpf: string;

  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @IsNumber({}, { message: 'Valor deve ser um número' })
  @IsPositive({ message: 'Valor deve ser maior que zero' })
  amount: number;

  @IsEnum(PaymentMethod, { 
    message: `Método de pagamento deve ser: ${Object.values(PaymentMethod).join(', ')}` 
  })
  paymentMethod: PaymentMethod;
}