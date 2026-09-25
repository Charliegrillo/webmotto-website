/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initNavActive();
  initMobileMenu();
  initScrollReveal();
  initScrollHint();
  initDeviceTabs();
  initPortfolioFilters();
  initFaq();
  initCalculator();
  initContactForms();
  initProjectTypeDropdown();
  initChat();
});

/* Resalta el enlace del menú de la página actual (y al hacer click) */
function initNavActive() {
  let path = window.location.pathname;
  if (path.endsWith('/index.html')) path = path.slice(0, -'index.html'.length);
  if (path.endsWith('.html')) path = path.slice(0, -'.html'.length);
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (!path) path = '/';

  const section = path.startsWith('/blog') ? '/blog' : path.startsWith('/portafolio') ? '/portafolio' : path;
  const links = [...document.querySelectorAll('[data-nav]')];

  const setActive = (match) => {
    links.forEach((link) => {
      const on = match(link);
      link.classList.toggle('nav-active', on);
      if (on) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  setActive((link) => link.getAttribute('data-nav') === section);
  links.forEach((link) => {
    link.addEventListener('click', () => setActive((l) => l === link));
  });
}

/* Menú móvil: drawer a pantalla completa; el header queda encima (z-40 > z-30) */
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  const header = document.getElementById('main-header');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');
  if (!btn || !menu) return;

  const isOpen = () => menu.classList.contains('is-open');

  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    btn.setAttribute('aria-expanded', String(open));
    iconOpen?.classList.toggle('hidden', open);
    iconClose?.classList.toggle('hidden', !open);
    document.body.classList.toggle('overflow-hidden', open);
    document.documentElement.classList.toggle('overflow-hidden', open);
    header?.classList.toggle('nav-open', open);
    document.getElementById('chat-toggle')?.classList.toggle('hidden', open);
    const chatPanel = document.getElementById('chat-panel');
    if (open && chatPanel && !chatPanel.classList.contains('hidden')) {
      chatPanel.classList.add('hidden');
      chatPanel.setAttribute('aria-hidden', 'true');
      document.getElementById('chat-toggle')?.setAttribute('aria-expanded', 'false');
      document.getElementById('chat-icon-open')?.classList.remove('hidden');
      document.getElementById('chat-icon-close')?.classList.add('hidden');
    }
  };

  btn.addEventListener('click', () => {
    setOpen(!isOpen());
  });

  document.querySelectorAll('.mobile-link').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false);
  });
}

/* Scroll reveal: solo oculta lo que queda fuera del primer viewport
   para no “brincar” al aterrizar en una página nueva. */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal-on-scroll');
  if (!els.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          entry.target.classList.remove('reveal-hide');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  const vh = window.innerHeight || document.documentElement.clientHeight;
  els.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh * 0.92 && rect.bottom > 0) {
      el.classList.add('is-visible');
    } else {
      el.classList.add('reveal-hide');
      observer.observe(el);
    }
  });
}

/* Botón animado "scroll down" al pie del hero; se oculta al hacer scroll */
function initScrollHint() {
  const hero = document.querySelector('main > section:first-of-type');
  if (!hero) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className =
    'scroll-hint absolute -bottom-5 left-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full border border-brand-500/70 bg-slate-900 text-brand-400 flex items-center justify-center shadow-lg hover:bg-brand-500 hover:text-slate-950 hover:border-brand-500 transition-all duration-300';
  btn.setAttribute('aria-label', 'Desplazarse hacia abajo');
  btn.innerHTML =
    '<svg class="block w-5 h-5 scroll-hint-arrow" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="/icons/sprite.svg#icon-chevron-down"/></svg>';
  hero.appendChild(btn);

  const next = hero.nextElementSibling;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  btn.addEventListener('click', () => {
    next?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  });

  const update = () => {
    const hide = window.scrollY > 48;
    btn.classList.toggle('opacity-0', hide);
    btn.classList.toggle('pointer-events-none', hide);
    btn.classList.toggle('translate-y-2', hide);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* Tabs de pantallas dispositivos */
function initDeviceTabs() {
  const tabs = document.querySelectorAll('.device-tab');
  const panels = document.querySelectorAll('.device-panel');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = `panel-${tab.dataset.target}`;
      tabs.forEach((t) => {
        t.classList.remove('active', 'bg-brand-500', 'text-slate-950', 'shadow-glow');
        t.classList.add('bg-slate-800', 'text-slate-300');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active', 'bg-brand-500', 'text-slate-950', 'shadow-glow');
      tab.classList.remove('bg-slate-200', 'text-slate-700', 'bg-slate-800', 'text-slate-300');
      tab.setAttribute('aria-selected', 'true');

      panels.forEach((panel) => {
        const match = panel.id === targetId;
        panel.classList.toggle('hidden', !match);
        panel.classList.toggle('grid', match);
        panel.hidden = !match;
      });
    });
  });
}

/* Filtros de portafolio */
function initPortfolioFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.portfolio-item');
  if (!btns.length) return;

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => {
        b.classList.remove('bg-brand-500', 'text-slate-950', 'active');
        b.classList.add('bg-slate-200', 'text-slate-700');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.remove('bg-slate-200', 'text-slate-700', 'bg-slate-800', 'text-slate-300');
      btn.classList.add('bg-brand-500', 'text-slate-950', 'active');
      btn.setAttribute('aria-pressed', 'true');

      const filter = btn.dataset.filter;
      items.forEach((item) => {
        const show = filter === 'all' || item.classList.contains(filter);
        item.style.display = show ? 'block' : 'none';
      });
    });
  });
}

/* FAQ acordeón accesible */
function initFaq() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const btn = item.querySelector('.faq-toggle');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      answer.classList.toggle('hidden', expanded);
      answer.hidden = expanded;
      if (icon) icon.style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  });
}

/* Cotizador interactivo */
function initCalculator() {
  const form = document.getElementById('calculator-form');
  const radios = document.querySelectorAll('input[name="project_type"]');
  const extras = document.querySelectorAll('.calc-extra');
  const output = document.getElementById('estimated-price');
  if (!radios.length || !output) return;

  form?.addEventListener('submit', (e) => e.preventDefault());

  const update = () => {
    let total = 0;
    radios.forEach((r) => {
      if (r.checked) total += parseInt(r.value, 10) || 0;
    });
    extras.forEach((e) => {
      if (e.checked) total += parseInt(e.value, 10) || 0;
    });
    output.textContent = `$${total.toLocaleString('en-US')} USD`;
    syncQuoteFields(total);
  };

  window.addEventListener('calc:sync', update);

  const typeIndex = { landing: 0, website: 1, ecommerce: 2, mobile: 3, saas: 4 };

  const applySelection = () => {
    const type = new URLSearchParams(window.location.search).get('type');
    const idx = typeIndex[type];
    if (idx !== undefined && radios[idx]) {
      radios.forEach((r, i) => { r.checked = i === idx; });
      update();
    } else if (![...radios].some((r) => r.checked) && radios[0]) {
      radios[0].checked = true;
      update();
    }
  };

  applySelection();
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) applySelection();
  });

  radios.forEach((r) => r.addEventListener('change', update));
  extras.forEach((e) => e.addEventListener('change', update));
  update();
}

/* Sincroniza los campos ocultos del formulario de envío de cotización */
function syncQuoteFields(total) {
  const typeEl = document.getElementById('q-type');
  const extrasEl = document.getElementById('q-extras');
  const totalEl = document.getElementById('q-total');
  const summaryEl = document.getElementById('q-summary');
  if (!typeEl || !extrasEl || !totalEl || !summaryEl) return;

  const checked = document.querySelector('input[name="project_type"]:checked');
  const typeName =
    checked?.closest('label')?.querySelector('span.font-bold')?.textContent.trim() || 'Landing Page';
  const extras = [...document.querySelectorAll('.calc-extra:checked')]
    .map((e) => (e.closest('label')?.textContent || '').replace(/\s*\(\+\$\d+\)/g, '').trim())
    .filter(Boolean);
  const totalText = `$${Number(total).toLocaleString('en-US')} USD`;

  typeEl.value = typeName;
  extrasEl.value = extras.join(', ');
  totalEl.value = totalText;
  summaryEl.value =
    `Cotización solicitada desde el cotizador web.\n` +
    `Proyecto: ${typeName}.\n` +
    `Extras: ${extras.length ? extras.join(', ') : 'ninguno'}.\n` +
    `Inversión estimada: ${totalText}.`;
}

/* Envío real de formularios vía Netlify Function (/.netlify/functions/send-email) */
function initContactForms() {
  document.querySelectorAll('.contact-form').forEach((form) => {
    const endpoint = form.dataset.endpoint || '/.netlify/functions/send-email';
    const okMsg = form.querySelector('.form-message-ok');
    const errMsg = form.querySelector('.form-message-error');
    const btn = form.querySelector('button[type="submit"]');
    const btnLabel = btn?.querySelector('span')?.textContent || '';
    let hideTimer;

    const hideMessages = () => {
      okMsg?.classList.add('hidden');
      errMsg?.classList.add('hidden');
    };
    const setText = (box, text) => {
      const el = box?.querySelector('[data-form-msg-text]');
      if (el && text) el.textContent = text;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (btn?.disabled) return;
      hideMessages();

      const data = Object.fromEntries(new FormData(form).entries());
      if (data.summary) {
        const extra = String(data.message || '').trim();
        data.message = extra ? `${data.summary}\n\n${extra}` : data.summary;
        delete data.summary;
      }

      const valid = String(data.name || '').trim() && String(data.email || '').trim() && String(data.message || '').trim();
      if (!valid) {
        setText(errMsg, 'Completa nombre, correo y mensaje para continuar.');
        errMsg?.classList.remove('hidden');
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-wait');
        const label = btn.querySelector('span');
        if (label) label.textContent = 'Enviando…';
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json().catch(() => ({}));

        if (res.ok && result.success !== false) {
          setText(okMsg, form.dataset.success);
          okMsg?.classList.remove('hidden');
          form.reset();
          syncProjectDropdown(form);
          window.dispatchEvent(new Event('calc:sync'));
        } else {
          setText(errMsg, typeof result.error === 'string' ? result.error : undefined);
          errMsg?.classList.remove('hidden');
        }
      } catch (err) {
        setText(errMsg, 'Hubo un error de conexión. Inténtalo de nuevo.');
        errMsg?.classList.remove('hidden');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('opacity-70', 'cursor-wait');
          const label = btn.querySelector('span');
          if (label && btnLabel) label.textContent = btnLabel;
        }
      }

      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideMessages, 8000);
    });
  });
}

/* Restaura el dropdown "Tipo de Proyecto" tras resetear el formulario */
function syncProjectDropdown(form) {
  const root = form.querySelector('[data-project-dropdown]');
  if (!root) return;
  const hidden = root.querySelector('input[type="hidden"][name="project_type"]');
  const valueEl = root.querySelector('.cf-type-value');
  const value = root.dataset.typeDefault || hidden?.value || 'Landing Page';
  if (hidden) hidden.value = value;
  if (valueEl) valueEl.textContent = value;
  root.querySelectorAll('.cf-type-option').forEach((opt) => {
    const active = opt.dataset.value === value;
    opt.setAttribute('aria-selected', String(active));
    opt.querySelector('.cf-type-check')?.classList.toggle('hidden', !active);
  });
}

/* Dropdown "Tipo de Proyecto": sheet inferior en móvil, menú en desktop */
function initProjectTypeDropdown() {
  document.querySelectorAll('[data-project-dropdown]').forEach((root) => {
    const btn = root.querySelector('.cf-type-btn');
    const list = root.querySelector('.cf-type-list');
    const backdrop = root.querySelector('[data-type-backdrop]');
    const valueEl = root.querySelector('.cf-type-value');
    const hidden = root.querySelector('input[type="hidden"][name="project_type"]');
    const chevron = root.querySelector('.cf-type-chevron');
    const options = [...root.querySelectorAll('.cf-type-option')];
    const closeBtn = root.querySelector('.cf-type-close');
    if (!btn || !list) return;
    if (hidden && !root.dataset.typeDefault) root.dataset.typeDefault = hidden.value;

    const setOpen = (open) => {
      if (open && window.innerWidth < 640) {
        document.body.append(backdrop, list);
      } else if (open) {
        root.append(backdrop, list);
      }
      list.classList.toggle('hidden', !open);
      backdrop?.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
      chevron?.classList.toggle('rotate-180', open);
document.body.classList.toggle('overflow-hidden', open && window.innerWidth < 640);
      const chatToggle = document.getElementById('chat-toggle');
      const chatPanel = document.getElementById('chat-panel');
      if (open) {
        chatToggle?.classList.add('pointer-events-none');
        chatPanel?.classList.add('hidden');
        chatPanel?.setAttribute('aria-hidden', 'true');
        chatToggle?.setAttribute('aria-expanded', 'false');
      } else {
        chatToggle?.classList.remove('pointer-events-none');
      }
    };

    const select = (opt, { focus = true } = {}) => {
      const value = opt.dataset.value || '';
      options.forEach((o) => {
        const active = o === opt;
        o.setAttribute('aria-selected', String(active));
        o.querySelector('.cf-type-check')?.classList.toggle('hidden', !active);
      });
      if (valueEl) valueEl.textContent = value;
      if (hidden) hidden.value = value;
      setOpen(false);
      if (focus) btn.focus();
    };

    const preselectFromUrl = () => {
      const type = new URLSearchParams(window.location.search).get('type');
      if (type === 'software') {
        const opt = options.find((o) => o.dataset.value === 'Software Personalizado');
        if (opt) select(opt, { focus: false });
        const nameInput = document.getElementById('cf-name');
        if (nameInput) {
          nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => nameInput.focus({ preventScroll: true }), 400);
        }
      }
    };

    preselectFromUrl();
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        const type = new URLSearchParams(window.location.search).get('type');
        if (type === 'software') {
          const opt = options.find((o) => o.dataset.value === 'Software Personalizado');
          if (opt) select(opt, { focus: false });
        }
      }
    });

    btn.addEventListener('click', () => setOpen(list.classList.contains('hidden')));
    backdrop?.addEventListener('click', () => setOpen(false));
    closeBtn?.addEventListener('click', () => setOpen(false));
    options.forEach((opt) => opt.addEventListener('click', () => select(opt)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !list.classList.contains('hidden')) setOpen(false);
    });
    document.addEventListener('click', (e) => {
      if (list.classList.contains('hidden')) return;
      if (root.contains(e.target) || list.contains(e.target) || backdrop?.contains(e.target)) return;
      setOpen(false);
    });
  });
}

/* Chat flotante: abre/cierra panel, mensajes de demo y CTA WhatsApp */
function initChat() {
  const toggle = document.getElementById('chat-toggle');
  const panel = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('chat-close');
  const iconOpen = document.getElementById('chat-icon-open');
  const iconClose = document.getElementById('chat-icon-close');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  const waLink = document.getElementById('chat-whatsapp');
  if (!toggle || !panel) return;

  const WA_NUMBER = '584243235521';
  let lastUserMsg = '';

  const setOpen = (open) => {
    panel.classList.toggle('hidden', !open);
    panel.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    iconOpen?.classList.toggle('hidden', open);
    iconClose?.classList.toggle('hidden', !open);
  };

  const updateWa = () => {
    if (!waLink) return;
    const text = lastUserMsg.trim()
      || 'Hola, quisiera información sobre sus servicios';
    waLink.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const appendMsg = (text, who) => {
    if (!messages) return;
    const el = document.createElement('div');
    if (who === 'user') {
      el.className =
        'max-w-[85%] ml-auto bg-brand-500 text-slate-950 rounded-2xl rounded-tr-md px-3.5 py-2.5 text-sm font-semibold shadow-sm';
    } else {
      el.className =
        'max-w-[85%] bg-white border border-slate-200 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm text-slate-700 shadow-sm';
    }
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  };

  const botReply = (userText) => {
    const t = userText.toLowerCase();
    let reply =
      'Gracias por escribir. Un asesor te contactará pronto. También puedes continuar por WhatsApp para respuesta inmediata.';
    if (t.includes('cota') || t.includes('precio') || t.includes('presupuesto')) {
      reply =
        '¡Perfecto! Para cotizar puedes usar el Cotizador de la web o enviarnos los detalles por WhatsApp y te armamos una propuesta.';
    } else if (t.includes('servicio') || t.includes('qué hacen') || t.includes('que hacen')) {
      reply =
        'Trabajamos Landing Pages, websites, e-commerce, apps móviles y SaaS a medida. ¿Cuál te interesa?';
    } else if (t.includes('hola') || t.includes('buen')) {
      reply = '¡Hola! ¿En qué proyecto estás pensando?';
    }
    setTimeout(() => appendMsg(reply, 'bot'), 450);
  };

  const send = (text) => {
    const value = (text || '').trim();
    if (!value) return;
    lastUserMsg = value;
    appendMsg(value, 'user');
    updateWa();
    botReply(value);
  };

  toggle.addEventListener('click', () => {
    setOpen(panel.classList.contains('hidden'));
  });
  closeBtn?.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) setOpen(false);
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    send(input?.value);
    if (input) input.value = '';
  });

  document.querySelectorAll('.chat-quick').forEach((btn) => {
    btn.addEventListener('click', () => send(btn.dataset.msg));
  });

  updateWa();
}

