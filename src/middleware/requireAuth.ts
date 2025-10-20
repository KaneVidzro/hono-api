// @file: src/middleware/requireAuth.ts
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { prisma } from '../lib/prisma';

export const requireAuth = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return c.json({ error: 'Missing token' }, 401);

  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set('jwtPayload', payload);

    // optional: check DB for active session
    const session = await prisma.session.findUnique({
      where: { sessionToken: payload.sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return c.json({ error: 'Session expired or invalid' }, 401);
    }

    c.set('user', session.user);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});
