import { v4 as uuidv4 } from 'uuid';
import { PaymentMethod, PaymentStatus } from '../enums';

export class Payment {
  public readonly id: string;
  public cpf: string;
  public description: string;
  public amount: number;
  public paymentMethod: PaymentMethod;
  public status: PaymentStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(
    cpf: string,
    description: string,
    amount: number,
    paymentMethod: PaymentMethod,
    id?: string,
  ) {
    this.id = id || uuidv4();
    this.cpf = cpf;
    this.description = description;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
    this.status = PaymentStatus.PENDING;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    this.validate();
  }

  public updateStatus(status: PaymentStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  public update(data: Partial<Pick<Payment, 'cpf' | 'description' | 'amount' | 'paymentMethod'>>): void {
    if (data.cpf !== undefined) {
      this.cpf = data.cpf;
    }
    if (data.description !== undefined) {
      this.description = data.description;
    }
    if (data.amount !== undefined) {
      this.amount = data.amount;
    }
    if (data.paymentMethod !== undefined) {
      this.paymentMethod = data.paymentMethod;
    }
    
    this.updatedAt = new Date();
    this.validate();
  }

  private validate(): void {
    if (!this.cpf || this.cpf.trim().length === 0) {
      throw new Error('CPF é obrigatório');
    }

    if (!this.isValidCPF(this.cpf)) {
      throw new Error('CPF inválido');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Descrição é obrigatória');
    }

    if (!this.amount || this.amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    if (!Object.values(PaymentMethod).includes(this.paymentMethod)) {
      throw new Error('Método de pagamento inválido');
    }
  }

  private isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit === 10 || firstDigit === 11) {
      firstDigit = 0;
    }

    if (parseInt(cleanCPF.charAt(9)) !== firstDigit) {
      return false;
    }

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit === 10 || secondDigit === 11) {
      secondDigit = 0;
    }

    return parseInt(cleanCPF.charAt(10)) === secondDigit;
  }
}