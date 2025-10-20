// @file: src/middleware/requireAuth.ts
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger'; // optional

export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the JWT signature and payload
    const payload = await verify(token, process.env.JWT_SECRET!);
    if (!payload?.sessionToken) {
      return c.json({ error: 'Malformed token payload' }, 401);
    }

    // Validate the session in DB
    const session = await prisma.session.findUnique({
      where: { sessionToken: payload.sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return c.json({ error: 'Session expired or invalid' }, 401);
    }

    await prisma.session.update({
      where: { sessionToken: payload.sessionToken },
      data: { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
    });

    // Attach user context
    c.set('user', session.user);
    c.set('session', session);
    await next();
  } catch (err) {
    logger?.warn({ err }, 'Invalid JWT');
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});
