// @file: src/routes/auth.route.ts

import { Hono } from 'hono';
import { authController } from '../controllers/auth';

interface ChildRoute {
  path: string;
  route: Hono;
}

export const authRoutes: ChildRoute[] = [
  { path: '/magic', route: authController.magic },
  { path: '/signup', route: authController.signup },
  { path: '/logout', route: authController.logout },
];
