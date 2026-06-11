/** Format amount in Indian Rupees: ₹199 */
export function formatMoney(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) return '₹0';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** Format with decimals: ₹199.50 */
export function formatMoneyDecimal(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) return '₹0.00';
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
