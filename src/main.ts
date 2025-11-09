import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Polyfill for crypto in case it's not available
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('crypto');
  globalThis.crypto = webcrypto;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Payment API')
    .setDescription('API avançada para processamento de pagamentos com autenticação, rate limiting, cache Redis, métricas Prometheus e workflows Temporal.io')
    .setVersion('1.0.0')
    .setContact('Rogerio Batista', 'https://github.com/rogeriobatista', 'rogerio@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3001', 'Development Server')
    .addServer('https://payment-api.example.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Payments', 'Operações relacionadas a pagamentos')
    .addTag('Authentication', 'Sistema de autenticação e autorização')
    .addTag('Monitoring', 'Métricas e health checks')
    .addTag('Health', 'Health checks da aplicação')
    .addTag('Webhooks', 'Webhooks de provedores de pagamento')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Payment API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const port = process.env.PORT || 3001;
  
  await app.listen(port);
  
  logger.log(`🚀 Payment API is running on: http://localhost:${port}`);
  logger.log(`� API Documentation available at: http://localhost:${port}/api/docs`);
  logger.log(`�📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});