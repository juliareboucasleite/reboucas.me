const express = require('express');
const { withBasePath } = require('../utils/basePath');

const router = express.Router();

const DISCORD_API = 'https://discord.com/api';

router.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.ID_CLIENTE,
    redirect_uri: process.env.REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
  });
  res.redirect(`${DISCORD_API}/oauth2/authorize?${params}`);
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Código não fornecido.');

  try {
    const tokenResp = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.ID_CLIENTE,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
    });
    if (!tokenResp.ok) throw new Error(`token ${tokenResp.status}`);
    const token = await tokenResp.json();

    const userResp = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!userResp.ok) throw new Error(`user ${userResp.status}`);
    const user = await userResp.json();

    req.session.usuario = {
      id: user.id,
      username: user.username,
      global_name: user.global_name,
      avatar: user.avatar,
    };
    res.redirect(withBasePath('/admin'));
  } catch (err) {
    console.error('[auth]', err);
    res.status(500).send('Falha ao autenticar com o Discord.');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect(withBasePath('/')));
});

module.exports = router;
