// @file: src/controllers/auth/login.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const loginController = new Hono();

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

loginController.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: 'Invalid request data' }, 400);
  }

  const { email, password } = parsed.data;

  // Look up user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  // Compare password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  // Create session
  const sessionToken = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken,
      expires,
    },
  });

  // (Optional) Set cookie for browser-based login
  // c.header('Set-Cookie', `sessionToken=${sessionToken}; HttpOnly; Path=/; Max-Age=604800`);

  return c.json({
    message: 'Login successful',
    sessionToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});
