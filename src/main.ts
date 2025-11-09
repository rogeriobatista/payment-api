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
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            /^http:\/\/localhost:\d+$/,
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'Cache-Control',
        ],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });

    // Global prefix
    // app.setGlobalPrefix(''); // Comentado para evitar problemas no Swagger

    // Swagger Configuration
    const config = new DocumentBuilder()
        .setTitle('Payment API')
        .setDescription('API avançada para processamento de pagamentos com integração ao Mercado Pago.')
        .setVersion('1.0.0')
        .setContact('Rogerio Batista', 'https://github.com/rogeriobatista', 'rogerio@example.com')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addServer('http://localhost:3000', 'Development Server')
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
        .addTag('Authentication', 'Sistema de autenticação e autorização')
        .addTag('Payments', 'Operações relacionadas a pagamentos')
        .addTag('Health', 'Health checks da aplicação')
        .addTag('Webhooks', 'Webhooks de provedores de pagamento')
        .addTag('Monitoring', 'Métricas e health checks')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
        },
        customSiteTitle: 'Payment API Documentation',
    });

    const port = process.env.PORT || 3000;

    await app.listen(port);

    logger.log(`🚀 Payment API is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
    logger.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🔒 Auth endpoints: /auth/register, /auth/login`);
    logger.log(`💳 Payment endpoints: /api/payment`);
}

bootstrap().catch((error) => {
    console.error('Error starting the application:', error);
    process.exit(1);
});