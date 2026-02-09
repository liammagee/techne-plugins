/**
 * Jest setup for JSDOM environment
 * Provides browser-like environment for testing plugins
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index) => Object.keys(store)[index] || null
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Reset mocks before each test
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();

  // Clean up TechnePlugins if it exists
  if (window.TechnePlugins) {
    delete window.TechnePlugins;
  }
  if (window.TECHNE_PLUGIN_MANIFEST) {
    delete window.TECHNE_PLUGIN_MANIFEST;
  }
  if (window.TECHNE_PLUGIN_AUTOSTART) {
    delete window.TECHNE_PLUGIN_AUTOSTART;
  }
  if (window.TECHNE_PLUGIN_QUEUE) {
    delete window.TECHNE_PLUGIN_QUEUE;
  }
});

// Helper function to load the plugin system fresh
global.loadPluginSystem = () => {
  // Reset any existing state
  delete window.TechnePlugins;

  // Use jest.isolateModules + require() for coverage instrumentation
  const path = require('path');
  const systemPath = path.resolve(__dirname, '../../core/techne-plugin-system.js');
  jest.isolateModules(() => {
    require(systemPath);
  });

  return window.TechnePlugins;
};

// Helper to create a minimal plugin
global.createTestPlugin = (id, options = {}) => ({
  id,
  name: options.name || `Test Plugin ${id}`,
  version: options.version || '1.0.0',
  init: options.init || jest.fn(() => Promise.resolve()),
  destroy: options.destroy || jest.fn(),
  ...options
});

// Helper to wait for next tick
global.nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to wait for condition
global.waitFor = async (condition, timeout = 5000, interval = 50) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
};

// Helper to load a plugin source file for coverage instrumentation.
// Uses jest.isolateModules + require() so Jest's transform pipeline
// instruments the code and each call gets a fresh execution.
// The { windowKey } option copies module.exports onto window[key].
global.loadPluginFile = (relativePath, opts = {}) => {
  const path = require('path');
  const filePath = path.resolve(__dirname, '../..', relativePath);
  let result;
  jest.isolateModules(() => {
    result = require(filePath);
  });
  if (opts.windowKey && result) {
    window[opts.windowKey] = result;
  }
};
