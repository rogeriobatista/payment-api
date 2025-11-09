import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TypeOrmPaymentRepository } from '../typeorm-payment.repository';
import { PaymentEntity } from '../../database/entities/payment.entity';
import { Payment } from '../../../domain/entities/payment.entity';
import { PaymentMethod, PaymentStatus } from '../../../domain/enums';

describe('TypeOrmPaymentRepository', () => {
  let repository: TypeOrmPaymentRepository;
  let typeormRepository: jest.Mocked<Repository<PaymentEntity>>;

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeOrmPaymentRepository,
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<TypeOrmPaymentRepository>(TypeOrmPaymentRepository);
    typeormRepository = module.get(getRepositoryToken(PaymentEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a payment successfully', async () => {
      // Arrange
      const payment = new Payment(
        '52998224725', // Valid CPF
        'Valid Description',
        100,
        PaymentMethod.PIX,
        'valid-id',
      );

      const paymentEntity = new PaymentEntity();
      paymentEntity.id = payment.id;
      paymentEntity.description = payment.description;
      paymentEntity.amount = payment.amount;
      paymentEntity.paymentMethod = payment.paymentMethod;
      paymentEntity.cpf = payment.cpf;
      paymentEntity.status = payment.status;
      paymentEntity.createdAt = payment.createdAt;
      paymentEntity.updatedAt = payment.updatedAt;

      const savedEntity = { ...paymentEntity };

      // Mock only save method since repository uses save directly
      typeormRepository.save.mockResolvedValue(savedEntity);

      // Act
      const result = await repository.save(payment);

      // Assert
      expect(typeormRepository.save).toHaveBeenCalledWith({
        id: payment.id,
        description: payment.description,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        cpf: payment.cpf,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      });
      expect(result).toBeInstanceOf(Payment);
      expect(result.id).toBe(payment.id);
      expect(result.description).toBe(payment.description);
      expect(result.amount).toBe(payment.amount);
      expect(result.paymentMethod).toBe(payment.paymentMethod);
      expect(result.cpf).toBe(payment.cpf);
      expect(result.status).toBe(payment.status);
    });

    it('should throw error when save fails', async () => {
      // Arrange
      const payment = new Payment(
        '11144477735',
        'Valid Description',
        100,
        PaymentMethod.PIX,
        'valid-id',
      );

      const paymentEntity = new PaymentEntity();
      const error = new Error('Database error');

      typeormRepository.create.mockReturnValue(paymentEntity);
      typeormRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.save(payment)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find a payment by id successfully', async () => {
      // Arrange
      const paymentId = 'test-id';
      const paymentEntity = new PaymentEntity();
      paymentEntity.id = paymentId;
      paymentEntity.description = 'Test Description';
      paymentEntity.amount = 100;
      paymentEntity.paymentMethod = PaymentMethod.PIX;
      paymentEntity.cpf = '52998224725'; // Valid CPF
      paymentEntity.status = PaymentStatus.PENDING;
      paymentEntity.createdAt = new Date();
      paymentEntity.updatedAt = new Date();

      typeormRepository.findOne.mockResolvedValue(paymentEntity);

      // Act
      const result = await repository.findById(paymentId);

      // Assert
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: paymentId },
      });
      expect(result).toBeInstanceOf(Payment);
      expect(result?.id).toBe(paymentId);
      expect(result?.description).toBe('Test Description');
      expect(result?.amount).toBe(100);
      expect(result?.paymentMethod).toBe(PaymentMethod.PIX);
      expect(result?.cpf).toBe('52998224725'); // Updated to match the valid CPF used
      expect(result?.status).toBe(PaymentStatus.PENDING);
    });

    it('should return null when payment not found', async () => {
      // Arrange
      const paymentId = 'non-existent-id';
      typeormRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(paymentId);

      // Assert
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: paymentId },
      });
      expect(result).toBeNull();
    });

    it('should throw error when findOne fails', async () => {
      // Arrange
      const paymentId = 'test-id';
      const error = new Error('Database error');
      typeormRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findById(paymentId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAll', () => {
    it('should find all payments successfully', async () => {
      // Arrange
      const paymentEntities = [
        {
          id: 'id-1',
          description: 'Payment 1',
          amount: 100,
          paymentMethod: PaymentMethod.PIX,
          cpf: '52998224725', // Valid CPF
          status: PaymentStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'id-2',
          description: 'Payment 2',
          amount: 200,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          cpf: '52998224725', // Valid CPF
          status: PaymentStatus.PAID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as PaymentEntity[];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(paymentEntities),
      };

      (typeormRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(typeormRepository.createQueryBuilder).toHaveBeenCalledWith('payment');
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Payment);
      expect(result[0].id).toBe('id-1');
      expect(result[0].description).toBe('Payment 1');
      expect(result[0].amount).toBe(100);
      expect(result[0].paymentMethod).toBe(PaymentMethod.PIX);

      expect(result[1]).toBeInstanceOf(Payment);
      expect(result[1].id).toBe('id-2');
      expect(result[1].description).toBe('Payment 2');
      expect(result[1].amount).toBe(200);
      expect(result[1].paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });

    it('should return empty array when no payments found', async () => {
      // Arrange
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      (typeormRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(typeormRepository.createQueryBuilder).toHaveBeenCalledWith('payment');
      expect(result).toEqual([]);
    });

    it('should throw error when find fails', async () => {
      // Arrange
      const error = new Error('Database error');
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(error),
      };

      (typeormRepository.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(repository.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('entity mapping', () => {
    it('should correctly map domain entity to TypeORM entity', async () => {
      // Arrange
      const domainPayment = new Payment(
        '52998224725',
        'Domain Payment',
        300,
        PaymentMethod.CREDIT_CARD,
        'domain-id',
      );

      const expectedEntity = {
        id: 'domain-id',
        description: 'Domain Payment',
        amount: 300,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        cpf: '52998224725',
        status: PaymentStatus.PENDING,
        createdAt: domainPayment.createdAt,
        updatedAt: domainPayment.updatedAt,
      };

      // Mock only save since repository uses save directly
      typeormRepository.save.mockResolvedValue(expectedEntity as any);

      // Act
      await repository.save(domainPayment);

      // Assert
      expect(typeormRepository.save).toHaveBeenCalledWith(expectedEntity);
    });

    it('should correctly map TypeORM entity to domain entity', async () => {
      // Arrange
      const typeormEntity = new PaymentEntity();
      typeormEntity.id = 'typeorm-id';
      typeormEntity.description = 'TypeORM Payment';
      typeormEntity.amount = 400;
      typeormEntity.paymentMethod = PaymentMethod.PIX;
      typeormEntity.cpf = '52998224725'; // Valid CPF
      typeormEntity.status = PaymentStatus.FAIL;
      typeormEntity.createdAt = new Date('2023-01-01');
      typeormEntity.updatedAt = new Date('2023-01-02');

      typeormRepository.findOne.mockResolvedValue(typeormEntity);

      // Act
      const result = await repository.findById('typeorm-id');

      // Assert
      expect(result).toBeInstanceOf(Payment);
      expect(result?.id).toBe('typeorm-id');
      expect(result?.description).toBe('TypeORM Payment');
      expect(result?.amount).toBe(400);
      expect(result?.paymentMethod).toBe(PaymentMethod.PIX);
      expect(result?.cpf).toBe('52998224725'); // Updated to match the valid CPF used
      expect(result?.status).toBe(PaymentStatus.FAIL);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
  });
});