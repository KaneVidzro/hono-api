// @file: src/controllers/auth/index.ts

import { signupController } from './signup.controller';
import { logoutController } from './logout.controller';
import { magicLinkController } from './magic.controller';
import { resendVerificationController } from './resendVerification.controller';
import { verifyEmailController } from './verifyEmail.controller';
import { forgetPasswordController } from './forgetPassword.controller';
import { resetPasswordController } from './resetPassword.controller';
import { loginController } from './login.controller';

export const authController = {
  magic: magicLinkController,
  signup: signupController,
  logout: logoutController,
  resendVerification: resendVerificationController,
  verifyEmail: verifyEmailController,
  forgetPassword: forgetPasswordController,
  resetPassword: resetPasswordController,
  login: loginController,
};
