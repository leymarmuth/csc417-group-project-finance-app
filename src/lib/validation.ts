/** Tiny, dependency-free validation primitives + form level rules. */

export type Errors<T extends string = string> = Partial<Record<T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export const validators = {
  required: (value: string, label = 'This field') =>
    value.trim().length === 0 ? `${label} is required` : undefined,

  email: (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address';
    return undefined;
  },

  minLength: (value: string, min: number, label = 'This field') =>
    value.trim().length < min ? `${label} must be at least ${min} characters` : undefined,

  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Use at least 8 characters';
    if (!/[a-zA-Z]/.test(value)) return 'Include at least one letter';
    if (!/[0-9]/.test(value)) return 'Include at least one number';
    return undefined;
  },

  amount: (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (!cleaned) return 'Enter an amount';
    const num = Number(cleaned);
    if (!Number.isFinite(num) || num <= 0) return 'Amount must be greater than zero';
    if (num > 100_000_000) return 'That amount is too large';
    return undefined;
  },

  currencyAmountOptional: (value: string) => {
    if (!value.trim()) return undefined;
    return validators.amount(value);
  },
} as const;

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Too short' | 'Weak' | 'Fair' | 'Strong' | 'Excellent';
  checks: { id: string; label: string; met: boolean }[];
};

/** Weighted strength model — drives the animated meter in the sign-up flow. */
export function passwordStrength(value: string): PasswordStrength {
  const checks = [
    { id: 'length', label: '8+ characters', met: value.length >= 8 },
    { id: 'case', label: 'Upper & lowercase', met: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { id: 'number', label: 'A number', met: /\d/.test(value) },
    { id: 'symbol', label: 'A symbol', met: /[^A-Za-z0-9]/.test(value) },
  ];
  const met = checks.filter((c) => c.met).length;
  let score: PasswordStrength['score'] = 0;
  if (value.length === 0) score = 0;
  else if (met <= 1) score = 1;
  else if (met === 2) score = 2;
  else if (met === 3) score = 3;
  else score = 4;

  const labels: PasswordStrength['label'][] = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'];

  return { score, label: labels[score], checks };
}
