import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdatePaymentUseCase } from '../update-payment.use-case';
import { PaymentRepository } from '@domain/repositories';
import { PaymentMethod, PaymentStatus } from '@domain/enums';
import { Payment } from '@domain/entities';

describe('UpdatePaymentUseCase', () => {
  let useCase: UpdatePaymentUseCase;
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
        UpdatePaymentUseCase,
        {
          provide: 'PaymentRepository',
          useValue: mockPaymentRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdatePaymentUseCase>(UpdatePaymentUseCase);
    paymentRepository = module.get('PaymentRepository');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    let existingPayment: Payment;

    beforeEach(() => {
      existingPayment = new Payment(
        '11144477735',
        'Original payment',
        100.50,
        PaymentMethod.PIX,
        'existing-payment-id',
      );
    });

    it('should update payment status only', async () => {
      const input = { status: PaymentStatus.PAID };
      
      paymentRepository.findById.mockResolvedValue(existingPayment);
      
      const updatedPayment = new Payment(
        existingPayment.cpf,
        existingPayment.description,
        existingPayment.amount,
        existingPayment.paymentMethod,
        existingPayment.id,
      );
      updatedPayment.updateStatus(PaymentStatus.PAID);
      
      paymentRepository.save.mockResolvedValue(updatedPayment);

      const result = await useCase.execute('existing-payment-id', input);

      expect(paymentRepository.findById).toHaveBeenCalledWith('existing-payment-id');
      expect(paymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.PAID,
        }),
      );
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should update multiple payment fields', async () => {
      const input = {
        description: 'Updated description',
        amount: 200.75,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };
      
      paymentRepository.findById.mockResolvedValue(existingPayment);
      
      const updatedPayment = new Payment(
        existingPayment.cpf,
        input.description,
        input.amount,
        input.paymentMethod,
        existingPayment.id,
      );
      
      paymentRepository.save.mockResolvedValue(updatedPayment);

      const result = await useCase.execute('existing-payment-id', input);

      expect(result.description).toBe('Updated description');
      expect(result.amount).toBe(200.75);
      expect(result.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });

    it('should update fields and status together', async () => {
      const input = {
        description: 'Updated description',
        amount: 150.00,
        status: PaymentStatus.PAID,
      };
      
      paymentRepository.findById.mockResolvedValue(existingPayment);
      
      const updatedPayment = new Payment(
        existingPayment.cpf,
        input.description,
        input.amount,
        existingPayment.paymentMethod,
        existingPayment.id,
      );
      updatedPayment.updateStatus(PaymentStatus.PAID);
      
      paymentRepository.save.mockResolvedValue(updatedPayment);

      const result = await useCase.execute('existing-payment-id', input);

      expect(result.description).toBe('Updated description');
      expect(result.amount).toBe(150.00);
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should update CPF', async () => {
      const input = { cpf: '52998224725' };
      
      paymentRepository.findById.mockResolvedValue(existingPayment);
      
      const updatedPayment = new Payment(
        input.cpf,
        existingPayment.description,
        existingPayment.amount,
        existingPayment.paymentMethod,
        existingPayment.id,
      );
      
      paymentRepository.save.mockResolvedValue(updatedPayment);

      const result = await useCase.execute('existing-payment-id', input);

      expect(result.cpf).toBe('52998224725');
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      const input = { status: PaymentStatus.PAID };
      
      paymentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent-id', input)
      ).rejects.toThrow(NotFoundException);
      
      expect(paymentRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException with correct message', async () => {
      const input = { status: PaymentStatus.PAID };
      
      paymentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute('non-existent-id', input)
      ).rejects.toThrow('Pagamento com ID non-existent-id não encontrado');
    });

    it('should handle validation errors from payment entity', async () => {
      const input = { amount: -100 }; // Invalid amount
      
      paymentRepository.findById.mockResolvedValue(existingPayment);

      await expect(
        useCase.execute('existing-payment-id', input)
      ).rejects.toThrow('Valor deve ser maior que zero');
      
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should handle invalid CPF updates', async () => {
      const input = { cpf: 'invalid-cpf' };
      
      paymentRepository.findById.mockResolvedValue(existingPayment);

      await expect(
        useCase.execute('existing-payment-id', input)
      ).rejects.toThrow('CPF inválido');
      
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should handle empty description updates', async () => {
      const input = { description: '' };
      
      paymentRepository.findById.mockResolvedValue(existingPayment);

      await expect(
        useCase.execute('existing-payment-id', input)
      ).rejects.toThrow('Descrição é obrigatória');
      
      expect(paymentRepository.save).not.toHaveBeenCalled();
    });

    it('should update to FAIL status', async () => {
      const input = { status: PaymentStatus.FAIL };
      
      paymentRepository.findById.mockResolvedValue(existingPayment);
      
      const updatedPayment = new Payment(
        existingPayment.cpf,
        existingPayment.description,
        existingPayment.amount,
        existingPayment.paymentMethod,
        existingPayment.id,
      );
      updatedPayment.updateStatus(PaymentStatus.FAIL);
      
      paymentRepository.save.mockResolvedValue(updatedPayment);

      const result = await useCase.execute('existing-payment-id', input);

      expect(result.status).toBe(PaymentStatus.FAIL);
    });

    it('should update from PAID back to PENDING', async () => {
      // Start with a PAID payment
      existingPayment.updateStatus(PaymentStatus.PAID);
      
      const input = { status: PaymentStatus.PENDING };
      
      paymentRepository.findById.mockResolvedValue(existingPayment);
      
      const updatedPayment = new Payment(
        existingPayment.cpf,
        existingPayment.description,
        existingPayment.amount,
        existingPayment.paymentMethod,
        existingPayment.id,
      );
      updatedPayment.updateStatus(PaymentStatus.PENDING);
      
      paymentRepository.save.mockResolvedValue(updatedPayment);

      const result = await useCase.execute('existing-payment-id', input);

      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should not update fields when input is empty', async () => {
      const input = {};
      
      paymentRepository.findById.mockResolvedValue(existingPayment);
      paymentRepository.save.mockResolvedValue(existingPayment);

      const result = await useCase.execute('existing-payment-id', input);

      expect(result).toBe(existingPayment);
      expect(paymentRepository.save).toHaveBeenCalledWith(existingPayment);
    });
  });
});