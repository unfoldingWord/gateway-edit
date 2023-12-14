module.exports = {
  'preset': 'vite-jest',
  'roots': ['<rootDir>'],
  // 'transform': { '^.+\\.ts?$': 'ts-jest' },
  'moduleFileExtensions': [
    'js',
    'jsx',
    'ts',
  ],
  'coveragePathIgnorePatterns': [
    '/node_modules/',
    '/.yalc/',
    'scripts',
    'cypress',
  ],
  'testPathIgnorePatterns': [
    '/node_modules/',
    'components',
    'cypress',
    '/.yalc/',
    'scripts',
  ],
  'testMatch': [
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  'moduleNameMapper': {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  'collectCoverageFrom': [
    './src/**.{js,jsx,ts}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  'coverageDirectory': 'jest-coverage',
}
