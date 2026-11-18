// Compatibility for DEV URLs saved before merchant/attempt IDs were separated.
// This is used only by the development-only payment page; ownership is still
// checked by the authenticated orders endpoint, never inferred from the URL.
export function devPaymentOrderId(reference: string): string {
  return reference.replace(/-p[1-9]\d*$/, '');
}
