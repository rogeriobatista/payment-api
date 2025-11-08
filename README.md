# Payment API

Uma API REST para gerenciar pagamentos com integração ao Mercado Pago, desenvolvida seguindo os princípios de Clean Architecture com NestJS.

## 📋 Funcionalidades

- ✅ Criar novos pagamentos (PIX e Cartão de Crédito)
- ✅ Atualizar pagamentos existentes
- ✅ Buscar pagamento por ID
- ✅ Listar pagamentos com filtros
- ✅ Integração com Mercado Pago para pagamentos via Cartão de Crédito
- ✅ Webhook para receber notificações do Mercado Pago
- ✅ Validação de CPF e dados de entrada
- ✅ Clean Architecture
- ✅ Testes unitários

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **NestJS** - Framework web progressivo
- **TypeScript** - Superset do JavaScript
- **PostgreSQL** - Banco de dados relacional
- **TypeORM** - ORM para TypeScript
- **Mercado Pago SDK** - Integração com gateway de pagamento
- **Jest** - Framework de testes
- **Class Validator** - Validação de dados

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture**:

```
src/
├── domain/           # Entidades e regras de negócio
│   ├── entities/     # Entidades do domínio
│   ├── enums/        # Enumerações
│   └── repositories/ # Interfaces dos repositórios
├── application/      # Casos de uso e DTOs
│   ├── use-cases/    # Casos de uso da aplicação
│   └── dtos/         # Data Transfer Objects
├── infrastructure/   # Implementações técnicas
│   ├── database/     # Configuração do banco
│   ├── repositories/ # Implementações dos repositórios
│   └── services/     # Serviços externos
└── presentation/     # Controllers e interfaces
    └── controllers/  # Controllers REST
```

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