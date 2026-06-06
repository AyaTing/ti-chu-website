import type { APIRoute } from 'astro';

export const prerender = false;

const R2_PUBLIC_URL = import.meta.env.R2_PUBLIC_URL as string;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const ALL: APIRoute = async ({ request, locals }) => {
  const bucket = locals.runtime.env.MEDIA_BUCKET;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
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

    if (!file || !file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Invalid file' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const dir = directory.replace(/^\/+|\/+$/g, '');
    const key = dir ? `${dir}/${file.name}` : file.name;
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    return new Response(JSON.stringify({ src: `${R2_PUBLIC_URL}/${key}` }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'DELETE') {
    const src = url.searchParams.get('src') ?? '';
    const key = src.replace(`${R2_PUBLIC_URL}/`, '');
    await bucket.delete(key);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405, headers: CORS });
};
