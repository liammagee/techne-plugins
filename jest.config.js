module.exports = {
  testTimeout: 30000,
  projects: [
    {
      displayName: 'Unit - Plugin System',
      testMatch: ['<rootDir>/tests/unit/core/**/*.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jsdom.setup.js']
    },
    {
      displayName: 'Unit - Plugins',
      testMatch: ['<rootDir>/tests/unit/plugins/**/*.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jsdom.setup.js']
    },
    {
      displayName: 'Integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/jsdom.setup.js']
    }
  ],
  collectCoverageFrom: [
    'core/**/*.js',
    'plugins/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/test-apps/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
