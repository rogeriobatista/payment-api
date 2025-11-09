import { Controller, Post, Body, HttpStatus, HttpCode, Logger, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdatePaymentUseCase } from '@application/use-cases';
import { PaymentStatus } from '@domain/enums';
import { TemporalService } from '../../workflows/temporal.service';
import { PaymentRepository } from '@domain/repositories';
import { Payment } from '@domain/entities';
import { MercadoPagoService } from '../../infrastructure/services/mercado-pago.service';

interface MercadoPagoWebhookDto {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

@ApiTags('Webhooks')
@Controller('api/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly updatePaymentUseCase: UpdatePaymentUseCase,
    private readonly temporalService: TemporalService,
    @Inject('PaymentRepository')
    private readonly paymentRepository: PaymentRepository,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @Post('mercado-pago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Webhook do Mercado Pago',
    description: 'Recebe notificações de eventos do Mercado Pago para atualizar status de pagamentos'
  })
  @ApiBody({
    description: 'Dados do webhook do Mercado Pago',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 12345 },
        live_mode: { type: 'boolean', example: false },
        type: { type: 'string', example: 'payment' },
        date_created: { type: 'string', example: '2025-11-08T17:30:00.000Z' },
        application_id: { type: 'number', example: 123456789 },
        user_id: { type: 'number', example: 987654321 },
        version: { type: 'number', example: 1 },
        api_version: { type: 'string', example: 'v1' },
        action: { type: 'string', example: 'payment.created' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'payment_id_123' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Webhook processado com sucesso' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados de webhook inválidos' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Erro interno ao processar webhook' 
  })
  async handleMercadoPagoWebhook(@Body() webhookData: MercadoPagoWebhookDto) {
    this.logger.log(`Webhook recebido do Mercado Pago: ${JSON.stringify(webhookData)}`);

    try {
      // Verificar se o webhook data é válido
      if (!webhookData || !webhookData.type) {
        this.logger.warn('Webhook data inválido ou tipo não informado');
        return { success: false, message: 'Webhook data inválido' };
      }

      // Verificar se é uma notificação de pagamento
      if (webhookData.type === 'payment') {
        if (!webhookData.data || !webhookData.data.id) {
          this.logger.warn('Webhook de pagamento sem ID válido');
          return { success: false, message: 'Payment ID não informado' };
        }

        const paymentId = webhookData.data.id;
        
        this.logger.log(`Pagamento ${paymentId} notificado pelo Mercado Pago`);
        
        // Primeiro, precisamos encontrar o pagamento interno pelo external_id do Mercado Pago
        try {
          // Buscar o pagamento interno usando o external_id do Mercado Pago
          const internalPayment = await this.findPaymentByExternalId(paymentId);
          
          if (!internalPayment) {
            this.logger.warn(`Pagamento interno não encontrado para external_id: ${paymentId}`);
            return { message: 'Pagamento não encontrado no sistema interno' };
          }

          // Consultar o status real do pagamento no Mercado Pago
          let mercadoPagoPaymentStatus: string;
          try {
            const mpPayment = await this.mercadoPagoService.getPayment(paymentId);
            mercadoPagoPaymentStatus = mpPayment.status;
            this.logger.log(`Status do pagamento ${paymentId} no Mercado Pago: ${mercadoPagoPaymentStatus}`);
          } catch (error) {
            this.logger.warn(`Erro ao consultar pagamento ${paymentId} no Mercado Pago: ${error.message}`);
            // Usar o action do webhook como fallback
            mercadoPagoPaymentStatus = this.mapMercadoPagoStatus(webhookData.action);
          }

          // Buscar workflows Temporal relacionados ao pagamento interno
          const workflows = await this.temporalService.listPaymentWorkflows(internalPayment.id);
          
          if (workflows.length === 0) {
            this.logger.warn(`Nenhum workflow encontrado para pagamento: ${internalPayment.id}`);
            // Ainda atualizar o status no banco mesmo sem workflow
            await this.updatePaymentStatusDirectly(internalPayment.id, mercadoPagoPaymentStatus);
            return { message: 'Pagamento atualizado (sem workflow ativo)' };
          }
          
          // Confirmar pagamento nos workflows ativos
          for (const workflow of workflows) {
            if (workflow.status === 'Running') {
              const mappedStatus = this.mapMercadoPagoStatusToEnum(mercadoPagoPaymentStatus);
              
              await this.temporalService.confirmPayment(
                workflow.workflowId, 
                mappedStatus === PaymentStatus.PAID ? 'paid' : 
                mappedStatus === PaymentStatus.FAIL ? 'failed' : 'pending', 
                {
                  mercadoPagoId: paymentId,
                  mercadoPagoStatus: mercadoPagoPaymentStatus,
                  webhookData: webhookData,
                  timestamp: new Date().toISOString(),
                  internalPaymentId: internalPayment.id
                }
              );
              
              this.logger.log(`Workflow ${workflow.workflowId} notificado sobre pagamento ${internalPayment.id} com status ${mappedStatus}`);
            }
          }
          
          // Também atualizar diretamente no banco como backup
          await this.updatePaymentStatusDirectly(internalPayment.id, mercadoPagoPaymentStatus);
          
        } catch (error) {
          this.logger.error(`Erro ao processar webhook para pagamento ${paymentId}: ${error.message}`);
          // Continue para não falhar o webhook
        }
      }

      return { message: 'Webhook processado com sucesso' };
    } catch (error) {
      this.logger.error(`Erro ao processar webhook: ${error.message}`);
      throw error;
    }
  }

  private mapMercadoPagoStatus(action: string): string {
    switch (action) {
      case 'payment.created':
      case 'payment.updated':
        return 'pending';
      case 'payment.approved':
        return 'approved'; // Mudança aqui
      case 'payment.rejected':
      case 'payment.cancelled':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private mapMercadoPagoStatusToEnum(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.PAID;
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return PaymentStatus.FAIL;
      case 'pending':
      case 'in_process':
      default:
        return PaymentStatus.PENDING;
    }
  }

  private async findPaymentByExternalId(externalId: string): Promise<Payment | null> {
    try {
      // O external_reference do Mercado Pago é nosso paymentId interno
      // Então podemos buscar diretamente pelo ID
      const payment = await this.paymentRepository.findById(externalId);
      
      if (payment) {
        return payment;
      }

      // Se não encontrar, pode ser que o external_id seja a preference_id
      // Neste caso, buscar em todos os pagamentos
      const allPayments = await this.paymentRepository.findAll();
      
      const foundPayment = allPayments.find(p => {
        // Verificar se a description contém referência ao external_id
        // ou se temos algum campo que armazena preference_id
        return p.description?.includes(externalId);
      });

      return foundPayment || null;
    } catch (error) {
      this.logger.error(`Erro ao buscar pagamento por external_id ${externalId}: ${error.message}`);
      return null;
    }
  }

  private async updatePaymentStatusFromWebhook(paymentId: string, webhookData: MercadoPagoWebhookDto): Promise<void> {
    try {
      const status = this.mapMercadoPagoStatusToEnum(this.mapMercadoPagoStatus(webhookData.action));
      
      await this.updatePaymentUseCase.execute(paymentId, { 
        status
      });
      
      this.logger.log(`Status do pagamento ${paymentId} atualizado para ${status} via webhook`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status do pagamento ${paymentId}: ${error.message}`);
      throw error;
    }
  }

  private async updatePaymentStatusDirectly(paymentId: string, mercadoPagoStatus: string): Promise<void> {
    try {
      const status = this.mapMercadoPagoStatusToEnum(mercadoPagoStatus);
      
      await this.updatePaymentUseCase.execute(paymentId, { 
        status
      });
      
      this.logger.log(`Status do pagamento ${paymentId} atualizado para ${status} via status direto do MP`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar status do pagamento ${paymentId}: ${error.message}`);
      throw error;
    }
  }
}