import type { User, Session } from '@prisma/client';
import type { ContextVariableMap } from 'hono';

declare module 'hono' {
  interface ContextVariableMap extends Record<string, any> {
    user: User;
    session: Session;
    jwtPayload: {
      sub: string;
      sessionToken: string;
      iat?: number;
      exp?: number;
    };
  }
}
