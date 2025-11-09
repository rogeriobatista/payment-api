-- Script de inicialização do banco de dados Payment API
-- Executado automaticamente no primeiro start do PostgreSQL

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar enum para métodos de pagamento
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE payment_method_enum AS ENUM ('PIX', 'CREDIT_CARD', 'BOLETO');
    END IF;
END $$;

-- Criar enum para status de pagamento
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'FAIL');
    END IF;
END $$;

-- Inserir dados de exemplo (opcional para desenvolvimento)
-- Descomente as linhas abaixo se quiser dados de exemplo

-- INSERT INTO payments (id, cpf, description, amount, payment_method, status) VALUES
-- (uuid_generate_v4(), '52998224725', 'Pagamento de exemplo PIX', 100.50, 'PIX', 'PENDING'),
-- (uuid_generate_v4(), '52998224725', 'Pagamento de exemplo Cartão', 250.00, 'CREDIT_CARD', 'PAID'),
-- (uuid_generate_v4(), '11144477735', 'Pagamento de exemplo Boleto', 75.25, 'BOLETO', 'PENDING');

-- Criar índices para performance
-- CREATE INDEX IF NOT EXISTS idx_payments_cpf ON payments(cpf);
-- CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
-- CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
-- CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Log de sucesso
\echo 'Database payment_api initialized successfully!'