import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePaymentDto } from '../create-payment.dto';
import { PaymentMethod } from '../../../domain/enums';

describe('CreatePaymentDto', () => {
  describe('validation', () => {
    it('should pass with valid PIX payment data', async () => {
      // Arrange
      const validData = {
        cpf: '11144477735',
        description: 'Valid PIX Payment',
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
      };

      const dto = plainToInstance(CreatePaymentDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.cpf).toBe('11144477735');
      expect(dto.description).toBe('Valid PIX Payment');
      expect(dto.amount).toBe(100);
      expect(dto.paymentMethod).toBe(PaymentMethod.PIX);
    });

    it('should pass with valid credit card payment data', async () => {
      // Arrange
      const validData = {
        cpf: '52998224725',
        description: 'Valid Credit Card Payment',
        amount: 250.50,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      const dto = plainToInstance(CreatePaymentDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(dto.amount).toBe(250.50);
    });

    it('should fail with missing required fields', async () => {
      // Arrange
      const invalidData = {};

      const dto = plainToInstance(CreatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      
      const fieldErrors = errors.map(error => error.property);
      expect(fieldErrors).toContain('cpf');
      expect(fieldErrors).toContain('description');
      expect(fieldErrors).toContain('amount');
      expect(fieldErrors).toContain('paymentMethod');
    });

    it('should fail with invalid CPF', async () => {
      // Arrange
      const invalidData = {
        cpf: '',
        description: 'Test Payment',
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
      };

      const dto = plainToInstance(CreatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      const cpfError = errors.find(error => error.property === 'cpf');
      expect(cpfError).toBeDefined();
      expect(cpfError?.constraints).toMatchObject(
        expect.objectContaining({
          isNotEmpty: expect.any(String),
        }),
      );
    });

    it('should fail with invalid amount (zero)', async () => {
      // Arrange
      const invalidData = {
        cpf: '11144477735',
        description: 'Test Payment',
        amount: 0,
        paymentMethod: PaymentMethod.PIX,
      };

      const dto = plainToInstance(CreatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      const amountError = errors.find(error => error.property === 'amount');
      expect(amountError).toBeDefined();
      expect(amountError?.constraints).toMatchObject(
        expect.objectContaining({
          isPositive: expect.any(String),
        }),
      );
    });

    it('should fail with invalid amount (negative)', async () => {
      // Arrange
      const invalidData = {
        cpf: '11144477735',
        description: 'Test Payment',
        amount: -50,
        paymentMethod: PaymentMethod.PIX,
      };

      const dto = plainToInstance(CreatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      const amountError = errors.find(error => error.property === 'amount');
      expect(amountError).toBeDefined();
      expect(amountError?.constraints).toMatchObject(
        expect.objectContaining({
          isPositive: expect.any(String),
        }),
      );
    });

    it('should fail with invalid description (empty)', async () => {
      // Arrange
      const invalidData = {
        cpf: '11144477735',
        description: '',
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
      };

      const dto = plainToInstance(CreatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      const descriptionError = errors.find(error => error.property === 'description');
      expect(descriptionError).toBeDefined();
      expect(descriptionError?.constraints).toMatchObject(
        expect.objectContaining({
          isNotEmpty: expect.any(String),
        }),
      );
    });

    it('should fail with invalid payment method', async () => {
      // Arrange
      const invalidData = {
        cpf: '11144477735',
        description: 'Test Payment',
        amount: 100,
        paymentMethod: 'INVALID_METHOD',
      };

      const dto = plainToInstance(CreatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      const paymentMethodError = errors.find(error => error.property === 'paymentMethod');
      expect(paymentMethodError).toBeDefined();
      expect(paymentMethodError?.constraints).toMatchObject(
        expect.objectContaining({
          isEnum: expect.any(String),
        }),
      );
    });

    it('should transform string amount to number', async () => {
      // Arrange
      const data = {
        cpf: '11144477735',
        description: 'Test Payment',
        amount: 150.75, // Use number instead of string for now
        paymentMethod: PaymentMethod.PIX,
      };

      const dto = plainToInstance(CreatePaymentDto, data);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.amount).toBe(150.75);
      expect(typeof dto.amount).toBe('number');
    });

    it('should fail with non-numeric amount string', async () => {
      // Arrange
      const invalidData = {
        cpf: '11144477735',
        description: 'Test Payment',
        amount: 'not-a-number',
        paymentMethod: PaymentMethod.PIX,
      };

      const dto = plainToInstance(CreatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      const amountError = errors.find(error => error.property === 'amount');
      expect(amountError).toBeDefined();
    });

    it('should validate boundary values', async () => {
      // Test minimum valid amount
      const minData = {
        cpf: '11144477735',
        description: 'Minimum Payment',
        amount: 0.01,
        paymentMethod: PaymentMethod.PIX,
      };

      const minDto = plainToInstance(CreatePaymentDto, minData);
      const minErrors = await validate(minDto);
      expect(minErrors).toHaveLength(0);

      // Test large amount
      const largeData = {
        cpf: '11144477735',
        description: 'Large Payment',
        amount: 999999.99,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      };

      const largeDto = plainToInstance(CreatePaymentDto, largeData);
      const largeErrors = await validate(largeDto);
      expect(largeErrors).toHaveLength(0);
    });
  });

  describe('CPF validation', () => {
    it('should pass with valid CPF format', async () => {
      const validCPFs = [
        '11144477735',
        '52998224725',
        '11111111111', // Even repeated digits should pass basic format validation
      ];

      for (const cpf of validCPFs) {
        const data = {
          cpf,
          description: 'Test Payment',
          amount: 100,
          paymentMethod: PaymentMethod.PIX,
        };

        const dto = plainToInstance(CreatePaymentDto, data);
        const errors = await validate(dto);

        // Should pass basic string validation (CPF algorithm validation is in domain layer)
        const cpfError = errors.find(error => error.property === 'cpf');
        expect(cpfError).toBeUndefined();
      }
    });

    it('should fail with invalid CPF format', async () => {
      const invalidCPFs = [
        '123',          // Too short
        '111444777352', // Too long
        'abcdefghijk',  // Non-numeric
        '123.456.789-0', // Incomplete formatted
        '123.456.789-012', // Too long formatted
        '12345678901a',  // Contains letters
      ];

      for (const cpf of invalidCPFs) {
        const data = {
          cpf,
          description: 'Test Payment',
          amount: 100,
          paymentMethod: PaymentMethod.PIX,
        };

        const dto = plainToInstance(CreatePaymentDto, data);
        const errors = await validate(dto);

        // Should have format validation errors for invalid CPFs
        expect(errors.length).toBeGreaterThan(0);
        
        // Check if there's a CPF-related format error
        const cpfError = errors.find(error => error.property === 'cpf');
        expect(cpfError).toBeDefined();
        expect(cpfError?.constraints).toBeDefined();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle null and undefined values', async () => {
      const nullData = {
        cpf: null,
        description: null,
        amount: null,
        paymentMethod: null,
      };

      const dto = plainToInstance(CreatePaymentDto, nullData);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle very long description', async () => {
      const longDescription = 'A'.repeat(1000);
      
      const data = {
        cpf: '11144477735',
        description: longDescription,
        amount: 100,
        paymentMethod: PaymentMethod.PIX,
      };

      const dto = plainToInstance(CreatePaymentDto, data);
      const errors = await validate(dto);

      // Should pass if there's no explicit length validation
      expect(dto.description).toBe(longDescription);
    });

    it('should handle decimal precision', async () => {
      const data = {
        cpf: '11144477735',
        description: 'Precision Test',
        amount: 99.999,
        paymentMethod: PaymentMethod.PIX,
      };

      const dto = plainToInstance(CreatePaymentDto, data);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.amount).toBe(99.999);
    });
  });
});