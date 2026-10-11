import z from 'zod';

export const EmailSchema = z.email('Invalid email format');

export const PasswordSchema = z.string().min(6, {
  error: ({ minimum }) =>
    `Password must be at least ${minimum} characters long`,
});

export const NameSchema = z.string().min(2, {
  error: ({ minimum }) => `Name must be at least ${minimum} characters long`,
});

export const IdSchema = z.uuid('Invalid ID format');

export const TimestampSchema = z.iso.datetime();
