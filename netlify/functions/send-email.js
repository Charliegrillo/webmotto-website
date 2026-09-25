// netlify/functions/send-email.js
import { Resend } from 'resend';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* ---- Anti-spam: límite de tasa por IP (en memoria, mejor esfuerzo) ---- */
const RATE_LIMIT = { max: 3, windowMs: 10 * 60 * 1000 };
const hits = new Map();

const getClientIp = (req) => {
  const netlify = req.headers.get('x-nf-client-connection-ip');
  if (netlify) return netlify;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
};

const isRateLimited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 2000) {
    for (const [key, list] of hits) {
      if (!list.some((t) => now - t < RATE_LIMIT.windowMs)) hits.delete(key);
    }
  }
  return false;
};

/* ---- Límites de longitud ---- */
const LIMITS = {
  name: 150,
  email: 254,
  message: 5000,
  phone: 60,
  project_type: 120,
  source: 120,
  total: 60,
  extras: 500,
};

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return json({ error: 'Demasiados envíos. Espera unos minutos y vuelve a intentarlo.' }, 429);
    }

    let body;
    try {
      body = await req.json();
    } catch (err) {
      return json({ error: 'Solicitud no válida.' }, 400);
    }

    const {
      name = '',
      email = '',
      message = '',
      phone = '',
      project_type = '',
      source = '',
      total = '',
      extras = '',
      website = '',
      t = '',
      'cf-turnstile-response': turnstileToken = '',
    } = body || {};

    // Honeypot: si el campo oculto viene relleno, es un bot → éxito sin enviar
    if (website) return json({ success: true });

    // Timestamp de carga del formulario: exige al menos 3 s y máximo 24 h de antigüedad
    const stamp = Number(t);
    if (!Number.isFinite(stamp) || !stamp) {
      return json({ error: 'Formulario caducado. Recarga la página e inténtalo de nuevo.' }, 400);
    }
    const age = Date.now() - stamp;
    if (age < 3000) {
      return json({ error: 'Envío demasiado rápido. Espera unos segundos e inténtalo de nuevo.' }, 400);
    }
    if (age > 24 * 60 * 60 * 1000) {
      return json({ error: 'Formulario caducado. Recarga la página e inténtalo de nuevo.' }, 400);
    }

    // Cloudflare Turnstile: verifica el token con la secret key del entorno
    if (!turnstileToken) {
      return json({ error: 'Verificación de seguridad no completada. Recarga la página.' }, 400);
    }
    if (!process.env.TURNSTILE_SECRET_KEY) {
      return json({ error: 'Configuración de seguridad pendiente (TURNSTILE_SECRET_KEY).' }, 500);
    }
    let turnstileOk = false;
    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: ip,
        }),
      });
      const verify = await verifyRes.json();
      turnstileOk = Boolean(verify && verify.success);
    } catch (err) {
      turnstileOk = false;
    }
    if (!turnstileOk) {
      return json({ error: 'La verificación de seguridad ha fallado. Inténtalo de nuevo.' }, 403);
    }

    const fields = { name, email, message, phone, project_type, source, total, extras };
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string' && value.length > LIMITS[key]) {
        return json({ error: `El campo "${key}" exige el máximo de ${LIMITS[key]} caracteres.` }, 400);
      }
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      return json({ error: 'Faltan campos obligatorios (nombre, correo y mensaje).' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return json({ error: 'El correo electrónico no es válido.' }, 400);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const rows = [
      ['Nombre', name],
      ['Correo', email],
      ['Teléfono / WhatsApp', phone],
      ['Tipo de proyecto', project_type],
      ['Origen', source],
      ['Inversión estimada', total],
      ['Extras solicitados', extras],
    ]
      .filter(([, value]) => String(value).trim())
      .map(
        ([key, value]) =>
          `<tr><td style="border:1px solid #e2e8f0;background:#f8fafc;padding:8px 12px"><strong>${escapeHtml(key)}</strong></td><td style="border:1px solid #e2e8f0;padding:8px 12px">${escapeHtml(value)}</td></tr>`
      )
      .join('');

    const html = `
      <h2 style="font-family:sans-serif;margin:0 0 12px">Nuevo mensaje desde la web</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;color:#0f172a">${rows}</table>
      <p style="font-family:sans-serif;font-size:14px;margin:16px 0 4px"><strong>Mensaje:</strong></p>
      <p style="font-family:sans-serif;font-size:14px;margin:0;white-space:pre-line">${escapeHtml(message)}</p>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Webmotto Contacto <contacto@webmotto.com>',
      to: ['info@webmotto.com'],
      subject: `Nuevo mensaje de contacto de: ${name}`,
      replyTo: email,
      html,
    });

    if (error) {
      return json({ error: error.message || 'No se pudo enviar el correo.' }, 502);
    }

    return json({ success: true, data });
  } catch (err) {
    return json({ error: 'Error interno del servidor.' }, 500);
  }
};
