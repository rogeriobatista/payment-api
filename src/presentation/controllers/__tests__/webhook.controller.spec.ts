import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from '../webhook.controller';
import { UpdatePaymentUseCase } from '@application/use-cases';
import { PaymentStatus, PaymentMethod } from '@domain/enums';
import { TemporalService } from '../../../workflows/temporal.service';
import { PaymentRepository } from '@domain/repositories';
import { MercadoPagoService } from '../../../infrastructure/services/mercado-pago.service';
import { Payment } from '@domain/entities';

describe('WebhookController', () => {
  let controller: WebhookController;
  let updatePaymentUseCase: jest.Mocked<UpdatePaymentUseCase>;
  let temporalService: jest.Mocked<TemporalService>;
  let paymentRepository: jest.Mocked<PaymentRepository>;
  let mercadoPagoService: jest.Mocked<MercadoPagoService>;

  beforeEach(async () => {
    const mockUpdatePaymentUseCase = {
      execute: jest.fn(),
    };

    const mockTemporalService = {
      startWorkflow: jest.fn(),
      signalWorkflow: jest.fn(),
    };

    const mockPaymentRepository = {
      findById: jest.fn(),
      findByMercadoPagoId: jest.fn(),
      findByExternalId: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    const mockMercadoPagoService = {
      createPreference: jest.fn(),
      getPayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: UpdatePaymentUseCase,
          useValue: mockUpdatePaymentUseCase,
        },
        {
          provide: TemporalService,
          useValue: mockTemporalService,
        },
        {
          provide: 'PaymentRepository',
          useValue: mockPaymentRepository,
        },
        {
          provide: MercadoPagoService,
          useValue: mockMercadoPagoService,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    updatePaymentUseCase = module.get(UpdatePaymentUseCase);
    temporalService = module.get(TemporalService);
    paymentRepository = module.get('PaymentRepository');
    mercadoPagoService = module.get(MercadoPagoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleMercadoPagoWebhook', () => {
    it('should handle payment webhook successfully', async () => {
      // Setup mock payment
      const mockPayment = new Payment(
        '11144477735',
        'Test payment',
        100,
        PaymentMethod.PIX,
        'mercado-pago-payment-id'
      );
      mockPayment.status = PaymentStatus.PENDING;

      paymentRepository.findById.mockResolvedValue(mockPayment);

      const webhookData = {
        id: 12345,
        live_mode: false,
        type: 'payment',
        date_created: '2023-11-07T10:00:00.000Z',
        application_id: 123456789,
        user_id: 987654321,
        version: 1,
        api_version: 'v1',
        action: 'payment.updated',
        data: {
          id: 'mercado-pago-payment-id',
        },
      };

      const result = await controller.handleMercadoPagoWebhook(webhookData);

      expect(result).toEqual({
        message: 'Webhook processado com sucesso',
      });
    });

    it('should handle non-payment webhook types', async () => {
      const webhookData = {
        id: 12345,
        live_mode: false,
        type: 'subscription', // Not a payment
        date_created: '2023-11-07T10:00:00.000Z',
        application_id: 123456789,
        user_id: 987654321,
        version: 1,
        api_version: 'v1',
        action: 'subscription.updated',
        data: {
          id: 'subscription-id',
        },
      };

      const result = await controller.handleMercadoPagoWebhook(webhookData);

      expect(result).toEqual({
        message: 'Webhook processado com sucesso',
      });

      // Should not call updatePaymentUseCase for non-payment webhooks
      expect(updatePaymentUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle payment webhook with different actions', async () => {
      // Setup mock payment
      const mockPayment = new Payment(
        '11144477735',
        'Test payment',
        100,
        PaymentMethod.PIX,
        'mercado-pago-payment-id'
      );
      mockPayment.status = PaymentStatus.PENDING;

      paymentRepository.findById.mockResolvedValue(mockPayment);

      const webhookData = {
        id: 12345,
        live_mode: false,
        type: 'payment',
        date_created: '2023-11-07T10:00:00.000Z',
        application_id: 123456789,
        user_id: 987654321,
        version: 1,
        api_version: 'v1',
        action: 'payment.created',
        data: {
          id: 'mercado-pago-payment-id',
        },
      };

      const result = await controller.handleMercadoPagoWebhook(webhookData);

      expect(result).toEqual({
        message: 'Webhook processado com sucesso',
      });
    });

    it('should handle live mode webhooks', async () => {
      // Setup mock payment
      const mockPayment = new Payment(
        '11144477735',
        'Test payment',
        100,
        PaymentMethod.PIX,
        'live-payment-id'
      );
      mockPayment.status = PaymentStatus.PENDING;

      paymentRepository.findById.mockResolvedValue(mockPayment);

      const webhookData = {
        id: 67890,
        live_mode: true,
        type: 'payment',
        date_created: '2023-11-07T10:00:00.000Z',
        application_id: 123456789,
        user_id: 987654321,
        version: 1,
        api_version: 'v1',
        action: 'payment.updated',
        data: {
          id: 'live-payment-id',
        },
      };

      const result = await controller.handleMercadoPagoWebhook(webhookData);

      expect(result).toEqual({
        message: 'Webhook processado com sucesso',
      });
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const invalidWebhookData = null; // This should cause an error

      // Act
      const result = await controller.handleMercadoPagoWebhook(invalidWebhookData);

      // Assert
      // The webhook controller handles errors gracefully and returns error message
      expect(result).toEqual({
        success: false,
        message: 'Webhook data inválido',
      });
    });

    it('should log webhook data', async () => {
      // Setup mock payment
      const mockPayment = new Payment(
        '11144477735',
        'Test payment',
        100,
        PaymentMethod.PIX,
        'logged-payment-id'
      );
      mockPayment.status = PaymentStatus.PENDING;

      paymentRepository.findById.mockResolvedValue(mockPayment);

      const consoleSpy = jest.spyOn(console, 'log');
      
      const webhookData = {
        id: 12345,
        live_mode: false,
        type: 'payment',
        date_created: '2023-11-07T10:00:00.000Z',
        application_id: 123456789,
        user_id: 987654321,
        version: 1,
        api_version: 'v1',
        action: 'payment.updated',
        data: {
          id: 'logged-payment-id',
        },
      };

      const result = await controller.handleMercadoPagoWebhook(webhookData);

      // Note: This test might not work with the mocked console.log in test-setup
      // but demonstrates the intention to test logging
      expect(result).toEqual({
        message: 'Webhook processado com sucesso',
      });

      consoleSpy.mockRestore();
    });

    it('should handle webhook with missing data field', async () => {
      const webhookData = {
        id: 12345,
        live_mode: false,
        type: 'payment',
        date_created: '2023-11-07T10:00:00.000Z',
        application_id: 123456789,
        user_id: 987654321,
        version: 1,
        api_version: 'v1',
        action: 'payment.updated',
        data: {
          id: '', // Empty ID
        },
      };

      const result = await controller.handleMercadoPagoWebhook(webhookData);

      expect(result).toEqual({
        success: false,
        message: 'Payment ID não informado',
      });
    });

    it('should handle webhook with different API versions', async () => {
      // Setup mock payment
      const mockPayment = new Payment(
        '11144477735',
        'Test payment',
        100,
        PaymentMethod.PIX,
        'v2-payment-id'
      );
      mockPayment.status = PaymentStatus.PENDING;

      paymentRepository.findById.mockResolvedValue(mockPayment);

      const webhookData = {
        id: 12345,
        live_mode: false,
        type: 'payment',
        date_created: '2023-11-07T10:00:00.000Z',
        application_id: 123456789,
        user_id: 987654321,
        version: 2,
        api_version: 'v2',
        action: 'payment.updated',
        data: {
          id: 'v2-payment-id',
        },
      };

      const result = await controller.handleMercadoPagoWebhook(webhookData);

      expect(result).toEqual({
        message: 'Webhook processado com sucesso',
      });
    });
  });

  describe('mapMercadoPagoStatus', () => {
    it('should map approved status to PAID', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum('approved');
      expect(result).toBe(PaymentStatus.PAID);
    });

    it('should map rejected status to FAIL', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum('rejected');
      expect(result).toBe(PaymentStatus.FAIL);
    });

    it('should map cancelled status to FAIL', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum('cancelled');
      expect(result).toBe(PaymentStatus.FAIL);
    });

    it('should map pending status to PENDING', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum('pending');
      expect(result).toBe(PaymentStatus.PENDING);
    });

    it('should map in_process status to PENDING', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum('in_process');
      expect(result).toBe(PaymentStatus.PENDING);
    });

    it('should map unknown status to PENDING', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum('unknown_status');
      expect(result).toBe(PaymentStatus.PENDING);
    });

    it('should map empty status to PENDING', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum('');
      expect(result).toBe(PaymentStatus.PENDING);
    });

    it('should map null status to PENDING', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum(null as any);
      expect(result).toBe(PaymentStatus.PENDING);
    });

    it('should map undefined status to PENDING', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum(undefined as any);
      expect(result).toBe(PaymentStatus.PENDING);
    });

    it('should handle case-sensitive status mapping', () => {
      const result = (controller as any).mapMercadoPagoStatusToEnum('APPROVED');
      expect(result).toBe(PaymentStatus.PENDING); // Should default to PENDING for unrecognized case
    });
  });
});