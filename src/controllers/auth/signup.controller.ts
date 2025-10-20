// @file:// src/controllers/auth/signup.controller.ts

import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { randomBytes } from 'crypto';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
});

export const signupController = new Hono();

signupController.post('/', async (c) => {
  const body = await c.req.json();

  const parsed = signupSchema.safeParse(body);

 if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten() }, 400);
  }

  const { name, email } = parsed.data;

    // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return c.json({ error: 'email already exists' }, 409);
  }

    // Create user
  const newUser = await prisma.user.create({
    data: { email, name },
  });

// create token for email verification
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiry

  await prisma.verificationToken.create({
    data: { email, token, expiresAt },
  });

  // Construct magic link (adjust for frontend or production domain)
  const magicLink = `http://localhost:3000/auth/magic/callback?token=${token}`;

  // (TODO) send email via Nodemailer / Resend / etc.
  console.log(`📩 Magic link for ${email}: ${magicLink}`);
  // Proceed with signup logic (e.g., save to database)
  return c.json({ message: 'Signup successful' }, 201);
});
