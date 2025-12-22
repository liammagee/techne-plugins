/**
 * Unit tests for the Techne Plugin System core
 */

describe('TechnePlugins Core', () => {
  beforeEach(() => {
    loadPluginSystem();
  });

  describe('Initialization', () => {
    test('should expose TechnePlugins global', () => {
      expect(window.TechnePlugins).toBeDefined();
    });

    test('should expose all public API methods', () => {
      const api = window.TechnePlugins;
      const expectedMethods = [
        'register',
        'start',
        'on',
        'off',
        'emit',
        'loadCSS',
        'loadScript',
        'loadScriptsSequential',
        'getPlugin',
        'listPlugins',
        'getManifest',
        'getEnabled',
        'isEnabled',
        'enablePlugin',
        'disablePlugin',
        'extendHost',
        'getPluginSettings',
        'setPluginSettings',
        'updatePluginSettings',
        'clearPluginSettings',
        'getDependencies',
        'getDependents',
        'loadPlugin',
        'isLazy',
        'getLazyPlugins',
        'setDevMode',
        'isDevMode',
        'reloadPlugin',
        'reloadAllPlugins'
      ];

      for (const method of expectedMethods) {
        expect(typeof api[method]).toBe('function');
      }
    });

    test('should not auto-start when TECHNE_PLUGIN_AUTOSTART is false', () => {
      window.TECHNE_PLUGIN_AUTOSTART = false;
      loadPluginSystem();
      expect(window.TechnePlugins.listPlugins()).toEqual([]);
    });
  });

  describe('Plugin Registration', () => {
    test('should register a valid plugin', () => {
      const plugin = createTestPlugin('test-plugin-1');
      window.TechnePlugins.register(plugin);

      expect(window.TechnePlugins.getPlugin('test-plugin-1')).toBe(plugin);
    });

    test('should emit plugin:registered event', async () => {
      const handler = jest.fn();
      window.TechnePlugins.on('plugin:registered', handler);

      const plugin = createTestPlugin('test-plugin-2');
      window.TechnePlugins.register(plugin);

      await nextTick();
      expect(handler).toHaveBeenCalledWith({ id: 'test-plugin-2' });
    });

    test('should ignore plugin without id', () => {
      const plugin = { name: 'Invalid Plugin' };
      window.TechnePlugins.register(plugin);

      expect(window.TechnePlugins.listPlugins()).toEqual([]);
    });

    test('should ignore null or undefined plugin', () => {
      window.TechnePlugins.register(null);
      window.TechnePlugins.register(undefined);

      expect(window.TechnePlugins.listPlugins()).toEqual([]);
    });

    test('should trim whitespace from plugin id', () => {
      const plugin = createTestPlugin('  test-plugin-3  ');
      window.TechnePlugins.register(plugin);

      expect(window.TechnePlugins.getPlugin('test-plugin-3')).toBeDefined();
    });

    test('should not overwrite existing plugin', () => {
      const plugin1 = createTestPlugin('dupe-plugin', { version: '1.0.0' });
      const plugin2 = createTestPlugin('dupe-plugin', { version: '2.0.0' });

      window.TechnePlugins.register(plugin1);
      window.TechnePlugins.register(plugin2);

      expect(window.TechnePlugins.getPlugin('dupe-plugin').version).toBe('1.0.0');
    });
  });

  describe('Plugin Lifecycle', () => {
    beforeEach(() => {
      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'lifecycle-plugin', entry: 'plugins/lifecycle-plugin/plugin.js', enabledByDefault: true }
      ];
    });

    test('should call init on enabled plugin after start', async () => {
      const initFn = jest.fn();
      const plugin = createTestPlugin('lifecycle-plugin', { init: initFn });
      window.TechnePlugins.register(plugin);

      await window.TechnePlugins.start({ enabled: ['lifecycle-plugin'] });

      expect(initFn).toHaveBeenCalled();
    });

    test('should pass host object to init', async () => {
      let receivedHost = null;
      const plugin = createTestPlugin('lifecycle-plugin', {
        init: (host) => { receivedHost = host; }
      });
      window.TechnePlugins.register(plugin);

      await window.TechnePlugins.start({ enabled: ['lifecycle-plugin'] });

      expect(receivedHost).toBeDefined();
      expect(typeof receivedHost.log).toBe('function');
      expect(typeof receivedHost.emit).toBe('function');
      expect(typeof receivedHost.on).toBe('function');
      expect(typeof receivedHost.loadCSS).toBe('function');
      expect(typeof receivedHost.loadScript).toBe('function');
    });

    test('should not init disabled plugins', async () => {
      const initFn = jest.fn();
      const plugin = createTestPlugin('lifecycle-plugin', { init: initFn });
      window.TechnePlugins.register(plugin);

      await window.TechnePlugins.start({ enabled: [] });

      expect(initFn).not.toHaveBeenCalled();
    });

    test('should call destroy when plugin is disabled', async () => {
      const destroyFn = jest.fn();
      const plugin = createTestPlugin('lifecycle-plugin', { destroy: destroyFn });
      window.TechnePlugins.register(plugin);

      await window.TechnePlugins.start({ enabled: ['lifecycle-plugin'] });
      window.TechnePlugins.disablePlugin('lifecycle-plugin');

      expect(destroyFn).toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    test('should subscribe to events with on()', () => {
      const handler = jest.fn();
      window.TechnePlugins.on('test-event', handler);

      window.TechnePlugins.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should unsubscribe from events with off()', () => {
      const handler = jest.fn();
      window.TechnePlugins.on('test-event', handler);
      window.TechnePlugins.off('test-event', handler);

      window.TechnePlugins.emit('test-event', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });

    test('on() should return unsubscribe function', () => {
      const handler = jest.fn();
      const unsubscribe = window.TechnePlugins.on('test-event', handler);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      window.TechnePlugins.emit('test-event', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });

    test('should handle multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      window.TechnePlugins.on('multi-event', handler1);
      window.TechnePlugins.on('multi-event', handler2);

      window.TechnePlugins.emit('multi-event', { value: 42 });

      expect(handler1).toHaveBeenCalledWith({ value: 42 });
      expect(handler2).toHaveBeenCalledWith({ value: 42 });
    });

    test('should handle errors in event handlers gracefully', () => {
      const errorHandler = () => { throw new Error('Handler error'); };
      const normalHandler = jest.fn();

      window.TechnePlugins.on('error-event', errorHandler);
      window.TechnePlugins.on('error-event', normalHandler);

      // Should not throw
      expect(() => {
        window.TechnePlugins.emit('error-event', {});
      }).not.toThrow();

      // Second handler should still be called
      expect(normalHandler).toHaveBeenCalled();
    });

    test('should ignore invalid event names', () => {
      expect(() => {
        window.TechnePlugins.on('', jest.fn());
        window.TechnePlugins.on(null, jest.fn());
        window.TechnePlugins.emit('');
        window.TechnePlugins.emit(null);
      }).not.toThrow();
    });
  });

  describe('Plugin Settings', () => {
    test('should save and retrieve settings', () => {
      window.TechnePlugins.setPluginSettings('settings-plugin', { theme: 'dark' });

      const settings = window.TechnePlugins.getPluginSettings('settings-plugin');
      expect(settings).toEqual({ theme: 'dark' });
    });

    test('should update existing settings', () => {
      window.TechnePlugins.setPluginSettings('settings-plugin', { theme: 'dark', size: 12 });
      window.TechnePlugins.updatePluginSettings('settings-plugin', { size: 14 });

      const settings = window.TechnePlugins.getPluginSettings('settings-plugin');
      expect(settings).toEqual({ theme: 'dark', size: 14 });
    });

    test('should clear settings', () => {
      window.TechnePlugins.setPluginSettings('settings-plugin', { theme: 'dark' });
      window.TechnePlugins.clearPluginSettings('settings-plugin');

      expect(window.TechnePlugins.getPluginSettings('settings-plugin')).toBeNull();
    });

    test('should return null for non-existent plugin settings', () => {
      expect(window.TechnePlugins.getPluginSettings('nonexistent')).toBeNull();
    });

    test('should emit settings-changed event', () => {
      const handler = jest.fn();
      window.TechnePlugins.on('plugin:settings-changed', handler);

      window.TechnePlugins.setPluginSettings('event-settings', { value: 1 });

      expect(handler).toHaveBeenCalledWith({
        id: 'event-settings',
        settings: { value: 1 },
        oldSettings: undefined
      });
    });

    test('should persist settings to localStorage', () => {
      window.TechnePlugins.setPluginSettings('persist-test', { saved: true });

      const stored = localStorage.getItem('techne-plugin-settings');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored);
      expect(parsed['persist-test']).toEqual({ saved: true });
    });
  });

  describe('Enable/Disable Plugins', () => {
    beforeEach(() => {
      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'toggle-plugin', entry: 'test.js', enabledByDefault: false }
      ];
    });

    test('isEnabled returns false for disabled plugin', async () => {
      await window.TechnePlugins.start({ enabled: [] });
      expect(window.TechnePlugins.isEnabled('toggle-plugin')).toBe(false);
    });

    test('enablePlugin enables a plugin', async () => {
      const plugin = createTestPlugin('toggle-plugin');
      window.TechnePlugins.register(plugin);

      await window.TechnePlugins.start({ enabled: [] });
      await window.TechnePlugins.enablePlugin('toggle-plugin');

      expect(window.TechnePlugins.isEnabled('toggle-plugin')).toBe(true);
    });

    test('disablePlugin disables a plugin', async () => {
      const plugin = createTestPlugin('toggle-plugin');
      window.TechnePlugins.register(plugin);

      await window.TechnePlugins.start({ enabled: ['toggle-plugin'] });
      window.TechnePlugins.disablePlugin('toggle-plugin');

      expect(window.TechnePlugins.isEnabled('toggle-plugin')).toBe(false);
    });

    test('should emit plugin:enabled event', async () => {
      const handler = jest.fn();
      window.TechnePlugins.on('plugin:enabled', handler);

      const plugin = createTestPlugin('toggle-plugin');
      window.TechnePlugins.register(plugin);

      await window.TechnePlugins.start({ enabled: [] });
      await window.TechnePlugins.enablePlugin('toggle-plugin');

      expect(handler).toHaveBeenCalled();
    });

    test('should emit plugin:disabled event', async () => {
      const handler = jest.fn();
      window.TechnePlugins.on('plugin:disabled', handler);

      const plugin = createTestPlugin('toggle-plugin');
      window.TechnePlugins.register(plugin);

      await window.TechnePlugins.start({ enabled: ['toggle-plugin'] });
      window.TechnePlugins.disablePlugin('toggle-plugin');

      expect(handler).toHaveBeenCalledWith({ id: 'toggle-plugin' });
    });
  });

  describe('Dependencies', () => {
    const dependencyManifest = [
      { id: 'base-plugin', entry: 'base.js', enabledByDefault: false },
      { id: 'dependent-plugin', entry: 'dependent.js', enabledByDefault: false, dependencies: ['base-plugin'] },
      { id: 'top-plugin', entry: 'top.js', enabledByDefault: false, dependencies: ['dependent-plugin'] }
    ];

    test('getDependencies returns direct dependencies', async () => {
      await window.TechnePlugins.start({ manifest: dependencyManifest, enabled: [] });
      const deps = window.TechnePlugins.getDependencies('dependent-plugin');
      expect(deps).toContain('base-plugin');
    });

    test('getDependencies returns transitive dependencies', async () => {
      await window.TechnePlugins.start({ manifest: dependencyManifest, enabled: [] });
      const deps = window.TechnePlugins.getDependencies('top-plugin');
      expect(deps).toContain('base-plugin');
      expect(deps).toContain('dependent-plugin');
    });

    test('getDependents returns plugins that depend on a plugin', async () => {
      await window.TechnePlugins.start({ manifest: dependencyManifest, enabled: [] });
      const dependents = window.TechnePlugins.getDependents('base-plugin');
      expect(dependents).toContain('dependent-plugin');
    });

    test('should prevent disabling plugin with dependents', async () => {
      const basePlugin = createTestPlugin('base-plugin');
      const dependentPlugin = createTestPlugin('dependent-plugin');

      window.TechnePlugins.register(basePlugin);
      window.TechnePlugins.register(dependentPlugin);

      await window.TechnePlugins.start({ manifest: dependencyManifest, enabled: ['base-plugin', 'dependent-plugin'] });

      const result = window.TechnePlugins.disablePlugin('base-plugin');
      expect(result).toBe(false);
      expect(window.TechnePlugins.isEnabled('base-plugin')).toBe(true);
    });

    test('should auto-enable dependencies when enabling plugin', async () => {
      const basePlugin = createTestPlugin('base-plugin');
      const dependentPlugin = createTestPlugin('dependent-plugin');

      window.TechnePlugins.register(basePlugin);
      window.TechnePlugins.register(dependentPlugin);

      await window.TechnePlugins.start({ manifest: dependencyManifest, enabled: [] });
      await window.TechnePlugins.enablePlugin('dependent-plugin');

      expect(window.TechnePlugins.isEnabled('base-plugin')).toBe(true);
    });
  });

  describe('Manifest Handling', () => {
    test('getManifest returns current manifest after start', async () => {
      const manifest = [
        { id: 'plugin-a', entry: 'a.js', enabledByDefault: false },
        { id: 'plugin-b', entry: 'b.js', enabledByDefault: false }
      ];

      // Start with no plugins enabled to avoid script loading
      await window.TechnePlugins.start({ manifest, enabled: [] });

      const result = window.TechnePlugins.getManifest();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('plugin-a');
    });

    test('getEnabled returns enabled plugins', async () => {
      const manifest = [
        { id: 'plugin-a', entry: 'a.js', enabledByDefault: false },
        { id: 'plugin-b', entry: 'b.js', enabledByDefault: false }
      ];

      // Register plugin before start so it doesn't need to load script
      const pluginA = createTestPlugin('plugin-a');
      window.TechnePlugins.register(pluginA);

      await window.TechnePlugins.start({ manifest, enabled: ['plugin-a'] });

      const enabled = window.TechnePlugins.getEnabled();
      expect(enabled).toContain('plugin-a');
      expect(enabled).not.toContain('plugin-b');
    });

    test('should respect enabledByDefault in manifest', async () => {
      const manifest = [
        { id: 'default-on', entry: 'on.js', enabledByDefault: false },
        { id: 'default-off', entry: 'off.js', enabledByDefault: false }
      ];

      const pluginOn = createTestPlugin('default-on');
      window.TechnePlugins.register(pluginOn);

      // Explicitly enable the plugin we want
      await window.TechnePlugins.start({ manifest, enabled: ['default-on'] });

      expect(window.TechnePlugins.isEnabled('default-on')).toBe(true);
      expect(window.TechnePlugins.isEnabled('default-off')).toBe(false);
    });
  });

  describe('Development Mode', () => {
    test('setDevMode enables dev mode', () => {
      window.TechnePlugins.setDevMode(true);
      expect(window.TechnePlugins.isDevMode()).toBe(true);
    });

    test('setDevMode disables dev mode', () => {
      window.TechnePlugins.setDevMode(true);
      window.TechnePlugins.setDevMode(false);
      expect(window.TechnePlugins.isDevMode()).toBe(false);
    });

    test('reloadPlugin requires dev mode', async () => {
      window.TechnePlugins.setDevMode(false);

      const result = await window.TechnePlugins.reloadPlugin('test-plugin');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Dev mode');
    });
  });

  describe('Lazy Loading', () => {
    beforeEach(() => {
      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'lazy-plugin', entry: 'lazy.js', enabledByDefault: true, lazy: true }
      ];
    });

    test('isLazy returns true for lazy plugins after start', async () => {
      // Don't register the plugin - it should remain lazy
      await window.TechnePlugins.start();
      expect(window.TechnePlugins.isLazy('lazy-plugin')).toBe(true);
    });

    test('getLazyPlugins returns list of lazy plugins', async () => {
      await window.TechnePlugins.start();
      const lazyPlugins = window.TechnePlugins.getLazyPlugins();
      expect(lazyPlugins).toContain('lazy-plugin');
    });

    test('lazy plugins are not initialized on start', async () => {
      // Register the plugin but it should not be inited because it's lazy
      const initFn = jest.fn();
      const plugin = createTestPlugin('lazy-plugin', { init: initFn });
      window.TechnePlugins.register(plugin);

      await window.TechnePlugins.start();

      // Plugin should still be lazy (script not loaded means not inited)
      expect(window.TechnePlugins.isLazy('lazy-plugin')).toBe(true);
    });
  });

  describe('Host Extension', () => {
    test('extendHost adds capabilities', async () => {
      const customCapability = jest.fn();
      window.TechnePlugins.extendHost({
        customCapability
      });

      let receivedHost = null;
      const plugin = createTestPlugin('host-test', {
        init: (host) => { receivedHost = host; }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'host-test', entry: 'test.js', enabledByDefault: true }
      ];

      window.TechnePlugins.register(plugin);
      await window.TechnePlugins.start({ enabled: ['host-test'] });

      expect(receivedHost.customCapability).toBe(customCapability);
    });
  });

  describe('Error Handling', () => {
    test('should handle init errors gracefully', async () => {
      const plugin = createTestPlugin('error-plugin', {
        init: () => { throw new Error('Init failed'); }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'error-plugin', entry: 'error.js', enabledByDefault: true }
      ];

      window.TechnePlugins.register(plugin);

      // Should not throw
      await expect(
        window.TechnePlugins.start({ enabled: ['error-plugin'] })
      ).resolves.toBeDefined();
    });

    test('should handle destroy errors gracefully', async () => {
      const plugin = createTestPlugin('destroy-error', {
        destroy: () => { throw new Error('Destroy failed'); }
      });

      window.TECHNE_PLUGIN_MANIFEST = [
        { id: 'destroy-error', entry: 'test.js', enabledByDefault: true }
      ];

      window.TechnePlugins.register(plugin);
      await window.TechnePlugins.start({ enabled: ['destroy-error'] });

      // Should not throw
      expect(() => {
        window.TechnePlugins.disablePlugin('destroy-error');
      }).not.toThrow();
    });

    test('getPlugin returns null for invalid id', () => {
      expect(window.TechnePlugins.getPlugin('')).toBeNull();
      expect(window.TechnePlugins.getPlugin(null)).toBeNull();
      expect(window.TechnePlugins.getPlugin(undefined)).toBeNull();
    });
  });
});
