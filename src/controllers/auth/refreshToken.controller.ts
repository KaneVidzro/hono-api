// @file: src/controllers/auth/refreshToken.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { sign } from 'hono/jwt';

export const refreshTokenController = new Hono();

// Validation schema
const refreshSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
});

refreshTokenController.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = refreshSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const { sessionToken } = parsed.data;

  // Find session in DB
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  const user = session.user;

  // ✅ Create new access token (15 min expiry)
  const accessToken = await sign(
    {
      userId: user.id,
      sessionToken,
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes
    },
    process.env.JWT_SECRET!,
  );

  // Optional: extend session expiry (sliding window)
  const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // +7 days
  await prisma.session.update({
    where: { sessionToken },
    data: { expires: newExpiry },
  });

  return c.json({
    message: 'Access token refreshed',
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});
