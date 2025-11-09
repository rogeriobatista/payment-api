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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ 
    summary: 'Criar novo pagamento',
    description: 'Cria um novo pagamento e gera URL de checkout quando necessário'
  })
  @ApiBody({ 
    type: CreatePaymentDto,
    description: 'Dados para criação do pagamento'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Pagamento criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        payment: {
          $ref: '#/components/schemas/PaymentResponseDto'
        },
        checkout_url: {
          type: 'string',
          description: 'URL para checkout (quando aplicável)',
          example: 'https://checkout.mercadopago.com.br/...'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos fornecidos',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: ['CPF deve estar no formato 000.000.000-00 ou 00000000000']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Erro interno do servidor' 
  })
  async createPayment(
    @Body(new ValidationPipe({ transform: true })) createPaymentDto: CreatePaymentDto,
  ): Promise<{ payment: PaymentResponseDto; checkout_url?: string }> {
    this.logger.log(`Criando pagamento: ${JSON.stringify(createPaymentDto)}`);

    try {
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
    } catch (error) {
      this.logger.error(`Erro ao criar pagamento: ${error.message}`);
      
      // Se for erro de validação de domínio, retornar Bad Request
      if (error.message.includes('CPF inválido') || 
          error.message.includes('obrigatório') || 
          error.message.includes('inválido')) {
        throw new BadRequestException(error.message);
      }
      
      // Para outros erros, relançar
      throw error;
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Atualizar pagamento existente',
    description: 'Atualiza os dados de um pagamento existente'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do pagamento',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({ 
    type: UpdatePaymentDto,
    description: 'Dados para atualização do pagamento'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Pagamento atualizado com sucesso',
    type: PaymentResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos ou ID inválido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Pagamento não encontrado' 
  })
  async updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true })) updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Atualizando pagamento ${id}: ${JSON.stringify(updatePaymentDto)}`);

    try {
      const payment = await this.updatePaymentUseCase.execute(id, updatePaymentDto);
      return new PaymentResponseDto(payment);
    } catch (error) {
      this.logger.error(`Erro ao atualizar pagamento ${id}: ${error.message}`);
      
      // Se for erro de validação de domínio, retornar Bad Request
      if (error.message.includes('CPF inválido') || 
          error.message.includes('obrigatório') || 
          error.message.includes('inválido')) {
        throw new BadRequestException(error.message);
      }
      
      // Para outros erros, relançar
      throw error;
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obter pagamento por ID',
    description: 'Retorna os detalhes de um pagamento específico'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do pagamento',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Pagamento encontrado com sucesso',
    type: PaymentResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'ID inválido fornecido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Pagamento não encontrado' 
  })
  async getPayment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Buscando pagamento: ${id}`);

    const payment = await this.getPaymentUseCase.execute(id);
    return new PaymentResponseDto(payment);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Listar pagamentos',
    description: 'Retorna uma lista de pagamentos com filtros opcionais'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página (começa em 1)',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de itens por página',
    example: 10
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'PAID', 'FAIL'],
    description: 'Filtrar por status do pagamento'
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    enum: ['CREDIT_CARD', 'PIX'],
    description: 'Filtrar por método de pagamento'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de pagamentos retornada com sucesso',
    type: [PaymentResponseDto]
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Parâmetros de consulta inválidos' 
  })
  async listPayments(
    @Query(new ValidationPipe({ transform: true })) listPaymentsDto: ListPaymentsDto,
  ): Promise<PaymentResponseDto[]> {
    this.logger.log(`Listando pagamentos: ${JSON.stringify(listPaymentsDto)}`);

    const payments = await this.listPaymentsUseCase.execute(listPaymentsDto);
    return payments.map(payment => new PaymentResponseDto(payment));
  }
}