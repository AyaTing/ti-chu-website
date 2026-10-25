import type { APIRoute } from 'astro';

export const prerender = false;

const R2_PUBLIC_URL = import.meta.env.R2_PUBLIC_URL as string;

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin');
  const host = request.headers.get('Host');
  if (!origin || !host) return null;
  try {
    const originUrl = new URL(origin);
    if (originUrl.host === host) return origin;
    // Allow cross-port localhost so TinaCMS dev server (localhost:4001) can reach Astro (localhost:4321)
    if (originUrl.hostname === 'localhost' && host.startsWith('localhost:')) return origin;
    return null;
  } catch {
    return null;
  }
}

// SVG is deliberately excluded: it can carry scripts.
function detectImageType(b: Uint8Array): { mime: string; ext: string } | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...b.slice(start, end));
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (ascii(0, 8) === '\x89PNG\r\n\x1a\n') return { mime: 'image/png', ext: 'png' };
  if (ascii(0, 4) === 'GIF8') return { mime: 'image/gif', ext: 'gif' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) {
    return { mime: 'image/avif', ext: 'avif' };
  }
  return null;
}

// Returns null if any path segment is outside [A-Za-z0-9_-], which also rules out "..".
function sanitizeDirectory(directory: string): string | null {
  const dir = directory.replace(/^\/+|\/+$/g, '');
  if (!dir) return '';
  return dir.split('/').every((seg) => /^[A-Za-z0-9_-]+$/.test(seg)) ? dir : null;
}

function sanitizeStem(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const stem = base.replace(/\.[^.]*$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '');
  return stem.slice(0, 60) || 'image';
}

// Verify the caller's Tina Cloud session: the token must be accepted by Tina's
// identity API for this project's client ID. Local `tinacms dev` uses a dummy
// token, so verification is skipped in dev only.
async function isAuthenticated(request: Request): Promise<boolean> {
  if (import.meta.env.DEV) return true;

  const clientId = import.meta.env.NEXT_PUBLIC_TINA_CLIENT_ID as string | undefined;
  const authorization = request.headers.get('Authorization');
  if (!clientId || !authorization?.startsWith('Bearer ')) return false;

  try {
    const res = await fetch(`https://identity.tinajs.io/v2/apps/${clientId}/currentUser`, {
      headers: { Authorization: authorization },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const ALL: APIRoute = async ({ request, locals }) => {
  const bucket = locals.runtime.env.MEDIA_BUCKET;
  const allowedOrigin = getAllowedOrigin(request);
  const CORS: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const origin = request.headers.get('Origin');
  if ((request.method === 'POST' || request.method === 'DELETE') && origin && !allowedOrigin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const directory = url.searchParams.get('directory') ?? '';
    const prefix = directory ? `${directory}/` : '';
    const list = await bucket.list({ prefix, delimiter: '/' });

    const dirs = (list.delimitedPrefixes ?? []).map((p) => ({
      type: 'dir',
      id: p,
      directory,
      filename: p.replace(/\/$/, '').split('/').pop(),
    }));

    const files = list.objects.map((obj) => ({
      type: 'file',
      id: obj.key,
      directory,
      filename: obj.key.split('/').pop(),
      src: `${R2_PUBLIC_URL}/${obj.key}`,
    }));

    return new Response(JSON.stringify({ items: [...dirs, ...files] }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const directory = (formData.get('directory') as string) ?? '';

    const bytes = file instanceof File ? new Uint8Array(await file.arrayBuffer()) : null;
    const detected = bytes ? detectImageType(bytes) : null;
    if (!file || !bytes || !detected) {
      return new Response(JSON.stringify({ error: 'Invalid file' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const dir = sanitizeDirectory(directory);
    if (dir === null) {
      return new Response(JSON.stringify({ error: 'Invalid directory' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Type and extension come from the file's actual bytes, never the client's claim;
    // the random suffix stops uploads from overwriting existing objects.
    const stem = sanitizeStem(file.name);
    const suffix = crypto.randomUUID().slice(0, 8);
    const filename = `${stem}-${suffix}.${detected.ext}`;
    const key = dir ? `${dir}/${filename}` : filename;
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: detected.mime },
    });

    return new Response(JSON.stringify({ src: `${R2_PUBLIC_URL}/${key}` }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'DELETE') {
    const src = url.searchParams.get('src') ?? '';
    const prefix = `${R2_PUBLIC_URL}/`;
    if (!src.startsWith(prefix)) {
      return new Response(JSON.stringify({ error: 'Invalid src' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    const key = src.slice(prefix.length);
    await bucket.delete(key);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405, headers: CORS });
};
