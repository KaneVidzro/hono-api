// @file: src/controllers/user/settings.controller.ts

import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/requireAuth';
import { z } from 'zod';

export const settingsController = new Hono();

// 🔒 Protect all routes in this controller
settingsController.use('*', requireAuth);

/**
 * Schema for user settings update
 * Adjust fields based on your actual Prisma schema
 */
const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  notificationsEnabled: z.boolean().optional(),
});

/**
 * GET /user/settings
 * → Retrieves the authenticated user's settings
 */
settingsController.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  return c.json({
    message: 'User settings retrieved successfully',
    settings: settings ?? {},
  });
});

/**
 * PATCH /user/settings
 * → Updates user settings (e.g., theme, notifications)
 */
settingsController.patch('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const updatedSettings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: { userId: user.id, ...parsed.data },
  });

  return c.json({
    message: 'Settings updated successfully',
    settings: updatedSettings,
  });
});
