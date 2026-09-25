import {
  posts,
  categories,
  BLOG_PER_PAGE,
  BLOG_PER_PAGE_SM,
  BLOG_PER_PAGE_XS,
  getCategoryLabel,
  SITE_URL,
} from './blog-data.js';

const state = {
  q: '',
  cat: 'all',
  page: 1,
  view: localStorage.getItem('blog-view') === 'list' ? 'list' : 'grid',
};

const els = {
  grid: document.getElementById('blog-grid'),
  search: document.getElementById('blog-search'),
  cats: document.getElementById('blog-cats'),
  catsHint: document.getElementById('blog-cats-hint'),
  pagination: document.getElementById('blog-pagination'),
  count: document.getElementById('blog-count'),
  empty: document.getElementById('blog-empty'),
  viewGrid: document.getElementById('view-grid'),
  viewList: document.getElementById('view-list'),
};

function normalize(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function readUrl() {
  const params = new URLSearchParams(window.location.search);
  state.q = params.get('q') || '';
  state.cat = params.get('cat') || 'all';
  const page = parseInt(params.get('page') || '1', 10);
  state.page = Number.isFinite(page) && page > 0 ? page : 1;
  if (els.search && state.q) els.search.value = state.q;
}

function writeUrl() {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.cat && state.cat !== 'all') params.set('cat', state.cat);
  if (state.page > 1) params.set('page', String(state.page));
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
  window.history.replaceState(null, '', url);
}

function filtered() {
  const q = normalize(state.q.trim());
  return posts.filter((p) => {
    if (state.cat !== 'all' && p.category !== state.cat) return false;
    if (!q) return true;
    const hay = normalize(
      [p.title, p.excerpt, p.metaDescription, getCategoryLabel(p.category), p.tags.join(' '), p.author].join(' '),
    );
    return hay.includes(q);
  });
}

/** Menos artículos en pantallas pequeñas; 9 en desktop (grid 3 col). */
function perPage() {
  const w = window.innerWidth;
  if (w < 640) return BLOG_PER_PAGE_XS;
  if (w < 1024) return BLOG_PER_PAGE_SM;
  return BLOG_PER_PAGE;
}

function cardGrid(p) {
  return `
    <article class="blog-card group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-brand-500 hover:shadow-xl transition-all flex flex-col">
      <a href="/blog/${p.slug}" class="block relative aspect-video bg-slate-100 overflow-hidden">
        <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.imageAlt)}" width="640" height="360" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <span class="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/95 text-slate-800 text-[11px] font-bold uppercase tracking-wider border border-slate-200">${escapeHtml(getCategoryLabel(p.category))}</span>
      </a>
      <div class="p-5 flex flex-col flex-1">
        <div class="flex items-center gap-3 text-xs font-semibold text-slate-500 mb-2">
          <time datetime="${p.date}">${formatDate(p.date)}</time>
          <span aria-hidden="true">·</span>
          <span>${p.readTime} min</span>
        </div>
        <h3 class="text-base font-bold text-slate-900 leading-snug mb-2">
          <a href="/blog/${p.slug}" class="hover:text-brand-700 transition-colors">${escapeHtml(p.title)}</a>
        </h3>
        <p class="text-base text-slate-700 leading-relaxed mb-4 line-clamp-3">${escapeHtml(p.excerpt)}</p>
        <a href="/blog/${p.slug}" class="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800">
          Leer artículo
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="/icons/sprite.svg#icon-arrow-right"/></svg>
        </a>
      </div>
    </article>`;
}

function cardList(p) {
  return `
    <article class="blog-card group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-brand-500 hover:shadow-xl transition-all flex flex-row">
      <a href="/blog/${p.slug}" class="w-28 sm:w-64 shrink-0 relative self-stretch bg-slate-100 overflow-hidden">
        <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.imageAlt)}" width="640" height="360" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
      </a>
      <div class="p-4 sm:p-6 flex flex-col flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-slate-500 mb-2">
          <span class="px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 font-bold uppercase tracking-wider">${escapeHtml(getCategoryLabel(p.category))}</span>
          <time datetime="${p.date}">${formatDate(p.date)}</time>
          <span aria-hidden="true">·</span>
          <span>${p.readTime} min</span>
        </div>
        <h3 class="text-base font-bold text-slate-900 leading-snug mb-2">
          <a href="/blog/${p.slug}" class="hover:text-brand-700 transition-colors">${escapeHtml(p.title)}</a>
        </h3>
        <p class="text-sm sm:text-base text-slate-700 leading-relaxed mb-4 line-clamp-2">${escapeHtml(p.excerpt)}</p>
        <a href="/blog/${p.slug}" class="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800">
          Leer artículo
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="/icons/sprite.svg#icon-arrow-right"/></svg>
        </a>
      </div>
    </article>`;
}

function formatDate(iso) {
  try {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return iso;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function setView(view) {
  state.view = view;
  localStorage.setItem('blog-view', view);
  els.viewGrid?.setAttribute('aria-pressed', String(view === 'grid'));
  els.viewList?.setAttribute('aria-pressed', String(view === 'list'));
  els.viewGrid?.classList.toggle('bg-brand-500', view === 'grid');
  els.viewGrid?.classList.toggle('text-slate-950', view === 'grid');
  els.viewGrid?.classList.toggle('bg-slate-200', view !== 'grid');
  els.viewGrid?.classList.toggle('text-slate-700', view !== 'grid');
  els.viewList?.classList.toggle('bg-brand-500', view === 'list');
  els.viewList?.classList.toggle('text-slate-950', view === 'list');
  els.viewList?.classList.toggle('bg-slate-200', view !== 'list');
  els.viewList?.classList.toggle('text-slate-700', view !== 'list');
  if (els.grid) {
    els.grid.classList.toggle('grid-cols-1', view === 'list');
    els.grid.classList.toggle('sm:grid-cols-2', view === 'grid');
    els.grid.classList.toggle('lg:grid-cols-3', view === 'grid');
  }
  render();
}

function setActiveCat(key) {
  state.cat = key;
  els.cats?.querySelectorAll('[data-cat]').forEach((btn) => {
    const active = btn.dataset.cat === key;
    btn.setAttribute('aria-pressed', String(active));
    btn.classList.toggle('bg-brand-500', active);
    btn.classList.toggle('text-slate-950', active);
    btn.classList.toggle('bg-slate-200', !active);
    btn.classList.toggle('text-slate-700', !active);
  });
}

function renderPagination(totalPages) {
  if (!els.pagination) return;
  if (totalPages <= 1) {
    els.pagination.innerHTML = '';
    els.pagination.classList.add('hidden');
    return;
  }
  els.pagination.classList.remove('hidden');

  if (state.page > totalPages) state.page = totalPages;

  const pageBtn = (n, label = String(n), attrs = '') => `
    <button type="button" ${attrs} data-page="${n}" class="min-w-10 h-10 px-3 rounded-xl font-bold text-sm transition-all ${
      n === state.page
        ? 'bg-brand-500 text-slate-950 shadow-glow'
        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
    }" ${n === state.page ? 'aria-current="page"' : ''}>${label}</button>`;

  const chevronLeft = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  const chevronRight = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  let html = pageBtn(Math.max(1, state.page - 1), chevronLeft, `aria-label="Página anterior" ${state.page === 1 ? 'disabled' : ''}`);
  html += pageBtn(1);
  if (state.page > 3) html += `<span class="px-1 text-slate-400 font-bold" aria-hidden="true">…</span>`;
  for (let n = Math.max(2, state.page - 1); n <= Math.min(totalPages - 1, state.page + 1); n++) {
    html += pageBtn(n);
  }
  if (state.page < totalPages - 2) html += `<span class="px-1 text-slate-400 font-bold" aria-hidden="true">…</span>`;
  if (totalPages > 1) html += pageBtn(totalPages);
  html += pageBtn(Math.min(totalPages, state.page + 1), chevronRight, `aria-label="Página siguiente" ${state.page >= totalPages ? 'disabled' : ''}`);

  els.pagination.innerHTML = html;
  els.pagination.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const n = parseInt(btn.dataset.page, 10);
      if (!Number.isFinite(n) || n === state.page) return;
      state.page = n;
      writeUrl();
      render();
      document.getElementById('blog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function render() {
  const list = filtered();
  const pageSize = perPage();
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  if (state.page > totalPages) state.page = totalPages;

  const start = (state.page - 1) * pageSize;
  const pageItems = list.slice(start, start + pageSize);

  if (els.count) {
    const from = list.length === 0 ? 0 : start + 1;
    const to = Math.min(start + pageSize, list.length);
    els.count.textContent = list.length
      ? `Mostrando ${from}–${to} de ${list.length} artículos`
      : 'Sin resultados';
  }

  if (!els.grid) return;

  if (!pageItems.length) {
    els.grid.innerHTML = '';
    els.grid.classList.add('hidden');
    els.empty?.classList.remove('hidden');
  } else {
    els.empty?.classList.add('hidden');
    els.grid.classList.remove('hidden');
    const fn = state.view === 'list' ? cardList : cardGrid;
    els.grid.innerHTML = pageItems.map(fn).join('');
  }

  renderPagination(totalPages);
  writeUrl();
}

function updateCatsHint() {
  const el = els.cats;
  const hint = els.catsHint;
  if (!el || !hint) return;
  const overflow = el.scrollWidth > el.clientWidth + 4;
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
  hint.classList.toggle('hidden', !overflow || atEnd);
}

function renderCats() {
  if (!els.cats) return;
  const counts = posts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  els.cats.innerHTML = categories
    .map((c) => {
      const n = c.key === 'all' ? posts.length : counts[c.key] || 0;
      const active = state.cat === c.key;
      return `<button type="button" data-cat="${c.key}" aria-pressed="${active}" class="shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
        active ? 'bg-brand-500 text-slate-950' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
      }">${escapeHtml(c.label)} <span class="opacity-60 font-semibold">(${n})</span></button>`;
    })
    .join('');

  els.cats.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.page = 1;
      setActiveCat(btn.dataset.cat);
      render();
    });
  });

  updateCatsHint();
  els.cats.removeEventListener('scroll', updateCatsHint);
  els.cats.addEventListener('scroll', updateCatsHint, { passive: true });
  window.removeEventListener('resize', updateCatsHint);
  window.addEventListener('resize', updateCatsHint);

  if (els.catsHint && !els.catsHint.dataset.bound) {
    els.catsHint.dataset.bound = '1';
    els.catsHint.addEventListener('click', () => {
      els.cats?.scrollBy({ left: 160, behavior: 'smooth' });
    });
  }
}

function initBlog() {
  if (!els.grid) return;

  readUrl();
  renderCats();
  setActiveCat(state.cat);
  setView(state.view);

  let t;
  els.search?.addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = e.target.value;
      state.page = 1;
      render();
    }, 180);
  });

  els.search?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.target.value = '';
      state.q = '';
      state.page = 1;
      render();
    }
  });

  els.viewGrid?.addEventListener('click', () => setView('grid'));
  els.viewList?.addEventListener('click', () => setView('list'));

  document.getElementById('blog-reset')?.addEventListener('click', () => {
    state.q = '';
    state.cat = 'all';
    state.page = 1;
    if (els.search) els.search.value = '';
    setActiveCat('all');
    render();
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('q') && els.search) els.search.value = params.get('q');

  document.querySelector('[data-blog-jsonld]')?.remove();
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.dataset.blogJsonld = 'true';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog de Agencia Web Studio',
    url: `${SITE_URL}/blog`,
    description:
      'Artículos sobre SEO, desarrollo web, e-commerce, diseño UX, apps móviles y marketing digital.',
    blogPost: posts.slice(0, 10).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.date,
      description: p.metaDescription,
    })),
  });
  document.head.appendChild(ld);

  let lastSize = perPage();
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      const next = perPage();
      if (next !== lastSize) {
        lastSize = next;
        const totalPages = Math.max(1, Math.ceil(filtered().length / next));
        if (state.page > totalPages) state.page = totalPages;
        render();
      }
    }, 150);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlog);
} else {
  initBlog();
}
