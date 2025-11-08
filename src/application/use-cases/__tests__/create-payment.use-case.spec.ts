import { Test, TestingModule } from '@nestjs/testing';
import { CreatePaymentUseCase } from '../create-payment.use-case';
import { PaymentRepository } from '@domain/repositories';
import { PaymentMethod } from '@domain/enums';
import { Payment } from '@domain/entities';

describe('CreatePaymentUseCase', () => {
  let useCase: CreatePaymentUseCase;
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
        CreatePaymentUseCase,
        {
          provide: 'PaymentRepository',
          useValue: mockPaymentRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreatePaymentUseCase>(CreatePaymentUseCase);
    paymentRepository = module.get('PaymentRepository');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a payment successfully', async () => {
    const input = {
      cpf: '11144477735',
      description: 'Test payment',
      amount: 100.50,
      paymentMethod: PaymentMethod.PIX,
    };

    const expectedPayment = new Payment(
      input.cpf,
      input.description,
      input.amount,
      input.paymentMethod,
    );

    paymentRepository.save.mockResolvedValue(expectedPayment);

    const result = await useCase.execute(input);

    expect(paymentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        cpf: input.cpf,
        description: input.description,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
      }),
    );
    expect(result).toBe(expectedPayment);
  });

  it('should throw error for invalid input', async () => {
    const input = {
      cpf: 'invalid',
      description: 'Test payment',
      amount: 100.50,
      paymentMethod: PaymentMethod.PIX,
    };

    await expect(useCase.execute(input)).rejects.toThrow('CPF inválido');
  });
});