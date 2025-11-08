// Mock para UUID
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-v4',
}));

// Mock para Mercado Pago SDK
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Preference: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    get: jest.fn(),
  })),
}));

// Configurações globais para testes
global.console = {
  ...console,
  // Silenciar logs durante os testes, mas manter error e warn
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};