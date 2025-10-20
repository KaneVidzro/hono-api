// @file: src/controllers/auth/resendVerification.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { randomBytes } from 'crypto';

export const resendVerificationController = new Hono();

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

resendVerificationController.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = resendSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const { email } = parsed.data;

  // Check user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return c.json({
      message: 'If an account exists, a verification email has been sent.',
    });
  }

  // Already verified?
  if (user.emailVerified) {
    return c.json({ message: 'Email is already verified.' }, 200);
  }

  // Delete old tokens
  await prisma.emailVerificationToken.deleteMany({ where: { email } });

  // Create new token
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.emailVerificationToken.create({
    data: { email, token, expires },
  });

  // Send or log
  const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;
  console.log(`📩 Verification link for ${email}: ${verificationLink}`);

  return c.json({
    message: 'If an account exists, a verification email has been sent.',
  });
});
