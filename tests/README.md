# Techne Plugins Test Suite

This directory contains a comprehensive testing infrastructure for the Techne plugin system and all plugins.

## Directory Structure

```
tests/
├── e2e/                    # End-to-end tests using Playwright
│   └── plugin-system.spec.js
├── fixtures/               # Test fixtures and sample data
│   ├── test-markdown.md
│   ├── test-maze.md
│   └── test-presentation.md
├── integration/            # Integration tests
│   └── plugin-loading.test.js
├── setup/                  # Test setup and utilities
│   └── jsdom.setup.js
└── unit/                   # Unit tests
    ├── core/              # Plugin system core tests
    │   └── plugin-system.test.js
    └── plugins/           # Individual plugin tests
        ├── markdown-renderer.test.js
        ├── maze.test.js
        └── presentations.test.js

test-apps/
├── electron/              # Minimal Electron app for testing
│   ├── main.js
│   ├── preload.js
│   ├── index.html
│   └── app.js
├── web/                   # Minimal web app for testing
│   ├── server.js
│   ├── index.html
│   └── app.js
└── shared/                # Shared test utilities
```

## Running Tests

### Unit Tests

Run all unit tests:
```bash
npm run test:unit
```

Run unit tests in watch mode:
```bash
npm run test:watch
```

### Integration Tests

```bash
npm run test:integration
```

### End-to-End Tests

Run all E2E tests:
```bash
npm run test:e2e
```

Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

Run E2E tests in headed mode:
```bash
npm run test:e2e:headed
```

### All Tests

```bash
npm run test:all
```

### Test Coverage

```bash
npm run test:coverage
```

## Test Apps

### Web Test App

Start the web test app:
```bash
npm run serve:web
```

Access at http://localhost:3456

Features:
- Plugin enable/disable controls
- Plugin view mounting/unmounting
- Event logging
- Built-in test runner
- API endpoints for testing

### Electron Test App

Start the Electron test app:
```bash
npm run serve:electron
```

Or with dev mode:
```bash
npm run dev:electron
```

Features:
- Same UI as web app
- Tests Electron-specific IPC
- Tests preload script communication
- Full plugin lifecycle testing

## Writing Tests

### Unit Tests

Unit tests are written using Jest and use JSDOM for DOM simulation.

```javascript
describe('My Plugin Feature', () => {
  beforeEach(() => {
    loadPluginSystem();
  });

  test('should do something', () => {
    const plugin = createTestPlugin('my-plugin');
    window.TechnePlugins.register(plugin);
    // assertions
  });
});
```

### Integration Tests

Integration tests test multiple components working together:

```javascript
describe('Plugin Coordination', () => {
  test('plugins can communicate via events', async () => {
    // Setup multiple plugins
    // Verify they interact correctly
  });
});
```

### E2E Tests

E2E tests use Playwright to test the full application:

```javascript
test('should enable plugin when toggle clicked', async ({ page }) => {
  await page.goto('/');
  const plugin = page.locator('.plugin-item').first();
  await plugin.click();
  await page.locator('#btn-toggle').click();
  await expect(plugin.locator('.status-badge')).toHaveClass(/enabled/);
});
```

## Test Utilities

### `loadPluginSystem()`

Loads a fresh instance of the plugin system.

### `createTestPlugin(id, options)`

Creates a mock plugin for testing.

```javascript
const plugin = createTestPlugin('test-plugin', {
  init: jest.fn(),
  destroy: jest.fn(),
  version: '1.0.0'
});
```

### `nextTick()`

Waits for the next event loop tick.

### `waitFor(condition, timeout, interval)`

Waits for a condition to become true.

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to these branches

The CI pipeline includes:
1. Unit tests
2. Integration tests
3. E2E tests (Chromium)
4. Cross-browser E2E tests (Chrome, Firefox, WebKit)
5. Test coverage report

See `.github/workflows/test.yml` for the full configuration.

## Coverage

Target coverage thresholds:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

View coverage report after running:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```
