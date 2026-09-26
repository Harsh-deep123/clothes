export function formatINR(value: number, decimals = false): string {
  const amount = Number(value) || 0;
  if (decimals) {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
