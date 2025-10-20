// @file: src/controllers/auth/login.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sign } from 'hono/jwt';

export const loginController = new Hono();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

loginController.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.password || !user.emailVerified) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const sessionToken = randomBytes(32).toString('hex');
  const sessionExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken,
      userAgent: c.req.header('User-Agent'),
      ipAddress:
        c.req.header('X-Forwarded-For') ??
        c.req.header('CF-Connecting-IP') ??
        c.req.header('X-Real-IP') ??
        'unknown',
      expires: sessionExpiry,
    },
  });

  // Create short-lived access token (15 minutes)
  const accessToken = await sign(
    {
      userId: user.id,
      sessionToken,
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
    },
    process.env.JWT_SECRET!,
  );

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
