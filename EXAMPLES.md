# Exemplos de Uso da Payment API

## 1. Criar Pagamento PIX

```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "description": "Pagamento PIX de exemplo",
    "amount": 150.75,
    "paymentMethod": "PIX"
  }'
```

**Resposta:**
```json
{
  "payment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "cpf": "12345678901",
    "description": "Pagamento PIX de exemplo",
    "amount": 150.75,
    "paymentMethod": "PIX",
    "status": "PENDING",
    "createdAt": "2023-11-07T10:00:00.000Z",
    "updatedAt": "2023-11-07T10:00:00.000Z"
  }
}
```

## 2. Criar Pagamento Cartão de Crédito

```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "98765432100",
    "description": "Compra online - Produto XYZ",
    "amount": 299.99,
    "paymentMethod": "CREDIT_CARD"
  }'
```

**Resposta:**
```json
{
  "payment": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "cpf": "98765432100",
    "description": "Compra online - Produto XYZ",
    "amount": 299.99,
    "paymentMethod": "CREDIT_CARD",
    "status": "PENDING",
    "createdAt": "2023-11-07T10:05:00.000Z",
    "updatedAt": "2023-11-07T10:05:00.000Z"
  },
  "checkout_url": "https://mercadopago.com/checkout/preference-123456"
}
```

## 3. Buscar Pagamento por ID

```bash
curl -X GET http://localhost:3000/api/payment/550e8400-e29b-41d4-a716-446655440000
```

## 4. Atualizar Status do Pagamento

```bash
curl -X PUT http://localhost:3000/api/payment/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID"
  }'
```

## 5. Listar Pagamentos

```bash
# Listar todos
curl -X GET http://localhost:3000/api/payment

# Filtrar por CPF
curl -X GET "http://localhost:3000/api/payment?cpf=12345678901"

# Filtrar por método de pagamento
curl -X GET "http://localhost:3000/api/payment?paymentMethod=PIX"

# Com paginação
curl -X GET "http://localhost:3000/api/payment?limit=10&offset=0"

# Múltiplos filtros
curl -X GET "http://localhost:3000/api/payment?cpf=12345678901&paymentMethod=PIX&limit=5"
```

## 6. Exemplos de Validação (Retornam erro)

### CPF Inválido
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "123",
    "description": "Teste",
    "amount": 100,
    "paymentMethod": "PIX"
  }'
```

### Valor Inválido
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "description": "Teste",
    "amount": -50,
    "paymentMethod": "PIX"
  }'
```

### Método de Pagamento Inválido
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "description": "Teste",
    "amount": 100,
    "paymentMethod": "INVALID_METHOD"
  }'
```

## 7. Testando com Postman/Insomnia

Importe esta collection para testar facilmente:

```json
{
  "info": {
    "name": "Payment API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Criar Pagamento PIX",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"cpf\": \"12345678901\",\n  \"description\": \"Pagamento PIX\",\n  \"amount\": 150.75,\n  \"paymentMethod\": \"PIX\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/payment",
          "host": ["{{baseUrl}}"],
          "path": ["api", "payment"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

## 8. Webhook Mercado Pago (Simulação)

```bash
curl -X POST http://localhost:3000/api/webhook/mercado-pago \
  -H "Content-Type: application/json" \
  -d '{
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
      "id": "payment-id-from-mercado-pago"
    }
  }'
```