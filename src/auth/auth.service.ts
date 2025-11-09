import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface User {
  id: string;
  email: string;
  roles: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

// Mock database - em produção, usar TypeORM/Prisma
let mockUsers = [
  {
    id: '1',
    email: 'admin@payment-api.com',
    password: 'admin123',
    roles: ['admin', 'user'],
  },
  {
    id: '2',
    email: 'user@payment-api.com',
    password: 'user123',
    roles: ['user'],
  },
];

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    // Em produção, validar contra banco de dados
    const user = mockUsers.find(u => u.email === email);
    if (user && user.password === password) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(email: string, password: string, roles: string[] = ['user']): Promise<User> {
    // Verificar se usuário já existe
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Gerar novo ID
    const newId = String(mockUsers.length + 1);
    
    // Criar novo usuário
    const newUser = {
      id: newId,
      email,
      password, // Em produção, usar bcrypt para hash
      roles,
    };

    // Adicionar ao "banco" mock
    mockUsers.push(newUser);

    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(user: User): Promise<{ access_token: string; user: User }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(user: User): Promise<{ access_token: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}