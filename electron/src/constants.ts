// FILE: electron/src/constants.ts
/// ANCHOR: ElectronConstants
import path from 'node:path';
import { app } from 'electron';

const APP_FOLDER = 'Mediclone';

export const getAppDataDir = () => {
  const base = app.getPath('appData');
  return path.join(base, APP_FOLDER);
};

export const paths = {
  database: () => path.join(getAppDataDir(), 'data', 'mediclone.db'),
  backups: () => path.join(getAppDataDir(), 'backups')
};

