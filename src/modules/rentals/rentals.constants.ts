export const RENTALS_QUEUE = 'rentals';

export const RENTALS_JOBS = {
  EXPIRE: 'expire-rental',
  REMIND: 'remind-rental',
  CANCEL_PENDING: 'cancel-pending-rental',
} as const;

export const RENTALS_EVENTS = {
  ACTIVATED: 'rentals.activated',
  CANCELLED: 'rentals.cancelled',
  EXPIRED: 'rentals.expired',
} as const;

export const RENTAL_ERRORS = {
  SLOT_NOT_FOUND: 'The selected slot was not found or is unavailable',
  SLOT_TAKEN: 'The selected slot has just been reserved by another user',
  RENTAL_NOT_FOUND: 'Rental not found',
} as const;

export const RENTAL_PAYMENT_RESERVATION_MS = 30 * 60 * 1000;
export const RENTAL_REMINDER_BEFORE_END_MS = 60 * 60 * 1000;
