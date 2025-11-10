/** @type {import('jest').Config} */
const config = {
  // Use ts-jest for TypeScript files
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '.',

  // Test file patterns - only include __tests__ directories
  testMatch: [
    '<rootDir>/lib/api/utils/__tests__/**/*.test.ts',
    '<rootDir>/lib/api/utils/__tests__/**/*.test.tsx',
  ],

  // Module paths
  moduleNameMapper: {
    // Map @ to the current directory
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Transform files with ts-jest
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          // Allow 'as any' and other TypeScript features
          strict: false,
        },
        // Use Babel to parse TypeScript
        babelConfig: false,
        // Disable type checking for faster tests (optional)
        isolatedModules: true,
      },
    ],
  },

  // Transform ESM modules from node_modules if needed
  transformIgnorePatterns: [
    'node_modules/(?!(@linkwarden)/)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'lib/api/utils/**/*.ts',
    '!lib/api/utils/**/*.test.ts',
    '!lib/api/utils/__tests__/**',
  ],

  // Setup files
  setupFilesAfterEnv: [],

  // Ignore patterns - exclude e2e, node_modules, .next
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/',
    '/playwright/',
    '\\.spec\\.ts$',  // Ignore Playwright spec files
  ],

  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/e2e/',
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Handle module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Globals for ts-jest
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};

module.exports = config;
