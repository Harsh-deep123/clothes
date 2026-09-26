/** Indian mobile: 10 digits starting 6–9, optional +91 / 91 prefix. */

export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let ten = digits;
  if (digits.length === 12 && digits.startsWith('91')) ten = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) ten = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(ten)) return null;
  return `+91${ten}`;
}

export function maskIndianMobile(e164: string): string {
  const ten = e164.replace(/^\+91/, '');
  if (ten.length !== 10) return e164;
  return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
}

export function indianMobileTenDigits(e164: string): string {
  return e164.replace(/^\+91/, '');
}
