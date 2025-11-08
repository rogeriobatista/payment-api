import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  CreatePaymentUseCase,
  UpdatePaymentUseCase,
  GetPaymentUseCase,
  ListPaymentsUseCase,
} from '@application/use-cases';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  ListPaymentsDto,
  PaymentResponseDto,
} from '@application/dtos';
import { PaymentMethod } from '@domain/enums';
import { MercadoPagoService } from '@infrastructure/services';

@Controller('api/payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly updatePaymentUseCase: UpdatePaymentUseCase,
    private readonly getPaymentUseCase: GetPaymentUseCase,
    private readonly listPaymentsUseCase: ListPaymentsUseCase,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Body(new ValidationPipe({ transform: true })) createPaymentDto: CreatePaymentDto,
  ): Promise<{ payment: PaymentResponseDto; checkout_url?: string }> {
    this.logger.log(`Criando pagamento: ${JSON.stringify(createPaymentDto)}`);

    const payment = await this.createPaymentUseCase.execute(createPaymentDto);
    
    let checkoutUrl: string | undefined;

    // Se for cartão de crédito, criar preferência no Mercado Pago
    if (createPaymentDto.paymentMethod === PaymentMethod.CREDIT_CARD) {
      try {
        const preference = await this.mercadoPagoService.createPreference({
          title: createPaymentDto.description,
          description: createPaymentDto.description,
          quantity: 1,
          unit_price: createPaymentDto.amount,
          external_reference: payment.id,
        });
        checkoutUrl = preference.init_point;
        
        this.logger.log(`Preferência do Mercado Pago criada para pagamento ${payment.id}`);
      } catch (error) {
        this.logger.error(`Erro ao criar preferência do Mercado Pago: ${error.message}`);
        // Continue sem URL de checkout se houver erro
      }
    }

    const response: { payment: PaymentResponseDto; checkout_url?: string } = {
      payment: new PaymentResponseDto(payment),
    };

    if (checkoutUrl) {
      response.checkout_url = checkoutUrl;
    }

    return response;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true })) updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Atualizando pagamento ${id}: ${JSON.stringify(updatePaymentDto)}`);

    const payment = await this.updatePaymentUseCase.execute(id, updatePaymentDto);
    return new PaymentResponseDto(payment);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPayment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Buscando pagamento: ${id}`);

    const payment = await this.getPaymentUseCase.execute(id);
    return new PaymentResponseDto(payment);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listPayments(
    @Query(new ValidationPipe({ transform: true })) listPaymentsDto: ListPaymentsDto,
  ): Promise<PaymentResponseDto[]> {
    this.logger.log(`Listando pagamentos: ${JSON.stringify(listPaymentsDto)}`);

    const payments = await this.listPaymentsUseCase.execute(listPaymentsDto);
    return payments.map(payment => new PaymentResponseDto(payment));
  }
}