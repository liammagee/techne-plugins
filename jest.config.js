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
    '!**/test-apps/**',
    // Exclude files that require React/Babel runtime or complex canvas APIs
    // not available in JSDOM unit tests
    '!plugins/techne-ai-tutor/**',
    '!plugins/techne-presentations/MarkdownPreziApp.js',
    '!plugins/techne-backdrop/fauna-overlay.js',
    '!plugins/techne-backdrop/fauna-overlay-extended.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 43,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
