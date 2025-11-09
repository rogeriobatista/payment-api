import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService } from '../mercado-pago.service';

// Mock MercadoPago
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn(),
  Preference: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    get: jest.fn(),
  })),
  Payment: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    search: jest.fn(),
  })),
}));

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test_access_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        MercadoPagoService,
      ],
    }).compile();

    service = module.get<MercadoPagoService>(MercadoPagoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have createPreference method', () => {
    expect(typeof service.createPreference).toBe('function');
  });
});
