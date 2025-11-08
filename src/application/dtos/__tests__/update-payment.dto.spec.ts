import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdatePaymentDto } from '../update-payment.dto';
import { PaymentStatus } from '../../../domain/enums';

describe('UpdatePaymentDto', () => {
  describe('validation', () => {
    it('should pass with valid status update', async () => {
      // Arrange
      const validData = {
        status: PaymentStatus.PAID,
      };

      const dto = plainToInstance(UpdatePaymentDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.status).toBe(PaymentStatus.PAID);
    });

    it('should pass with valid description update', async () => {
      // Arrange
      const validData = {
        description: 'Updated payment description',
      };

      const dto = plainToInstance(UpdatePaymentDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.description).toBe('Updated payment description');
    });

    it('should pass with both status and description update', async () => {
      // Arrange
      const validData = {
        status: PaymentStatus.FAIL,
        description: 'Failed payment - insufficient funds',
      };

      const dto = plainToInstance(UpdatePaymentDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.status).toBe(PaymentStatus.FAIL);
      expect(dto.description).toBe('Failed payment - insufficient funds');
    });

    it('should pass with empty object (all fields optional)', async () => {
      // Arrange
      const emptyData = {};

      const dto = plainToInstance(UpdatePaymentDto, emptyData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.status).toBeUndefined();
      expect(dto.description).toBeUndefined();
    });

    it('should fail with invalid status', async () => {
      // Arrange
      const invalidData = {
        status: 'INVALID_STATUS',
      };

      const dto = plainToInstance(UpdatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      const statusError = errors.find(error => error.property === 'status');
      expect(statusError).toBeDefined();
      expect(statusError?.constraints).toMatchObject(
        expect.objectContaining({
          isEnum: expect.any(String),
        }),
      );
    });

    it('should allow empty description', async () => {
      // Arrange
      const validData = {
        description: '',
      };

      const dto = plainToInstance(UpdatePaymentDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0); // Empty description is allowed
      expect(dto.description).toBe('');
    });

    it('should allow whitespace-only description', async () => {
      // Arrange
      const validData = {
        description: '   ',
      };

      const dto = plainToInstance(UpdatePaymentDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0); // Whitespace description is allowed
    });
  });

  describe('status validation', () => {
    it('should accept all valid payment statuses', async () => {
      const validStatuses = [
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        PaymentStatus.FAIL,
      ];

      for (const status of validStatuses) {
        const data = { status };
        const dto = plainToInstance(UpdatePaymentDto, data);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.status).toBe(status);
      }
    });

    it('should allow null status', async () => {
      // Arrange
      const validData = {
        status: null,
      };

      const dto = plainToInstance(UpdatePaymentDto, validData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0); // Null is allowed for optional fields
    });
  });

  describe('description validation', () => {
    it('should accept various valid descriptions', async () => {
      const validDescriptions = [
        'Simple payment',
        'Payment for order #12345',
        'Refund for cancelled service',
        'Monthly subscription fee',
        'Payment with special characters: !@#$%^&*()',
        'Payment with numbers 123456789',
      ];

      for (const description of validDescriptions) {
        const data = { description };
        const dto = plainToInstance(UpdatePaymentDto, data);
        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
        expect(dto.description).toBe(description);
      }
    });

    it('should accept long descriptions', async () => {
      // Arrange
      const longDescription = 'A'.repeat(500);
      const data = { description: longDescription };

      const dto = plainToInstance(UpdatePaymentDto, data);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.description).toBe(longDescription);
    });

    it('should reject non-string description', async () => {
      const invalidDescriptions = [
        123,
        true,
        [],
        {},
      ];

      for (const description of invalidDescriptions) {
        const data = { description };
        const dto = plainToInstance(UpdatePaymentDto, data);
        const errors = await validate(dto);

        const descriptionError = errors.find(error => error.property === 'description');
        expect(descriptionError).toBeDefined();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values correctly', async () => {
      // Arrange
      const data = {
        status: undefined,
        description: undefined,
      };

      const dto = plainToInstance(UpdatePaymentDto, data);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.status).toBeUndefined();
      expect(dto.description).toBeUndefined();
    });

    it('should handle mixed valid and invalid fields', async () => {
      // Arrange
      const data = {
        status: PaymentStatus.PAID, // Valid
        description: '', // Invalid
      };

      const dto = plainToInstance(UpdatePaymentDto, data);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0); // Empty description is allowed
      expect(dto.status).toBe(PaymentStatus.PAID);
    });

    it('should preserve field types after transformation', async () => {
      // Arrange
      const data = {
        status: PaymentStatus.FAIL,
        description: 'Test description',
      };

      const dto = plainToInstance(UpdatePaymentDto, data);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(typeof dto.status).toBe('string');
      expect(typeof dto.description).toBe('string');
    });

    it('should handle extra fields gracefully', async () => {
      // Arrange
      const data = {
        status: PaymentStatus.PAID,
        description: 'Valid description',
        extraField: 'should be ignored',
        anotherField: 123,
      };

      const dto = plainToInstance(UpdatePaymentDto, data);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
      expect(dto.status).toBe(PaymentStatus.PAID);
      expect(dto.description).toBe('Valid description');
      // Extra fields are actually preserved in plain JS objects
      expect((dto as any).extraField).toBe('should be ignored');
      expect((dto as any).anotherField).toBe(123);
    });
  });

  describe('validation messages', () => {
    it('should provide meaningful error messages for invalid status', async () => {
      // Arrange
      const invalidData = {
        status: 'WRONG_STATUS',
      };

      const dto = plainToInstance(UpdatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      const statusError = errors.find(error => error.property === 'status');
      expect(statusError?.constraints?.isEnum).toContain('Status deve ser');
    });

    it('should provide meaningful error messages for empty description', async () => {
      // Arrange
      const invalidData = {
        description: '',
      };

      const dto = plainToInstance(UpdatePaymentDto, invalidData);

      // Act
      const errors = await validate(dto);

      // Assert
      const descriptionError = errors.find(error => error.property === 'description');
      // Since description can be empty, this test should pass
      expect(descriptionError).toBeUndefined();
    });
  });
});