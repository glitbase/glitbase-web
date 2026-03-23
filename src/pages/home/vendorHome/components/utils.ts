export const currencySymbol = (currency?: string) => {
  const c = (currency || '').toUpperCase();
  const map: Record<string, string> = { NGN: '₦', GBP: '£', USD: '$', EUR: '€' };
  return map[c] ?? (currency || '');
};

export const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

export const toStoreSlug = (name?: string) =>
  (name || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const formatDateTime = (dateISO?: string, time?: string) => {
  if (!dateISO) return '';
  const date = new Date(dateISO);
  const dateLabel = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const timeLabel = (() => {
    if (!time) return '';
    // backend sometimes sends "18:00" or "18:00PM"
    const trimmed = String(time).trim();
    if (/am|pm/i.test(trimmed)) return trimmed.toUpperCase();
    const [hRaw, mRaw] = trimmed.split(':');
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (Number.isNaN(h) || Number.isNaN(m)) return trimmed;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const normalized = h % 12 === 0 ? 12 : h % 12;
    return `${normalized}:${String(m).padStart(2, '0')}${suffix}`;
  })();

  return [dateLabel, timeLabel].filter(Boolean).join(', ');
};

export const formatDuration = (minutes?: number) => {
  const total = Number(minutes || 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours <= 0) return `${mins}min`;
  if (mins <= 0) return `${hours}hr`;
  return `${hours}hr ${mins}min`;
};

export const statusPillClasses = (status?: string) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'pending':
    case 'ongoing':
      return 'bg-[#FFF8E6] text-[#8A6703]';
    case 'confirmed':
      return 'bg-[#E3F2FD] text-[#2196F3]';
    case 'completed':
      return 'bg-[#EBFEE3] text-[#3D7B22]';
    case 'cancelled':
    case 'rejected':
    case 'refunded':
      return 'bg-[#FFF0F0] text-[#BB0A0A]';
    default:
      return 'bg-[#F4F4F5] text-[#6C6C6C]';
  }
};

