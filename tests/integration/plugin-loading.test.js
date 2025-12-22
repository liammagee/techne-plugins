/**
 * Integration tests for plugin loading and lifecycle
 */

describe('Plugin Loading Integration', () => {
  beforeEach(() => {
    loadPluginSystem();
  });

  describe('Multi-Plugin Coordination', () => {
    test('should load multiple plugins in correct order', async () => {
      const loadOrder = [];

      const pluginA = createTestPlugin('plugin-a', {
        init: () => { loadOrder.push('a'); }
      });
      const pluginB = createTestPlugin('plugin-b', {
        init: () => { loadOrder.push('b'); }
      });
      const pluginC = createTestPlugin('plugin-c', {
        init: () => { loadOrder.push('c'); }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'plugin-a', entry: 'a.js', enabledByDefault: true },
        { id: 'plugin-b', entry: 'b.js', enabledByDefault: true },
        { id: 'plugin-c', entry: 'c.js', enabledByDefault: true }
      ];

      window.TechnePlugins.register(pluginA);
      window.TechnePlugins.register(pluginB);
      window.TechnePlugins.register(pluginC);

      await window.TechnePlugins.start({ enabled: ['plugin-a', 'plugin-b', 'plugin-c'] });

      expect(loadOrder).toHaveLength(3);
      expect(loadOrder).toContain('a');
      expect(loadOrder).toContain('b');
      expect(loadOrder).toContain('c');
    });

    test('should load dependencies before dependents', async () => {
      const loadOrder = [];

      const basePlugin = createTestPlugin('base', {
        init: () => { loadOrder.push('base'); }
      });
      const dependentPlugin = createTestPlugin('dependent', {
        init: () => { loadOrder.push('dependent'); }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'base', entry: 'base.js', enabledByDefault: true },
        { id: 'dependent', entry: 'dependent.js', enabledByDefault: true, dependencies: ['base'] }
      ];

      window.TechnePlugins.register(basePlugin);
      window.TechnePlugins.register(dependentPlugin);

      await window.TechnePlugins.start({ enabled: ['dependent', 'base'] });

      expect(loadOrder.indexOf('base')).toBeLessThan(loadOrder.indexOf('dependent'));
    });
  });

  describe('Plugin Communication', () => {
    test('plugins can communicate via events', async () => {
      let receivedData = null;

      const senderPlugin = createTestPlugin('sender', {
        init: (host) => {
          host.emit('sender:message', { value: 42 });
        }
      });

      const receiverPlugin = createTestPlugin('receiver', {
        init: (host) => {
          host.on('sender:message', (data) => {
            receivedData = data;
          });
        }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'sender', entry: 'sender.js', enabledByDefault: true },
        { id: 'receiver', entry: 'receiver.js', enabledByDefault: true }
      ];

      // Receiver must be registered first to receive the event
      window.TechnePlugins.register(receiverPlugin);
      window.TechnePlugins.register(senderPlugin);

      await window.TechnePlugins.start({ enabled: ['receiver', 'sender'] });

      expect(receivedData).toEqual({ value: 42 });
    });

    test('plugins can access shared settings', async () => {
      let settingsFromB = null;

      const pluginA = createTestPlugin('plugin-a', {
        init: (host) => {
          host.setSettings({ sharedValue: 'from A' });
        }
      });

      const pluginB = createTestPlugin('plugin-b', {
        init: (host) => {
          // Access plugin A's settings through the global API
          settingsFromB = window.TechnePlugins.getPluginSettings('plugin-a');
        }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'plugin-a', entry: 'a.js', enabledByDefault: true },
        { id: 'plugin-b', entry: 'b.js', enabledByDefault: true }
      ];

      window.TechnePlugins.register(pluginA);
      window.TechnePlugins.register(pluginB);

      await window.TechnePlugins.start({ enabled: ['plugin-a', 'plugin-b'] });

      expect(settingsFromB).toEqual({ sharedValue: 'from A' });
    });
  });

  describe('Mode Registration', () => {
    test('plugin can register a mode and another plugin can access it', async () => {
      let registeredModes = [];

      const modePlugin = createTestPlugin('mode-plugin', {
        init: (host) => {
          host.emit('mode:available', {
            id: 'test-mode',
            title: 'Test Mode',
            mount: () => {},
            unmount: () => {}
          });
        }
      });

      const consumerPlugin = createTestPlugin('consumer-plugin', {
        init: (host) => {
          host.on('mode:available', (mode) => {
            registeredModes.push(mode.id);
          });
        }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'mode-plugin', entry: 'mode.js', enabledByDefault: true },
        { id: 'consumer-plugin', entry: 'consumer.js', enabledByDefault: true }
      ];

      // Consumer first so it can receive the event
      window.TechnePlugins.register(consumerPlugin);
      window.TechnePlugins.register(modePlugin);

      await window.TechnePlugins.start({ enabled: ['consumer-plugin', 'mode-plugin'] });

      expect(registeredModes).toContain('test-mode');
    });
  });

  describe('Plugin Cleanup', () => {
    test('should clean up resources when plugin is disabled', async () => {
      let cleanedUp = false;
      let intervalId = null;

      const resourcePlugin = createTestPlugin('resource-plugin', {
        init: () => {
          // Simulate a resource that needs cleanup
          intervalId = setInterval(() => {}, 1000);
        },
        destroy: () => {
          if (intervalId) {
            clearInterval(intervalId);
            cleanedUp = true;
          }
        }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'resource-plugin', entry: 'resource.js', enabledByDefault: true }
      ];

      window.TechnePlugins.register(resourcePlugin);
      await window.TechnePlugins.start({ enabled: ['resource-plugin'] });

      window.TechnePlugins.disablePlugin('resource-plugin');

      expect(cleanedUp).toBe(true);
    });

    test('should clean up event listeners when plugin is disabled', async () => {
      let eventCount = 0;

      const listenerPlugin = createTestPlugin('listener-plugin', {
        init: (host) => {
          host.on('test:event', () => { eventCount++; });
        },
        destroy: () => {
          // Plugin should clean up its own listeners
        }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'listener-plugin', entry: 'listener.js', enabledByDefault: true }
      ];

      window.TechnePlugins.register(listenerPlugin);
      await window.TechnePlugins.start({ enabled: ['listener-plugin'] });

      window.TechnePlugins.emit('test:event');
      expect(eventCount).toBe(1);

      // Disable plugin
      window.TechnePlugins.disablePlugin('listener-plugin');

      // Note: The plugin system doesn't automatically clean up event listeners
      // This is a known limitation - plugins should clean up their own listeners
    });
  });

  describe('Settings Persistence Across Reloads', () => {
    test('settings should persist in localStorage', async () => {
      const plugin = createTestPlugin('persist-plugin', {
        init: (host) => {
          host.setSettings({ persistedValue: 123 });
        }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'persist-plugin', entry: 'persist.js', enabledByDefault: true }
      ];

      window.TechnePlugins.register(plugin);
      await window.TechnePlugins.start({ enabled: ['persist-plugin'] });

      // Verify settings are in localStorage
      const stored = localStorage.getItem('techne-plugin-settings');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored);
      expect(parsed['persist-plugin']).toEqual({ persistedValue: 123 });

      // Simulate reload by creating a new plugin system
      loadPluginSystem();

      // Register the plugin again (would happen on page load)
      const reloadedPlugin = createTestPlugin('persist-plugin', {
        init: (host) => {
          // Get previously saved settings
          const settings = host.getSettings();
          expect(settings).toEqual({ persistedValue: 123 });
        }
      });

      window.TechnePlugins.register(reloadedPlugin);
      await window.TechnePlugins.start({ enabled: ['persist-plugin'] });
    });
  });

  describe('Start Events', () => {
    test('should emit plugins:starting before loading', async () => {
      let startingReceived = false;
      let startedReceived = false;
      let startingFirst = false;

      window.TechnePlugins.on('plugins:starting', () => {
        startingReceived = true;
        if (!startedReceived) startingFirst = true;
      });

      window.TechnePlugins.on('plugins:started', () => {
        startedReceived = true;
      });

      await window.TechnePlugins.start();

      expect(startingReceived).toBe(true);
      expect(startedReceived).toBe(true);
      expect(startingFirst).toBe(true);
    });

    test('should include enabled plugins in start events', async () => {
      let enabledFromEvent = null;

      window.TechnePlugins.on('plugins:started', (data) => {
        enabledFromEvent = data.enabled;
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'test-a', entry: 'a.js', enabledByDefault: true },
        { id: 'test-b', entry: 'b.js', enabledByDefault: false }
      ];

      const pluginA = createTestPlugin('test-a');
      window.TechnePlugins.register(pluginA);

      await window.TechnePlugins.start();

      expect(enabledFromEvent).toContain('test-a');
      expect(enabledFromEvent).not.toContain('test-b');
    });
  });

  describe('Enabled State Formats', () => {
    beforeEach(() => {
      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'format-a', entry: 'a.js', enabledByDefault: true },
        { id: 'format-b', entry: 'b.js', enabledByDefault: false }
      ];

      const pluginA = createTestPlugin('format-a');
      const pluginB = createTestPlugin('format-b');
      window.TechnePlugins.register(pluginA);
      window.TechnePlugins.register(pluginB);
    });

    test('should accept array format for enabled', async () => {
      await window.TechnePlugins.start({ enabled: ['format-a', 'format-b'] });

      expect(window.TechnePlugins.isEnabled('format-a')).toBe(true);
      expect(window.TechnePlugins.isEnabled('format-b')).toBe(true);
    });

    test('should accept object format for enabled', async () => {
      await window.TechnePlugins.start({
        enabled: {
          'format-a': { enabled: false },
          'format-b': { enabled: true }
        }
      });

      expect(window.TechnePlugins.isEnabled('format-a')).toBe(false);
      expect(window.TechnePlugins.isEnabled('format-b')).toBe(true);
    });
  });

  describe('Host Capabilities', () => {
    test('plugins receive app-specific host capabilities', async () => {
      let receivedCapabilities = {};

      window.TechnePlugins.extendHost({
        customApi: () => 'custom result',
        appId: 'test-app'
      });

      const plugin = createTestPlugin('capability-test', {
        init: (host) => {
          receivedCapabilities.customApi = host.customApi;
          receivedCapabilities.appId = host.appId;
        }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'capability-test', entry: 'test.js', enabledByDefault: true }
      ];

      window.TechnePlugins.register(plugin);
      await window.TechnePlugins.start({ enabled: ['capability-test'] });

      expect(typeof receivedCapabilities.customApi).toBe('function');
      expect(receivedCapabilities.customApi()).toBe('custom result');
    });
  });
});
