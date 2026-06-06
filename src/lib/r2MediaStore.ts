import type { Media, MediaList, MediaStore, MediaUploadOptions } from 'tinacms';

export class R2MediaStore implements MediaStore {
  accept = 'image/*';

  async persist(files: MediaUploadOptions[]): Promise<Media[]> {
    const results: Media[] = [];

    for (const { file, directory } of files) {
      const formData = new FormData();
      formData.append('file', file);
      if (directory) formData.append('directory', directory);

      const res = await fetch('/api/media', { method: 'POST', body: formData });
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
    const { items } = (await res.json()) as { items: Media[] };

    return { items };
  }

  async delete(media: Media): Promise<void> {
    await fetch(`/api/media?src=${encodeURIComponent(media.src ?? '')}`, {
      method: 'DELETE',
    });
  }
}
