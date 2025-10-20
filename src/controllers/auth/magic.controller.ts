// @file: src/controllers/auth/magic.controller.ts

import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';
import { randomBytes } from 'crypto';
import { sign } from 'hono/jwt';

export const magicLinkController = new Hono();

/**
 * Step 1: Request Magic Link
 */
magicLinkController.post('/request', async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ error: 'Email is required' }, 400);

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return c.json({ error: 'No account exists matching this email' }, 404);

  // Optional: cooldown check
  const existing = await prisma.magicLinkToken.findFirst({
    where: { email: normalizedEmail, expires: { gt: new Date() } },
  });
  if (existing) return c.json({ error: 'Magic link already sent. Try again soon.' }, 429);

  await prisma.magicLinkToken.deleteMany({ where: { email: normalizedEmail } });

  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 10);

  await prisma.magicLinkToken.create({
    data: { email: normalizedEmail, token, expires },
  });

  const magicLink = `http://localhost:3000/auth/magic/callback?token=${token}`;
  console.log(`📩 Magic link for ${normalizedEmail}: ${magicLink}`);

  return c.json({ message: 'Magic link sent (check console)' });
});

/**
 * Step 2: Verify Token & Create Session
 */
magicLinkController.post('/callback', async (c) => {
  const { token } = await c.req.json();
  if (!token) return c.json({ error: 'Token is required' }, 400);

  const record = await prisma.magicLinkToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }

  const user = await prisma.user.findUnique({ where: { email: record.email } });
  if (!user) return c.json({ error: 'User not found' }, 404);

  const sessionToken = randomBytes(32).toString('hex');
  const sessionExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken,
      userAgent: c.req.header('User-Agent'),
      ipAddress: c.req.header('X-Forwarded-For') ?? c.req.header('CF-Connecting-IP'),
      expires: sessionExpiry,
    },
  });

  const accessToken = await sign(
    {
      userId: user.id,
      sessionToken,
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
    },
    process.env.JWT_SECRET!,
  );

  await prisma.magicLinkToken.deleteMany({ where: { token } });

  return c.json({
    message: 'Login successful',
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});
