/** Download self-contained GLBs without mutating the caller's saved configuration. */
export function prefetchModels(config: Record<string, any>, fetcher = fetch, cache?: Map<string, Promise<string>>) {
  const entries: any[] = [];
  const visit = (entry: any): void => {
    if (!entry || typeof entry !== 'object') return;
    if (Array.isArray(entry.children) && entry.children.length) {
      for (const child of entry.children) {
        if (child?.url || child?.uri) visit(child);
        else if (child && typeof child === 'object') Object.values(child).forEach(visit);
      }
    } else if (entry.url || entry.uri) entries.push(entry);
  };
  const copy = structuredClone(config);
  for (const [key, entry] of Object.entries(copy)) {
    if (key !== 'walls' && key !== 'floor') visit(entry);
  }
  const urls = [...new Set<string>(entries.map(entry => entry.url || entry.uri))];
  const keys = new Map<string, string>(entries.map(entry => [entry.url || entry.uri,
    entry.modelData?.id?.replace(/_node\d+$/, '') || entry.url || entry.uri]));
  const ownedUrls = new Set<string>();
  const controller = new AbortController();
  const completed = new Map<string, (url: string) => void>();
  const ready = new Map(urls.map(url => [url, new Promise<string>(resolve => completed.set(url, resolve))]));
  let next = 0;
  const downloads = Promise.all(Array.from({ length: Math.min(4, urls.length) }, async () => {
    while (next < urls.length && !controller.signal.aborted) {
      const url = urls[next++];
      let resolvedUrl = url;
      try {
        const key = keys.get(url)!;
        let request = cache?.get(key);
        if (!request) {
          request = (async () => {
            const response = await fetcher(url, { signal: controller.signal });
            if (!response.ok) throw new Error('Model download failed.');
            const bytes = await response.arrayBuffer();
            const view = new DataView(bytes);
            if (bytes.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 ||
                view.getUint32(4, true) !== 2 || view.getUint32(16, true) !== 0x4e4f534a) return url;
            const json = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, view.getUint32(12, true))));
            const external = [...(json.buffers || []), ...(json.images || [])]
              .some(resource => resource.uri && !resource.uri.startsWith('data:'));
            if (external) return url;
            return URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
          })().then(local => {
            if (!local.startsWith('blob:')) cache?.delete(key);
            return local;
          }).catch(error => { cache?.delete(key); throw error; });
          cache?.set(key, request);
        }
        resolvedUrl = await request;
        if (!cache && resolvedUrl.startsWith('blob:')) ownedUrls.add(resolvedUrl);
      } catch {
        // Normal import retains its usual retry and error behavior.
      } finally {
        completed.get(url)!(resolvedUrl);
      }
    }
  }));
  return {
    config: copy,
    resolveUrl: (url: string): Promise<string> => ready.get(url) || Promise.resolve(url),
    release: async () => {
      controller.abort();
      // Settle queued entries and wait for active downloads before revoking URLs.
      completed.forEach((resolve, url) => resolve(url));
      await downloads;
      ownedUrls.forEach(url => URL.revokeObjectURL(url));
    },
  };
}
