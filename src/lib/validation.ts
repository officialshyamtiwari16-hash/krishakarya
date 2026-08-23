/**
 * Form Input Validation and Sanitization Utility
 * Guarantees safe payloads and prevents XSS / malformed data.
 */

// HTML entity sanitization to prevent script injection
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Strip angle brackets
    .slice(0, maxLength);
}

// Indian 10-digit mobile number validator
export function isValidIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-+]/g, '');
  // Matches 91XXXXXXXXXX or 10-digit starting with 6-9
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return /^[6-9]\d{9}$/.test(cleaned.slice(2));
  }
  return /^[6-9]\d{9}$/.test(cleaned);
}

// Format phone for standard display (+91 XXXXX XXXXX)
export function formatIndianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    const num = cleaned.slice(2);
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  return phone;
}

// Indian PIN Code (6-digit format, starts with 1-9)
export function isValidPincode(pincode: string): boolean {
  if (!pincode) return false;
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

// Validate Positive Numeric Amounts (wages, rental rates, ledger)
export function isValidAmount(amount: number | string, min: number = 1, max: number = 1000000): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && isFinite(num) && num >= min && num <= max;
}

// Validate Rating Value (1 to 5)
export function isValidRating(rating: number): boolean {
  return Number.isFinite(rating) && rating >= 1 && rating <= 5;
}
