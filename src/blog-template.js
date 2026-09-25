import { posts, categories, SITE_URL, getCategoryLabel } from './blog-data.js';

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderContent(blocks) {
  return blocks
    .map((block) => {
      if (block.type === 'h2') {
        return `              <h2 class="text-2xl font-extrabold text-slate-900 mt-10 mb-4 tracking-tight">${esc(block.text)}</h2>`;
      }
      if (block.type === 'h3') {
        return `              <h3 class="text-xl font-bold text-slate-900 mt-8 mb-3">${esc(block.text)}</h3>`;
      }
      if (block.type === 'ul') {
        const items = block.items
          .map(
            (item) =>
              `                <li class="flex gap-3 text-lg text-slate-700 leading-relaxed"><svg class="w-5 h-5 text-brand-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="/icons/sprite.svg#icon-check"/></svg><span>${esc(item)}</span></li>`,
          )
          .join('\n');
        return `              <ul class="space-y-3 my-5">\n${items}\n              </ul>`;
      }
      return `              <p class="text-slate-700 leading-relaxed text-lg mb-5">${esc(block.text)}</p>`;
    })
    .join('\n');
}

function relatedPosts(post, limit = 3) {
  const sameCat = posts.filter((p) => p.category === post.category && p.slug !== post.slug);
  const others = posts.filter((p) => p.category !== post.category && p.slug !== post.slug);
  return [...sameCat, ...others].slice(0, limit);
}

export function renderArticleHtml(post) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const pub = post.date;
  const mod = post.date;
  const related = relatedPosts(post);
  const catLabel = getCategoryLabel(post.category);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.title,
    description: post.metaDescription,
    image: [post.image],
    datePublished: pub,
    dateModified: mod,
    author: { '@type': 'Person', name: post.author, jobTitle: post.authorRole },
    publisher: {
      '@type': 'Organization',
      name: 'Agencia Web Studio',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` },
    },
    keywords: post.tags.join(', '),
    articleSection: catLabel,
    wordCount: post.content.reduce((n, b) => {
      if (b.type === 'ul') return n + b.items.join(' ').split(/\s+/).length;
      return n + String(b.text || '').split(/\s+/).length;
    }, 0),
    inLanguage: 'es',
  };

  const relatedHtml = related
    .map(
      (r) => `
              <a href="/blog/${r.slug}" class="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-brand-500 hover:shadow-xl transition-all">
                <div class="aspect-video bg-slate-100 overflow-hidden">
                  <img src="${esc(r.image)}" alt="${esc(r.imageAlt)}" width="640" height="360" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                </div>
                <div class="p-5">
                  <p class="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">${esc(getCategoryLabel(r.category))}</p>
                  <h3 class="text-base font-bold text-slate-900 leading-snug group-hover:text-brand-700 transition-colors">${esc(r.title)}</h3>
                </div>
              </a>`,
    )
    .join('\n');

  const tagsHtml = post.tags
    .map(
      (t) =>
        `<span class="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">${esc(t)}</span>`,
    )
    .join(' ');

  return `<!DOCTYPE html>
<html lang="es" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(post.title)} | Agencia Web Studio</title>
    <meta name="description" content="${esc(post.metaDescription)}">
    <link rel="canonical" href="${url}">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#f59e0b">
    <meta name="author" content="${esc(post.author)}">
    <meta name="keywords" content="${esc(post.tags.join(', '))}">

    <meta property="og:title" content="${esc(post.title)}">
    <meta property="og:description" content="${esc(post.metaDescription)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${esc(post.image)}">
    <meta property="og:locale" content="es_ES">
    <meta property="article:published_time" content="${pub}">
    <meta property="article:author" content="${esc(post.author)}">
    <meta property="article:section" content="${esc(catLabel)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(post.title)}">
    <meta name="twitter:description" content="${esc(post.metaDescription)}">
    <meta name="twitter:image" content="${esc(post.image)}">

    <link rel="icon" href="/favicon.svg" type="image/svg+xml">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://images.unsplash.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap">

    <script type="application/ld+json">${JSON.stringify(articleLd)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
    <link rel="stylesheet" href="/src/style.css">
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased selection:bg-brand-500 selection:text-slate-950 overflow-x-hidden">

    <!-- @include partials/header.html -->

    <main id="contenido">
        <article class="pt-24 pb-8 lg:pt-36 lg:pb-16" itemscope itemtype="https://schema.org/BlogPosting">
            <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                <nav aria-label="Migas de pan" class="mb-8 text-sm font-semibold text-slate-500">
                    <ol class="flex flex-wrap items-center gap-2">
                        <li><a href="/" class="hover:text-brand-600">Inicio</a></li>
                        <li aria-hidden="true">/</li>
                        <li><a href="/blog" class="hover:text-brand-600">Blog</a></li>
                        <li aria-hidden="true">/</li>
                        <li class="text-slate-800 line-clamp-1 max-w-[14rem]">${esc(catLabel)}</li>
                    </ol>
                </nav>

                <header class="mb-8">
                    <div class="flex flex-wrap items-center gap-3 mb-4">
                        <a href="/blog?cat=${encodeURIComponent(post.category)}" class="px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider hover:bg-brand-200 transition-colors">${esc(catLabel)}</a>
                        <time datetime="${pub}" class="text-sm text-slate-500 font-semibold" itemprop="datePublished">${formatDate(pub)}</time>
                        <span class="text-sm text-slate-500 font-semibold">${post.readTime} min de lectura</span>
                    </div>
                    <h1 class="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-slate-900 leading-tight tracking-tight" itemprop="headline">${esc(post.title)}</h1>
                    <p class="mt-4 text-lg text-slate-600 leading-relaxed" itemprop="description">${esc(post.excerpt)}</p>
                    <div class="mt-6 flex items-center gap-3">
                        <span class="w-10 h-10 rounded-full bg-brand-500 text-slate-950 font-black flex items-center justify-center text-sm" aria-hidden="true">${initials(post.author)}</span>
                        <div>
                            <p class="text-sm font-bold text-slate-900" itemprop="author">${esc(post.author)}</p>
                            <p class="text-xs text-slate-500">${esc(post.authorRole)}</p>
                        </div>
                    </div>
                </header>

                <figure class="mb-10 rounded-3xl overflow-hidden border border-slate-200 shadow-card-soft">
                    <img src="${esc(post.image)}" alt="${esc(post.imageAlt)}" width="1200" height="630" itemprop="image" decoding="async" class="w-full aspect-[16/9] object-cover">
                </figure>

                <div class="prose-blog" itemprop="articleBody">
${renderContent(post.content)}
                </div>

                <div class="mt-10 pt-8 border-t border-slate-200">
                    <p class="text-sm font-bold text-slate-900 mb-3">Etiquetas</p>
                    <div class="flex flex-wrap gap-2">${tagsHtml}</div>
                </div>

                <div class="mt-10 p-6 sm:p-8 rounded-3xl bg-slate-950 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div>
                        <p class="font-bold text-base">¿Quieres resultados como los de este artículo?</p>
                        <p class="text-slate-400 text-sm mt-1">Cuéntanos tu proyecto y recibe una propuesta en menos de 24 h.</p>
                    </div>
                    <a href="/cotizador" class="shrink-0 px-6 py-3 rounded-xl bg-brand-500 text-slate-950 font-extrabold text-sm hover:bg-brand-600 transition-colors">Cotizar gratis</a>
                </div>

                <section class="mt-14" aria-labelledby="related-title">
                    <h2 id="related-title" class="text-2xl font-black text-slate-900 mb-6">Artículos relacionados</h2>
                    <div class="grid sm:grid-cols-3 gap-5">
${relatedHtml}
                    </div>
                </section>

                <nav class="mt-12 flex items-stretch justify-between gap-3 sm:gap-4 text-sm font-bold" aria-label="Navegación entre artículos">
                    ${prevNextLink(post, -1)}
                    <a href="/blog" aria-label="Ver todo el blog" class="shrink-0 px-3 sm:px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:border-brand-500 hover:text-brand-700 transition-colors flex items-center justify-center">
                        <svg class="w-5 h-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                        <span class="hidden sm:inline whitespace-nowrap">Ver todo el blog</span>
                    </a>
                    ${prevNextLink(post, 1)}
                </nav>
            </div>
        </article>
    </main>

    <!-- @include partials/footer.html -->

    <script type="module" src="/src/main.js"></script>
</body>
</html>
`;
}

function formatDate(iso) {
  try {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return iso;
  }
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function prevNextLink(post, dir) {
  const idx = posts.findIndex((p) => p.slug === post.slug);
  const other = posts[idx + dir];
  if (!other) return '<span class="shrink-0" aria-hidden="true"></span>';
  const cls =
    dir < 0
      ? 'shrink-0 px-3 sm:px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:border-brand-500 hover:text-brand-700 transition-colors flex items-center justify-center'
      : 'shrink-0 px-3 sm:px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:border-brand-500 hover:text-brand-700 transition-colors flex items-center justify-center sm:justify-end';
  const icon = dir < 0
    ? '<svg class="w-5 h-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'
    : '<svg class="w-5 h-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const label = dir < 0 ? '← Anterior' : 'Siguiente →';
  const aria = dir < 0 ? `Artículo anterior: ${other.title}` : `Artículo siguiente: ${other.title}`;
  return `<a href="/blog/${other.slug}" class="${cls}" aria-label="${esc(aria)}">${icon}<span class="hidden sm:block min-w-0"><span class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1 whitespace-nowrap">${label}</span><span class="line-clamp-2 max-w-[10rem] sm:max-w-[12rem]">${esc(other.title)}</span></span></a>`;
}

export { categories, posts };
