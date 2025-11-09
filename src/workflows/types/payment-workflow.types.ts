export interface PaymentWorkflowInput {
  paymentId: string;
  cpf: string;
  description: string;
  amount: number;
  paymentMethod: string;
}

export interface PaymentWorkflowResult {
  paymentId: string;
  status: 'completed' | 'failed' | 'cancelled';
  message?: string;
  checkoutUrl?: string;
  failureReason?: string;
}

export interface PaymentProcessingResult {
  success: boolean;
  checkoutUrl?: string;
  externalId?: string;
  errorMessage?: string;
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface NotificationResult {
  success: boolean;
  channel: 'email' | 'sms' | 'webhook';
  message?: string;
}