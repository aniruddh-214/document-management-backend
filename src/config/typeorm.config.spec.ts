describe('TypeORM Config', () => {
  it('sets migrations paths correctly for production', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    const ENV = require('./env.config').default;
    const { typeOrmConfig } = require('./typeorm.config');

    expect(typeOrmConfig.migrations).toEqual(['dist/migrations/*.js']);
  });

  it('sets migrations paths correctly for development', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    const ENV = require('./env.config').default;
    const { typeOrmConfig } = require('./typeorm.config');

    expect(typeOrmConfig.migrations).toEqual(['src/migrations/*.ts']);
  });
});
