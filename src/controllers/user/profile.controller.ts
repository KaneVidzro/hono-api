// @file: src/controllers/user/profile.controller.ts

import { Hono } from 'hono';

export const profileController = new Hono();

profileController.get('/', (c) => {
  return c.json({ message: 'User profile endpoint' });
});

profileController.put('/', async (c) => {
  const body = await c.req.json();
  return c.json({ message: 'Profile updated', data: body });
});

profileController.delete('/', (c) => {
  return c.json({ message: 'Profile deleted' });
});