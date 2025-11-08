import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetPaymentUseCase } from '../get-payment.use-case';
import { PaymentRepository } from '@domain/repositories';
import { PaymentMethod, PaymentStatus } from '@domain/enums';
import { Payment } from '@domain/entities';

describe('GetPaymentUseCase', () => {
  let useCase: GetPaymentUseCase;
  let paymentRepository: jest.Mocked<PaymentRepository>;

  beforeEach(async () => {
    const mockPaymentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCpf: jest.fn(),
      findByPaymentMethod: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentUseCase,
        {
          provide: 'PaymentRepository',
          useValue: mockPaymentRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetPaymentUseCase>(GetPaymentUseCase);
    paymentRepository = module.get('PaymentRepository');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return payment when found', async () => {
      const payment = new Payment(
        '11144477735',
        'Test payment',
        100.50,
        PaymentMethod.PIX,
        'test-payment-id',
      );

      paymentRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute('test-payment-id');

      expect(paymentRepository.findById).toHaveBeenCalledWith('test-payment-id');
      expect(result).toBe(payment);
      expect(result.id).toBe('test-payment-id');
      expect(result.cpf).toBe('11144477735');
      expect(result.description).toBe('Test payment');
      expect(result.amount).toBe(100.50);
      expect(result.paymentMethod).toBe(PaymentMethod.PIX);
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should return credit card payment when found', async () => {
      const payment = new Payment(
        '52998224725',
        'Credit card payment',
        299.99,
        PaymentMethod.CREDIT_CARD,
        'credit-card-payment-id',
      );
      payment.updateStatus(PaymentStatus.PAID);

      paymentRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute('credit-card-payment-id');

      expect(paymentRepository.findById).toHaveBeenCalledWith('credit-card-payment-id');
      expect(result).toBe(payment);
      expect(result.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.amount).toBe(299.99);
    });

    it('should return payment with FAIL status', async () => {
      const payment = new Payment(
        '11144477735',
        'Failed payment',
        150.00,
        PaymentMethod.CREDIT_CARD,
        'failed-payment-id',
      );
      payment.updateStatus(PaymentStatus.FAIL);

      paymentRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute('failed-payment-id');

      expect(result.status).toBe(PaymentStatus.FAIL);
    });

    it('should throw NotFoundException when payment not found', async () => {
      paymentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent-id')
      ).rejects.toThrow(NotFoundException);

      expect(paymentRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should throw NotFoundException with correct message', async () => {
      paymentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent-id')
      ).rejects.toThrow('Pagamento com ID non-existent-id não encontrado');
    });

    it('should handle various UUID formats', async () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      for (const uuid of validUUIDs) {
        const payment = new Payment(
          '11144477735',
          `Payment ${uuid}`,
          100.00,
          PaymentMethod.PIX,
          uuid,
        );

        paymentRepository.findById.mockResolvedValue(payment);

        const result = await useCase.execute(uuid);

        expect(result.id).toBe(uuid);
        expect(paymentRepository.findById).toHaveBeenCalledWith(uuid);
      }
    });

    it('should return payment with all properties correctly', async () => {
      const payment = new Payment(
        '11144477735',
        'Complete payment test',
        500.25,
        PaymentMethod.PIX,
        'complete-test-id',
      );

      paymentRepository.findById.mockResolvedValue(payment);

      const result = await useCase.execute('complete-test-id');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('cpf');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('paymentMethod');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle repository errors gracefully', async () => {
      const repositoryError = new Error('Database connection error');
      paymentRepository.findById.mockRejectedValue(repositoryError);

      await expect(
        useCase.execute('test-id')
      ).rejects.toThrow('Database connection error');

      expect(paymentRepository.findById).toHaveBeenCalledWith('test-id');
    });

    it('should call repository only once per execution', async () => {
      const payment = new Payment(
        '11144477735',
        'Test payment',
        100.50,
        PaymentMethod.PIX,
        'test-payment-id',
      );

      paymentRepository.findById.mockResolvedValue(payment);

      await useCase.execute('test-payment-id');

      expect(paymentRepository.findById).toHaveBeenCalledTimes(1);
      expect(paymentRepository.findById).toHaveBeenCalledWith('test-payment-id');
    });
  });
});