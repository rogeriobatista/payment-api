import { 
  Controller, 
  Post, 
  Body, 
  HttpStatus, 
  UnauthorizedException,
  UseGuards,
  Get,
  Request,
  ConflictException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, User } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ 
    summary: 'Registrar novo usuário',
    description: `
Cria um novo usuário no sistema. Este endpoint é público e não requer autenticação.

**Características:**
- Validação de email único
- Senha mínima de 6 caracteres
- Roles opcionais (padrão: ['user'])
- Login automático após registro
- Retorna token JWT para uso imediato

**Exemplo de uso:**
\`\`\`bash
curl -X POST http://localhost:3000/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "roles": ["user"]
  }'
\`\`\`
    `
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Usuário criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User created successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '3' },
            email: { type: 'string', example: 'newuser@payment-api.com' },
            roles: { type: 'array', items: { type: 'string' }, example: ['user'] }
          }
        },
        access_token: { 
          type: 'string', 
          description: 'Token JWT para autenticação imediata',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Email já está em uso',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'User with this email already exists' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Dados de entrada inválidos' 
  })
  async register(@Body() registerDto: RegisterDto) {
    try {
      const user = await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.roles
      );

      // Fazer login automático após registro
      const loginResult = await this.authService.login(user);

      return {
        message: 'User created successfully',
        user: loginResult.user,
        access_token: loginResult.access_token
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  @Post('login')
  @Public()
  @ApiOperation({ 
    summary: 'Autenticar usuário',
    description: `
Realiza login do usuário com email e senha, retornando token JWT.

**Características:**
- Validação de credenciais
- Token JWT com expiração configurável
- Informações do usuário no retorno
- Suporte a refresh token

**Usuários de teste disponíveis:**
- Email: \`admin@payment-api.com\` / Senha: \`admin123\` (Admin)
- Email: \`user@payment-api.com\` / Senha: \`user123\` (User)

**Exemplo de uso:**
\`\`\`bash
curl -X POST http://localhost:3000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@payment-api.com",
    "password": "admin123"
  }'
\`\`\`
    `
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