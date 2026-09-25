import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { posts } from './src/blog-data.js';
import { renderArticleHtml } from './src/blog-template.js';

const root = path.dirname(fileURLToPath(import.meta.url));

const PAGES = [
  'index.html',
  'nosotros.html',
  'servicios.html',
  'portafolio.html',
  'cotizador.html',
  'faq.html',
  'contacto.html',
  'blog.html',
];

/** URLs legacy → nueva destino (301). */
const REDIRECTS = {
  pantallas: '/portafolio',
  experiencia: '/nosotros',
};

const blogInputs = Object.fromEntries(
  posts.map((p) => [`blog/${p.slug}`, path.resolve(root, `blog/${p.slug}.html`)]),
);

/** Casos de estudio del portafolio (rutas limpias /portafolio/<slug>). */
const CASE_STUDIES = ['portafolio/saas-gestion-operativa', 'portafolio/ecommerce-alto-rendimiento', 'portafolio/landing-page-alta-conversion', 'portafolio/website-corporativo', 'portafolio/app-finanzas-ia'];

const caseInputs = Object.fromEntries(
  CASE_STUDIES.map((slug) => [slug, path.resolve(root, `${slug}.html`)]),
);

function generateBlogArticles() {
  const dir = path.join(root, 'blog');
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set(posts.map((p) => `${p.slug}.html`));
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith('.html') && !keep.has(file)) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
  for (const post of posts) {
    fs.writeFileSync(path.join(dir, `${post.slug}.html`), renderArticleHtml(post), 'utf8');
  }
}

generateBlogArticles();

/**
 * Inyecta partials (header/footer) en cada página HTML.
 * Uso: <!-- @include partials/header.html -->
 */
function htmlPartials() {
  const includeRe = /<!--\s*@include\s+([^\s]+?)\s*-->/g;

  function inject(html, depth = 0) {
    if (depth > 5) return html;
    const next = html.replace(includeRe, (_, file) => {
      const full = path.resolve(root, file);
      if (!full.startsWith(root)) return '';
      try {
        return fs.readFileSync(full, 'utf8');
      } catch {
        return `<!-- missing partial: ${file} -->`;
      }
    });
    if (next === html) return next;
    return inject(next, depth + 1);
  }

  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return inject(html);
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.includes(`${path.sep}partials${path.sep}`)) {
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

/**
 * URLs limpias: /portafolio sirve portafolio.html (dev + preview),
 * redirige /portafolio.html → /portafolio con 301 y rutas legacy (REDIRECTS).
 */
function cleanUrls() {
  const known = new Set([
    ...PAGES.map((p) => (p === 'index.html' ? '' : p.replace(/\.html$/, ''))),
    ...posts.map((p) => `blog/${p.slug}`),
    ...CASE_STUDIES,
  ]);

  function redirect(res, dest, search) {
    res.statusCode = 301;
    res.setHeader('Location', dest + search);
    res.end();
    return true;
  }

  function handle(req, res, next) {
    const raw = req.url || '/';
    const qi = raw.indexOf('?');
    const pathname = qi === -1 ? raw : raw.slice(0, qi);
    const search = qi === -1 ? '' : raw.slice(qi);

    const hasExt = /\.[a-zA-Z0-9]+$/.test(pathname);

    if (pathname.endsWith('.html')) {
      const slug = pathname === '/index.html' ? '' : pathname.replace(/^\//, '').replace(/\.html$/, '');
      if (REDIRECTS[slug]) return redirect(res, REDIRECTS[slug], search);
      if (known.has(slug)) {
        const dest = (slug ? `/${slug}` : '/') + search;
        res.statusCode = 301;
        res.setHeader('Location', dest);
        res.end();
        return;
      }
      return next();
    }

    if (pathname !== '/' && pathname.endsWith('/')) {
      const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
      if (REDIRECTS[slug]) return redirect(res, REDIRECTS[slug], search);
      if (known.has(slug)) {
        res.statusCode = 301;
        res.setHeader('Location', `/${slug}${search}`);
        res.end();
        return;
      }
      return next();
    }

    if (hasExt) return next();

    const slug = pathname === '/' ? '' : pathname.replace(/^\//, '');
    if (REDIRECTS[slug]) return redirect(res, REDIRECTS[slug], search);
    if (known.has(slug)) {
      req.url = `/${slug}.html${search}`;
    }
    next();
  }

  return {
    name: 'clean-urls',
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [htmlPartials(), cleanUrls(), tailwindcss()],
  server: {
    allowedHosts: ['crown-bush-pig-possible.trycloudflare.com'],
  },
  preview: {
    allowedHosts: ['crown-bush-pig-possible.trycloudflare.com'],
  },
  build: {
    target: 'es2020',
    cssMinify: 'lightningcss',
    rollupOptions: {
      input: {
        ...Object.fromEntries(PAGES.map((p) => [p.replace('.html', ''), path.resolve(root, p)])),
        ...blogInputs,
        ...caseInputs,
      },
    },
  },
});
