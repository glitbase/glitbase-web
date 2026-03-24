/**
 * Normalise `service.category` from the API (string or populated object).
 */
export function getServiceCategoryLabel(service: unknown): string | null {
  if (!service || typeof service !== 'object') return null;
  const c = (service as { category?: unknown }).category;
  if (c == null || c === '') return null;
  if (typeof c === 'string') {
    const t = c.trim();
    return t.length ? t : null;
  }
  if (typeof c !== 'object') return null;
  const o = c as Record<string, unknown>;
  for (const key of ['name', 'title', 'label'] as const) {
    const v = o[key];
    if (typeof v === 'string') {
      const t = v.trim();
      if (t.length) return t;
    }
  }
  if (typeof o.value === 'string' && o.value.trim()) {
    return o.value.trim();
  }
  return null;
}
