import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PaymentController } from '../../presentation/controllers/payment.controller';
import { CreatePaymentUseCase, UpdatePaymentUseCase, GetPaymentUseCase, ListPaymentsUseCase } from '../../application/use-cases';
import { MercadoPagoService } from '../../infrastructure/services/mercado-pago.service';
import { TemporalService } from '../../workflows/temporal.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

describe('Rate Limit Integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000, // 1 minute
            limit: 2, // 2 requests per minute for testing
          },
        ]),
      ],
      controllers: [PaymentController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
        {
          provide: CreatePaymentUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: 'test-id',
              cpf: '11144477735',
              description: 'Test payment',
              amount: 100,
              status: 'PENDING',
            }),
          },
        },
        {
          provide: UpdatePaymentUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetPaymentUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ListPaymentsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: MercadoPagoService,
          useValue: {
            createPreference: jest.fn(),
          },
        },
        {
          provide: TemporalService,
          useValue: {
            startPaymentWorkflow: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/payment - Rate Limiting', () => {
    const validPaymentData = {
      cpf: '11144477735',
      description: 'Test Payment',
      amount: 100,
      paymentMethod: 'PIX',
    };

    it('should allow requests within rate limit', async () => {
      const response1 = await request(app.getHttpServer())
        .post('/api/payment')
        .send(validPaymentData)
        .expect(201);

      expect(response1.status).toBe(201);

      const response2 = await request(app.getHttpServer())
        .post('/api/payment')
        .send(validPaymentData)
        .expect(201);

      expect(response2.status).toBe(201);
    });

    it('should show rate limit is working through headers', async () => {
      // Make first request
      const response1 = await request(app.getHttpServer())
        .post('/api/payment')
        .send(validPaymentData)
        .expect(201);

      // Check that rate limit headers are present
      expect(response1.headers['x-ratelimit-limit']).toBeDefined();
      expect(response1.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response1.headers['x-ratelimit-reset']).toBeDefined();

      const limit = parseInt(response1.headers['x-ratelimit-limit']);
      const remaining = parseInt(response1.headers['x-ratelimit-remaining']);

      // Verify limit is configured (should be 2 from our test config)
      expect(limit).toBeGreaterThan(0);
      expect(remaining).toBeLessThan(limit); // Should have decreased after first request

      console.log(`Rate Limit - Limit: ${limit}, Remaining: ${remaining}`);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payment')
        .send(validPaymentData)
        .expect(201);

      // Check for rate limit headers
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Rate Limit Headers', () => {
    it('should show decreasing remaining requests', async () => {
      const validPaymentData = {
        cpf: '11144477735',
        description: 'Test Payment',
        amount: 100,
        paymentMethod: 'PIX',
      };

      const response1 = await request(app.getHttpServer())
        .post('/api/payment')
        .send(validPaymentData)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/api/payment')
        .send(validPaymentData)
        .expect(201);

      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

      expect(remaining2).toBeLessThan(remaining1);
    });
  });
});