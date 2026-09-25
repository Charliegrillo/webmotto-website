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

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  try {
    const body = await req.json();
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
    } = body || {};

    // Honeypot: si el campo oculto viene relleno, es un bot → éxito sin enviar
    if (website) return json({ success: true });

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
