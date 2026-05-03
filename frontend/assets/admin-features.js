/* ============================================================
   admin-features.js
   gerencia as seções: verify · precos · sorteios · forum
   roda DEPOIS do admin-panel.js (que carrega channels/settings/etc)
   ============================================================ */
(function () {
  'use strict';

  function $(sel, ctx = document) { return ctx.querySelector(sel); }
  function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[m]));
  }

  async function api(url, options = {}) {
    const r = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    });
    const isJson = (r.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await r.json() : await r.text();
    if (!r.ok) throw new Error(typeof data === 'object' ? data.erro || 'falha' : data);
    return data;
  }

  function toast(msg, isError = false) {
    let node = document.getElementById('admin-toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'admin-toast';
      node.className = 'admin-toast';
      document.body.appendChild(node);
    }
    node.textContent = msg;
    node.dataset.error = isError ? 'true' : 'false';
    node.classList.add('is-visible');
    clearTimeout(node._t);
    node._t = setTimeout(() => node.classList.remove('is-visible'), 2600);
  }

  // ---------- popula selects compartilhados ----------
  async function popularSelects() {
    try {
      const [channels, roles, categories, forums] = await Promise.all([
        api('api/admin/dashboard').then((d) => d.channels || []),
        api('api/admin/roles'),
        api('api/admin/categories'),
        api('api/admin/forum/channels'),
      ]);

      // canais de texto
      $$('select[data-channel-select]').forEach((sel) => {
        const cur = sel.value;
        sel.innerHTML =
          '<option value="">— escolha o canal —</option>' +
          channels.map((c) => `<option value="${c.id}">#${escapeHtml(c.name)}</option>`).join('');
        if (cur) sel.value = cur;
      });

      // cargos
      $$('select[data-role-select]').forEach((sel) => {
        const cur = sel.value;
        sel.innerHTML =
          '<option value="">— escolha o cargo —</option>' +
          roles.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
        if (cur) sel.value = cur;
      });

      // categorias
      $$('select[data-category-select]').forEach((sel) => {
        const cur = sel.value;
        sel.innerHTML =
          '<option value="">— sem categoria —</option>' +
          categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        if (cur) sel.value = cur;
      });

      // foruns
      $$('select[data-forum-select]').forEach((sel) => {
        const cur = sel.value;
        sel.innerHTML =
          '<option value="">— escolha o fórum —</option>' +
          forums.map((f) => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
        if (cur) sel.value = cur;
      });
    } catch (err) {
      console.warn('[features] popular selects falhou', err);
    }
  }

  // ---------- VERIFICAÇÃO ----------
  function setupVerify() {
    const form = $('#verify-form');
    const postForm = $('#verify-post-form');
    if (!form) return;

    api('api/admin/settings').then((s) => {
      const v = s.verification ?? {};
      form.elements.roleId.value = v.roleId ?? '';
      form.elements.buttonLabel.value = v.buttonLabel ?? '';
      form.elements.title.value = v.title ?? '';
      form.elements.description.value = v.description ?? '';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form).entries());
      try {
        const atual = await api('api/admin/settings');
        await api('api/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({ ...atual, verification: { ...(atual.verification || {}), ...fd } }),
        });
        toast('verificação salva ✦');
      } catch (err) { toast(err.message, true); }
    });

    postForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(postForm).entries());
      try {
        await api('api/admin/verify/post', { method: 'POST', body: JSON.stringify(fd) });
        toast('painel postado ✦');
      } catch (err) { toast(err.message, true); }
    });
  }

  // ---------- PRECOS ----------
  function setupPrecos() {
    const form = $('#precos-form');
    const postForm = $('#precos-post-form');
    const methodsBox = $('#precos-methods');
    if (!form) return;

    const PAYMENTS = ['robux', 'paypal', 'wise', 'stripe'];

    function renderMethods(methods) {
      methodsBox.innerHTML = PAYMENTS.map((k) => {
        const m = methods?.[k] ?? { enabled: true, label: k };
        return `
          <label>
            <input type="checkbox" name="m_${k}" ${m.enabled === false ? '' : 'checked'} />
            <input type="text" name="label_${k}" value="${escapeHtml(m.label || k)}" placeholder="${k}" style="width:120px;margin-left:6px;" />
          </label>`;
      }).join('');
    }

    api('api/admin/settings').then((s) => {
      const p = s.pricing ?? {};
      form.elements.ticketCategoryId.value = p.ticketCategoryId ?? '';
      form.elements.title.value = p.title ?? '';
      form.elements.description.value = p.description ?? '';
      if (form.elements.imageUrl) form.elements.imageUrl.value = p.imageUrl ?? '';
      renderMethods(p.methods);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const methods = {};
      PAYMENTS.forEach((k) => {
        methods[k] = {
          enabled: fd.has(`m_${k}`),
          label: String(fd.get(`label_${k}`) ?? '').trim() || k,
        };
      });
      try {
        const atual = await api('api/admin/settings');
        await api('api/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({
            ...atual,
            pricing: {
              ticketCategoryId: fd.get('ticketCategoryId'),
              title: fd.get('title'),
              description: fd.get('description'),
              imageUrl: fd.get('imageUrl'),
              methods,
            },
          }),
        });
        toast('preços salvos ✦');
      } catch (err) { toast(err.message, true); }
    });

    postForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(postForm).entries());
      try {
        await api('api/admin/precos/post', { method: 'POST', body: JSON.stringify(fd) });
        toast('painel de preços postado ✦');
      } catch (err) { toast(err.message, true); }
    });
  }

  // ---------- SORTEIOS ----------
  async function carregarSorteios() {
    const wrap = $('#giveaways-list');
    if (!wrap) return;
    try {
      const lista = await api('api/admin/sorteios');
      if (lista.length === 0) {
        wrap.innerHTML = '<p class="empty-copy">nenhum sorteio cadastrado.</p>';
        return;
      }
      wrap.innerHTML = lista
        .map((s) => {
          const status = s.status === 'ativo' ? '🟢 ativo' : '⚫ encerrado';
          const ganhadores = (s.ganhadores ?? []).map((id) => `<@${id}>`).join(', ');
          return `
            <article class="log-item">
              <div class="log-item__top">
                <strong>${escapeHtml(s.premio)}</strong>
                <span>${status}</span>
              </div>
              <p>id: <code>${s.id}</code> · canal: <#${s.channelId}> · ${s.participantes.length} participantes · ${s.vencedores} ganhador(es)</p>
              ${s.status === 'encerrado' && ganhadores ? `<p>vencedores: ${ganhadores}</p>` : ''}
              <div class="log-item__meta">
                <span>termina: ${new Date(s.termina).toLocaleString()}</span>
                <span>
                  ${s.status === 'ativo' ? `<button class="btn btn--outline" data-action="end" data-id="${s.id}">Finalizar agora</button>` : ''}
                  <button class="btn btn--ghost" data-action="del" data-id="${s.id}">Apagar</button>
                </span>
              </div>
            </article>`;
        })
        .join('');

      wrap.querySelectorAll('button[data-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const { action, id } = btn.dataset;
          try {
            if (action === 'end') {
              await api(`api/admin/sorteios/${id}/finalizar`, { method: 'POST' });
              toast('sorteio finalizado ✦');
            }
            if (action === 'del') {
              if (!confirm('apagar esse sorteio do registro?')) return;
              await api(`api/admin/sorteios/${id}`, { method: 'DELETE' });
              toast('sorteio removido');
            }
            carregarSorteios();
          } catch (err) { toast(err.message, true); }
        });
      });
    } catch (err) {
      console.warn('[sorteios]', err);
    }
  }

  function setupSorteios() {
    const form = $('#giveaway-form');
    const refresh = $('#refresh-giveaways');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form).entries());
      try {
        await api('api/admin/sorteios', {
          method: 'POST',
          body: JSON.stringify({
            channelId: fd.channelId,
            premio: fd.premio,
            vencedores: Number(fd.vencedores) || 1,
            duracaoMinutos: Number(fd.duracaoMinutos) || 60,
          }),
        });
        toast('sorteio criado ✦');
        form.reset();
        form.elements.vencedores.value = 1;
        form.elements.duracaoMinutos.value = 60;
        carregarSorteios();
      } catch (err) { toast(err.message, true); }
    });

    refresh?.addEventListener('click', carregarSorteios);
    carregarSorteios();
  }

  // ---------- FORUM ----------
  async function carregarForumPosts() {
    const wrap = $('#forum-list');
    if (!wrap) return;
    try {
      const lista = await api('api/admin/forum/posts');
      if (lista.length === 0) {
        wrap.innerHTML = '<p class="empty-copy">nenhum post ainda.</p>';
        return;
      }
      wrap.innerHTML = lista
        .map(
          (p) => `
            <article class="log-item">
              <div class="log-item__top">
                <strong>${escapeHtml(p.title)}</strong>
                <span><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">abrir thread →</a></span>
              </div>
              <div class="log-item__meta">
                <span>${new Date(p.createdAt).toLocaleString()}</span>
                <span>${p.actor?.username ? `por ${escapeHtml(p.actor.username)}` : ''}</span>
              </div>
            </article>`,
        )
        .join('');
    } catch (err) {
      console.warn('[forum]', err);
    }
  }

  function setupForum() {
    const form = $('#forum-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form).entries());
      try {
        await api('api/admin/forum/post', { method: 'POST', body: JSON.stringify(fd) });
        toast('post enviado ✦');
        form.reset();
        carregarForumPosts();
      } catch (err) { toast(err.message, true); }
    });

    carregarForumPosts();
  }

  // ---------- bootstrap ----------
  // espera o admin-panel.js terminar (ele já popula channels), depois roda nossa lógica
  setTimeout(async () => {
    await popularSelects();
    setupVerify();
    setupPrecos();
    setupSorteios();
    setupForum();
  }, 600);
})();
