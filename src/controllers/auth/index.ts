// @file: src/controllers/auth/index.ts

import { signupController } from './signup.controller';
import { logoutController } from './logout.controller';
import { magicLinkController } from './magic.controller';

export const authController = {
  magic: magicLinkController,
  signup: signupController,
  logout: logoutController,
};
