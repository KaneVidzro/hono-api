// @file: src/controllers/user/settings.controller.ts

import { Hono } from 'hono';

export const settingsController = new Hono();

settingsController.get('/', (c) => {
  return c.json({ message: 'User settings endpoint' });
});

settingsController.patch('/', async (c) => {
  const body = await c.req.json();
  return c.json({ message: 'Settings updated', data: body });
});
