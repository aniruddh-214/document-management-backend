describe('ternary logic in env variable parsing', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('coerces PORT to number if set as string', () => {
    process.env.PORT = '1234';
    process.env.DB_HOST = 'localhost';
    process.env.DB_USERNAME = 'user';
    process.env.DB_PASSWORD = 'pass';
    process.env.DB_NAME = 'dbname';
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_EXPIRY_TIME = '1h';

    const ENV = require('./env.config').default;

    expect(ENV.PORT).toBe(1234);
    expect(typeof ENV.PORT).toBe('number');
  });

  it('sets PORT as default if process.env.PORT is missing or empty', () => {
    process.env.PORT = ''; // empty string
    process.env.DB_HOST = 'localhost';
    process.env.DB_USERNAME = 'user';
    process.env.DB_PASSWORD = 'pass';
    process.env.DB_NAME = 'dbname';
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_EXPIRY_TIME = '1h';

    const ENV = require('./env.config').default;
    expect(ENV.PORT).toBe(3000);

    // also test completely missing PORT
    delete process.env.PORT;
    const ENV2 = require('./env.config').default;
    expect(ENV2.PORT).toBe(3000);
  });

  it('sets SHOW_CONSOLE_LOG true only if string "true"', () => {
    process.env.SHOW_CONSOLE_LOG = 'true';
    process.env.DB_HOST = 'localhost';
    process.env.DB_USERNAME = 'user';
    process.env.DB_PASSWORD = 'pass';
    process.env.DB_NAME = 'dbname';
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_EXPIRY_TIME = '1h';
    process.env.PORT = '3000';

    const ENV = require('./env.config').default;
    expect(ENV.SHOW_CONSOLE_LOG).toBe(true);
  });

  it('sets SHOW_CONSOLE_LOG false if string is anything other than "true"', () => {
    const falsyValues = ['false', 'random', '', undefined];

    for (const val of falsyValues) {
      process.env.SHOW_CONSOLE_LOG = val as string;
      process.env.DB_HOST = 'localhost';
      process.env.DB_USERNAME = 'user';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'dbname';
      process.env.JWT_SECRET = 'secret';
      process.env.JWT_EXPIRY_TIME = '1h';
      process.env.PORT = '3000';

      const ENV = require('./env.config').default;
      expect(ENV.SHOW_CONSOLE_LOG).toBe(false);
      jest.resetModules();
    }
  });
});
