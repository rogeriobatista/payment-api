import { 
  Controller, 
  Post, 
  Body, 
  HttpStatus, 
  UnauthorizedException,
  UseGuards,
  Get,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, User } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'Autenticar usuário',
    description: 'Realiza login do usuário com email e senha, retornando token JWT'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { 
          type: 'string', 
          description: 'Token JWT para autenticação',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        refresh_token: {
          type: 'string',
          description: 'Token para renovação do access_token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            email: { type: 'string', example: 'admin@payment-api.com' },
            roles: { type: 'array', items: { type: 'string' }, example: ['admin'] }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Credenciais inválidas',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Credenciais inválidas' },
        error: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Dados de entrada inválidos' 
  })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email, 
      loginDto.password
    );
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Renovar token de acesso',
    description: 'Gera um novo access_token utilizando um token válido'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token renovado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: { 
          type: 'string',
          description: 'Novo token JWT',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        refresh_token: {
          type: 'string',
          description: 'Novo refresh token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Token inválido ou expirado' 
  })
  async refresh(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obter perfil do usuário',
    description: 'Retorna informações do usuário autenticado'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Perfil do usuário retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '1' },
        email: { type: 'string', example: 'admin@payment-api.com' },
        roles: { type: 'array', items: { type: 'string' }, example: ['admin'] },
        iat: { type: 'number', description: 'Token issued at' },
        exp: { type: 'number', description: 'Token expiration' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Token não fornecido ou inválido' 
  })
  getProfile(@Request() req) {
    return req.user;
  }
}