const state = {
  guild: null,
  stats: null,
  channels: [],
  imageAssets: [],
  settings: null,
  products: [],
  logs: [],
  me: null,
};

const refs = {
  me: document.getElementById('me'),
  guildMeta: document.getElementById('guild-meta'),
  overviewStats: document.getElementById('overview-stats'),
  list: document.getElementById('lista'),
  logsList: document.getElementById('logs-list'),
  refreshDashboard: document.getElementById('refresh-dashboard'),
  productForm: document.getElementById('form-novo'),
  settingsForm: document.getElementById('settings-form'),
  embedForm: document.getElementById('embed-form'),
  previewWelcome: document.getElementById('preview-welcome'),
  previewGoodbye: document.getElementById('preview-goodbye'),
  welcomeCard: document.getElementById('welcome-preview-card'),
  goodbyeCard: document.getElementById('goodbye-preview-card'),
};

const DEFAULT_IMAGE_ASSETS = [
  { value: 'Welcome.png', label: 'Welcome.png' },
  { value: 'byebye.png', label: 'byebye.png' },
  { value: 'Logo.png', label: 'Logo.png' },
  { value: 'prices.png', label: 'prices.png' },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function requestJson(url, options = {}) {
  const resolvedUrl = String(url || '');
  const fetchUrl = resolvedUrl.startsWith('/') || resolvedUrl.startsWith('http') ? resolvedUrl : `/${resolvedUrl}`;

  const response = await fetch(fetchUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' ? payload.erro || 'Falha na requisição.' : payload;
    throw new Error(message);
  }

  return payload;
}

function notify(message, isError = false) {
  let node = document.getElementById('admin-toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'admin-toast';
    node.className = 'admin-toast';
    document.body.appendChild(node);
  }

  node.textContent = message;
  node.dataset.error = isError ? 'true' : 'false';
  node.classList.add('is-visible');
  clearTimeout(node._timer);
  node._timer = setTimeout(() => node.classList.remove('is-visible'), 2600);
}

function channelLabel(channelId) {
  const channel = state.channels.find((item) => item.id === channelId);
  return channel ? `#${channel.name}` : '#nao-configurado';
}

function renderOverview() {
  const stats = state.stats || { products: 0, channels: 0, logs: 0 };
  const guild = state.guild;

  refs.overviewStats.innerHTML = [
    {
      label: 'Servidor',
      value: guild?.name || 'Desconectado',
      detail: guild ? `${guild.memberCount || 0} membros` : 'Sem guild configurada',
    },
    {
      label: 'Produtos',
      value: stats.products,
      detail: 'itens cadastrados',
    },
    {
      label: 'Canais',
      value: stats.channels,
      detail: 'canais disponíveis no painel',
    },
    {
      label: 'Logs',
      value: stats.logs,
      detail: 'eventos recentes',
    },
  ]
    .map(
      (card) => `
        <article class="stat-card">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <small>${escapeHtml(card.detail)}</small>
        </article>`,
    )
    .join('');

  refs.guildMeta.innerHTML = guild
    ? `
      <div class="guild-meta">
        ${guild.iconUrl ? `<img src="${guild.iconUrl}" alt="${escapeHtml(guild.name)}" />` : ''}
        <div>
          <strong>${escapeHtml(guild.name)}</strong>
          <p>${guild.memberCount || 0} membros · ${guild.roleCount || 0} cargos</p>
        </div>
      </div>`
    : '<p>Nenhuma guild conectada.</p>';
}

function renderProducts() {
  if (!state.products.length) {
    refs.list.innerHTML = '<article class="card" data-empty>Nenhum produto cadastrado ainda.</article>';
    return;
  }

  refs.list.innerHTML = state.products
    .map(
      (product) => `
        <article class="card">
          ${product.imagem ? `<img src="${escapeHtml(product.imagem)}" alt="${escapeHtml(product.nome)}" loading="lazy" />` : ''}
          <span class="cat">${escapeHtml(product.categoria)}</span>
          <h3>${escapeHtml(product.nome)}</h3>
          <p>${escapeHtml(product.descricao || 'Sem descrição curta.')}</p>
          <p class="preco">${escapeHtml(product.preco)} ${escapeHtml(product.moeda)}</p>
          <button type="button" data-del="${escapeHtml(product.id)}">Remover</button>
        </article>`,
    )
    .join('');

  refs.list.querySelectorAll('[data-del]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Remover este produto do catálogo?')) return;
      try {
        await requestJson(`api/admin/produtos/${button.dataset.del}`, { method: 'DELETE' });
        notify('Produto removido.');
        await loadDashboard();
      } catch (error) {
        notify(error.message, true);
      }
    });
  });
}

function renderLogs() {
  if (!state.logs.length) {
    refs.logsList.innerHTML = '<p class="empty-copy">Nenhum log ainda.</p>';
    return;
  }

  refs.logsList.innerHTML = state.logs
    .map((log) => {
      const when = new Date(log.createdAt).toLocaleString('pt-BR');
      const actor = log.actor?.username ? `${log.actor.username}${log.actor.id ? ` · ${log.actor.id}` : ''}` : 'sistema';

      return `
        <article class="log-item">
          <div class="log-item__top">
            <strong>${escapeHtml(log.title || log.type || 'Evento')}</strong>
            <span>${escapeHtml(when)}</span>
          </div>
          <p>${escapeHtml(log.message || '')}</p>
          <div class="log-item__meta">
            <span>${escapeHtml(log.source || 'painel')}</span>
            <span>${escapeHtml(actor)}</span>
          </div>
        </article>`;
    })
    .join('');
}

function fillChannelSelects() {
  const selects = document.querySelectorAll('[data-channel-select]');
  const options = [
    '<option value="">Selecionar canal</option>',
    ...state.channels.map(
      (channel) => `<option value="${escapeHtml(channel.id)}">#${escapeHtml(channel.name)}</option>`,
    ),
  ].join('');

  selects.forEach((select) => {
    const previous = select.value;
    select.innerHTML = options;
    if (previous) select.value = previous;
  });
}

async function fillImageAssetSelects() {
  try {
    const assets = [...DEFAULT_IMAGE_ASSETS, ...(state.imageAssets || [])];
    const uniqueAssets = assets.filter((asset, index, array) =>
      index === array.findIndex((item) => item.value === asset.value),
    );
    const options = ['<option value="">Sem imagem</option>']
      .concat(uniqueAssets.map((asset) => `<option value="${escapeHtml(asset.value)}">${escapeHtml(asset.label)}</option>`))
      .join('');

    document.querySelectorAll('[data-image-asset-select]').forEach((select) => {
      const previous = select.value;
      select.innerHTML = options;
      if (previous) select.value = previous;
    });
  } catch (error) {
    console.warn('[admin] fillImageAssetSelects failed', error);
  }
}

function populateSettingsForm() {
  const settings = state.settings;
  if (!settings) return;

  const form = refs.settingsForm;
  form.welcomeChannelId.value = settings.channels?.welcomeChannelId || '';
  form.goodbyeChannelId.value = settings.channels?.goodbyeChannelId || '';
  form.logsChannelId.value = settings.channels?.logsChannelId || '';
  form.ticketChannelId.value = settings.channels?.ticketChannelId || '';
  form.pricesChannelId.value = settings.channels?.pricesChannelId || '';
  form.infoChannelId.value = settings.channels?.infoChannelId || '';
  form.rulesChannelId.value = settings.channels?.rulesChannelId || '';
  form.embedChannelId.value = settings.channels?.embedChannelId || '';

  form.accentColor.value = settings.appearance?.accentColor || '#f4cfe0';
  form.authorName.value = settings.appearance?.authorName || '/pawshop';

  form.welcomeEnabled.checked = Boolean(settings.welcome?.enabled);
  form.goodbyeEnabled.checked = Boolean(settings.goodbye?.enabled);

  form.welcomeTitle.value = settings.welcome?.title || '';
  form.welcomeIntro.value = settings.welcome?.intro || '';
  form.welcomeVerifyLine.value = settings.welcome?.verifyLine || '';
  form.welcomeMemberCountText.value = settings.welcome?.memberCountText || '';

  form.goodbyeTitle.value = settings.goodbye?.title || '';
  form.goodbyeIntro.value = settings.goodbye?.intro || '';
  form.goodbyeOutro.value = settings.goodbye?.outro || '';
  form.goodbyeMemberCountText.value = settings.goodbye?.memberCountText || '';

  refs.embedForm.channelId.value = settings.channels?.embedChannelId || '';
  refs.embedForm.color.value = settings.appearance?.accentColor || '#f4cfe0';

  renderPreviewCards();
}

function getSettingsFromForm() {
  const form = refs.settingsForm;

  return {
    channels: {
      welcomeChannelId: form.welcomeChannelId.value,
      goodbyeChannelId: form.goodbyeChannelId.value,
      logsChannelId: form.logsChannelId.value,
      ticketChannelId: form.ticketChannelId.value,
      pricesChannelId: form.pricesChannelId.value,
      infoChannelId: form.infoChannelId.value,
      rulesChannelId: form.rulesChannelId.value,
      embedChannelId: form.embedChannelId.value,
    },
    welcome: {
      enabled: form.welcomeEnabled.checked,
      title: form.welcomeTitle.value,
      intro: form.welcomeIntro.value,
      verifyLine: form.welcomeVerifyLine.value,
      memberCountText: form.welcomeMemberCountText.value,
    },
    goodbye: {
      enabled: form.goodbyeEnabled.checked,
      title: form.goodbyeTitle.value,
      intro: form.goodbyeIntro.value,
      outro: form.goodbyeOutro.value,
      memberCountText: form.goodbyeMemberCountText.value,
    },
    appearance: {
      accentColor: form.accentColor.value,
      authorName: form.authorName.value,
    },
  };
}

function replaceTokens(text, kind) {
  const settings = getSettingsFromForm();
  const memberCount = state.guild?.memberCount || 0;
  const replacements = {
    '{user}': kind === 'goodbye' ? '@eutesy' : '@julia',
    '{server}': state.guild?.name || 'Pawshop',
    '{memberCount}': String(memberCount),
    '{rulesChannel}': channelLabel(settings.channels.rulesChannelId),
    '{ticketChannel}': channelLabel(settings.channels.ticketChannelId),
    '{pricesChannel}': channelLabel(settings.channels.pricesChannelId),
    '{infoChannel}': channelLabel(settings.channels.infoChannelId),
  };

  return Object.entries(replacements).reduce(
    (acc, [token, value]) => acc.replaceAll(token, value),
    String(text || ''),
  );
}

function renderPreviewCards() {
  const settings = getSettingsFromForm();
  const author = settings.appearance.authorName || '/pawshop';

  refs.welcomeCard.innerHTML = `
    <div class="discord-card__header">
      <div>
        <strong>${escapeHtml(author)}</strong>
        <p>${escapeHtml(replaceTokens(settings.welcome.title, 'welcome'))}</p>
      </div>
      <img src="images/Logo.png" alt="Logo Pawshop" class="discord-card__thumb" />
    </div>
    <div class="discord-card__body">
      <p>${escapeHtml(replaceTokens(settings.welcome.intro, 'welcome'))}</p>
      <p>🍼 ${escapeHtml(channelLabel(settings.channels.ticketChannelId))}</p>
      <p>🍼 ${escapeHtml(channelLabel(settings.channels.pricesChannelId))}</p>
      <p>🍼 ${escapeHtml(channelLabel(settings.channels.infoChannelId))}</p>
      <p>${escapeHtml(replaceTokens(settings.welcome.verifyLine, 'welcome'))}</p>
      <img src="images/Welcome.png" alt="Preview welcome" class="discord-card__banner" />
      <small>${escapeHtml(replaceTokens(settings.welcome.memberCountText, 'welcome'))}</small>
    </div>`;

  refs.goodbyeCard.innerHTML = `
    <div class="discord-card__header">
      <div>
        <strong>${escapeHtml(author)}</strong>
        <p>${escapeHtml(replaceTokens(settings.goodbye.title, 'goodbye'))}</p>
      </div>
      <img src="images/Logo.png" alt="Logo Pawshop" class="discord-card__thumb" />
    </div>
    <div class="discord-card__body">
      <p>${escapeHtml(replaceTokens(settings.goodbye.intro, 'goodbye'))}</p>
      <p>${escapeHtml(replaceTokens(settings.goodbye.outro, 'goodbye'))}</p>
      <img src="images/byebye.png" alt="Preview bye" class="discord-card__banner discord-card__banner--small" />
      <small>${escapeHtml(replaceTokens(settings.goodbye.memberCountText, 'goodbye'))}</small>
    </div>`;
}

async function loadCurrentUser() {
  state.me = await requestJson('api/me');
  refs.me.textContent = state.me ? `★ ${state.me.global_name ?? state.me.username}` : '—';
}

async function loadDashboard() {
  const payload = await requestJson('api/admin/dashboard');
  console.debug('[admin] dashboard payload images:', payload.images);
  state.guild = payload.guild;
  state.stats = payload.stats;
  state.channels = payload.channels || [];
  state.imageAssets = payload.images || [];
  state.settings = payload.settings || null;
  state.logs = payload.logs || [];
  state.products = await requestJson('api/admin/produtos');

  fillChannelSelects();
  await fillImageAssetSelects();
  renderOverview();
  populateSettingsForm();
  renderProducts();
  renderLogs();
}

refs.refreshDashboard.addEventListener('click', async () => {
  try {
    await loadDashboard();
    notify('Painel atualizado.');
  } catch (error) {
    notify(error.message, true);
  }
});

refs.productForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
    await requestJson('api/admin/produtos', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    event.currentTarget.reset();
    notify('Produto adicionado ao catálogo.');
    await loadDashboard();
  } catch (error) {
    notify(error.message, true);
  }
});

refs.settingsForm.addEventListener('input', renderPreviewCards);
refs.settingsForm.addEventListener('change', renderPreviewCards);

refs.settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const payload = getSettingsFromForm();
    state.settings = await requestJson('api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    notify('Configurações salvas.');
    await loadDashboard();
  } catch (error) {
    notify(error.message, true);
  }
});

refs.embedForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const formData = new FormData(event.currentTarget);
    await requestJson('api/admin/embeds/send', {
      method: 'POST',
      body: JSON.stringify({
        channelId: formData.get('channelId'),
        title: formData.get('title'),
        description: formData.get('description'),
        footer: formData.get('footer'),
        color: formData.get('color'),
        imageAsset: formData.get('imageAsset'),
        useLogo: formData.get('useLogo') === 'on',
      }),
    });
    notify('Embed enviado.');
    await loadDashboard();
  } catch (error) {
    notify(error.message, true);
  }
});

refs.previewWelcome.addEventListener('click', async () => {
  try {
    await requestJson('api/admin/welcome/preview', { method: 'POST', body: JSON.stringify({}) });
    notify('Preview de welcome enviado.');
    await loadDashboard();
  } catch (error) {
    notify(error.message, true);
  }
});

refs.previewGoodbye.addEventListener('click', async () => {
  try {
    await requestJson('api/admin/goodbye/preview', { method: 'POST', body: JSON.stringify({}) });
    notify('Preview de bye enviado.');
    await loadDashboard();
  } catch (error) {
    notify(error.message, true);
  }
});

(async () => {
  try {
    await Promise.all([loadCurrentUser(), loadDashboard()]);
  } catch (error) {
    notify(error.message, true);
  }
})();
