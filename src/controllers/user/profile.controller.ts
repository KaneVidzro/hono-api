// @file: src/controllers/user/profile.controller.ts

import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { z } from 'zod';

export const profileController = new Hono();

// 👇 Protect all routes in this controller
profileController.use('*', requireAuth);

// Validation schema for updates
const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
});

// GET /user/profile — get current user's profile
profileController.get('/', async (c) => {
  const user = c.get('user');

  return c.json({
    message: 'User profile fetched successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

// PUT /user/profile — update user info
profileController.put('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  return c.json({
    message: 'Profile updated successfully',
    user: updated,
  });
});

// DELETE /user/profile — delete account (and sessions)
profileController.delete('/', async (c) => {
  const user = c.get('user');

  // Delete all sessions
  await prisma.session.deleteMany({ where: { userId: user.id } });
  // Delete user
  await prisma.user.delete({ where: { id: user.id } });

  return c.json({ message: 'Account deleted successfully' });
});
