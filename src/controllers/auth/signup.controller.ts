// @file:// src/controllers/auth/signup.controller.ts

import { Hono } from 'hono';

export const signupController = new Hono();

signupController.get('/', async (c) => {
  return c.json({ message: 'Signup endpoint' });
});
