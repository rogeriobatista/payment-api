import { Test, TestingModule } from '@nestjs/testing';
import { ListPaymentsUseCase } from '../list-payments.use-case';
import { PaymentRepository } from '@domain/repositories';
import { PaymentMethod, PaymentStatus } from '@domain/enums';
import { Payment } from '@domain/entities';

describe('ListPaymentsUseCase', () => {
  let useCase: ListPaymentsUseCase;
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
        ListPaymentsUseCase,
        {
          provide: 'PaymentRepository',
          useValue: mockPaymentRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListPaymentsUseCase>(ListPaymentsUseCase);
    paymentRepository = module.get('PaymentRepository');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    let mockPayments: Payment[];

    beforeEach(() => {
      mockPayments = [
        new Payment(
          '11144477735',
          'PIX Payment 1',
          100.50,
          PaymentMethod.PIX,
          'payment-1',
        ),
        new Payment(
          '52998224725',
          'Credit Card Payment',
          299.99,
          PaymentMethod.CREDIT_CARD,
          'payment-2',
        ),
        new Payment(
          '11144477735',
          'PIX Payment 2',
          50.25,
          PaymentMethod.PIX,
          'payment-3',
        ),
      ];
    });

    it('should return all payments when no filters provided', async () => {
      paymentRepository.findAll.mockResolvedValue(mockPayments);

      const result = await useCase.execute();

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: undefined,
        paymentMethod: undefined,
        limit: 50,
        offset: 0,
      });
      expect(result).toHaveLength(3);
      expect(result).toBe(mockPayments);
    });

    it('should return empty array when no payments found', async () => {
      paymentRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should filter payments by CPF', async () => {
      const filteredPayments = mockPayments.filter(p => p.cpf === '11144477735');
      paymentRepository.findAll.mockResolvedValue(filteredPayments);

      const result = await useCase.execute({ cpf: '11144477735' });

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: '11144477735',
        paymentMethod: undefined,
        limit: 50,
        offset: 0,
      });
      expect(result).toHaveLength(2);
      expect(result.every(p => p.cpf === '11144477735')).toBe(true);
    });

    it('should filter payments by payment method', async () => {
      const filteredPayments = mockPayments.filter(p => p.paymentMethod === PaymentMethod.PIX);
      paymentRepository.findAll.mockResolvedValue(filteredPayments);

      const result = await useCase.execute({ paymentMethod: PaymentMethod.PIX });

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: undefined,
        paymentMethod: PaymentMethod.PIX,
        limit: 50,
        offset: 0,
      });
      expect(result).toHaveLength(2);
      expect(result.every(p => p.paymentMethod === PaymentMethod.PIX)).toBe(true);
    });

    it('should filter payments by CREDIT_CARD method', async () => {
      const filteredPayments = mockPayments.filter(p => p.paymentMethod === PaymentMethod.CREDIT_CARD);
      paymentRepository.findAll.mockResolvedValue(filteredPayments);

      const result = await useCase.execute({ paymentMethod: PaymentMethod.CREDIT_CARD });

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: undefined,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        limit: 50,
        offset: 0,
      });
      expect(result).toHaveLength(1);
      expect(result[0].paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });

    it('should apply custom limit', async () => {
      const limitedPayments = mockPayments.slice(0, 2);
      paymentRepository.findAll.mockResolvedValue(limitedPayments);

      const result = await useCase.execute({ limit: 2 });

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: undefined,
        paymentMethod: undefined,
        limit: 2,
        offset: 0,
      });
      expect(result).toHaveLength(2);
    });

    it('should apply custom offset', async () => {
      const offsetPayments = mockPayments.slice(1);
      paymentRepository.findAll.mockResolvedValue(offsetPayments);

      const result = await useCase.execute({ offset: 1 });

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: undefined,
        paymentMethod: undefined,
        limit: 50,
        offset: 1,
      });
      expect(result).toHaveLength(2);
    });

    it('should apply multiple filters together', async () => {
      const multiFilteredPayments = mockPayments.filter(
        p => p.cpf === '11144477735' && p.paymentMethod === PaymentMethod.PIX
      );
      paymentRepository.findAll.mockResolvedValue(multiFilteredPayments);

      const result = await useCase.execute({
        cpf: '11144477735',
        paymentMethod: PaymentMethod.PIX,
        limit: 10,
        offset: 0,
      });

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: '11144477735',
        paymentMethod: PaymentMethod.PIX,
        limit: 10,
        offset: 0,
      });
      expect(result).toHaveLength(2);
      expect(result.every(p => p.cpf === '11144477735' && p.paymentMethod === PaymentMethod.PIX)).toBe(true);
    });

    it('should use default limit when not provided', async () => {
      paymentRepository.findAll.mockResolvedValue(mockPayments);

      await useCase.execute({});

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: undefined,
        paymentMethod: undefined,
        limit: 50,
        offset: 0,
      });
    });

    it('should use default offset when not provided', async () => {
      paymentRepository.findAll.mockResolvedValue(mockPayments);

      await useCase.execute({ limit: 10 });

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: undefined,
        paymentMethod: undefined,
        limit: 10,
        offset: 0,
      });
    });

    it('should handle large limit values', async () => {
      paymentRepository.findAll.mockResolvedValue(mockPayments);

      await useCase.execute({ limit: 1000 });

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: undefined,
        paymentMethod: undefined,
        limit: 1000,
        offset: 0,
      });
    });

    it('should handle large offset values', async () => {
      paymentRepository.findAll.mockResolvedValue([]);

      await useCase.execute({ offset: 1000 });

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: undefined,
        paymentMethod: undefined,
        limit: 50,
        offset: 1000,
      });
    });

    it('should return payments with different statuses', async () => {
      const paymentsWithStatuses = [
        new Payment('11144477735', 'Pending payment', 100, PaymentMethod.PIX, 'pending-1'),
        new Payment('52998224725', 'Paid payment', 200, PaymentMethod.CREDIT_CARD, 'paid-1'),
        new Payment('11144477735', 'Failed payment', 300, PaymentMethod.CREDIT_CARD, 'failed-1'),
      ];
      
      paymentsWithStatuses[1].updateStatus(PaymentStatus.PAID);
      paymentsWithStatuses[2].updateStatus(PaymentStatus.FAIL);

      paymentRepository.findAll.mockResolvedValue(paymentsWithStatuses);

      const result = await useCase.execute();

      expect(result[0].status).toBe(PaymentStatus.PENDING);
      expect(result[1].status).toBe(PaymentStatus.PAID);
      expect(result[2].status).toBe(PaymentStatus.FAIL);
    });

    it('should handle repository errors gracefully', async () => {
      const repositoryError = new Error('Database connection error');
      paymentRepository.findAll.mockRejectedValue(repositoryError);

      await expect(
        useCase.execute()
      ).rejects.toThrow('Database connection error');

      expect(paymentRepository.findAll).toHaveBeenCalled();
    });

    it('should call repository only once per execution', async () => {
      paymentRepository.findAll.mockResolvedValue(mockPayments);

      await useCase.execute({ cpf: '11144477735' });

      expect(paymentRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should pass exact filter parameters to repository', async () => {
      const input = {
        cpf: '11144477735',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        limit: 25,
        offset: 10,
      };

      paymentRepository.findAll.mockResolvedValue([]);

      await useCase.execute(input);

      expect(paymentRepository.findAll).toHaveBeenCalledWith({
        cpf: '11144477735',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        limit: 25,
        offset: 10,
      });
    });
  });
});