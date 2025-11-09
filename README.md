# Payment API - Sistema Avançado de Pagamentos

Uma API robusta para processamento de pagamentos com **autenticação JWT**, **rate limiting**, **cache Redis**, **métricas Prometheus**, **workflows Temporal.io** e **documentação OpenAPI completa**.

## 🚀 Quick Start

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar ambiente
Criar arquivo `.env`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/paymentdb
JWT_SECRET=your-super-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
NODE_ENV=development
```

### 3. Executar serviços
```bash
# Terminal 1: Temporal Server
temporal server start-dev

# Terminal 2: Worker Temporal
npm run worker:dev

# Terminal 3: API
npm run start:dev
```

### 4. Acessar
- 🌐 **API**: http://localhost:3001
- 📚 **Documentação**: http://localhost:3001/api/docs
- 🔍 **Temporal UI**: http://localhost:8233
- 📊 **Métricas**: http://localhost:3001/metrics
- 💚 **Health**: http://localhost:3001/health

## 🎯 Funcionalidades Implementadas ✅

1. **🔐 Autenticação JWT** - Sistema completo com refresh tokens
2. **🛡️ Rate Limiting** - Proteção contra abuso (10-60 req/min)
3. **⚡ Cache Redis** - Performance otimizada com fallback
4. **📝 Logs Estruturados** - Winston com interceptors
5. **📊 Métricas Prometheus** - Monitoramento completo
6. **📚 Documentação OpenAPI** - Swagger detalhado
7. **🔄 Workflows Temporal.io** - Processamento robusto

## 📋 Índice

- [Características](#características)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando a aplicação](#executando-a-aplicação)
- [Documentação da API](#documentação-da-api)
- [Endpoints](#endpoints)
- [Webhooks](#webhooks)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Desenvolvimento](#desenvolvimento)
- [Deploy](#deploy)
- [Contribuição](#contribuição)

## ✨ Características

- 🏛️ **Clean Architecture** - Separação clara de responsabilidades
- � **Múltiplos métodos de pagamento** - PIX e Cartão de Crédito
- 🔄 **Integração Mercado Pago** - API oficial com webhooks
- 🛡️ **Validação robusta** - CPF, dados de entrada e regras de negócio
- 📊 **PostgreSQL** - Banco de dados relacional com TypeORM
- 🧪 **Testes abrangentes** - 121 testes unitários (94% coverage)
- 📝 **Documentação completa** - OpenAPI/Swagger
- 🔍 **Logs estruturados** - Monitoramento e debugging
- 🚀 **TypeScript** - Type safety e melhor DX

## 🏗️ Arquitetura

O projeto segue os princípios da **Clean Architecture**:

```
src/
├── domain/              # Regras de negócio e entidades
│   ├── entities/        # Payment entity
│   ├── enums/          # PaymentMethod, PaymentStatus
│   └── repositories/   # Interfaces de repositório
├── application/         # Casos de uso e DTOs
│   ├── use-cases/      # Create, Update, Get, List payments
│   └── dtos/           # Data Transfer Objects
├── infrastructure/     # Implementações técnicas
│   ├── database/       # TypeORM entities e configuração
│   ├── repositories/   # Implementação dos repositórios
│   └── services/       # Mercado Pago service
└── presentation/       # Controllers e APIs
    └── controllers/    # Payment e Webhook controllers
```

## 📋 Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 13.0
- **Conta Mercado Pago** (para integração de pagamentos)

## 🚀 Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/rogeriobatista/payment-api.git
cd payment-api
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

## ⚙️ Configuração

### Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=payment_api

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=your_access_token
MERCADO_PAGO_PUBLIC_KEY=your_public_key

# Application
PORT=3000
NODE_ENV=development
```

### Configuração do Banco de Dados

1. **Crie o banco de dados:**
```sql
CREATE DATABASE payment_api;
```

2. **Execute as migrações:**
```bash
npm run migration:run
```

### Configuração do Mercado Pago

1. Acesse o [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Obtenha suas credenciais (Access Token e Public Key)
4. Configure as credenciais no arquivo `.env`

## 🏃‍♂️ Executando a aplicação

### Desenvolvimento
```bash
npm run start:dev
```

### Produção
```bash
npm run build
npm run start:prod
```

A API estará disponível em `http://localhost:3000`

## 📚 Documentação da API

### Swagger/OpenAPI
Acesse `http://localhost:3000/api` para visualizar a documentação interativa.

### Autenticação
Atualmente a API não requer autenticação. Em produção, implemente JWT ou similar.

## 🛣️ Endpoints

### Criar Pagamento
```http
POST /api/payment
Content-Type: application/json

{
  "cpf": "11144477735",
  "description": "Pagamento de teste",
  "amount": 100.50,
  "paymentMethod": "PIX"
}
```

**Resposta (PIX):**
```json
{
  "payment": {
    "id": "uuid-v4",
    "cpf": "11144477735",
    "description": "Pagamento de teste",
    "amount": 100.50,
    "paymentMethod": "PIX",
    "status": "PENDING",
    "createdAt": "2023-11-07T10:00:00.000Z",
    "updatedAt": "2023-11-07T10:00:00.000Z"
  }
}
```

**Resposta (Cartão de Crédito):**
```json
{
  "payment": {
    "id": "uuid-v4",
    "cpf": "11144477735",
    "description": "Pagamento de teste",
    "amount": 100.50,
    "paymentMethod": "CREDIT_CARD",
    "status": "PENDING",
    "createdAt": "2023-11-07T10:00:00.000Z",
    "updatedAt": "2023-11-07T10:00:00.000Z"
  },
  "checkout_url": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123"
}
```

### Buscar Pagamento
```http
GET /api/payment/:id
```

### Listar Pagamentos
```http
GET /api/payment?cpf=11144477735&paymentMethod=PIX&limit=10
```

### Atualizar Pagamento
```http
PUT /api/payment/:id
Content-Type: application/json

{
  "status": "PAID",
  "description": "Pagamento confirmado"
}
```

### Status de Pagamento
- `PENDING` - Aguardando pagamento
- `PAID` - Pago com sucesso
- `FAIL` - Falha no pagamento

### Métodos de Pagamento
- `PIX` - Pagamento instantâneo
- `CREDIT_CARD` - Cartão de crédito via Mercado Pago

## 🔗 Webhooks

### Webhook do Mercado Pago
```http
POST /api/webhook/mercado-pago
Content-Type: application/json

{
  "id": 12345,
  "live_mode": false,
  "type": "payment",
  "date_created": "2023-11-07T10:00:00.000Z",
  "application_id": 123456789,
  "user_id": 987654321,
  "version": 1,
  "api_version": "v1",
  "action": "payment.updated",
  "data": {
    "id": "payment_id_from_mercado_pago"
  }
}
```

**Configuração no Mercado Pago:**
1. Acesse o painel do Mercado Pago
2. Vá em "Webhooks"
3. Configure a URL: `https://your-domain.com/api/webhook/mercado-pago`
4. Selecione os eventos: `payment`

## 🧪 Testes

### Executar todos os testes
```bash
npm test
```

### Executar testes em modo watch
```bash
npm run test:watch
```

### Executar testes com coverage
```bash
npm run test:cov
```

### Executar testes específicos
```bash
npm test -- payment.controller.spec.ts
```

### Cobertura de Testes
- **121 testes** implementados
- **94% de cobertura** do código
- Testes unitários para todas as camadas da arquitetura

## 📁 Estrutura do projeto

```
payment-api/
├── src/
│   ├── domain/                    # Camada de domínio
│   │   ├── entities/
│   │   │   ├── payment.entity.ts          # Entidade Payment
│   │   │   └── __tests__/                 # Testes da entidade
│   │   ├── enums/
│   │   │   ├── payment-method.enum.ts     # Enum métodos de pagamento
│   │   │   ├── payment-status.enum.ts     # Enum status de pagamento
│   │   │   └── index.ts
│   │   └── repositories/
│   │       └── payment.repository.ts      # Interface do repositório
│   ├── application/               # Camada de aplicação
│   │   ├── use-cases/
│   │   │   ├── create-payment.use-case.ts # Caso de uso: criar pagamento
│   │   │   ├── update-payment.use-case.ts # Caso de uso: atualizar pagamento
│   │   │   ├── get-payment.use-case.ts    # Caso de uso: buscar pagamento
│   │   │   ├── list-payments.use-case.ts  # Caso de uso: listar pagamentos
│   │   │   └── __tests__/                 # Testes dos casos de uso
│   │   └── dtos/
│   │       ├── create-payment.dto.ts      # DTO para criação
│   │       ├── update-payment.dto.ts      # DTO para atualização
│   │       ├── list-payments.dto.ts       # DTO para listagem
│   │       ├── payment-response.dto.ts    # DTO de resposta
│   │       └── __tests__/                 # Testes dos DTOs
│   ├── infrastructure/            # Camada de infraestrutura
│   │   ├── database/
│   │   │   ├── entities/
│   │   │   │   └── payment.entity.ts      # Entidade TypeORM
│   │   │   └── database.module.ts         # Módulo do banco
│   │   ├── repositories/
│   │   │   ├── typeorm-payment.repository.ts # Implementação do repositório
│   │   │   └── __tests__/                 # Testes do repositório
│   │   └── services/
│   │       ├── mercado-pago.service.ts    # Serviço Mercado Pago
│   │       └── __tests__/                 # Testes do serviço
│   ├── presentation/              # Camada de apresentação
│   │   └── controllers/
│   │       ├── payment.controller.ts      # Controller de pagamentos
│   │       ├── webhook.controller.ts      # Controller de webhooks
│   │       └── __tests__/                 # Testes dos controllers
│   ├── app.module.ts              # Módulo principal
│   └── main.ts                    # Arquivo de inicialização
├── test/                          # Configuração de testes
├── .env.example                   # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 👨‍💻 Desenvolvimento

### Scripts disponíveis

```bash
# Desenvolvimento
npm run start:dev          # Inicia em modo desenvolvimento (watch)
npm run start:debug        # Inicia em modo debug

# Build
npm run build             # Compila o TypeScript
npm run start:prod        # Inicia em modo produção

# Testes
npm test                  # Executa todos os testes
npm run test:watch        # Executa testes em modo watch
npm run test:cov          # Executa testes com coverage
npm run test:e2e          # Executa testes end-to-end

# Linting e formatação
npm run lint              # Executa ESLint
npm run format            # Formata código com Prettier

# Database
npm run migration:generate # Gera nova migração
npm run migration:run     # Executa migrações
npm run migration:revert  # Reverte última migração
```

### Adicionando novos recursos

1. **Nova entidade de domínio:**
   - Crie em `src/domain/entities/`
   - Implemente validações de negócio
   - Adicione testes unitários

2. **Novo caso de uso:**
   - Crie em `src/application/use-cases/`
   - Implemente a lógica de aplicação
   - Adicione testes unitários

3. **Nova integração externa:**
   - Crie serviço em `src/infrastructure/services/`
   - Implemente interface na camada de domínio
   - Adicione testes com mocks

4. **Novo endpoint:**
   - Adicione ao controller existente ou crie novo
   - Documente com decorators do Swagger
   - Adicione validação de entrada
   - Implemente testes de integração

### Boas práticas

- **Sempre escreva testes** antes de implementar
- **Use injeção de dependência** do NestJS
- **Valide entradas** com class-validator
- **Trate erros** de forma consistente
- **Documente** endpoints com Swagger
- **Use TypeScript** de forma rigorosa
- **Siga** os princípios SOLID

## 🚢 Deploy

### Docker

1. **Build da imagem:**
```bash
docker build -t payment-api .
```

2. **Execute o container:**
```bash
docker run -p 3000:3000 --env-file .env payment-api
```

### Docker Compose

```bash
docker-compose up -d
```

### Variáveis de ambiente de produção

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
MERCADO_PAGO_ACCESS_TOKEN=your_production_token
```

### Checklist de deploy

- [ ] Configurar variáveis de ambiente de produção
- [ ] Executar migrações do banco de dados
- [ ] Configurar webhooks do Mercado Pago
- [ ] Configurar logs de produção
- [ ] Configurar monitoramento
- [ ] Testar endpoints críticos
- [ ] Verificar conectividade com banco de dados

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. **Commit** suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. **Abra** um Pull Request

### Padrão de commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona endpoint para cancelar pagamento
fix: corrige validação de CPF
docs: atualiza README com exemplos
test: adiciona testes para webhook controller
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Issues:** [GitHub Issues](https://github.com/rogeriobatista/payment-api/issues)
- **Email:** rogeriobatista@example.com
- **Documentação:** [Wiki do projeto](https://github.com/rogeriobatista/payment-api/wiki)

## 📊 Status do Projeto

- ✅ API Core implementada
- ✅ Integração Mercado Pago
- ✅ Testes unitários (94% coverage)
- ✅ Documentação Swagger
- ✅ Webhooks funcionais
- 🔄 Autenticação (planejado)
- 🔄 Rate limiting (planejado)
- 🔄 Logs estruturados (planejado)

---

**Desenvolvido com ❤️ usando NestJS e Clean Architecture**

## 📦 Instalação

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd payment-api
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=payment_api

# Mercado Pago Configuration
MERCADO_PAGO_ACCESS_TOKEN=your_access_token_here
MERCADO_PAGO_PUBLIC_KEY=your_public_key_here
```

4. **Configure o banco de dados PostgreSQL:**
```bash
# Criar banco de dados
createdb payment_api
```

5. **Execute as migrações:**
```bash
npm run typeorm migration:run
```

## 🚀 Execução

### Desenvolvimento
```bash
npm run start:dev
```

### Produção
```bash
npm run build
npm run start
```

### Testes
```bash
# Testes unitários
npm run test

# Testes com watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 📚 API Endpoints

### Base URL
```
http://localhost:3000
```

### 1. Criar Pagamento
```http
POST /api/payment
```

**Body:**
```json
{
  "cpf": "12345678901",
  "description": "Pagamento de teste",
  "amount": 100.50,
  "paymentMethod": "PIX"
}
```

**Response (PIX):**
```json
{
  "payment": {
    "id": "uuid",
    "cpf": "12345678901",
    "description": "Pagamento de teste",
    "amount": 100.50,
    "paymentMethod": "PIX",
    "status": "PENDING",
    "createdAt": "2023-11-07T10:00:00Z",
    "updatedAt": "2023-11-07T10:00:00Z"
  }
}
```

**Response (CREDIT_CARD):**
```json
{
  "payment": {
    "id": "uuid",
    "cpf": "12345678901",
    "description": "Pagamento de teste",
    "amount": 100.50,
    "paymentMethod": "CREDIT_CARD",
    "status": "PENDING",
    "createdAt": "2023-11-07T10:00:00Z",
    "updatedAt": "2023-11-07T10:00:00Z"
  },
  "checkout_url": "https://mercadopago.com/checkout/preference-id"
}
```

### 2. Atualizar Pagamento
```http
PUT /api/payment/:id
```

**Body:**
```json
{
  "status": "PAID"
}
```

### 3. Buscar Pagamento
```http
GET /api/payment/:id
```

### 4. Listar Pagamentos
```http
GET /api/payment?cpf=12345678901&paymentMethod=PIX&limit=10&offset=0
```

**Query Parameters:**
- `cpf` (opcional): Filtrar por CPF
- `paymentMethod` (opcional): Filtrar por método (`PIX` ou `CREDIT_CARD`)
- `limit` (opcional): Limite de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

### 5. Webhook Mercado Pago
```http
POST /api/webhook/mercado-pago
```

## 📝 Regras de Negócio

### Métodos de Pagamento

**PIX:**
- Pagamentos via PIX são criados com status `PENDING`
- Não há integração externa necessária
- Status deve ser atualizado manualmente

**Cartão de Crédito:**
- Integração obrigatória com Mercado Pago
- Retorna URL de checkout para o cliente
- Status é atualizado via webhook do Mercado Pago

### Status de Pagamento
- `PENDING`: Pagamento pendente
- `PAID`: Pagamento aprovado
- `FAIL`: Erro no processamento

### Validações
- **CPF**: Deve ser válido (algoritmo de validação)
- **Valor**: Deve ser maior que zero
- **Descrição**: Obrigatória
- **Método de Pagamento**: Deve ser `PIX` ou `CREDIT_CARD`

## 🧪 Testes

O projeto inclui testes unitários para:
- Entidades do domínio
- Casos de uso
- Controllers
- Serviços

```bash
# Executar todos os testes
npm run test

# Executar com coverage
npm run test:coverage
```

## 🔧 Configuração do Mercado Pago

1. **Crie uma conta no Mercado Pago Developers**
2. **Obtenha suas credenciais:**
   - Access Token
   - Public Key
3. **Configure o webhook:**
   - URL: `https://seu-dominio.com/api/webhook/mercado-pago`
   - Eventos: `payment`

## 📦 Estrutura do Banco de Dados

### Tabela: payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  cpf VARCHAR(11) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method_enum NOT NULL,
  status payment_status_enum DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deploy

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Variáveis de Ambiente (Produção)
```env
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=payment_api
MERCADO_PAGO_ACCESS_TOKEN=your_production_token
```

## 📋 TODO (Opcional)

- [ ] Implementar Temporal.io para workflows robustos
- [ ] Adicionar autenticação e autorização
- [ ] Implementar rate limiting
- [ ] Adicionar logs estruturados
- [ ] Implementar cache com Redis
- [ ] Adicionar métricas e monitoramento
- [ ] Documentação OpenAPI/Swagger

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para suporte, envie um email para suporte@exemplo.com ou abra uma issue no GitHub.