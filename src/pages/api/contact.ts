import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const toStr = (v: unknown) => typeof v === 'string' ? v : '';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.RESEND_API_KEY as string;
  const toEmail = import.meta.env.CONTACT_EMAIL as string;

  if (!apiKey || !toEmail) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const name = toStr(body['name']);
  const phone = toStr(body['phone']);
  const lineId = toStr(body['lineId']);
  const email = toStr(body['email']);
  const address = toStr(body['address']);
  const size = toStr(body['size']);
  const type = toStr(body['type']);
  const budget = toStr(body['budget']);
  const time = toStr(body['time']);

  if (!name || !phone) {
    return new Response(JSON.stringify({ error: '姓名與電話為必填' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resend = new Resend(apiKey);

  const html = `
    <h2>帝筑室內設計｜新詢問表單</h2>
    <table cellpadding="8" style="border-collapse:collapse;width:100%;max-width:500px">
      <tr><td style="background:#f5f5f5;font-weight:bold;width:40%">姓名</td><td>${escapeHtml(name)}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold">連絡電話</td><td>${escapeHtml(phone)}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold">Line ID</td><td>${lineId ? escapeHtml(lineId) : '—'}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold">Email</td><td>${email ? escapeHtml(email) : '—'}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold">房屋所在地／建案名稱</td><td>${address ? escapeHtml(address) : '—'}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold">空間坪數</td><td>${size ? escapeHtml(size) : '—'}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold">空間性質</td><td>${type ? escapeHtml(type) : '—'}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold">房屋預算</td><td>${budget ? escapeHtml(budget) : '—'}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold">方便聯繫時間</td><td>${time ? escapeHtml(time) : '—'}</td></tr>
    </table>
  `;

  const { error } = await resend.emails.send({
    // 測試模式用 onboarding@resend.dev，買網域後改成 contact@your-domain.com
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: `【帝筑】新詢問：${name.replace(/[\r\n]/g, ' ')}`,
    html,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
