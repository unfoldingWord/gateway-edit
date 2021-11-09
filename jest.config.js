module.exports = {
  'roots': ['<rootDir>'],
  // 'transform': { '^.+\\.ts?$': 'ts-jest' },
  'moduleFileExtensions': [
    'js',
    'ts',
  ],
  'coveragePathIgnorePatterns': [
    '/node_modules/',
  ],
  'testPathIgnorePatterns': [
    '/node_modules/',
    'components',
    'cypress',
  ],
  'testMatch': [
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  'moduleNameMapper': {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  'collectCoverageFrom': [
    './src/**.{js,jsx,ts}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  'coverageDirectory': './coverage/',
};
