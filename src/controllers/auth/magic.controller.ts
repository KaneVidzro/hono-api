// @file: src/controllers/auth/magic.controller.ts

import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';
import { randomBytes } from 'crypto';

export const magicLinkController = new Hono();

/**
 * Step 1: Request Magic Link
 * Example: POST /auth/magic/request
 */

magicLinkController.post('/request', async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: 'Email is required' }, 400);

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return c.json({ error: 'No account exist matching this email' }, 404);
  }

  // Generate token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes expiry

  // delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { email },
  });

  // Save verification token
  await prisma.verificationToken.create({
    data: { email, token, expiresAt },
  });

  // Construct magic link (adjust for frontend or production domain)
  const magicLink = `http://localhost:3000/auth/magic/callback?token=${token}`;

  // (TODO) send email via Nodemailer / Resend / etc.
  console.log(`📩 Magic link for ${email}: ${magicLink}`);

  return c.json({ message: 'Magic link sent to your email (check console)' });
});

/**
 * Step 2: Callback — Verify Token and Create Session
 * Example: GET /auth/magic/callback?token=xyz
 */

magicLinkController.get('/callback', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'Token is required' }, 400);

  // Lookup token
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: record.email },
  });
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Create session
  const sessionToken = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  await prisma.session.create({
    data: { userId: user.id, sessionToken, expires },
  });

  // Delete verification token after use
  await prisma.verificationToken.delete({ where: { token } });

  return c.json({
    message: 'Login successful',
    sessionToken,
    user,
  });
});
