// @file: src/middleware/requireAuth.ts

import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

interface JwtPayload {
  userId: string;
  sessionToken: string;
  exp: number;
}

export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // ✅ Safely cast via `unknown` to avoid TS2352
    const payload = (await verify(token, process.env.JWT_SECRET!)) as unknown as JwtPayload;

    // ✅ Validate payload fields exist and are strings
    if (
      !payload ||
      typeof payload.sessionToken !== 'string' ||
      typeof payload.userId !== 'string'
    ) {
      return c.json({ error: 'Malformed token payload' }, 401);
    }

    // ✅ Find valid session
    const session = await prisma.session.findUnique({
      where: { sessionToken: payload.sessionToken },
      include: { user: true },
    });

    if (!session) {
      return c.json({ error: 'Session not found' }, 401);
    }

    if (session.expires < new Date()) {
      await prisma.session.delete({ where: { sessionToken: payload.sessionToken } });
      return c.json({ error: 'Session expired' }, 401);
    }

    // ✅ Optional sliding session renewal
    await prisma.session.update({
      where: { sessionToken: payload.sessionToken },
      data: { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
    });

    // ✅ Attach context data for later use
    c.set('user', session.user);
    c.set('session', session);

    await next();
  } catch (err) {
    logger?.warn({ err }, 'Invalid JWT');
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});
