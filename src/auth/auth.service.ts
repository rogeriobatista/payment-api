import { Injectable, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    // Em produção, validar contra banco de dados
    // Por simplicidade, usando usuários mockados
    const mockUsers = [
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

    const user = mockUsers.find(u => u.email === email);
    if (user && user.password === password) {
      const { password, ...result } = user;
      return result;
    }
    return null;
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