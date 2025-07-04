import { z } from 'zod';

const serverConfig = z.object({
  APPLICATION_NAME: z.string().default('NEST'),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRY_TIME: z.string(),
  NODE_ENV: z
    .enum(['test', 'development', 'staging', 'production'])
    .default('development'),
  PORT: z.preprocess((val: string) => {
    if (typeof val === 'string' && /^\d+$/.test(val)) {
      return Number(val);
    }
    return;
  }, z.number().default(3000)),

  SHOW_CONSOLE_LOG: z.boolean().default(false),
});

const envVariables = {
  APPLICATION_NAME: process.env.APPLICATION_NAME,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY_TIME: process.env.JWT_EXPIRY_TIME,

  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,

  SHOW_CONSOLE_LOG: process.env.SHOW_CONSOLE_LOG === 'true' ? true : false,
};

type ServerConfig = z.infer<typeof serverConfig>;
const ENV: ServerConfig = serverConfig.parse(envVariables);

export default ENV;
