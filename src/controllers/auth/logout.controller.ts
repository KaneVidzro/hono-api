// @file: src/controllers/auth/logout.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

export const logoutController = new Hono();

// ✅ Schema validation
const logoutSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
});

logoutController.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = logoutSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const { sessionToken } = parsed.data;

  // 🔍 Check for existing session
  const session = await prisma.session.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    return c.json({ error: 'Session not found or already logged out' }, 404);
  }

  // 🗑️ Delete session record
  await prisma.session.delete({
    where: { sessionToken },
  });

  return c.json({ message: 'Logged out successfully' });
});
