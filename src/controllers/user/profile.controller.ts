// @file: src/controllers/user/profile.controller.ts

import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { z } from 'zod';

export const profileController = new Hono();

// 🔒 Protect all routes in this controller
profileController.use('*', requireAuth);

/**
 * Zod schema for updating user profile
 */
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

/**
 * GET /user/profile
 * → Returns the authenticated user's profile
 */
profileController.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  return c.json({
    message: 'User profile fetched successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * PUT /user/profile
 * → Updates user info
 */
profileController.put('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return c.json({
    message: 'Profile updated successfully',
    user: updated,
  });
});

/**
 * DELETE /user/profile
 * → Deletes account and all active sessions
 */
profileController.delete('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  return c.json({
    message: 'Account and all sessions deleted successfully',
  });
});
