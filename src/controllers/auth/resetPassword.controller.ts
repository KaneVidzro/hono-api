// @file: src/controllers/auth/resetPassword.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

export const resetPasswordController = new Hono();

// Validation schema
const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

resetPasswordController.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: 'Invalid request data' }, 400);
  }

  const { token, password } = parsed.data;

  // Lookup the token in DB
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    return c.json({ error: 'Invalid or expired reset token' }, 400);
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: record.email },
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Hash the new password
  const passwordHash = await bcrypt.hash(password, 10);

  // Update user password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  // Remove token after successful password reset
  await prisma.verificationToken.delete({
    where: { token },
  });

  return c.json({ message: 'Password reset successful' });
});
