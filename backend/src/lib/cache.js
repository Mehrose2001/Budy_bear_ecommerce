const cache = new Map();
const inflight = new Map();

export async function cached(key, ttlMs, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return hit.value;
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const pending = Promise.resolve()
    .then(loader)
    .then((value) => {
      cache.set(key, { at: Date.now(), value });
      return value;
    })
    .catch((error) => {
      if (hit) return hit.value;
      throw error;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, pending);
  return pending;
}

export function invalidateCatalogCache() {
  for (const key of cache.keys()) {
    if (key.startsWith("catalog:")) cache.delete(key);
  }
}
