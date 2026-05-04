const { ehAdmin } = require('../utils/jsonStore');
const { withBasePath } = require('../utils/basePath');

function querJson(req) {
  if (req.baseUrl?.startsWith('/api') || req.originalUrl?.startsWith('/api')) return true;
  const accept = req.get?.('accept') || '';
  return accept.includes('application/json');
}

function exigirLogin(req, res, next) {
  if (!req.session?.usuario) {
    if (querJson(req)) return res.status(401).json({ erro: 'Sessão expirada.' });
    return res.redirect(withBasePath('/login'));
  }
  next();
}

function exigirAdmin(req, res, next) {
  const u = req.session?.usuario;
  if (!u) {
    if (querJson(req)) return res.status(401).json({ erro: 'Sessão expirada.' });
    return res.redirect(withBasePath('/login'));
  }
  if (!ehAdmin(u.id)) {
    if (querJson(req)) return res.status(403).json({ erro: 'Acesso negado.' });
    return res.status(403).send('Acesso negado.');
  }
  next();
}

module.exports = { exigirLogin, exigirAdmin };
