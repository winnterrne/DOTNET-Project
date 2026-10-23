export const uid = (p = 'id') =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const pad = (n: number) => String(n).padStart(2, '0');

/** YYYY-MM-DD theo giờ địa phương */
export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toDateStr(new Date());

export const parseDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: string, n: number) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

export const addMonths = (s: string, n: number) => {
  const d = parseDate(s);
  d.setMonth(d.getMonth() + n);
  return toDateStr(d);
};

export const diffDays = (a: string, b: string) =>
  Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);

/** combine date + HH:mm -> ISO */
export const atTime = (date: string, hhmm: string) => {
  const d = parseDate(date);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const hoursUntil = (iso: string) => (new Date(iso).getTime() - Date.now()) / 3600000;

export const fmtDate = (s?: string) => {
  if (!s) return '—';
  const d = s.length <= 10 ? parseDate(s) : new Date(s);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fmtDateTime = (iso?: string) => (iso ? `${fmtTime(iso)} ${fmtDate(iso)}` : '—');

export const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const WEEKDAYS_FULL = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const fmtWeekday = (iso: string) => WEEKDAYS_FULL[new Date(iso).getDay()];

export const fmtMoney = (n: number) =>
  n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' ₫';

export const fmtMoneyShort = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' tỷ';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' tr';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return String(n);
};

export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 0) return 'sắp tới';
  if (s < 60) return 'vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`;
  return fmtDate(iso);
};

/** Thứ 2 đầu tuần của ngày */
export const weekStart = (iso: string) => {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return toDateStr(d);
};

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const calcBMI = (w: number, hCm: number) => (hCm > 0 ? +(w / (hCm / 100) ** 2).toFixed(1) : 0);

export const bmiLabel = (bmi: number) =>
  bmi < 18.5 ? 'Thiếu cân' : bmi < 23 ? 'Bình thường' : bmi < 25 ? 'Thừa cân' : 'Béo phì';
