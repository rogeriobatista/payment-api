import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  sleep,
  log,
} from '@temporalio/workflow';
import type * as activities from './activities/payment.activities';
import { PaymentWorkflowInput, PaymentWorkflowResult } from './types/payment-workflow.types';

// Configurar timeouts para activities
const { 
  validatePayment,
  processPaymentWithProvider,
  updatePaymentStatus,
  sendPaymentNotification,
  logPaymentEvent,
  checkExternalPaymentStatus,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumInterval: '30 seconds',
    maximumAttempts: 3,
  },
});

// Signals para controle externo do workflow
export const cancelPaymentSignal = defineSignal<[string]>('cancelPayment');
export const confirmPaymentSignal = defineSignal<[string, any]>('confirmPayment');

// Queries para consultar status do workflow
export const getPaymentStatusQuery = defineQuery<string>('getPaymentStatus');
export const getWorkflowProgressQuery = defineQuery<any>('getWorkflowProgress');

export async function paymentProcessingWorkflow(
  input: PaymentWorkflowInput
): Promise<PaymentWorkflowResult> {
  let currentStatus = 'started';
  let currentStep = 'validation';
  let cancelled = false;
  let confirmed = false;
  let confirmationData: any = null;
  let externalId: string | undefined;
  let checkoutUrl: string | undefined;

  // Setup signal handlers
  setHandler(cancelPaymentSignal, (reason: string) => {
    log.info('Payment cancellation requested', { paymentId: input.paymentId, reason });
    cancelled = true;
    currentStatus = 'cancelled';
  });

  setHandler(confirmPaymentSignal, (status: string, data: any) => {
    log.info('Payment confirmation received', { paymentId: input.paymentId, status, data });
    confirmed = true;
    confirmationData = data;
    currentStatus = status;
  });

  // Setup query handlers
  setHandler(getPaymentStatusQuery, () => currentStatus);
  setHandler(getWorkflowProgressQuery, () => ({
    status: currentStatus,
    step: currentStep,
    paymentId: input.paymentId,
    externalId,
    checkoutUrl,
  }));

  try {
    await logPaymentEvent(input.paymentId, 'workflow_started', input);

    // Step 1: Validação
    currentStep = 'validation';
    currentStatus = 'validating';
    
    log.info('Starting payment validation', { paymentId: input.paymentId });
    
    const validationResult = await validatePayment(input.cpf, input.amount);
    
    if (!validationResult.isValid) {
      currentStatus = 'validation_failed';
      await logPaymentEvent(input.paymentId, 'validation_failed', validationResult);
      await updatePaymentStatus(input.paymentId, 'FAIL');
      
      return {
        paymentId: input.paymentId,
        status: 'failed',
        failureReason: validationResult.errors?.join(', '),
      };
    }

    await logPaymentEvent(input.paymentId, 'validation_passed', validationResult);

    // Check for cancellation
    if (cancelled) {
      await updatePaymentStatus(input.paymentId, 'CANCELLED');
      return {
        paymentId: input.paymentId,
        status: 'cancelled',
        message: 'Payment cancelled by user',
      };
    }

    // Step 2: Processamento com provedor externo
    currentStep = 'processing';
    currentStatus = 'processing';
    
    log.info('Starting payment processing', { paymentId: input.paymentId });
    
    const processingResult = await processPaymentWithProvider(
      input.paymentId,
      input.paymentMethod,
      input.amount,
      input.description
    );

    if (!processingResult.success) {
      currentStatus = 'processing_failed';
      await logPaymentEvent(input.paymentId, 'processing_failed', processingResult);
      await updatePaymentStatus(input.paymentId, 'FAIL');
      
      return {
        paymentId: input.paymentId,
        status: 'failed',
        failureReason: processingResult.errorMessage,
      };
    }

    externalId = processingResult.externalId;
    checkoutUrl = processingResult.checkoutUrl;
    
    await logPaymentEvent(input.paymentId, 'processing_completed', processingResult);
    await updatePaymentStatus(input.paymentId, 'PENDING', externalId);

    // Step 3: Aguardar confirmação ou timeout
    currentStep = 'awaiting_confirmation';
    currentStatus = 'pending';

    log.info('Waiting for payment confirmation', { 
      paymentId: input.paymentId, 
      externalId,
      checkoutUrl 
    });

    // Enviar notificação inicial
    await sendPaymentNotification(input.paymentId, input.cpf, 'PENDING');

    // Aguardar confirmação por até 30 minutos
    const confirmationTimeout = 30 * 60 * 1000; // 30 minutes
    const checkInterval = 2 * 60 * 1000; // 2 minutes
    
    let timeElapsed = 0;
    
    while (!confirmed && !cancelled && timeElapsed < confirmationTimeout) {
      // Wait for signal or timeout
      const waitResult = await condition(() => confirmed || cancelled, checkInterval);
      
      if (!waitResult) {
        // Timeout reached, check external status
        if (externalId) {
          const statusCheck = await checkExternalPaymentStatus(externalId, 'mercadopago');
          
          if (statusCheck.status === 'paid') {
            confirmed = true;
            currentStatus = 'paid';
            confirmationData = statusCheck.details;
            break;
          } else if (statusCheck.status === 'failed') {
            currentStatus = 'failed';
            await updatePaymentStatus(input.paymentId, 'FAIL');
            await logPaymentEvent(input.paymentId, 'payment_failed', statusCheck);
            
            return {
              paymentId: input.paymentId,
              status: 'failed',
              failureReason: 'Payment failed at external provider',
            };
          }
        }
        
        timeElapsed += checkInterval;
      }
    }

    // Check final status
    if (cancelled) {
      await updatePaymentStatus(input.paymentId, 'CANCELLED');
      await sendPaymentNotification(input.paymentId, input.cpf, 'CANCELLED');
      
      return {
        paymentId: input.paymentId,
        status: 'cancelled',
        message: 'Payment cancelled',
      };
    }

    if (confirmed && currentStatus === 'paid') {
      // Step 4: Finalização
      currentStep = 'finalizing';
      
      await updatePaymentStatus(input.paymentId, 'PAID');
      await sendPaymentNotification(input.paymentId, input.cpf, 'PAID');
      await logPaymentEvent(input.paymentId, 'payment_completed', confirmationData);
      
      return {
        paymentId: input.paymentId,
        status: 'completed',
        message: 'Payment completed successfully',
        checkoutUrl,
      };
    }

    // Timeout sem confirmação
    currentStatus = 'expired';
    await updatePaymentStatus(input.paymentId, 'EXPIRED');
    await sendPaymentNotification(input.paymentId, input.cpf, 'EXPIRED');
    await logPaymentEvent(input.paymentId, 'payment_expired', { timeElapsed });

    return {
      paymentId: input.paymentId,
      status: 'failed',
      failureReason: 'Payment expired - no confirmation received within timeout period',
    };

  } catch (error) {
    currentStatus = 'error';
    const errorMessage = error instanceof Error ? error.message : 'Unknown workflow error';
    
    await logPaymentEvent(input.paymentId, 'workflow_error', { error: errorMessage });
    await updatePaymentStatus(input.paymentId, 'FAIL');
    
    return {
      paymentId: input.paymentId,
      status: 'failed',
      failureReason: errorMessage,
    };
  }
}