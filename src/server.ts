// @file: src/server.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from 'bun';
import { logger } from './utils/logger';
import { routes } from './routes';

const server = new Hono();

// Enable CORS globally
server.use('*', cors());

// Mount all route groups
routes.forEach(({ path, children }) => {
  children.forEach(({ path: childPath, route }) => {
    server.route(`${path}${childPath}`, route);
  });
});

// Start the Bun server
serve({
  fetch: server.fetch,
  port: 3000,
});

logger.info('🚀 Server running on http://localhost:3000');
