import { Controller, Post, Body, HttpStatus, HttpCode, Logger } from '@nestjs/common';
import { UpdatePaymentUseCase } from '@application/use-cases';
import { PaymentStatus } from '@domain/enums';

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

@Controller('api/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly updatePaymentUseCase: UpdatePaymentUseCase,
  ) {}

  @Post('mercado-pago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(@Body() webhookData: MercadoPagoWebhookDto) {
    this.logger.log(`Webhook recebido do Mercado Pago: ${JSON.stringify(webhookData)}`);

    try {
      // Verificar se é uma notificação de pagamento
      if (webhookData.type === 'payment') {
        const paymentId = webhookData.data.id;
        
        // Aqui você implementaria a lógica para consultar o status do pagamento
        // no Mercado Pago e atualizar o status no seu sistema
        
        // Por enquanto, apenas logamos o evento
        this.logger.log(`Pagamento ${paymentId} notificado pelo Mercado Pago`);
        
        // Exemplo de atualização de status (você precisaria implementar a consulta real)
        // const mercadoPagoPayment = await this.mercadoPagoService.getPayment(paymentId);
        // const status = this.mapMercadoPagoStatus(mercadoPagoPayment.status);
        // await this.updatePaymentUseCase.execute(externalReference, { status });
      }

      return { message: 'Webhook processado com sucesso' };
    } catch (error) {
      this.logger.error(`Erro ao processar webhook: ${error.message}`);
      throw error;
    }
  }

  private mapMercadoPagoStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.PAID;
      case 'rejected':
      case 'cancelled':
        return PaymentStatus.FAIL;
      case 'pending':
      case 'in_process':
      default:
        return PaymentStatus.PENDING;
    }
  }
}