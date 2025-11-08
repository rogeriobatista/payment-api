#!/bin/bash

# Payment API - Setup e Demo Script
echo "🚀 Payment API - Setup e Demo"
echo "================================"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado"
    exit 1
fi

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL não encontrado. Você precisará configurar manualmente."
else
    echo "✅ PostgreSQL encontrado"
fi

echo "📦 Instalando dependências..."
npm install

echo "🔨 Compilando o projeto..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Projeto compilado com sucesso!"
else
    echo "❌ Falha na compilação"
    exit 1
fi

echo ""
echo "📋 Para continuar o setup:"
echo "1. Configure o PostgreSQL:"
echo "   createdb payment_api"
echo ""
echo "2. Configure as variáveis de ambiente no arquivo .env"
echo ""
echo "3. Execute o projeto:"
echo "   npm run start:dev"
echo ""
echo "4. Teste a API:"
echo "   curl http://localhost:3000/api/payment"
echo ""
echo "🎯 Endpoints disponíveis:"
echo "   POST   /api/payment           - Criar pagamento"
echo "   GET    /api/payment           - Listar pagamentos"
echo "   GET    /api/payment/:id       - Buscar pagamento"
echo "   PUT    /api/payment/:id       - Atualizar pagamento"
echo "   POST   /api/webhook/mercado-pago - Webhook MP"
echo ""
echo "📚 Consulte o README.md para mais detalhes"