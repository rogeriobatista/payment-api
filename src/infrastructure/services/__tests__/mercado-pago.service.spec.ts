import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService } from '../mercado-pago.service';

// Mock objects
const mockMercadoPagoConfig = jest.fn();
const mockPreference = {
  create: jest.fn(),
  get: jest.fn(),
};

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: mockMercadoPagoConfig,
  Preference: jest.fn().mockImplementation(() => mockPreference),
}));

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    configService = module.get(ConfigService);
    
    // Mock configuration values
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      switch (key) {
        case 'MERCADO_PAGO_ACCESS_TOKEN':
          return 'test_access_token';
        case 'MERCADO_PAGO_WEBHOOK_URL':
          return 'http://localhost:3000/api/webhook/mercado-pago';
        case 'MERCADO_PAGO_SUCCESS_URL':
          return defaultValue || 'http://localhost:3000/payment/success';
        case 'MERCADO_PAGO_FAILURE_URL':
          return defaultValue || 'http://localhost:3000/payment/failure';
        case 'MERCADO_PAGO_PENDING_URL':
          return defaultValue || 'http://localhost:3000/payment/pending';
        default:
          return defaultValue;
      }
    });

    // Clear mocks
    jest.clearAllMocks();

    service = new MercadoPagoService(configService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize MercadoPago client with access token', () => {
    expect(configService.get).toHaveBeenCalledWith('MERCADO_PAGO_ACCESS_TOKEN');
    expect(mockMercadoPagoConfig).toHaveBeenCalledWith({
      accessToken: 'test_access_token',
      options: {
        timeout: 5000,
        idempotencyKey: 'abc',
      },
    });
  });

  it('should throw error if access token is not configured', () => {
    configService.get.mockReturnValue(undefined);

    expect(() => {
      new MercadoPagoService(configService);
    }).toThrow('MERCADO_PAGO_ACCESS_TOKEN não configurado');
  });

  describe('createPreference', () => {
    const mockInput = {
      title: 'Test Payment',
      description: 'Test payment description',
      quantity: 1,
      unit_price: 100.50,
      external_reference: 'payment-123',
      payer_email: 'test@example.com',
    };

    it('should create preference successfully', async () => {
      const mockResponse = {
        id: 'preference-123',
        init_point: 'https://mercadopago.com/checkout/preference-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/preference-123',
      };

      mockPreference.create.mockResolvedValue(mockResponse);

      const result = await service.createPreference(mockInput);

      expect(mockPreference.create).toHaveBeenCalledWith({
        body: {
          items: [
            {
              id: 'payment-123',
              title: 'Test Payment',
              description: 'Test payment description',
              quantity: 1,
              unit_price: 100.50,
            },
          ],
          payer: {
            email: 'test@example.com',
          },
          external_reference: 'payment-123',
          notification_url: 'http://localhost:3000/api/webhook/mercado-pago',
          back_urls: {
            success: 'http://localhost:3000/payment/success',
            failure: 'http://localhost:3000/payment/failure',
            pending: 'http://localhost:3000/payment/pending',
          },
          auto_return: 'approved',
          payment_methods: {
            excluded_payment_types: [
              { id: 'ticket' },
              { id: 'bank_transfer' },
            ],
            installments: 12,
          },
        },
      });

      expect(result).toEqual({
        id: 'preference-123',
        init_point: 'https://mercadopago.com/checkout/preference-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/preference-123',
      });
    });

    it('should create preference without payer email', async () => {
      const inputWithoutEmail = {
        title: 'Test Payment',
        description: 'Test payment description',
        quantity: 1,
        unit_price: 100.50,
        external_reference: 'payment-123',
      };

      const mockResponse = {
        id: 'preference-123',
        init_point: 'https://mercadopago.com/checkout/preference-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/preference-123',
      };

      mockPreference.create.mockResolvedValue(mockResponse);

      const result = await service.createPreference(inputWithoutEmail);

      expect(mockPreference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          payer: undefined,
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should use default external_reference when not provided', async () => {
      const inputWithoutReference = {
        title: 'Test Payment',
        description: 'Test payment description',
        quantity: 1,
        unit_price: 100.50,
      };

      const mockResponse = {
        id: 'preference-123',
        init_point: 'https://mercadopago.com/checkout/preference-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/preference-123',
      };

      mockPreference.create.mockResolvedValue(mockResponse);

      await service.createPreference(inputWithoutReference);

      expect(mockPreference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          items: [
            expect.objectContaining({
              id: 'payment-item',
            }),
          ],
          external_reference: undefined,
        }),
      });
    });

    it('should handle Mercado Pago API errors', async () => {
      const apiError = new Error('Mercado Pago API Error');
      mockPreference.create.mockRejectedValue(apiError);

      await expect(
        service.createPreference(mockInput)
      ).rejects.toThrow('Falha ao criar preferência de pagamento');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockPreference.create.mockRejectedValue(networkError);

      await expect(
        service.createPreference(mockInput)
      ).rejects.toThrow('Falha ao criar preferência de pagamento');
    });

    it('should use custom back URLs from config', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        switch (key) {
          case 'MERCADO_PAGO_ACCESS_TOKEN':
            return 'test_access_token';
          case 'MERCADO_PAGO_SUCCESS_URL':
            return 'https://myapp.com/success';
          case 'MERCADO_PAGO_FAILURE_URL':
            return 'https://myapp.com/failure';
          case 'MERCADO_PAGO_PENDING_URL':
            return 'https://myapp.com/pending';
          default:
            return defaultValue;
        }
      });

      // Recreate service with new config
      service = new MercadoPagoService(configService);

      const mockResponse = {
        id: 'preference-123',
        init_point: 'https://mercadopago.com/checkout/preference-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/preference-123',
      };

      mockPreference.create.mockResolvedValue(mockResponse);

      await service.createPreference(mockInput);

      expect(mockPreference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          back_urls: {
            success: 'https://myapp.com/success',
            failure: 'https://myapp.com/failure',
            pending: 'https://myapp.com/pending',
          },
        }),
      });
    });
  });

  describe('getPreference', () => {
    it('should get preference successfully', async () => {
      const mockPreferenceData = {
        id: 'preference-123',
        items: [
          {
            id: 'payment-123',
            title: 'Test Payment',
            quantity: 1,
            unit_price: 100.50,
          },
        ],
        init_point: 'https://mercadopago.com/checkout/preference-123',
      };

      mockPreference.get.mockResolvedValue(mockPreferenceData);

      const result = await service.getPreference('preference-123');

      expect(mockPreference.get).toHaveBeenCalledWith({
        preferenceId: 'preference-123',
      });
      expect(result).toBe(mockPreferenceData);
    });

    it('should handle errors when getting preference', async () => {
      const apiError = new Error('Preference not found');
      mockPreference.get.mockRejectedValue(apiError);

      await expect(
        service.getPreference('invalid-preference-id')
      ).rejects.toThrow('Falha ao buscar preferência de pagamento');

      expect(mockPreference.get).toHaveBeenCalledWith({
        preferenceId: 'invalid-preference-id',
      });
    });

    it('should handle network timeout when getting preference', async () => {
      const timeoutError = new Error('Request timeout');
      mockPreference.get.mockRejectedValue(timeoutError);

      await expect(
        service.getPreference('preference-123')
      ).rejects.toThrow('Falha ao buscar preferência de pagamento');
    });
  });
});