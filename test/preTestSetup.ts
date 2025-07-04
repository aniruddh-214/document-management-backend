/// <reference path="../src/types/globals.d.ts" />

import * as dotenv from 'dotenv';
import * as path from 'path';

export default async () => {
  dotenv.config({ path: path.resolve(__dirname, './.env') });
  console.log('✅ Loaded test/.env from global setup');
};
