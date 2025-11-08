import { Payment } from '../payment.entity';
import { PaymentMethod, PaymentStatus } from '../../enums';

describe('Payment Entity', () => {
  describe('constructor', () => {
    it('should create a payment with valid data', () => {
      const payment = new Payment(
        '11144477735',
        'Test payment',
        100.50,
        PaymentMethod.PIX,
      );

      expect(payment.cpf).toBe('11144477735');
      expect(payment.description).toBe('Test payment');
      expect(payment.amount).toBe(100.50);
      expect(payment.paymentMethod).toBe(PaymentMethod.PIX);
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.id).toBeDefined();
      expect(payment.createdAt).toBeInstanceOf(Date);
      expect(payment.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a payment with custom id', () => {
      const customId = 'custom-id-123';
      const payment = new Payment(
        '11144477735',
        'Test payment',
        100.50,
        PaymentMethod.PIX,
        customId,
      );

      expect(payment.id).toBe(customId);
    });

    it('should accept formatted CPF', () => {
      const payment = new Payment(
        '123.456.789-01',
        'Test payment',
        100.50,
        PaymentMethod.PIX,
      );

      expect(payment.cpf).toBe('123.456.789-01');
    });

    it('should throw error for empty CPF', () => {
      expect(() => {
        new Payment(
          '',
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('CPF é obrigatório');
    });

    it('should throw error for CPF with whitespace only', () => {
      expect(() => {
        new Payment(
          '   ',
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('CPF é obrigatório');
    });

    it('should throw error for invalid CPF length', () => {
      expect(() => {
        new Payment(
          '123',
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('CPF inválido');
    });

    it('should throw error for CPF with all same digits', () => {
      expect(() => {
        new Payment(
          '11111111111',
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('CPF inválido');
    });

    it('should throw error for CPF with invalid check digits', () => {
      expect(() => {
        new Payment(
          '12345678900', // Invalid check digits
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('CPF inválido');
    });

    it('should accept valid CPF', () => {
      // Usando um CPF válido para teste (algoritmo de validação)
      expect(() => {
        new Payment(
          '11144477735', // CPF válido
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).not.toThrow();
    });

    it('should throw error for empty description', () => {
      expect(() => {
        new Payment(
          '11144477735',
          '',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('Descrição é obrigatória');
    });

    it('should throw error for description with whitespace only', () => {
      expect(() => {
        new Payment(
          '11144477735',
          '   ',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('Descrição é obrigatória');
    });

    it('should throw error for zero amount', () => {
      expect(() => {
        new Payment(
          '11144477735',
          'Test payment',
          0,
          PaymentMethod.PIX,
        );
      }).toThrow('Valor deve ser maior que zero');
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        new Payment(
          '11144477735',
          'Test payment',
          -50,
          PaymentMethod.PIX,
        );
      }).toThrow('Valor deve ser maior que zero');
    });

    it('should accept decimal amounts', () => {
      const payment = new Payment(
        '11144477735',
        'Test payment',
        99.99,
        PaymentMethod.PIX,
      );

      expect(payment.amount).toBe(99.99);
    });

    it('should create payment with CREDIT_CARD method', () => {
      const payment = new Payment(
        '11144477735',
        'Test payment',
        100.50,
        PaymentMethod.CREDIT_CARD,
      );

      expect(payment.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });
  });

  describe('updateStatus', () => {
    let payment: Payment;

    beforeEach(() => {
      payment = new Payment(
        '11144477735',
        'Test payment',
        100.50,
        PaymentMethod.PIX,
      );
    });

    it('should update status to PAID', () => {
      payment.updateStatus(PaymentStatus.PAID);
      expect(payment.status).toBe(PaymentStatus.PAID);
    });

    it('should update status to FAIL', () => {
      payment.updateStatus(PaymentStatus.FAIL);
      expect(payment.status).toBe(PaymentStatus.FAIL);
    });

    it('should update updatedAt when status changes', () => {
      const originalUpdatedAt = payment.updatedAt;
      
      // Small delay to ensure different timestamp
      setTimeout(() => {
        payment.updateStatus(PaymentStatus.PAID);
        expect(payment.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      }, 1);
    });

    it('should update status from PENDING to PAID', () => {
      expect(payment.status).toBe(PaymentStatus.PENDING);
      payment.updateStatus(PaymentStatus.PAID);
      expect(payment.status).toBe(PaymentStatus.PAID);
    });

    it('should update status from PAID back to PENDING', () => {
      payment.updateStatus(PaymentStatus.PAID);
      payment.updateStatus(PaymentStatus.PENDING);
      expect(payment.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe('update', () => {
    let payment: Payment;

    beforeEach(() => {
      payment = new Payment(
        '11144477735',
        'Test payment',
        100.50,
        PaymentMethod.PIX,
      );
    });

    it('should update description', () => {
      payment.update({ description: 'Updated payment description' });
      expect(payment.description).toBe('Updated payment description');
    });

    it('should update amount', () => {
      payment.update({ amount: 200.75 });
      expect(payment.amount).toBe(200.75);
    });

    it('should update CPF', () => {
      payment.update({ cpf: '52998224725' });
      expect(payment.cpf).toBe('52998224725');
    });

    it('should update payment method', () => {
      payment.update({ paymentMethod: PaymentMethod.CREDIT_CARD });
      expect(payment.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });

    it('should update multiple fields at once', () => {
      payment.update({
        description: 'New description',
        amount: 300.00,
        paymentMethod: PaymentMethod.CREDIT_CARD,
      });

      expect(payment.description).toBe('New description');
      expect(payment.amount).toBe(300.00);
      expect(payment.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
      expect(payment.cpf).toBe('11144477735'); // unchanged
    });

    it('should not update fields that are undefined', () => {
      const originalCpf = payment.cpf;
      const originalDescription = payment.description;

      payment.update({ amount: 150.00 });

      expect(payment.amount).toBe(150.00);
      expect(payment.cpf).toBe(originalCpf);
      expect(payment.description).toBe(originalDescription);
    });

    it('should update updatedAt field', () => {
      const originalUpdatedAt = payment.updatedAt;
      
      setTimeout(() => {
        payment.update({ description: 'New description' });
        expect(payment.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      }, 1);
    });

    it('should validate CPF when updating', () => {
      expect(() => {
        payment.update({ cpf: 'invalid-cpf' });
      }).toThrow('CPF inválido');
    });

    it('should validate amount when updating', () => {
      expect(() => {
        payment.update({ amount: -50 });
      }).toThrow('Valor deve ser maior que zero');
    });

    it('should validate description when updating', () => {
      expect(() => {
        payment.update({ description: '' });
      }).toThrow('Descrição é obrigatória');
    });

    it('should validate payment method when updating', () => {
      expect(() => {
        payment.update({ paymentMethod: 'INVALID_METHOD' as any });
      }).toThrow('Método de pagamento inválido');
    });
  });

  describe('CPF validation', () => {
    it('should accept CPF with dots and dash', () => {
      expect(() => {
        new Payment(
          '111.444.777-35',
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).not.toThrow();
    });

    it('should accept CPF without formatting', () => {
      expect(() => {
        new Payment(
          '11144477735',
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).not.toThrow();
    });

    it('should reject CPF with letters', () => {
      expect(() => {
        new Payment(
          '111.444.777-3a',
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('CPF inválido');
    });

    it('should reject CPF that is too short', () => {
      expect(() => {
        new Payment(
          '111.444.777',
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('CPF inválido');
    });

    it('should reject CPF that is too long', () => {
      expect(() => {
        new Payment(
          '111.444.777-356',
          'Test payment',
          100.50,
          PaymentMethod.PIX,
        );
      }).toThrow('CPF inválido');
    });
  });
});