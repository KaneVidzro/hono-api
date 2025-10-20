// @file: src/controllers/user/settings.controller.ts

import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/requireAuth';

export const settingsController = new Hono();

// 🔒 Protect all routes in this controller
settingsController.use('*', requireAuth);

/**
 * GET /user/settings
 * Retrieves the authenticated user's settings
 */
settingsController.get('/', async (c) => {
  const user = c.get('user');

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  return c.json({
    message: 'User settings retrieved',
    settings,
  });
});

/**
 * PATCH /user/settings
 * Updates user settings (e.g., theme, notifications)
 */
settingsController.patch('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const updatedSettings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: body,
    create: { userId: user.id, ...body },
  });

  return c.json({
    message: 'Settings updated successfully',
    settings: updatedSettings,
  });
});
