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
  StrictRateLimit, 
  ModerateRateLimit,
  LenientRateLimit 
} from '../../rate-limit/decorators/rate-limit.decorator';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  ListPaymentsDto,
  PaymentResponseDto,
} from '@application/dtos';
import { PaymentMethod } from '@domain/enums';
import { MercadoPagoService } from '@infrastructure/services';
import { TemporalService } from '../../workflows/temporal.service';

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
    private readonly temporalService: TemporalService,
  ) {}

  @Post()
  @StrictRateLimit() // 5 requests per minute para criação de pagamentos
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
          description: 'URL para checkout do Mercado Pago (cartão de crédito)',
          example: 'https://checkout.mercadopago.com.br/...'
        },
        workflow_id: {
          type: 'string',
          description: 'ID do workflow Temporal.io (cartão de crédito)',
          example: 'payment-123e4567-e89b-12d3-a456-426614174000-1699536000000'
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
      let workflowId: string | undefined;

      // Se for cartão de crédito, iniciar workflow Temporal e integrar com Mercado Pago
      if (createPaymentDto.paymentMethod === PaymentMethod.CREDIT_CARD) {
        try {
          // Iniciar workflow Temporal para gerenciar o pagamento
          const workflowHandle = await this.temporalService.startPaymentWorkflow({
            paymentId: payment.id,
            cpf: createPaymentDto.cpf,
            description: createPaymentDto.description,
            amount: createPaymentDto.amount,
            paymentMethod: createPaymentDto.paymentMethod,
          });
          
          workflowId = workflowHandle.workflowId;
          
          // Criar preferência no Mercado Pago
          const preference = await this.mercadoPagoService.createPreference({
            title: createPaymentDto.description,
            description: createPaymentDto.description,
            quantity: 1,
            unit_price: createPaymentDto.amount,
            external_reference: payment.id,
          });
          checkoutUrl = preference.init_point;
          
          this.logger.log(`Workflow Temporal iniciado: ${workflowId} para pagamento ${payment.id}`);
          this.logger.log(`Preferência do Mercado Pago criada para pagamento ${payment.id}`);
        } catch (error) {
          this.logger.error(`Erro ao iniciar workflow/Mercado Pago para pagamento ${payment.id}: ${error.message}`);
          // Continue sem workflow/checkout se houver erro
        }
      }

      const response: { 
        payment: PaymentResponseDto; 
        checkout_url?: string;
        workflow_id?: string;
      } = {
        payment: new PaymentResponseDto(payment),
      };

      if (checkoutUrl) {
        response.checkout_url = checkoutUrl;
      }

      if (workflowId) {
        response.workflow_id = workflowId;
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
  @ModerateRateLimit() // 20 requests per minute para atualizações
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
  @LenientRateLimit() // 100 requests per minute para consultas
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
  @LenientRateLimit() // 100 requests per minute para listagem
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
    name: 'cpf',
    required: false,
    type: String,
    description: 'Filtrar por CPF do pagador (com ou sem formatação)',
    example: '11144477735'
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