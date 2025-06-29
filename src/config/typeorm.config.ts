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
  logging: ENV.NODE_ENV !== 'production',

  // Migrations: use JS files in production, TS files in dev
  migrations:
    ENV.NODE_ENV === 'production'
      ? ['dist/migrations/*.js'] // Use compiled JS in prod
      : ['src/migrations/*.ts'], // Use TS files during development

  cache: {
    duration: 60000, // 1 minute and this is the db level caching we can use redis as well
  },
  maxQueryExecutionTime: 1000, //if query take   1 second then console
};

const AppDataSource = new DataSource(typeOrmConfig);

export default AppDataSource;
