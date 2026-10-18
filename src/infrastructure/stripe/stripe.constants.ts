export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

export const STRIPE_ERRORS = {
  RAW_BODY_MISSING: 'Stripe raw body is missing',
  SIGNATURE_MISSING: 'Stripe signature is missing',
  INVALID_WEBHOOK_SIGNATURE: 'Invalid Stripe webhook signature',
} as const;
