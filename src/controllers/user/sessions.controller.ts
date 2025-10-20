// @file: src/controllers/user/sessions.controller.ts

import { Hono } from 'hono';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/requireAuth';

export const sessionsController = new Hono();

// 🔒 Protect all routes in this controller
sessionsController.use('*', requireAuth);

/**
 * GET /user/sessions
 * Lists all active sessions for the authenticated user.
 */
sessionsController.get('/', async (c) => {
  const user = c.get('user');

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      sessionToken: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expires: true,
    },
  });

  return c.json({
    message: 'Active sessions retrieved successfully',
    count: sessions.length,
    sessions,
  });
});

/**
 * DELETE /user/sessions/:id
 * Allows user to log out from a specific device/session.
 */
sessionsController.delete('/:id', async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('id');

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== user.id) {
    return c.json({ error: 'Session not found or not authorized' }, 404);
  }

  await prisma.session.delete({
    where: { id: sessionId },
  });

  return c.json({ message: 'Session revoked successfully' });
});

/**
 * DELETE /user/sessions
 * Log out from all other devices (keep current session).
 */
sessionsController.delete('/', async (c) => {
  const user = c.get('user');
  const currentSession = c.get('session');

  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      NOT: { id: currentSession.id },
    },
  });

  return c.json({ message: 'Logged out from all other devices' });
});
