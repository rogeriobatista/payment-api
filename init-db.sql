-- Script de inicialização do banco de dados
-- Este arquivo é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Garantir que o usuário tenha as permissões necessárias
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Criar tabela de pagamentos (será sobrescrita pelas migrations do TypeORM)
CREATE TABLE IF NOT EXISTS payment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpf VARCHAR(11) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('PIX', 'CREDIT_CARD')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payment_cpf ON payment(cpf);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);
CREATE INDEX IF NOT EXISTS idx_payment_method ON payment(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment(created_at);

-- Inserir dados de exemplo (opcional)
INSERT INTO payment (id, cpf, description, amount, payment_method, status) VALUES
    (uuid_generate_v4(), '11144477735', 'Pagamento de exemplo - PIX', 99.90, 'PIX', 'PAID'),
    (uuid_generate_v4(), '52998224725', 'Pagamento de exemplo - Cartão', 149.90, 'CREDIT_CARD', 'PENDING')
ON CONFLICT DO NOTHING;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_payment_updated_at ON payment;
CREATE TRIGGER update_payment_updated_at
    BEFORE UPDATE ON payment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();