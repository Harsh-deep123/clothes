export function generateOrderId(date = new Date()) {
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  return `ZAYRO-${ymd}-${rand}`;
}
