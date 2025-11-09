# Payment API - Sistema Avançado de Pagamentos

Uma API **enterprise-ready** para processamento de pagamentos com **autenticação JWT**, **rate limiting**, **cache Redis**, **métricas Prometheus**, **workflows Temporal.io** e **documentação OpenAPI completa**.

## 🚀 Funcionalidades

- 🔐 **Autenticação JWT** - Sistema completo de login/registro
- 💳 **Integração Mercado Pago** - Processamento de pagamentos PIX, cartão, boleto
- 🚀 **Rate Limiting** - Proteção contra abuso com configuração flexível
- 📊 **Cache Redis** - Cache distribuído para alta performance
- 🔄 **Temporal.io** - Workflows robustos para processamento assíncrono
- 📈 **Monitoramento** - Métricas com Prometheus e dashboards Grafana
- 🐳 **Docker** - Ambiente completamente containerizado
- 📖 **Documentação** - API totalmente documentada com Swagger UI
- 🏥 **Health Checks** - Monitoramento de saúde de todos os serviços

## 🏃‍♂️ Quick Start

### 1. Clone e Configure

```bash
git clone https://github.com/rogeriobatista/payment-api.git
cd payment-api

# Configure o ambiente
cp .env.example .env
# Edite o .env conforme necessário
```

### 2. Execute com Docker (Recomendado)

```bash
# Ambiente de desenvolvimento (com hot reload)
docker compose -f docker-compose.dev.yml up -d

# Verifique se todos os serviços estão rodando
docker compose -f docker-compose.dev.yml ps
```

### 3. Acesse a Aplicação

- **API**: http://localhost:3000
- **Documentação Swagger**: http://localhost:3000/api/docs
- **Adminer (PostgreSQL)**: http://localhost:8080
- **Redis Commander**: http://localhost:8081

## 📖 Como Usar a API

### 1. Registrar um Usuário

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "roles": ["user"]
  }'
```

**Resposta:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "1",
    "email": "usuario@exemplo.com",
    "roles": ["user"]
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Fazer Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### 3. Acessar Endpoints Protegidos

```bash
# Use o token recebido no login/registro
curl -X GET http://localhost:3000/api/payment \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 4. Criar um Pagamento

```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "description": "Compra de produto",
    "paymentMethod": "pix"
  }'
```

## 🐳 Docker & Ambientes

### Desenvolvimento (`docker-compose.dev.yml`)

- **Hot reload** ativado via volume binding
- **Ferramentas de debug** incluídas
- **Adminer** para PostgreSQL (http://localhost:8080)
- **Redis Commander** para Redis (http://localhost:8081)
- **Monitoramento opcional** com `--profile monitoring`

```bash
# Iniciar ambiente de desenvolvimento
docker compose -f docker-compose.dev.yml up -d

# Ver logs
docker compose -f docker-compose.dev.yml logs -f

# Parar ambiente
docker compose -f docker-compose.dev.yml down
```

### Produção (`docker-compose.prod.yml`)

- **Build otimizado** para produção
- **Stack completo** incluindo Nginx proxy
- **Health checks** em todos os serviços
- **Monitoring integrado** (Prometheus + Grafana)

```bash
# Build e deploy para produção
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Monitoramento (opcional)
docker compose -f docker-compose.prod.yml --profile monitoring up -d
```

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger UI:

**URL**: http://localhost:3000/api/docs

### Principais Endpoints

#### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Fazer login
- `GET /auth/profile` - Obter perfil do usuário
- `POST /auth/refresh` - Renovar token

#### Pagamentos
- `GET /api/payment` - Listar pagamentos
- `POST /api/payment` - Criar pagamento
- `GET /api/payment/:id` - Obter pagamento específico
- `PUT /api/payment/:id` - Atualizar pagamento

#### Webhooks
- `POST /api/webhook/mercado-pago` - Webhook do Mercado Pago

#### Monitoramento
- `GET /health` - Health check geral
- `GET /metrics` - Métricas Prometheus

## 🏗️ Arquitetura

### Stack Tecnológico

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: NestJS
- **Banco de Dados**: PostgreSQL 12
- **Cache**: Redis 7
- **Workflows**: Temporal.io
- **Documentação**: Swagger/OpenAPI
- **Monitoramento**: Prometheus + Grafana
- **Containerização**: Docker + Docker Compose

### Estrutura do Projeto

```
src/
├── auth/                   # Sistema de autenticação
│   ├── controllers/
│   ├── services/
│   ├── guards/
│   ├── strategies/
│   └── dto/
├── presentation/           # Controllers e DTOs
│   └── controllers/
├── application/           # Use cases e business logic
│   └── use-cases/
├── domain/               # Entidades e repositories
│   ├── entities/
│   └── repositories/
├── infrastructure/       # Implementações externas
│   ├── database/
│   ├── cache/
│   └── services/
├── rate-limit/          # Rate limiting
├── logging/             # Sistema de logs
└── main.ts             # Bootstrap da aplicação
```

## ⚙️ Configuração

### Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
# Aplicação
NODE_ENV=development
PORT=3000

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=payment_api

# Autenticação
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=24h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Temporal
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=TEST-your_access_token_here
MERCADO_PAGO_PUBLIC_KEY=TEST-your_public_key_here

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=info
```

### Configuração do Mercado Pago

1. Acesse o [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Obtenha suas credenciais de teste
4. Configure no `.env`:
   ```bash
   MERCADO_PAGO_ACCESS_TOKEN=TEST-sua_credencial_aqui
   MERCADO_PAGO_PUBLIC_KEY=TEST-sua_chave_publica_aqui
   ```

## 🚀 Deploy em Produção

### Docker Compose (Recomendado)

```bash
# 1. Clone e configure
git clone https://github.com/rogeriobatista/payment-api.git
cd payment-api
cp .env.example .env

# 2. Configure variáveis de produção
nano .env  # Configure com credenciais reais

# 3. Build e deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 4. Verificar status
docker compose -f docker-compose.prod.yml ps
```

### Kubernetes (Helm)

```bash
# TODO: Implementar charts Helm
helm install payment-api ./charts/payment-api
```

## 📊 Monitoramento

### Health Checks

A aplicação possui health checks abrangentes:

```bash
curl http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "temporal": { "status": "up" }
  }
}
```

### Métricas Prometheus

```bash
curl http://localhost:3000/metrics
```

### Dashboards Grafana

Acesse: http://localhost:3001 (com `--profile monitoring`)

- **Usuário**: admin
- **Senha**: admin

## 🔧 Desenvolvimento

### Pré-requisitos

- Node.js 20+
- Docker & Docker Compose
- Git

### Setup Local

```bash
# 1. Clone o projeto
git clone https://github.com/rogeriobatista/payment-api.git
cd payment-api

# 2. Instale dependências
npm install

# 3. Configure ambiente
cp .env.example .env

# 4. Inicie serviços Docker
docker compose -f docker-compose.dev.yml up -d postgres redis temporal

# 5. Execute em modo desenvolvimento
npm run start:dev
```

### Scripts Disponíveis

```bash
npm run start:dev      # Desenvolvimento com hot reload
npm run start:debug    # Debug mode
npm run build          # Build para produção
npm run start:prod     # Executar versão de produção
npm run test           # Executar testes
npm run test:e2e       # Testes end-to-end
npm run lint           # Linting
npm run format         # Formatar código
```

### Estrutura de Comandos Docker

```bash
# Desenvolvimento
docker compose -f docker-compose.dev.yml up -d    # Iniciar
docker compose -f docker-compose.dev.yml down     # Parar
docker compose -f docker-compose.dev.yml logs -f  # Ver logs

# Produção
docker compose -f docker-compose.prod.yml build   # Build
docker compose -f docker-compose.prod.yml up -d   # Deploy
docker compose -f docker-compose.prod.yml ps      # Status

# Utilitários
docker compose -f docker-compose.dev.yml exec payment-api bash  # Acessar container
docker compose -f docker-compose.dev.yml restart payment-api    # Reiniciar serviço
```

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

### Testes com Docker

```bash
# Executar testes no container
docker compose -f docker-compose.dev.yml exec payment-api npm test
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use **TypeScript** para type safety
- Siga os padrões **ESLint** e **Prettier**
- Escreva **testes** para novas funcionalidades
- Documente com **JSDoc** quando necessário
- Use **conventional commits**

## 📝 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Documentação**: http://localhost:3000/api/docs
- **Issues**: https://github.com/rogeriobatista/payment-api/issues
- **Wiki**: https://github.com/rogeriobatista/payment-api/wiki

## 📈 Roadmap

- [ ] Implementação de mais provedores de pagamento
- [ ] Sistema de webhooks genérico
- [ ] Dashboard administrativo
- [ ] API de relatórios e analytics
- [ ] Sistema de multi-tenancy
- [ ] Integração com blockchain
- [ ] Mobile SDK

---

**Desenvolvido com ❤️ por [Rogerio Batista](https://github.com/rogeriobatista)**