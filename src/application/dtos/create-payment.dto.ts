import { IsString, IsNotEmpty, IsNumber, IsPositive, IsEnum, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@domain/enums';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'CPF do pagador',
    example: '123.456.789-00',
    pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$|^\\d{11}$',
    minLength: 11,
    maxLength: 14,
  })
  @IsString({ message: 'CPF deve ser uma string' })
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, { 
    message: 'CPF deve estar no formato 000.000.000-00 ou 00000000000' 
  })
  cpf: string;

  @ApiProperty({
    description: 'Descrição do pagamento',
    example: 'Pagamento de produto X',
    minLength: 1,
    maxLength: 500,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({
    description: 'Valor do pagamento em centavos',
    example: 10000,
    minimum: 1,
    type: 'number',
  })
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @IsPositive({ message: 'Valor deve ser maior que zero' })
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
    enumName: 'PaymentMethod',
  })
  @IsEnum(PaymentMethod, { 
    message: `Método de pagamento deve ser: ${Object.values(PaymentMethod).join(', ')}` 
  })
  paymentMethod: PaymentMethod;
}