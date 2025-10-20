// @file: src/controllers/auth/logout.controller.ts

import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';

export const logoutController = new Hono();

/**
 * POST /auth/logout
 * Expects: { sessionToken: string }
 * Behavior:
 * - Deletes the session from DB
 * - Optionally clears session cookie (if implemented)
 */
logoutController.post('/', async (c) => {
  const { sessionToken } = await c.req.json();

  if (!sessionToken) {
    return c.json({ error: 'Session token is required' }, 400);
  }

  // Check if session exists
  const session = await prisma.session.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    return c.json({ error: 'Session not found or already logged out' }, 404);
  }

  // Delete the session
  await prisma.session.delete({
    where: { sessionToken },
  });

  // Optionally clear session cookie if you’re storing it in cookies
  // c.header('Set-Cookie', 'sessionToken=; Path=/; HttpOnly; Max-Age=0');

  return c.json({ message: 'Logged out successfully' });
});
