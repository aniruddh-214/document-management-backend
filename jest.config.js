const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: './test/.env' });

const projectRoot = path.resolve('.');

const config = {
  rootDir: projectRoot,
  verbose: true,
  preset: 'ts-jest',

  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  modulePaths: ['<rootDir>'],

  moduleNameMapper: {
    '^#src/(.+)': '<rootDir>/src/$1',
    // Add more aliases as needed
  },

  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  testRegex: '.*\\.spec\\.ts$',

  testPathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/types/globals.d.ts',
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,js}',
    '!<rootDir>/src/**/*.spec.ts',
    '!src/scripts/**',
    '!src/main.ts',
  ],

  coverageReporters: [
    'html',
    'text',
    'lcov',
    'text-summary',
    'json',
    'clover',
    'cobertura',
  ],

  coverageDirectory: '<rootDir>/test_reports/',

  coveragePathIgnorePatterns: [
    '<rootDir>/src/main.ts',
    '<rootDir>/src/types',
    '<rootDir>/src/migrations',
  ],

  testEnvironment: 'node',

  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },

  // Optional global setup/teardown
  globalSetup: '<rootDir>/test/preTestSetup.ts',
  // globalTeardown: '<rootDir>/test/weedFixture.ts',
};

module.exports = config;
