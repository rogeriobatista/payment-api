import { IsOptional, IsString, IsEnum, IsNumber, Min, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@domain/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListPaymentsDto {
  @ApiPropertyOptional({
    description: 'CPF do pagador para filtrar (com ou sem formatação)',
    example: '11144477735',
    pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$|^\\d{11}$',
  })
  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, { 
    message: 'CPF deve estar no formato 000.000.000-00 ou 00000000000' 
  })
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Método de pagamento para filtrar',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { 
    message: `Método de pagamento deve ser: ${Object.values(PaymentMethod).join(', ')}` 
  })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Status do pagamento para filtrar',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { 
    message: `Status deve ser: ${Object.values(PaymentStatus).join(', ')}` 
  })
  status?: PaymentStatus;

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

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'Page deve ser um número' })
  @Min(1, { message: 'Page deve ser maior que zero' })
  page?: number;
}