import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '@domain/entities';
import { PaymentRepository, PaymentFilters } from '@domain/repositories';
import { PaymentMethod } from '@domain/enums';
import { PaymentEntity } from '../database/entities';

@Injectable()
export class TypeOrmPaymentRepository implements PaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    const paymentEntity = this.toEntity(payment);
    const savedEntity = await this.paymentRepository.save(paymentEntity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.paymentRepository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCpf(cpf: string): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({ where: { cpf } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByPaymentMethod(paymentMethod: PaymentMethod): Promise<Payment[]> {
    const entities = await this.paymentRepository.find({ where: { paymentMethod } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findAll(filters?: PaymentFilters): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (filters?.cpf) {
      queryBuilder.andWhere('payment.cpf = :cpf', { cpf: filters.cpf });
    }

    if (filters?.paymentMethod) {
      queryBuilder.andWhere('payment.paymentMethod = :paymentMethod', { 
        paymentMethod: filters.paymentMethod 
      });
    }

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    queryBuilder.orderBy('payment.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async update(id: string, paymentData: Partial<Payment>): Promise<Payment | null> {
    const existingEntity = await this.paymentRepository.findOne({ where: { id } });
    if (!existingEntity) {
      return null;
    }

    const updateData: Partial<PaymentEntity> = {};
    
    if (paymentData.cpf !== undefined) updateData.cpf = paymentData.cpf;
    if (paymentData.description !== undefined) updateData.description = paymentData.description;
    if (paymentData.amount !== undefined) updateData.amount = paymentData.amount;
    if (paymentData.paymentMethod !== undefined) updateData.paymentMethod = paymentData.paymentMethod;
    if (paymentData.status !== undefined) updateData.status = paymentData.status;

    await this.paymentRepository.update(id, updateData);
    
    const updatedEntity = await this.paymentRepository.findOne({ where: { id } });
    return updatedEntity ? this.toDomain(updatedEntity) : null;
  }

  private toEntity(payment: Payment): PaymentEntity {
    const entity = new PaymentEntity();
    entity.id = payment.id;
    entity.cpf = payment.cpf;
    entity.description = payment.description;
    entity.amount = payment.amount;
    entity.paymentMethod = payment.paymentMethod;
    entity.status = payment.status;
    entity.createdAt = payment.createdAt;
    entity.updatedAt = payment.updatedAt;
    return entity;
  }

  private toDomain(entity: PaymentEntity): Payment {
    const payment = new Payment(
      entity.cpf,
      entity.description,
      entity.amount,
      entity.paymentMethod,
      entity.id,
    );
    
    payment.status = entity.status;
    payment.updatedAt = entity.updatedAt;
    
    return payment;
  }
}