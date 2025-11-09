import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    // Reset não está disponível em todas as versões do cache-manager
    // Implementar lógica personalizada se necessário
    console.log('Cache reset requested');
  }

  // Métodos específicos para payments
  async getPayment(paymentId: string) {
    return this.get(`payment:${paymentId}`);
  }

  async setPayment(paymentId: string, payment: any, ttl: number = 300) {
    await this.set(`payment:${paymentId}`, payment, ttl);
  }

  async delPayment(paymentId: string) {
    await this.del(`payment:${paymentId}`);
  }

  async getPaymentsList(filters: any) {
    const key = `payments:list:${this.generateKeyFromFilters(filters)}`;
    return this.get(key);
  }

  async setPaymentsList(filters: any, payments: any[], ttl: number = 60) {
    const key = `payments:list:${this.generateKeyFromFilters(filters)}`;
    await this.set(key, payments, ttl);
  }

  async invalidatePaymentsList() {
    // Em uma implementação real, você usaria padrões para deletar múltiplas chaves
    // Por simplicidade, apenas resetamos o cache
    const keys = ['payments:list:*'];
    for (const key of keys) {
      await this.del(key);
    }
  }

  // Cache para estatísticas
  async getStats(key: string) {
    return this.get(`stats:${key}`);
  }

  async setStats(key: string, stats: any, ttl: number = 3600) {
    await this.set(`stats:${key}`, stats, ttl);
  }

  // Cache para configurações
  async getConfig(key: string) {
    return this.get(`config:${key}`);
  }

  async setConfig(key: string, config: any, ttl: number = 86400) {
    await this.set(`config:${key}`, config, ttl);
  }

  private generateKeyFromFilters(filters: any): string {
    const sortedKeys = Object.keys(filters).sort();
    const keyParts = sortedKeys.map(key => `${key}:${filters[key]}`);
    return keyParts.join('|');
  }

  // Método helper para cache com fallback
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === undefined) {
      value = await fetcher();
      await this.set(key, value, ttl);
    }
    
    return value;
  }

  // Warm-up cache
  async warmUp() {
    // Implementar cache warm-up para dados frequentemente acessados
    console.log('Cache warm-up initiated');
  }
}