import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export interface MercadoPagoPreferenceInput {
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  payer_email?: string;
  external_reference?: string;
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig;
  private readonly preference: Preference;
  private readonly payment: Payment;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    this.client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: 'abc',
      },
    });

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  async createPreference(input: MercadoPagoPreferenceInput): Promise<MercadoPagoPreferenceResponse> {
    try {
      this.logger.log(`Criando preferência no Mercado Pago para: ${input.external_reference}`);

      const preferenceData = {
        items: [
          {
            id: input.external_reference || 'payment-item',
            title: input.title,
            description: input.description,
            quantity: input.quantity,
            unit_price: input.unit_price,
          },
        ],
        payer: input.payer_email ? {
          email: input.payer_email,
        } : undefined,
        external_reference: input.external_reference,
        notification_url: this.configService.get<string>('MERCADO_PAGO_WEBHOOK_URL'),
        back_urls: {
          success: this.configService.get<string>('MERCADO_PAGO_SUCCESS_URL', 'http://localhost:3000/payment/success'),
          failure: this.configService.get<string>('MERCADO_PAGO_FAILURE_URL', 'http://localhost:3000/payment/failure'),
          pending: this.configService.get<string>('MERCADO_PAGO_PENDING_URL', 'http://localhost:3000/payment/pending'),
        },
        auto_return: 'approved' as const,
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' },
            { id: 'bank_transfer' },
          ],
          installments: 12,
        },
      };

      const response = await this.preference.create({ body: preferenceData });

      this.logger.log(`Preferência criada com sucesso. ID: ${response.id}`);

      return {
        id: response.id!,
        init_point: response.init_point!,
        sandbox_init_point: response.sandbox_init_point!,
      };
    } catch (error) {
      this.logger.error('Erro ao criar preferência no Mercado Pago', error);
      throw new Error('Falha ao criar preferência de pagamento');
    }
  }

  async getPreference(preferenceId: string) {
    try {
      this.logger.log(`Buscando preferência: ${preferenceId}`);
      const response = await this.preference.get({ preferenceId });
      return response;
    } catch (error) {
      this.logger.error(`Erro ao buscar preferência ${preferenceId}`, error);
      throw new Error('Falha ao buscar preferência de pagamento');
    }
  }

  async getPayment(paymentId: string) {
    try {
      this.logger.log(`Buscando pagamento: ${paymentId}`);
      const response = await this.payment.get({ id: paymentId });
      return response;
    } catch (error) {
      this.logger.error(`Erro ao buscar pagamento ${paymentId}`, error);
      throw new Error('Falha ao buscar dados do pagamento');
    }
  }
}