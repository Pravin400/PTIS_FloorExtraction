const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_PATTERN = /^[6-9]\d{9}$/;
const PINCODE_PATTERN = /^[1-9]\d{5}$/;

/** Adds https:// when the user enters a domain without a protocol (e.g. akolamc.in). */
export function normalizeWebsiteUrl(website: string): string {
  const trimmed = website.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidWebsiteUrl(website: string): boolean {
  if (!website.trim()) return true;

  try {
    const url = new URL(normalizeWebsiteUrl(website));
    const host = url.hostname;
    return host.length > 0 && host.includes('.') && !host.startsWith('.') && !host.endsWith('.');
  } catch {
    return false;
  }
}

export function isValidEmail(email: string): boolean {
  if (!email.trim()) return true;
  return EMAIL_PATTERN.test(email.trim());
}

export function isValidIndianPhone(phone: string): boolean {
  if (!phone.trim()) return true;
  return INDIAN_PHONE_PATTERN.test(phone.trim());
}

export function isValidPincode(pincode: string): boolean {
  if (!pincode.trim()) return true;
  return PINCODE_PATTERN.test(pincode.trim());
}
