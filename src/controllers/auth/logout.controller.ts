// @file:// src/controllers/auth/logout.controller.ts

import { Hono } from 'hono';

export const logoutController = new Hono();

logoutController.get('/', (c) => {
  return c.json({ message: 'Logout endpoint' });
});
