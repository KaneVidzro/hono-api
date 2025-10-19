// @file: src/server.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from 'bun';
import { logger } from './utils/logger';

const server = new Hono();

// Enable CORS globally
server.use('*', cors());

// Define a simple GET route
server.get('/', (c) => {
  return c.json({ message: 'Hello, World!' });
});

serve({
  fetch: server.fetch,
  port: 3000,
});

logger.info('🚀 Server running on http://localhost:3000');
