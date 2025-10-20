// @file: src/controllers/auth/forgetPassword.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { randomBytes } from 'crypto';

export const forgetPasswordController = new Hono();

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

forgetPasswordController.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return c.json({ errors: parsed.error.flatten() }, 400);

  const { email } = parsed.data;

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return c.json({ error: 'No account found with this email' }, 404);

  // Delete old tokens
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  // Create new token
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 min expiry

  await prisma.passwordResetToken.create({
    data: { email, token, expires },
  });

  // Construct password reset link
  const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;
  console.log(`🔑 Password reset link for ${email}: ${resetLink}`);

  // TODO: Send via email (e.g., Resend, Nodemailer)
  return c.json({ message: 'Password reset link sent (check console)' });
});
