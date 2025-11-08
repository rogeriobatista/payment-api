import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod } from '@domain/enums';

export class ListPaymentsDto {
  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  cpf?: string;

  @IsOptional()
  @IsEnum(PaymentMethod, { 
    message: `Método de pagamento deve ser: ${Object.values(PaymentMethod).join(', ')}` 
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'Limit deve ser um número' })
  @Min(1, { message: 'Limit deve ser maior que zero' })
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'Offset deve ser um número' })
  @Min(0, { message: 'Offset deve ser maior ou igual a zero' })
  offset?: number;
}