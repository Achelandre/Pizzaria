-- Inicialização do banco "pizzaria" ao subir o contêiner PostgreSQL
-- Executado automaticamente pelo docker-entrypoint do Postgres.

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  telefone VARCHAR(32),
  endereco VARCHAR(200),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  categoria VARCHAR(50) NOT NULL DEFAULT 'Outro',
  preco NUMERIC(10,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  data_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'Dinheiro',
  total_bruto NUMERIC(10,2) NOT NULL,
  desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_liquido NUMERIC(10,2) NOT NULL,
  observacao TEXT,
  codigo_fiscal VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS itens_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10,2) NOT NULL
);

-- Dados exemplo
INSERT INTO clientes (nome, telefone, endereco)
SELECT 'Ana Silva', '(11) 98888-0000', 'Rua das Flores, 123'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Ana Silva');

INSERT INTO clientes (nome, telefone, endereco)
SELECT 'Bruno Costa', '(11) 97777-1111', 'Av. Central, 456'
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = 'Bruno Costa');

INSERT INTO produtos (nome, categoria, preco, ativo)
SELECT 'Pizza Marguerita', 'Pizza', 39.90, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Pizza Marguerita');

INSERT INTO produtos (nome, categoria, preco, ativo)
SELECT 'Refrigerante 2L', 'Refrigerante', 12.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Refrigerante 2L');

INSERT INTO produtos (nome, categoria, preco, ativo)
SELECT 'Pizza Chocolate', 'Sobremesa', 42.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Pizza Chocolate');
