const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const { criarAdminRouter } = require('./routes/admin');
const { getBasePath } = require('./utils/basePath');
const { exigirAdmin } = require('./middleware/isAdmin');

function criarServidor(client) {
  const app = express();
  const router = express.Router();
  const RAIZ = path.join(__dirname, '..');
  const basePath = getBasePath();
  const adminRoutes = criarAdminRouter(client);

  function renderizarPagina(nomeArquivo) {
    const caminho = path.join(RAIZ, 'frontend', 'pages', nomeArquivo);
    return fs
      .readFileSync(caminho, 'utf8')
      .replaceAll('__BASE_PATH__', basePath || '');
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-troque-isso',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
    }),
  );

  router.use('/styles', express.static(path.join(RAIZ, 'frontend', 'styles')));
  router.use('/images', express.static(path.join(RAIZ, 'frontend', 'images')));
  router.use('/assets', express.static(path.join(RAIZ, 'frontend', 'assets')));

  router.use('/auth', authRoutes);
  router.use('/', portfolioRoutes);
  router.use('/api/admin', adminRoutes);

  router.get('/', (req, res) => res.type('html').send(renderizarPagina('index.html')));
  router.get('/login', (req, res) => res.type('html').send(renderizarPagina('login.html')));
  router.get('/admin', exigirAdmin, (req, res) => res.type('html').send(renderizarPagina('admin.html')));

  router.get('/api/me', (req, res) => res.json(req.session?.usuario ?? null));
  app.use(basePath || '/', router);

  return app;
}

module.exports = { criarServidor };
