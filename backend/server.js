const path = require('node:path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const adminRoutes = require('./routes/admin');
const { exigirAdmin } = require('./middleware/isAdmin');

function criarServidor() {
  const app = express();
  const RAIZ = path.join(__dirname, '..');

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

  app.use('/styles', express.static(path.join(RAIZ, 'frontend', 'styles')));
  app.use('/images', express.static(path.join(RAIZ, 'frontend', 'images')));
  app.use('/assets', express.static(path.join(RAIZ, 'frontend', 'assets')));

  app.use('/auth', authRoutes);
  app.use('/', portfolioRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/', (req, res) => res.sendFile(path.join(RAIZ, 'frontend', 'pages', 'index.html')));
  app.get('/login', (req, res) => res.sendFile(path.join(RAIZ, 'frontend', 'pages', 'login.html')));
  app.get('/admin', exigirAdmin, (req, res) =>
    res.sendFile(path.join(RAIZ, 'frontend', 'pages', 'admin.html')),
  );

  app.get('/api/me', (req, res) => res.json(req.session?.usuario ?? null));

  return app;
}

module.exports = { criarServidor };
