// @file: src/routes/index.ts

import { Hono } from 'hono';
import { authRoutes } from './auth.route';
import { userRoutes } from './user.route';

interface RouteGroup {
  path: string;
  children: { path: string; route: Hono }[];
}

export const routes: RouteGroup[] = [
  // adding the routes
  { path: '/auth', children: authRoutes },
  { path: '/user', children: userRoutes },
];
