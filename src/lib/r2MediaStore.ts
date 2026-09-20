import type { Media, MediaList, MediaStore, MediaUploadOptions } from 'tinacms';

async function parseApiError(res: Response, fallback: string): Promise<string> {
  try {
    const { error } = await res.json() as { error: string };
    return error;
  } catch {
    return fallback;
  }
}

export class R2MediaStore implements MediaStore {
  accept = 'image/*';

  async persist(files: MediaUploadOptions[]): Promise<Media[]> {
    const results: Media[] = [];

    for (const { file, directory } of files) {
      const formData = new FormData();
      formData.append('file', file);
      if (directory) formData.append('directory', directory);

      const res = await fetch('/api/media', { method: 'POST', body: formData });
      if (!res.ok) {
        throw new Error(await parseApiError(res, 'Upload failed'));
      }
      const { src } = (await res.json()) as { src: string };

      const parts = src.split('/');
      results.push({
        type: 'file',
        id: src,
        directory: directory ?? '',
        filename: parts[parts.length - 1],
        src,
      });
    }

    return results;
  }

  async previewSrc(src: string): Promise<string> {
    return src;
  }

  async list(options?: { directory?: string }): Promise<MediaList> {
    const params = new URLSearchParams();
    if (options?.directory) params.set('directory', options.directory);

    const res = await fetch(`/api/media?${params}`);
    if (!res.ok) {
      throw new Error(await parseApiError(res, 'Failed to list media'));
    }
    const { items } = (await res.json()) as { items: Media[] };

    return { items };
  }

  async delete(media: Media): Promise<void> {
    const res = await fetch(`/api/media?src=${encodeURIComponent(media.src ?? '')}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(await parseApiError(res, 'Failed to delete media'));
    }
  }
}
