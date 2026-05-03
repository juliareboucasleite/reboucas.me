const express = require('express');
const { lerProdutos, salvarProdutos } = require('../utils/jsonStore');
const { exigirAdmin } = require('../middleware/isAdmin');

const router = express.Router();

router.use(exigirAdmin);

router.get('/produtos', (req, res) => {
  res.json(lerProdutos());
});

router.post('/produtos', (req, res) => {
  const { nome, categoria, preco, moeda, link, descricao, imagem } = req.body ?? {};
  if (!nome || !categoria || preco === undefined) {
    return res.status(400).json({ erro: 'nome, categoria e preco são obrigatórios.' });
  }
  const produtos = lerProdutos();
  const novo = {
    id: `${Date.now()}`,
    nome,
    categoria,
    preco: Number(preco),
    moeda: moeda ?? 'robux',
    link: link ?? '',
    descricao: descricao ?? '',
    imagem: imagem ?? '',
  };
  produtos.push(novo);
  salvarProdutos(produtos);
  res.status(201).json(novo);
});

router.put('/produtos/:id', (req, res) => {
  const produtos = lerProdutos();
  const idx = produtos.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ erro: 'Produto não encontrado.' });
  produtos[idx] = { ...produtos[idx], ...req.body, id: produtos[idx].id };
  salvarProdutos(produtos);
  res.json(produtos[idx]);
});

router.delete('/produtos/:id', (req, res) => {
  const produtos = lerProdutos();
  const restantes = produtos.filter((p) => p.id !== req.params.id);
  if (restantes.length === produtos.length) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }
  salvarProdutos(restantes);
  res.json({ ok: true });
});

module.exports = router;
