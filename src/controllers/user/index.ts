// @file: src/controllers/user/index.ts

import { profileController } from './profile.controller';
import { settingsController } from './settings.controller';
import { sessionsController } from './sessions.controller';

export const userController = {
  profile: profileController,
  settings: settingsController,
  sessions: sessionsController,
};
