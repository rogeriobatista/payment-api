import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from '../payment.controller';
import { CreatePaymentUseCase } from '../../../application/use-cases/create-payment.use-case';
import { UpdatePaymentUseCase } from '../../../application/use-cases/update-payment.use-case';
import { GetPaymentUseCase } from '../../../application/use-cases/get-payment.use-case';
import { ListPaymentsUseCase } from '../../../application/use-cases/list-payments.use-case';
import { CreatePaymentDto } from '../../../application/dtos/create-payment.dto';
import { UpdatePaymentDto } from '../../../application/dtos/update-payment.dto';
import { ListPaymentsDto } from '../../../application/dtos/list-payments.dto';
import { PaymentMethod, PaymentStatus } from '../../../domain/enums';
import { Payment } from '../../../domain/entities/payment.entity';
import { MercadoPagoService } from '../../../infrastructure/services/mercado-pago.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let createPaymentUseCase: jest.Mocked<CreatePaymentUseCase>;
  let updatePaymentUseCase: jest.Mocked<UpdatePaymentUseCase>;
  let getPaymentUseCase: jest.Mocked<GetPaymentUseCase>;
  let listPaymentsUseCase: jest.Mocked<ListPaymentsUseCase>;
  let mercadoPagoService: jest.Mocked<MercadoPagoService>;

  beforeEach(async () => {
    const mockCreatePaymentUseCase = {
      execute: jest.fn(),
    };

    const mockUpdatePaymentUseCase = {
      execute: jest.fn(),
    };

    const mockGetPaymentUseCase = {
      execute: jest.fn(),
    };

    const mockListPaymentsUseCase = {
      execute: jest.fn(),
    };

    const mockMercadoPagoService = {
      createPreference: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: CreatePaymentUseCase,
          useValue: mockCreatePaymentUseCase,
        },
        {
          provide: UpdatePaymentUseCase,
          useValue: mockUpdatePaymentUseCase,
        },
        {
          provide: GetPaymentUseCase,
          useValue: mockGetPaymentUseCase,
        },
        {
          provide: ListPaymentsUseCase,
          useValue: mockListPaymentsUseCase,
        },
        {
          provide: MercadoPagoService,
          useValue: mockMercadoPagoService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    createPaymentUseCase = module.get(CreatePaymentUseCase);
    updatePaymentUseCase = module.get(UpdatePaymentUseCase);
    getPaymentUseCase = module.get(GetPaymentUseCase);
    listPaymentsUseCase = module.get(ListPaymentsUseCase);
    mercadoPagoService = module.get(MercadoPagoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a PIX payment successfully', async () => {
      // Arrange
      const createPaymentDto: CreatePaymentDto = {
        cpf: '11144477735', // CPF válido
        description: 'Test Payment',
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
      };

      const createdPayment = new Payment(
        createPaymentDto.cpf,
        createPaymentDto.description,
        createPaymentDto.amount,
        createPaymentDto.paymentMethod,
        'generated-id',
      );

      createPaymentUseCase.execute.mockResolvedValue(createdPayment);

      // Act
      const result = await controller.createPayment(createPaymentDto);

      // Assert
      expect(createPaymentUseCase.execute).toHaveBeenCalledWith(
        createPaymentDto,
      );
      expect(result.payment).toBeDefined();
      expect(result.payment.cpf).toBe(createPaymentDto.cpf);
      expect(result.payment.description).toBe(createPaymentDto.description);
      expect(result.payment.amount).toBe(createPaymentDto.amount);
      expect(result.payment.paymentMethod).toBe(createPaymentDto.paymentMethod);
      expect(result.checkout_url).toBeUndefined(); // PIX não tem checkout URL
    });

    it('should create a credit card payment with checkout URL', async () => {
      // Arrange
      const createPaymentDto: CreatePaymentDto = {
        cpf: '52998224725',
        description: 'Credit Card Payment',
        amount: 250,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      const createdPayment = new Payment(
        createPaymentDto.cpf,
        createPaymentDto.description,
        createPaymentDto.amount,
        createPaymentDto.paymentMethod,
        'cc-payment-id',
      );

      const mockPreference = {
        id: 'preference-123',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
        sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
      };

      createPaymentUseCase.execute.mockResolvedValue(createdPayment);
      mercadoPagoService.createPreference.mockResolvedValue(mockPreference);

      // Act
      const result = await controller.createPayment(createPaymentDto);

      // Assert
      expect(createPaymentUseCase.execute).toHaveBeenCalledWith(
        createPaymentDto,
      );
      expect(mercadoPagoService.createPreference).toHaveBeenCalledWith({
        title: createPaymentDto.description,
        description: createPaymentDto.description,
        quantity: 1,
        unit_price: createPaymentDto.amount,
        external_reference: createdPayment.id,
      });
      expect(result.payment.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(result.checkout_url).toBe(mockPreference.init_point);
    });

    it('should handle credit card payment even when Mercado Pago fails', async () => {
      // Arrange
      const createPaymentDto: CreatePaymentDto = {
        cpf: '52998224725',
        description: 'Credit Card Payment',
        amount: 250,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      const createdPayment = new Payment(
        createPaymentDto.cpf,
        createPaymentDto.description,
        createPaymentDto.amount,
        createPaymentDto.paymentMethod,
        'cc-payment-id',
      );

      createPaymentUseCase.execute.mockResolvedValue(createdPayment);
      mercadoPagoService.createPreference.mockRejectedValue(
        new Error('Mercado Pago API error'),
      );

      // Act
      const result = await controller.createPayment(createPaymentDto);

      // Assert
      expect(result.payment).toBeDefined();
      expect(result.checkout_url).toBeUndefined(); // Não deve ter URL quando falha
    });

    it('should throw error when payment creation fails', async () => {
      // Arrange
      const createPaymentDto: CreatePaymentDto = {
        cpf: 'invalid-cpf',
        description: 'Invalid Payment',
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
      };

      const error = new Error('Invalid CPF provided');
      createPaymentUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.createPayment(createPaymentDto),
      ).rejects.toThrow('Invalid CPF provided');
      expect(createPaymentUseCase.execute).toHaveBeenCalledWith(
        createPaymentDto,
      );
    });
  });

  describe('updatePayment', () => {
    it('should update a payment successfully', async () => {
      // Arrange
      const paymentId = 'payment-id';
      const updatePaymentDto: UpdatePaymentDto = {
        status: PaymentStatus.PAID,
      };

      const updatedPayment = new Payment(
        '11144477735',
        'Original Payment',
        100,
        PaymentMethod.PIX,
        paymentId,
      );
      updatedPayment.updateStatus(PaymentStatus.PAID);

      updatePaymentUseCase.execute.mockResolvedValue(updatedPayment);

      // Act
      const result = await controller.updatePayment(paymentId, updatePaymentDto);

      // Assert
      expect(updatePaymentUseCase.execute).toHaveBeenCalledWith(
        paymentId,
        updatePaymentDto,
      );
      expect(result.id).toBe(paymentId);
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should update payment description', async () => {
      // Arrange
      const paymentId = 'payment-id';
      const updatePaymentDto: UpdatePaymentDto = {
        description: 'Updated Description',
      };

      const updatedPayment = new Payment(
        '11144477735',
        'Updated Description',
        100,
        PaymentMethod.PIX,
        paymentId,
      );

      updatePaymentUseCase.execute.mockResolvedValue(updatedPayment);

      // Act
      const result = await controller.updatePayment(paymentId, updatePaymentDto);

      // Assert
      expect(updatePaymentUseCase.execute).toHaveBeenCalledWith(
        paymentId,
        updatePaymentDto,
      );
      expect(result.description).toBe('Updated Description');
    });

    it('should throw error when payment not found for update', async () => {
      // Arrange
      const paymentId = 'non-existent-id';
      const updatePaymentDto: UpdatePaymentDto = {
        status: PaymentStatus.PAID,
      };

      const error = new Error('Payment not found');
      updatePaymentUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.updatePayment(paymentId, updatePaymentDto),
      ).rejects.toThrow('Payment not found');
      expect(updatePaymentUseCase.execute).toHaveBeenCalledWith(
        paymentId,
        updatePaymentDto,
      );
    });
  });

  describe('getPayment', () => {
    it('should find a payment by id successfully', async () => {
      // Arrange
      const paymentId = 'payment-id';
      const payment = new Payment(
        '11144477735',
        'Found Payment',
        150,
        PaymentMethod.CREDIT_CARD,
        paymentId,
      );

      getPaymentUseCase.execute.mockResolvedValue(payment);

      // Act
      const result = await controller.getPayment(paymentId);

      // Assert
      expect(getPaymentUseCase.execute).toHaveBeenCalledWith(paymentId);
      expect(result.id).toBe(paymentId);
      expect(result.description).toBe('Found Payment');
    });

    it('should throw error when payment not found', async () => {
      // Arrange
      const paymentId = 'non-existent-id';
      const error = new Error('Payment not found');
      getPaymentUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getPayment(paymentId)).rejects.toThrow(
        'Payment not found',
      );
      expect(getPaymentUseCase.execute).toHaveBeenCalledWith(paymentId);
    });
  });

  describe('listPayments', () => {
    it('should list all payments successfully', async () => {
      // Arrange
      const listDto: ListPaymentsDto = {};
      const payments = [
        new Payment(
          '11144477735',
          'Payment 1',
          100,
          PaymentMethod.PIX,
          'id-1',
        ),
        new Payment(
          '52998224725',
          'Payment 2',
          200,
          PaymentMethod.CREDIT_CARD,
          'id-2',
        ),
      ];

      listPaymentsUseCase.execute.mockResolvedValue(payments);

      // Act
      const result = await controller.listPayments(listDto);

      // Assert
      expect(listPaymentsUseCase.execute).toHaveBeenCalledWith(listDto);
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Payment 1');
      expect(result[1].description).toBe('Payment 2');
    });

    it('should return empty array when no payments found', async () => {
      // Arrange
      const listDto: ListPaymentsDto = {};
      listPaymentsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await controller.listPayments(listDto);

      // Assert
      expect(listPaymentsUseCase.execute).toHaveBeenCalledWith(listDto);
      expect(result).toEqual([]);
    });

    it('should handle filtered list with status', async () => {
      // Arrange
      const listDto: ListPaymentsDto = { paymentMethod: PaymentMethod.PIX };
      const paidPayments = [
        new Payment(
          '11144477735',
          'PIX Payment',
          100,
          PaymentMethod.PIX,
          'pix-id',
        ),
      ];

      listPaymentsUseCase.execute.mockResolvedValue(paidPayments);

      // Act
      const result = await controller.listPayments(listDto);

      // Assert
      expect(listPaymentsUseCase.execute).toHaveBeenCalledWith(listDto);
      expect(result).toHaveLength(1);
      expect(result[0].paymentMethod).toBe(PaymentMethod.PIX);
    });

    it('should throw error when listing payments fails', async () => {
      // Arrange
      const listDto: ListPaymentsDto = {};
      const error = new Error('Database connection error');
      listPaymentsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.listPayments(listDto)).rejects.toThrow(
        'Database connection error',
      );
      expect(listPaymentsUseCase.execute).toHaveBeenCalledWith(listDto);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete payment workflow', async () => {
      // Arrange - Create payment
      const createDto: CreatePaymentDto = {
        cpf: '11144477735',
        description: 'Workflow Payment',
        amount: 500,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      const createdPayment = new Payment(
        createDto.cpf,
        createDto.description,
        createDto.amount,
        createDto.paymentMethod,
        'workflow-id',
      );

      const mockPreference = {
        id: 'preference-workflow',
        init_point: 'https://checkout.mercadopago.com.br/preferences',
        sandbox_init_point: 'https://sandbox.mercadopago.com.br/preferences',
      };

      createPaymentUseCase.execute.mockResolvedValue(createdPayment);
      mercadoPagoService.createPreference.mockResolvedValue(mockPreference);

      // Act - Create
      const created = await controller.createPayment(createDto);

      // Assert - Creation
      expect(created.payment.status).toBe(PaymentStatus.PENDING);
      expect(created.checkout_url).toBeDefined();

      // Arrange - Update payment
      const updateDto: UpdatePaymentDto = {
        status: PaymentStatus.PAID,
      };

      const updatedPayment = new Payment(
        createDto.cpf,
        createDto.description,
        createDto.amount,
        createDto.paymentMethod,
        'workflow-id',
      );
      updatedPayment.updateStatus(PaymentStatus.PAID);

      updatePaymentUseCase.execute.mockResolvedValue(updatedPayment);

      // Act - Update
      const updated = await controller.updatePayment('workflow-id', updateDto);

      // Assert - Update
      expect(updated.status).toBe(PaymentStatus.PAID);
    });

    it('should handle different payment methods correctly', async () => {
      // Test PIX payment
      const pixDto: CreatePaymentDto = {
        cpf: '52998224725', // Valid CPF
        description: 'PIX Payment',
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
      };

      const pixPayment = new Payment(
        pixDto.cpf,
        pixDto.description,
        pixDto.amount,
        pixDto.paymentMethod,
        'pix-id',
      );

      createPaymentUseCase.execute.mockResolvedValueOnce(pixPayment);

      const pixResult = await controller.createPayment(pixDto);
      expect(pixResult.payment.paymentMethod).toBe(PaymentMethod.PIX);
      expect(pixResult.checkout_url).toBeUndefined();

      // Test Credit Card payment
      const ccDto: CreatePaymentDto = {
        cpf: '52998224725', // Valid CPF
        description: 'Credit Card Payment',
        amount: 200,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      const ccPayment = new Payment(
        ccDto.cpf,
        ccDto.description,
        ccDto.amount,
        ccDto.paymentMethod,
        'cc-id',
      );

      const mockPreference = {
        id: 'preference-cc',
        init_point: 'https://checkout.mercadopago.com.br/cc',
        sandbox_init_point: 'https://sandbox.mercadopago.com.br/cc',
      };

      createPaymentUseCase.execute.mockResolvedValueOnce(ccPayment);
      mercadoPagoService.createPreference.mockResolvedValueOnce(mockPreference);

      const ccResult = await controller.createPayment(ccDto);
      expect(ccResult.payment.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(ccResult.checkout_url).toBeDefined();
    });
  });
});