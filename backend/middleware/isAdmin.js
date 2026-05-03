const { ehAdmin } = require('../utils/jsonStore');

function exigirLogin(req, res, next) {
  if (!req.session?.usuario) return res.redirect('/login');
  next();
}

function exigirAdmin(req, res, next) {
  const u = req.session?.usuario;
  if (!u) return res.redirect('/login');
  if (!ehAdmin(u.id)) return res.status(403).send('Acesso negado.');
  next();
}

module.exports = { exigirLogin, exigirAdmin };
