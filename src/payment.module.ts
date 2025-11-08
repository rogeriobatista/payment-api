import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from '@infrastructure/database/entities';
import { TypeOrmPaymentRepository } from '@infrastructure/repositories';
import { MercadoPagoService } from '@infrastructure/services';
import { PaymentRepository } from '@domain/repositories';
import {
  CreatePaymentUseCase,
  UpdatePaymentUseCase,
  GetPaymentUseCase,
  ListPaymentsUseCase,
} from '@application/use-cases';
import { PaymentController, WebhookController } from '@presentation/controllers';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity])],
  controllers: [PaymentController, WebhookController],
  providers: [
    // Repositories
    {
      provide: 'PaymentRepository',
      useClass: TypeOrmPaymentRepository,
    },
    // Services
    MercadoPagoService,
    // Use Cases
    CreatePaymentUseCase,
    UpdatePaymentUseCase,
    GetPaymentUseCase,
    ListPaymentsUseCase,
  ],
})
export class PaymentModule {}