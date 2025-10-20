// @file: src/controllers/auth/verifyEmail.controller.ts

import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';

export const verifyEmailController = new Hono();

/** 
 * POST /auth/verify-email?token=abc123
 * 1️⃣ Checks the token
 * 2️⃣ Marks the user as verified
 * 3️⃣ Deletes the verification token
 */
verifyEmailController.post('/', async (c) => {
  const token = await c.req.json();

  if (!token) {
    return c.json({ error: 'Verification token is required' }, 400);
  }

  // Find the token record
  const record = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return c.json({ error: 'Invalid verification token' }, 400);
  }

  if (record.expiresAt < new Date()) {
    return c.json({ error: 'Verification token has expired' }, 400);
  }

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: record.email },
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Mark user as verified
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  // Delete the token (no reuse)
  await prisma.verificationToken.delete({
    where: { token },
  });

  return c.json({
    message: 'Email verified successfully!',
  });
});
