export function toE164(phone: string, defaultCountry = '91'): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (trimmed.startsWith('+') && digits.length >= 10) return `+${digits}`;
  if (digits.startsWith(defaultCountry) && digits.length === defaultCountry.length + 10) {
    return `+${digits}`;
  }
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  if (digits.startsWith('0') && digits.length === 11) {
    return `+${defaultCountry}${digits.slice(1)}`;
  }
  return `+${digits}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{9,14}$/.test(phone);
}
