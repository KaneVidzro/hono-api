// @file: src/controllers/auth/magic.controller.ts

import { Hono } from 'hono';

export const magicLinkController = new Hono();

magicLinkController.post('/request', (c) => {
  return c.json({ message: 'Request magic link endpoint' });
});

magicLinkController.get('/callback', (c) => {
  return c.json({ message: 'Callback magic link endpoint' });
});
