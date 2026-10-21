export const UPI_ID = 'harshdhiman613@okhdfcbank';
export const UPI_PAYEE = 'Zayro Store';
export const GPAY_NUMBER = '7681987334';
export const GPAY_VPA = '7681987334@okhdfcbank';

export type UpiPaymentChoice = 'gpay' | 'phonepe' | 'paytm';

export function isUpiPayment(method?: string | null): method is UpiPaymentChoice {
  return method === 'gpay' || method === 'phonepe' || method === 'paytm';
}

export function upiQuery(amount: number) {
  const am = Math.max(0, Number(amount) || 0).toFixed(2);
  return [
    `pa=${encodeURIComponent(UPI_ID)}`,
    `pn=${encodeURIComponent(UPI_PAYEE)}`,
    `am=${am}`,
    'cu=INR',
    `tn=${encodeURIComponent('Zayro Store order')}`,
  ].join('&');
}

export function upiPayUrl(amount: number, scheme = 'upi') {
  return `${scheme}://pay?${upiQuery(amount)}`;
}

export function upiQrImage(amount: number) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=340x340&ecc=M&margin=10&data=${encodeURIComponent(upiPayUrl(amount))}`;
}

export function upiAppLink(choice: UpiPaymentChoice, amount: number) {
  const query = upiQuery(amount);
  if (choice === 'gpay') return gpayTezUrl(amount);
  if (choice === 'phonepe') return `phonepe://pay?${query}`;
  return `paytmmp://pay?${query}`;
}

function gpayAmountQuery(amount: number) {
  const am = Math.max(0, Number(amount) || 0).toFixed(2);
  return [
    `pa=${encodeURIComponent(GPAY_VPA)}`,
    `pn=${encodeURIComponent(UPI_PAYEE)}`,
    `am=${am}`,
    'cu=INR',
    `tn=${encodeURIComponent('Shopping payment')}`,
  ].join('&');
}

export function gpayUpiUrl(amount: number) {
  return `upi://pay?${gpayAmountQuery(amount)}`;
}

export function gpayTezUrl(amount: number) {
  return `tez://upi/pay?${gpayAmountQuery(amount)}`;
}

export function gpayAppUrl(amount: number) {
  return `gpay://upi/pay?${gpayAmountQuery(amount)}`;
}

export function gpayQrImage(amount: number) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=340x340&ecc=M&margin=10&data=${encodeURIComponent(gpayUpiUrl(amount))}`;
}

export function gpayIntentUrl(amount: number) {
  const query = gpayAmountQuery(amount);
  return `intent://upi/pay?${query}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
}

export function gpayLaunchUrl(amount: number) {
  if (/Android/i.test(navigator.userAgent)) return gpayIntentUrl(amount);
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return gpayTezUrl(amount);
  return gpayTezUrl(amount);
}

export function launchGooglePay(amount: number) {
  const url = gpayLaunchUrl(amount);
  window.location.href = url;
}

export function upiMethodLabel(method?: string | null) {
  if (method === 'gpay') return 'Google Pay';
  if (method === 'phonepe') return 'PhonePe';
  if (method === 'paytm') return 'Paytm';
  return 'UPI';
}
