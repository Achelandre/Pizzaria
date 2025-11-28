const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const PORT = Number(process.env.PORT || 3001);

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'pizzaria',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', now: result.rows[0]?.now });
  } catch (erro) {
    console.error('Falha na verificação de saúde:', erro);
    res.status(500).json({ status: 'erro', detalhe: 'Falha ao acessar o banco.' });
  }
});

app.get('/api/clientes', async (_req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, telefone, endereco, criado_em
       FROM clientes
       ORDER BY nome`
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar clientes:', erro);
    res.status(500).json({ mensagem: 'Erro ao listar clientes.' });
  }
});

app.post('/api/clientes', async (req, res) => {
  const { nome, telefone, endereco } = req.body ?? {};
  if (!nome || typeof nome !== 'string') {
    return res.status(400).json({ mensagem: 'Campo nome é obrigatório.' });
  }
  try {
    const resultado = await pool.query(
      `INSERT INTO clientes (nome, telefone, endereco)
       VALUES ($1, $2, $3)
       RETURNING id, nome, telefone, endereco, criado_em`,
      [nome.trim(), telefone ?? null, endereco ?? null]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao criar cliente:', erro);
    res.status(500).json({ mensagem: 'Erro ao criar cliente.' });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }
  const { nome, telefone, endereco } = req.body ?? {};
  if (!nome || typeof nome !== 'string') {
    return res.status(400).json({ mensagem: 'Campo nome é obrigatório.' });
  }
  try {
    const resultado = await pool.query(
      `UPDATE clientes
       SET nome = $1, telefone = $2, endereco = $3
       WHERE id = $4
       RETURNING id, nome, telefone, endereco, criado_em`,
      [nome.trim(), telefone ?? null, endereco ?? null, id]
    );
    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao atualizar cliente:', erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar cliente.' });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }
  try {
    const resultado = await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }
    res.status(204).send();
  } catch (erro) {
    console.error('Erro ao remover cliente:', erro);
    res.status(500).json({ mensagem: 'Erro ao remover cliente.' });
  }
});

app.get('/api/produtos', async (_req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, categoria, preco, ativo, criado_em
       FROM produtos
       ORDER BY nome`
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar produtos:', erro);
    res.status(500).json({ mensagem: 'Erro ao listar produtos.' });
  }
});

app.post('/api/produtos', async (req, res) => {
  const { nome, categoria, preco, ativo } = req.body ?? {};
  if (!nome || typeof nome !== 'string') {
    return res.status(400).json({ mensagem: 'Campo nome é obrigatório.' });
  }
  const valor = Number(preco);
  if (Number.isNaN(valor)) {
    return res.status(400).json({ mensagem: 'Preço inválido.' });
  }
  try {
    const resultado = await pool.query(
      `INSERT INTO produtos (nome, categoria, preco, ativo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, categoria, preco, ativo, criado_em`,
      [nome.trim(), categoria ?? 'Outro', valor, ativo !== false]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao criar produto:', erro);
    res.status(500).json({ mensagem: 'Erro ao criar produto.' });
  }
});

app.put('/api/produtos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }
  const { nome, categoria, preco, ativo } = req.body ?? {};
  if (!nome || typeof nome !== 'string') {
    return res.status(400).json({ mensagem: 'Campo nome é obrigatório.' });
  }
  const valor = Number(preco);
  if (Number.isNaN(valor)) {
    return res.status(400).json({ mensagem: 'Preço inválido.' });
  }
  try {
    const resultado = await pool.query(
      `UPDATE produtos
       SET nome = $1, categoria = $2, preco = $3, ativo = $4
       WHERE id = $5
       RETURNING id, nome, categoria, preco, ativo, criado_em`,
      [nome.trim(), categoria ?? 'Outro', valor, ativo !== false, id]
    );
    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao atualizar produto:', erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar produto.' });
  }
});

app.delete('/api/produtos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }
  try {
    const resultado = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }
    res.status(204).send();
  } catch (erro) {
    console.error('Erro ao remover produto:', erro);
    res.status(500).json({ mensagem: 'Erro ao remover produto.' });
  }
});

app.get('/api/pedidos', async (_req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT p.id,
              p.cliente_id,
              p.data_pedido,
              p.forma_pagamento,
              p.total_bruto,
              p.desconto,
              p.total_liquido,
              p.observacao,
              p.codigo_fiscal,
              COALESCE(json_agg(json_build_object(
                'id', i.id,
                'pedido_id', i.pedido_id,
                'produto_id', i.produto_id,
                'quantidade', i.quantidade,
                'preco_unitario', i.preco_unitario
              ) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS itens
       FROM pedidos p
       LEFT JOIN itens_pedido i ON i.pedido_id = p.id
       GROUP BY p.id
       ORDER BY p.data_pedido DESC`
    );
    const pedidos = resultado.rows.map(row => ({
      ...row,
      itens: Array.isArray(row.itens) ? row.itens : JSON.parse(row.itens)
    }));
    res.json(pedidos);
  } catch (erro) {
    console.error('Erro ao listar pedidos:', erro);
    res.status(500).json({ mensagem: 'Erro ao listar pedidos.' });
  }
});

app.post('/api/pedidos', async (req, res) => {
  const { cliente_id, forma_pagamento, total_bruto, desconto, total_liquido, observacao, itens } = req.body ?? {};
  if (!cliente_id || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ mensagem: 'Cliente e itens são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const codigoFiscal = `NF-${Date.now()}`;
    const pedido = await client.query(
      `INSERT INTO pedidos (cliente_id, forma_pagamento, total_bruto, desconto, total_liquido, observacao, codigo_fiscal)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, cliente_id, forma_pagamento, total_bruto, desconto, total_liquido, observacao, codigo_fiscal, data_pedido`,
      [
        cliente_id,
        forma_pagamento ?? 'Dinheiro',
        Number(total_bruto) || 0,
        Number(desconto) || 0,
        Number(total_liquido) || 0,
        observacao ?? null,
        codigoFiscal
      ]
    );

    const pedidoCriado = pedido.rows[0];

    for (const item of itens) {
      const produtoId = Number(item.produto_id);
      const quantidade = Number(item.quantidade);
      const precoUnitario = Number(item.preco_unitario);
      if (!produtoId || quantidade <= 0) {
        throw new Error('Item de pedido inválido.');
      }
      await client.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)` ,
        [pedidoCriado.id, produtoId, quantidade, precoUnitario || 0]
      );
    }

    await client.query('COMMIT');

    const retorno = await pool.query(
      `SELECT p.id,
              p.cliente_id,
              p.data_pedido,
              p.forma_pagamento,
              p.total_bruto,
              p.desconto,
              p.total_liquido,
              p.observacao,
              p.codigo_fiscal,
              json_agg(json_build_object(
                'id', i.id,
                'pedido_id', i.pedido_id,
                'produto_id', i.produto_id,
                'quantidade', i.quantidade,
                'preco_unitario', i.preco_unitario
              ) ORDER BY i.id) AS itens
       FROM pedidos p
       JOIN itens_pedido i ON i.pedido_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [pedidoCriado.id]
    );

    res.status(201).json(retorno.rows[0]);
  } catch (erro) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', erro);
    res.status(500).json({ mensagem: 'Erro ao criar pedido.' });
  } finally {
    client.release();
  }
});

app.delete('/api/pedidos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }
  try {
    const resultado = await pool.query('DELETE FROM pedidos WHERE id = $1', [id]);
    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }
    res.status(204).send();
  } catch (erro) {
    console.error('Erro ao remover pedido:', erro);
    res.status(500).json({ mensagem: 'Erro ao remover pedido.' });
  }
});

app.use((err, _req, res, _next) => {
  console.error('Erro inesperado:', err);
  res.status(500).json({ mensagem: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`API da Pizzaria ouvindo na porta ${PORT}`);
});
