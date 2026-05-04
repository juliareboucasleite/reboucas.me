/* carrd renderer — reads window.carrdData and mounts the UI */

(function () {
  'use strict';

  /* ---------- tiny dom helper ---------- */
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const key in attrs) {
        const v = attrs[key];
        if (v == null || v === false) continue;
        if (key === 'class') node.className = v;
        else if (key === 'dataset') Object.assign(node.dataset, v);
        else node.setAttribute(key, v);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function toneSuffix(tone) {
    const n = Number(tone);
    return n > 1 && n <= 9 ? ` side-list__icon--${n}` : '';
  }

  function externalAttrs(href) {
    if (typeof href !== 'string' || !/^https?:/i.test(href)) return {};
    return { target: '_blank', rel: 'noopener noreferrer' };
  }

  /* ---------- section renderers ---------- */
  function renderAbout(mount, data) {
    if (!mount || !data) return;

    const intro = el('p', { class: 'about-intro' });
    if (data.name) intro.appendChild(el('span', { class: 'about-name' }, data.name));
    if (data.tagline) intro.appendChild(el('span', { class: 'about-tagline' }, data.tagline));

    const actions = el('div', { class: 'about-actions' });
    (data.actions || []).forEach((a) => {
      if (a.type === 'primary' || a.type === 'link') {
        actions.appendChild(el(
          'a',
          { href: a.href, class: 'btn' + (a.type === 'primary' ? ' btn--primary' : ''), ...externalAttrs(a.href) },
          a.label
        ));
      } else if (a.type === 'copy') {
        actions.appendChild(el(
          'button',
          { type: 'button', class: 'btn btn--copy', 'data-copy': a.value },
          a.label
        ));
      }
    });

    const sections = el('div', { class: 'about-sections' },
      (data.sections || []).map((s) => el('section', { class: 'about-section' },
        el('h4', { class: 'about-section__label' }, s.label),
        el('p',  { class: 'about-section__text' },  s.text)
      ))
    );

    mount.appendChild(el('div', { class: 'about-profile' }, intro));
    mount.appendChild(actions);
    mount.appendChild(sections);
  }

  function renderScheduleItem(item) {
    if (item.kind === 'feature') {
      return el('article', { class: 'career-item career-item--flow career-item--compact-row' },
        el('span', { class: 'career-item__icon' + toneSuffix(item.tone), 'aria-hidden': 'true' }, item.icon || ''),
        el('div',  { class: 'career-item__body' },
          el('strong', null, item.title || ''),
          el('span',   null, item.meta  || '')
        )
      );
    }
    return el('article', { class: 'career-mini-item career-mini-item--compact' },
      el('span', { class: 'career-mini-item__icon' + toneSuffix(item.tone), 'aria-hidden': 'true' }, item.icon || ''),
      el('div',  { class: 'career-mini-item__body' },
        el('strong', null, item.title || ''),
        el('span',   null, item.meta  || '')
      )
    );
  }

  function renderSchedule(mount, data) {
    if (!mount || !data) return;

    const flow = el('div', { class: 'career-flow', 'aria-label': 'Schedule entries' });
    (data.months || []).forEach((m) => {
      const content = el('div', { class: 'career-flow-year__content' });

      if (m.band) {
        content.appendChild(el('div', { class: 'career-flow-band', 'aria-hidden': 'true' },
          el('span', null, m.band)
        ));
      }
      if (m.milestone) {
        content.appendChild(el('button', { type: 'button', class: 'career-milestone career-milestone--flow' },
          el('span', { class: 'career-milestone__dot', 'aria-hidden': 'true' }),
          el('span', { class: 'career-milestone__text' }, m.milestone.text || ''),
          m.milestone.date ? el('span', { class: 'career-milestone__date' }, m.milestone.date) : null
        ));
      }
      (m.items || []).forEach((it) => content.appendChild(renderScheduleItem(it)));

      const label = el('div', { class: 'career-flow-year__label' });
      label.appendChild(document.createTextNode(m.month || ''));
      if (m.year) {
        label.appendChild(el('br'));
        label.appendChild(document.createTextNode(m.year));
      }

      flow.appendChild(el('section', { class: 'career-flow-year' }, label, content));
    });

    mount.appendChild(el('div', { class: 'timeline career-board', 'aria-label': 'Commission schedule' }, flow));
  }

  function renderCommissions(mount, data) {
    if (!mount || !data) return;
    const grid = el('div', { class: 'work-grid' },
      (data.items || []).map((c) => el('article', { class: 'work-card' },
        el('div', { class: 'work-card__media', 'aria-hidden': 'true' }),
        el('h3',  { class: 'work-card__title' }, c.title || ''),
        el('p',   { class: 'work-card__desc' },  c.desc  || ''),
        c.href ? el('a', { href: c.href, class: 'work-card__link', ...externalAttrs(c.href) }, c.linkLabel || 'Open →') : null
      ))
    );
    mount.appendChild(grid);
  }

  function renderProjects(mount, data) {
    if (!mount || !data) return;
    const list = el('ul', { class: 'side-list' },
      (data.items || []).map((p) => el('li', { class: 'side-list__item' },
        el('span', { class: 'side-list__icon' + toneSuffix(p.tone), 'aria-hidden': 'true' }, p.icon || ''),
        el('div',  { class: 'side-list__content' },
          el('strong', null, p.title || ''),
          el('p', { class: 'side-list__desc' }, p.desc || ''),
          p.url ? el('a', { href: p.url, class: 'side-list__url', ...externalAttrs(p.url) }, p.urlLabel || p.url) : null
        )
      ))
    );
    mount.appendChild(list);
  }

  function renderIdeas(mount, data) {
    if (!mount || !data) return;
    const wrap = el('div', { class: 'ideas-list' },
      (data.items || []).map((i) => el('div', { class: 'ideas-card' },
        el('h3', { class: 'ideas-card__title' }, i.title || ''),
        el('p',  { class: 'ideas-card__desc' },  i.desc  || '')
      ))
    );
    mount.appendChild(wrap);
  }

  /* ---------- titles ---------- */
  function setTitle(selector, text) {
    if (!text) return;
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  }

  /* ---------- behaviors ---------- */
  function attachScrollNav() {
    const area = document.getElementById('scroll-area');
    const prev = document.getElementById('scroll-prev');
    const next = document.getElementById('scroll-next');
    if (!area || !prev || !next) return;

    function step() {
      const cols = area.querySelector('.columns');
      const col = area.querySelector('.column');
      const gap = cols ? parseFloat(getComputedStyle(cols).columnGap || '16') || 16 : 16;
      return (col ? col.getBoundingClientRect().width : 460) + gap;
    }
    prev.addEventListener('click', () => area.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => area.scrollBy({ left:  step(), behavior: 'smooth' }));
  }

  function attachCopyButtons() {
    document.querySelectorAll('.btn--copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const value = btn.getAttribute('data-copy') || '';
        try {
          await navigator.clipboard.writeText(value);
          btn.classList.add('is-copied');
          setTimeout(() => btn.classList.remove('is-copied'), 1500);
        } catch { /* ignore */ }
      });
    });
  }

  /* ---------- bootstrap ---------- */
  function init() {
    const data = window.carrdData;
    if (!data) {
      console.error('carrd: window.carrdData is missing — load data.js before app.js.');
      return;
    }

    if (data.pageTitle) {
      document.title = data.pageTitle;
      const banner = document.querySelector('.name-banner__text');
      if (banner) banner.textContent = data.pageTitle;
    }

    setTitle('[data-mount-title="about"]',       data.about?.title);
    setTitle('[data-mount-title="schedule"]',    data.schedule?.title);
    setTitle('[data-mount-title="commissions"]', data.commissions?.title);
    setTitle('[data-mount-title="projects"]',    data.projects?.title);
    setTitle('[data-mount-title="ideas"]',       data.ideas?.title);

    renderAbout      (document.querySelector('[data-mount="about"]'),       data.about);
    renderSchedule   (document.querySelector('[data-mount="schedule"]'),    data.schedule);
    renderCommissions(document.querySelector('[data-mount="commissions"]'), data.commissions);
    renderProjects   (document.querySelector('[data-mount="projects"]'),    data.projects);
    renderIdeas      (document.querySelector('[data-mount="ideas"]'),       data.ideas);

    attachScrollNav();
    attachCopyButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
