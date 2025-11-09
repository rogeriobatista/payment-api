import { PaymentValidationResult, PaymentProcessingResult, NotificationResult } from '../types/payment-workflow.types';
import { MercadoPagoService } from '../../infrastructure/services/mercado-pago.service';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { TypeOrmPaymentRepository } from '../../infrastructure/repositories/typeorm-payment.repository';
import { PaymentEntity } from '../../infrastructure/database/entities/payment.entity';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';

// Instâncias dos serviços (será injetado pelo worker)
let mercadoPagoService: MercadoPagoService;
let paymentRepository: PaymentRepository;
let configService: ConfigService;

// Função para inicializar dependências
export function initializeActivities(dataSource: DataSource, config: ConfigService) {
  configService = config;
  mercadoPagoService = new MercadoPagoService(configService);
  paymentRepository = new TypeOrmPaymentRepository(dataSource.getRepository(PaymentEntity));
}

// Activity para validar dados do pagamento
export async function validatePayment(cpf: string, amount: number): Promise<PaymentValidationResult> {
  const errors: string[] = [];

  // Validar CPF
  if (!cpf || !/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/.test(cpf)) {
    errors.push('CPF inválido');
  }

  // Validar valor
  if (!amount || amount <= 0) {
    errors.push('Valor deve ser maior que zero');
  }

  // Simular validação adicional (consulta a blacklist, etc.)
  if (cpf === '000.000.000-00' || cpf === '00000000000') {
    errors.push('CPF bloqueado');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Activity para processar pagamento com provedor externo
export async function processPaymentWithProvider(
  paymentId: string,
  paymentMethod: string,
  amount: number,
  description: string
): Promise<PaymentProcessingResult> {
  try {
    console.log(`Processing payment ${paymentId} with ${paymentMethod}`);
    
    if (paymentMethod === 'CREDIT_CARD') {
      // Usar serviço real do Mercado Pago
      if (mercadoPagoService) {
        try {
          const preference = await mercadoPagoService.createPreference({
            title: description,
            description: description,
            quantity: 1,
            unit_price: amount,
            external_reference: paymentId,
          });
          
          return {
            success: true,
            checkoutUrl: preference.init_point,
            externalId: preference.id,
          };
        } catch (error) {
          console.error('Erro ao criar preferência Mercado Pago:', error);
          return {
            success: false,
            errorMessage: `Erro no Mercado Pago: ${error.message}`,
          };
        }
      } else {
        // Fallback para desenvolvimento
        return {
          success: true,
          checkoutUrl: `https://checkout.mercadopago.com/${paymentId}`,
          externalId: `mp_${paymentId}_${Date.now()}`,
        };
      }
    } else if (paymentMethod === 'PIX') {
      // Simular geração de PIX (pode ser expandido com API real)
      return {
        success: true,
        externalId: `pix_${paymentId}_${Date.now()}`,
      };
    }

    return {
      success: false,
      errorMessage: 'Método de pagamento não suportado',
    };
  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Activity para atualizar status do pagamento no banco
export async function updatePaymentStatus(
  paymentId: string,
  status: string,
  externalId?: string
): Promise<boolean> {
  try {
    console.log(`Updating payment ${paymentId} status to ${status}`);
    
    if (paymentRepository) {
      // Mapear string para enum
      let paymentStatus: PaymentStatus;
      switch (status.toLowerCase()) {
        case 'paid':
          paymentStatus = PaymentStatus.PAID;
          break;
        case 'fail':
        case 'failed':
        case 'cancelled':
          paymentStatus = PaymentStatus.FAIL;
          break;
        case 'pending':
        default:
          paymentStatus = PaymentStatus.PENDING;
          break;
      }
      
      // Atualizar no banco de dados
      const updatedPayment = await paymentRepository.update(paymentId, { 
        status: paymentStatus,
        // Se tivesse campo externalId na entidade: externalId 
      });
      
      return updatedPayment !== null;
    } else {
      // Fallback para desenvolvimento - apenas log
      console.log(`[SIMULATED] Payment ${paymentId} updated to ${status}${externalId ? ` with external ID ${externalId}` : ''}`);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating payment status: ${error}`);
    return false;
  }
}

// Activity para enviar notificações
export async function sendPaymentNotification(
  paymentId: string,
  cpf: string,
  status: string,
  channel: 'email' | 'sms' | 'webhook' = 'email'
): Promise<NotificationResult> {
  try {
    console.log(`Sending ${channel} notification for payment ${paymentId} to ${cpf}`);
    
    // Simular envio de notificação
    const message = `Seu pagamento ${paymentId} está ${status}`;
    
    // Aqui você implementaria o envio real (email service, SMS, webhook, etc.)
    
    return {
      success: true,
      channel,
      message,
    };
  } catch (error) {
    return {
      success: false,
      channel,
      message: error instanceof Error ? error.message : 'Erro no envio',
    };
  }
}

// Activity para logging e auditoria
export async function logPaymentEvent(
  paymentId: string,
  event: string,
  details: any
): Promise<void> {
  console.log(`Payment ${paymentId} - ${event}:`, details);
  
  // Aqui você salvaria o log em um sistema de auditoria
  // await auditService.log({
  //   paymentId,
  //   event,
  //   details,
  //   timestamp: new Date(),
  // });
}

// Activity para verificar status de pagamento externo
export async function checkExternalPaymentStatus(
  externalId: string,
  provider: string
): Promise<{ status: string; details?: any }> {
  try {
    console.log(`Checking payment status for ${externalId} at ${provider}`);
    
    // Simular consulta ao provedor externo
    // const response = await providerApi.getPayment(externalId);
    
    // Simular diferentes status baseado no tempo
    const statuses = ['pending', 'paid', 'failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus,
      details: {
        provider,
        externalId,
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: 'unknown',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}