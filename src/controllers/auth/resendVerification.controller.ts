// @file: src/controllers/auth/resendVerification.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { randomBytes } from 'crypto';

export const resendVerificationController = new Hono();

// Validation schema
const resendSchema = z.object({
  email: z.email('Invalid email address'),
});

resendVerificationController.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = resendSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: 'Invalid request data' }, 400);
  }

  const { email } = parsed.data;

  // 1️⃣ Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return c.json({ error: 'No account found with this email' }, 404);
  }

  // 2️⃣ Check if user already verified
  if (user.emailVerified) {
    return c.json({ message: 'Email is already verified' }, 200);
  }

  // 3️⃣ Delete any existing verification tokens for this email
  await prisma.verificationToken.deleteMany({ where: { email } });

  // 4️⃣ Generate a new verification token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.verificationToken.create({
    data: { email, token, expiresAt },
  });

  // 5️⃣ Construct and "send" verification link
  const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;
  console.log(`📩 Resent verification link for ${email}: ${verificationLink}`);

  // TODO: integrate email service (Resend, Nodemailer, etc.)

  return c.json({
    message: 'Verification email resent successfully (check console)',
  });
});
