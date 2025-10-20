// @file: src/controllers/auth/resetPassword.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

export const resetPasswordController = new Hono();

const resetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

resetPasswordController.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const { token, newPassword } = parsed.data;

  // Lookup token
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.expires < new Date()) {
    if (record) await prisma.passwordResetToken.delete({ where: { token } });
    return c.json({ error: 'Invalid or expired reset token' }, 400);
  }

  // Find user
  const user = await prisma.user.findUnique({ where: { email: record.email } });
  if (!user) return c.json({ error: 'User not found' }, 404);

  // Hash and update password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  // Clean up tokens and sessions
  await prisma.passwordResetToken.delete({ where: { token } });
  await prisma.session.deleteMany({ where: { userId: user.id } });

  return c.json({ message: 'Password reset successful. Please log in again.' });
});
