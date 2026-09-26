export function isValidIndianMobile(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  let ten = digits;
  if (digits.length === 12 && digits.startsWith('91')) ten = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) ten = digits.slice(1);
  return /^[6-9]\d{9}$/.test(ten);
}
