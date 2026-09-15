interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
}

type Json = Record<string, unknown>;

const json = (data: Json, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function b64url(bytes: Uint8Array) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
}

async function makeToken(email: string, secret: string) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ email, exp: Date.now() + 8 * 60 * 60 * 1000 })));
  return `${payload}.${await sign(payload, secret)}`;
}

async function isAdmin(request: Request, env: Env) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  const [payload, signature] = token.split('.');
  if (!payload || !signature || signature !== await sign(payload, env.SESSION_SECRET)) return false;
  try {
    const normal = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normal + '='.repeat((4 - normal.length % 4) % 4)));
    return decoded.email === env.ADMIN_EMAIL && decoded.exp > Date.now();
  } catch { return false; }
}

async function api(request: Request, env: Env, url: URL) {
  const path = url.pathname;

  if (path === '/api/login' && request.method === 'POST') {
    const body = await request.json<{ email?: string; password?: string }>();
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: 'Admin login is not configured' }, 503);
    if (body.email !== env.ADMIN_EMAIL || body.password !== env.ADMIN_PASSWORD) return json({ error: 'Invalid login' }, 401);
    return json({ token: await makeToken(body.email, env.SESSION_SECRET) });
  }

  if (path === '/api/admin/check') return (await isAdmin(request, env)) ? json({ ok: true }) : json({ error: 'Unauthorised' }, 401);

  if (path === '/api/portfolio_projects' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id,title,category,description,image_url,alt_text,created_at FROM portfolio_projects ORDER BY created_at DESC').all();
    return json({ data: results });
  }

  if (path === '/api/portfolio_projects' && request.method === 'POST') {
    if (!(await isAdmin(request, env))) return json({ error: 'Unauthorised' }, 401);
    const b = await request.json<Record<string, string>>();
    const result = await env.DB.prepare('INSERT INTO portfolio_projects (title,category,description,image_url,alt_text) VALUES (?,?,?,?,?)')
      .bind(b.title || '', b.category || 'Business Signage', b.description || '', b.image_url || '', b.alt_text || '').run();
    return json({ data: { id: result.meta.last_row_id, ...b } }, 201);
  }

  if (path.startsWith('/api/portfolio_projects/') && request.method === 'DELETE') {
    if (!(await isAdmin(request, env))) return json({ error: 'Unauthorised' }, 401);
    const id = Number(decodeURIComponent(path.split('/').pop() || ''));
    if (!Number.isInteger(id)) return json({ error: 'Invalid project ID' }, 400);
    await env.DB.prepare('DELETE FROM portfolio_projects WHERE id = ?').bind(id).run();
    return json({ data: { id } });
  }

  if (path === '/api/quote_enquiries' && request.method === 'POST') {
    const b = await request.json<Record<string, string>>();
    if (!b.name || !b.service || !b.description) return json({ error: 'Missing required fields' }, 400);

    const result = await env.DB.prepare('INSERT INTO quote_enquiries (name,organisation,phone,email,service,description,quantity,timeframe) VALUES (?,?,?,?,?,?,?,?)')
      .bind(b.name, b.organisation || '', b.phone || '', b.email || '', b.service, b.description, b.quantity || '', b.timeframe || '').run();

    try {
      const emailResponse = await fetch('https://formsubmit.co/ajax/Rhett.jokersgroup@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `New Joker's Group enquiry from ${b.name}`,
          _template: 'table',
          _captcha: 'false',
          Name: b.name,
          Organisation: b.organisation || 'Not provided',
          Phone: b.phone || 'Not provided',
          Email: b.email || 'Not provided',
          Service: b.service,
          Description: b.description,
          Quantity: b.quantity || 'Not provided',
          Timeframe: b.timeframe || 'Not provided',
        }),
      });
      if (!emailResponse.ok) console.error('FormSubmit email failed', emailResponse.status);
    } catch (error) {
      console.error('FormSubmit email error', error);
    }

    return json({ data: { id: result.meta.last_row_id } }, 201);
  }

  if (path === '/api/quote_enquiries' && request.method === 'GET') {
    if (!(await isAdmin(request, env))) return json({ error: 'Unauthorised' }, 401);
    const { results } = await env.DB.prepare('SELECT id,name,email,phone,service,description,created_at FROM quote_enquiries ORDER BY created_at DESC').all();
    return json({ data: results });
  }

  return json({ error: 'Not found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return api(request, env, url);
    return env.ASSETS.fetch(request);
  },
};
