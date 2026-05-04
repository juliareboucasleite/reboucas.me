const express = require('express');
const { lerProdutos } = require('../utils/jsonStore');
const config = require('../../config/config.json');

const router = express.Router();

router.get('/api/produtos', (req, res) => {
  const { categoria } = req.query;
  let produtos = lerProdutos();
  if (categoria) produtos = produtos.filter((p) => p.categoria === categoria);
  res.json({ loja: config.loja, produtos });
});

module.exports = router;
