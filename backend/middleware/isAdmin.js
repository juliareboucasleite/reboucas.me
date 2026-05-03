const { ehAdmin } = require('../utils/jsonStore');
const { withBasePath } = require('../utils/basePath');

function exigirLogin(req, res, next) {
  if (!req.session?.usuario) return res.redirect(withBasePath('/login'));
  next();
}

function exigirAdmin(req, res, next) {
  const u = req.session?.usuario;
  if (!u) return res.redirect(withBasePath('/login'));
  if (!ehAdmin(u.id)) return res.status(403).send('Acesso negado.');
  next();
}

module.exports = { exigirLogin, exigirAdmin };
