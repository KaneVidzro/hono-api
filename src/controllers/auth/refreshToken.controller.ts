// @file: src/controllers/auth/refreshToken.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { sign } from 'hono/jwt';
import { randomBytes } from 'crypto';

export const refreshTokenController = new Hono();

// ✅ Request body validation
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

refreshTokenController.post('/', async (c) => {
  // Parse and validate request body
  const body = await c.req.json();
  const parsed = refreshSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const { refreshToken } = parsed.data;

  // 🔍 Find the session from DB
  const session = await prisma.session.findUnique({
    where: { sessionToken: refreshToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  const user = session.user;

  // 🔑 Generate a new short-lived access token (15 min)
  const accessToken = await sign(
    {
      userId: user.id,
      sessionToken: session.sessionToken,
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes
    },
    process.env.JWT_SECRET!,
  );

  // 🕒 Extend session expiry (sliding window — +7 days)
  const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  // 🔄 (Optional) Rotate refresh token for better security
  const newRefreshToken = randomBytes(32).toString('hex');

  await prisma.session.update({
    where: { sessionToken: refreshToken },
    data: {
      sessionToken: newRefreshToken,
      expires: newExpiry,
    },
  });

  // ✅ Respond with new tokens and user info
  return c.json({
    message: 'Access token refreshed successfully',
    accessToken,
    refreshToken: newRefreshToken, // rotated refresh token
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});
