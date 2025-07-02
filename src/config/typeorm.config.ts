import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

import ENV from './env.config';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  username: ENV.DB_USERNAME,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_NAME,

  // Load entities dynamically (entities folder anywhere under src)
  entities: [`${__dirname}/../**/entities/*.entity{.ts,.js}`],

  synchronize: false,

  // Enable logging based on environment or debugging need
  logging: false,

  // Migrations: use JS files in production, TS files in dev
  migrations:
    ENV.NODE_ENV === 'production'
      ? ['dist/migrations/*.js'] // Use compiled JS in prod
      : ['src/migrations/*.ts'], // Use TS files during development
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  maxQueryExecutionTime: 1000, //if query take   1 second then console
};

const AppDataSource = new DataSource(typeOrmConfig);

export default AppDataSource;
