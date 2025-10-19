// @file: src/routes/user.route.ts

import { Hono } from 'hono';
import { userController } from '../controllers/user';

interface ChildRoute {
  path: string;
  route: Hono;
}

export const userRoutes: ChildRoute[] = [
  { path: '/profile', route: userController.profile },
  { path: '/settings', route: userController.settings },
];
