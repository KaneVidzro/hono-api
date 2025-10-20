// @file: src/controllers/auth/signup.controller.ts

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
    return c.json({ error: 'Email already exists' }, 409);
  }

  // Create user
  const newUser = await prisma.user.create({
    data: { email, name },
  });

  // Create email verification token
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.emailVerificationToken.create({
    data: { email, token, expires },
  });

  // Construct verification link
  const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;

  // TODO: send via Nodemailer / Resend / etc.
  console.log(`📩 Verification link for ${email}: ${verificationLink}`);

  return c.json(
    {
      message: 'Signup successful. Please verify your email address.',
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    },
    201,
  );
});
