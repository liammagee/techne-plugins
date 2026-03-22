/**
 * Unit tests that load actual theme-manager plugin source files
 * for coverage instrumentation.
 */

describe('Theme Manager Plugin Sources', () => {
  beforeEach(() => {
    loadPluginSystem();

    // Clean up globals
    delete window._TECHNE_THEMES;
    delete window.techneThemeManager;

    // Mock electronAPI so isElectron detection works
    window.electronAPI = { invoke: jest.fn() };
  });

  // =========================================
  // themes.js
  // =========================================
  describe('themes.js', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-theme-manager/themes.js');
    });

    test('should expose _TECHNE_THEMES on window', () => {
      expect(window._TECHNE_THEMES).toBeDefined();
      expect(typeof window._TECHNE_THEMES).toBe('object');
    });

    test('should define light and dark themes', () => {
      expect(window._TECHNE_THEMES.light).toBeDefined();
      expect(window._TECHNE_THEMES.dark).toBeDefined();
      expect(window._TECHNE_THEMES.light.name).toBe('Light');
      expect(window._TECHNE_THEMES.dark.name).toBe('Dark');
    });

    test('dark theme should have techne-dark bodyClass', () => {
      expect(window._TECHNE_THEMES.dark.bodyClass).toBe('techne-dark');
    });

    test('should define brand themes', () => {
      const brandThemes = ['techne-red-light', 'techne-red-dark', 'techne-orange-light', 'techne-orange-dark'];
      for (const id of brandThemes) {
        expect(window._TECHNE_THEMES[id]).toBeDefined();
        expect(window._TECHNE_THEMES[id].name).toBeTruthy();
      }
    });

    test('should define community themes', () => {
      const communityThemes = ['solarized-light', 'solarized-dark', 'nord', 'dracula', 'monokai', 'sepia'];
      for (const id of communityThemes) {
        expect(window._TECHNE_THEMES[id]).toBeDefined();
        expect(window._TECHNE_THEMES[id].tokens).toBeDefined();
        expect(window._TECHNE_THEMES[id].tokens['--techne-bg']).toBeTruthy();
      }
    });

    test('every theme should have name, description, bodyClass, and tokens', () => {
      for (const [id, theme] of Object.entries(window._TECHNE_THEMES)) {
        expect(theme.name).toBeTruthy();
        expect(typeof theme.description).toBe('string');
        expect(typeof theme.bodyClass).toBe('string');
        expect(typeof theme.tokens).toBe('object');
      }
    });

    test('dark themes should have techne-dark bodyClass', () => {
      const darkThemes = ['dark', 'techne-red-dark', 'techne-orange-dark', 'solarized-dark', 'nord', 'dracula', 'monokai'];
      for (const id of darkThemes) {
        expect(window._TECHNE_THEMES[id].bodyClass).toBe('techne-dark');
      }
    });
  });

  // =========================================
  // theme-manager.js
  // =========================================
  describe('theme-manager.js', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-theme-manager/themes.js');
      loadPluginFile('plugins/techne-theme-manager/theme-manager.js');
    });

    afterEach(() => {
      if (window.techneThemeManager?._destroy) {
        window.techneThemeManager._destroy();
      }
      document.body.className = '';
      document.body.removeAttribute('data-techne-theme');
      document.documentElement.style.cssText = '';
      localStorage.clear();
    });

    test('should expose techneThemeManager API on window', () => {
      expect(window.techneThemeManager).toBeDefined();
      expect(typeof window.techneThemeManager.applyTheme).toBe('function');
      expect(typeof window.techneThemeManager.getActiveTheme).toBe('function');
      expect(typeof window.techneThemeManager.getThemes).toBe('function');
      expect(typeof window.techneThemeManager.detectSystemPreference).toBe('function');
    });

    test('_init() should apply default light theme', () => {
      window.techneThemeManager._init({ emit: jest.fn() });
      expect(window.techneThemeManager.getActiveTheme()).toBe('light');
      expect(document.body.getAttribute('data-techne-theme')).toBe('light');
    });

    test('_init() should use saved theme from localStorage', () => {
      localStorage.setItem('techne-theme-active', 'dark');
      window.techneThemeManager._init({ emit: jest.fn() });
      expect(window.techneThemeManager.getActiveTheme()).toBe('dark');
    });

    test('applyTheme() should switch to dark theme', () => {
      window.techneThemeManager._init({ emit: jest.fn() });
      window.techneThemeManager.applyTheme('dark');
      expect(window.techneThemeManager.getActiveTheme()).toBe('dark');
      expect(document.body.classList.contains('techne-dark')).toBe(true);
      expect(document.body.getAttribute('data-techne-theme')).toBe('dark');
    });

    test('applyTheme() should set CSS custom properties from tokens', () => {
      window.techneThemeManager._init({ emit: jest.fn() });
      window.techneThemeManager.applyTheme('nord');
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--techne-bg')).toBeTruthy();
    });

    test('applyTheme() should remove previous theme bodyClass', () => {
      window.techneThemeManager._init({ emit: jest.fn() });
      window.techneThemeManager.applyTheme('dark');
      expect(document.body.classList.contains('techne-dark')).toBe(true);
      window.techneThemeManager.applyTheme('light');
      expect(document.body.classList.contains('techne-dark')).toBe(false);
    });

    test('applyTheme() with unknown theme should warn and not crash', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      window.techneThemeManager._init({ emit: jest.fn() });
      window.techneThemeManager.applyTheme('nonexistent');
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Unknown theme'), 'nonexistent');
      spy.mockRestore();
    });

    test('applyTheme() should emit theme:changed event via host', () => {
      const host = { emit: jest.fn() };
      window.techneThemeManager._init(host);
      window.techneThemeManager.applyTheme('nord');
      expect(host.emit).toHaveBeenCalledWith('theme:changed', expect.objectContaining({ themeId: 'nord' }));
    });

    test('applyTheme() should dispatch DOM CustomEvent', () => {
      window.techneThemeManager._init({ emit: jest.fn() });
      const handler = jest.fn();
      document.addEventListener('techne-theme-changed', handler);
      window.techneThemeManager.applyTheme('dracula');
      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail.themeId).toBe('dracula');
      document.removeEventListener('techne-theme-changed', handler);
    });

    test('getThemes() should return all themes', () => {
      const themes = window.techneThemeManager.getThemes();
      expect(themes.light).toBeDefined();
      expect(themes.dark).toBeDefined();
      expect(themes.nord).toBeDefined();
    });

    test('detectSystemPreference() should return light or dark', () => {
      const pref = window.techneThemeManager.detectSystemPreference();
      expect(['light', 'dark']).toContain(pref);
    });

    test('_destroy() should clean up body classes and attributes', () => {
      window.techneThemeManager._init({ emit: jest.fn() });
      window.techneThemeManager.applyTheme('dark');
      window.techneThemeManager._destroy();
      expect(document.body.classList.contains('techne-dark')).toBe(false);
      expect(document.body.getAttribute('data-techne-theme')).toBeNull();
    });

    test('_init() with host getSetting should read saved theme', () => {
      const host = {
        emit: jest.fn(),
        getSetting: jest.fn((key) => key === 'activeTheme' ? 'monokai' : undefined)
      };
      window.techneThemeManager._init(host);
      expect(window.techneThemeManager.getActiveTheme()).toBe('monokai');
    });

    test('_init() with followSystem enabled should detect system preference', () => {
      const host = {
        emit: jest.fn(),
        getSetting: jest.fn((key) => key === 'followSystem' ? true : undefined)
      };
      window.techneThemeManager._init(host);
      // Should have applied either light or dark based on system pref
      expect(['light', 'dark']).toContain(window.techneThemeManager.getActiveTheme());
    });

    test('applyTheme() should persist to localStorage', () => {
      window.techneThemeManager._init({ emit: jest.fn() });
      window.techneThemeManager.applyTheme('sepia');
      expect(localStorage.getItem('techne-theme-active')).toBe('sepia');
    });
  });

  // =========================================
  // theme-editor.js
  // =========================================
  describe('theme-editor.js', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-theme-manager/themes.js');
      loadPluginFile('plugins/techne-theme-manager/theme-manager.js');
      window.techneThemeManager._init({ emit: jest.fn() });
      loadPluginFile('plugins/techne-theme-manager/theme-editor.js');
    });

    afterEach(() => {
      if (window.techneThemeManager?._destroy) window.techneThemeManager._destroy();
      document.body.className = '';
      document.body.removeAttribute('data-techne-theme');
      document.documentElement.style.cssText = '';
      localStorage.clear();
      delete window.techneThemeEditor;
    });

    test('should expose techneThemeEditor API on window', () => {
      expect(window.techneThemeEditor).toBeDefined();
      expect(typeof window.techneThemeEditor.getPresets).toBe('function');
      expect(typeof window.techneThemeEditor.getVarGroups).toBe('function');
      expect(typeof window.techneThemeEditor.loadCustomThemes).toBe('function');
      expect(typeof window.techneThemeEditor.saveCustomThemes).toBe('function');
      expect(typeof window.techneThemeEditor.applyThemeVars).toBe('function');
      expect(typeof window.techneThemeEditor.clearThemeVars).toBe('function');
      expect(typeof window.techneThemeEditor.resetToDefault).toBe('function');
      expect(typeof window.techneThemeEditor.toHex).toBe('function');
      expect(typeof window.techneThemeEditor.restoreTheme).toBe('function');
    });

    test('getVarGroups() should return groups with vars arrays', () => {
      const groups = window.techneThemeEditor.getVarGroups();
      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].label).toBeTruthy();
      expect(Array.isArray(groups[0].vars)).toBe(true);
    });

    test('loadCustomThemes() should return empty object by default', () => {
      const themes = window.techneThemeEditor.loadCustomThemes();
      expect(themes).toEqual({});
    });

    test('saveCustomThemes() and loadCustomThemes() round-trip', () => {
      const custom = { myTheme: { name: 'My Theme', base: 'light', vars: { '--techne-bg': '#fff' } } };
      window.techneThemeEditor.saveCustomThemes(custom);
      const loaded = window.techneThemeEditor.loadCustomThemes();
      expect(loaded.myTheme).toBeDefined();
      expect(loaded.myTheme.name).toBe('My Theme');
    });

    test('applyThemeVars() should set CSS custom properties', () => {
      window.techneThemeEditor.applyThemeVars({ '--techne-bg': '#123456' });
      expect(document.documentElement.style.getPropertyValue('--techne-bg')).toBe('#123456');
    });

    test('clearThemeVars() should remove CSS custom properties', () => {
      window.techneThemeEditor.applyThemeVars({ '--techne-bg': '#123456' });
      window.techneThemeEditor.clearThemeVars();
      expect(document.documentElement.style.getPropertyValue('--techne-bg')).toBe('');
    });

    test('resetToDefault() should clear vars and reset theme to light', () => {
      window.techneThemeEditor.applyThemeVars({ '--techne-bg': '#000' });
      window.techneThemeEditor.setActiveCustomTheme('custom:foo');
      window.techneThemeEditor.resetToDefault();
      expect(window.techneThemeEditor.getActiveCustomTheme()).toBeNull();
      expect(window.techneThemeManager.getActiveTheme()).toBe('light');
    });

    test('toHex() should convert rgb to hex', () => {
      expect(window.techneThemeEditor.toHex('rgb(255, 0, 128)')).toBe('#ff0080');
    });

    test('toHex() should expand short hex', () => {
      expect(window.techneThemeEditor.toHex('#abc')).toBe('#aabbcc');
    });

    test('toHex() should pass through 6-digit hex', () => {
      expect(window.techneThemeEditor.toHex('#ff0080')).toBe('#ff0080');
    });

    test('toHex() should handle transparent and null', () => {
      expect(window.techneThemeEditor.toHex('transparent')).toBe('#000000');
      expect(window.techneThemeEditor.toHex(null)).toBe('#000000');
    });

    test('applyCustomTheme() should apply saved custom theme', () => {
      const custom = { test: { name: 'Test', base: 'dark', vars: { '--techne-accent': '#ff0000' } } };
      window.techneThemeEditor.saveCustomThemes(custom);
      window.techneThemeEditor.applyCustomTheme('test');
      expect(document.documentElement.style.getPropertyValue('--techne-accent')).toBe('#ff0000');
      expect(window.techneThemeEditor.getActiveCustomTheme()).toBe('custom:test');
    });

    test('setActiveCustomTheme() and getActiveCustomTheme() round-trip', () => {
      window.techneThemeEditor.setActiveCustomTheme('preset:nord');
      expect(window.techneThemeEditor.getActiveCustomTheme()).toBe('preset:nord');
      window.techneThemeEditor.setActiveCustomTheme(null);
      expect(window.techneThemeEditor.getActiveCustomTheme()).toBeNull();
    });

    test('restoreTheme() with no active custom theme should be a no-op', () => {
      window.techneThemeEditor.setActiveCustomTheme(null);
      // Should not throw
      window.techneThemeEditor.restoreTheme();
    });

    test('_setHost() should configure host for settings persistence', () => {
      const host = { getSetting: jest.fn(), setSetting: jest.fn() };
      window.techneThemeEditor._setHost(host);
      window.techneThemeEditor.saveCustomThemes({ t: { name: 'T' } });
      expect(host.setSetting).toHaveBeenCalledWith('customThemes', expect.any(Object));
    });

    test('loadCustomThemes() should use host getSetting when available', () => {
      const customThemes = { hosted: { name: 'Hosted' } };
      const host = { getSetting: jest.fn((k) => k === 'customThemes' ? customThemes : undefined), setSetting: jest.fn() };
      window.techneThemeEditor._setHost(host);
      const result = window.techneThemeEditor.loadCustomThemes();
      expect(result.hosted).toBeDefined();
    });

    test('getActiveCustomTheme() should use host getSetting when available', () => {
      const host = { getSetting: jest.fn((k) => k === 'activeCustomTheme' ? 'preset:nord' : undefined), setSetting: jest.fn() };
      window.techneThemeEditor._setHost(host);
      expect(window.techneThemeEditor.getActiveCustomTheme()).toBe('preset:nord');
    });

    test('setActiveCustomTheme() should use host setSetting when available', () => {
      const host = { getSetting: jest.fn(), setSetting: jest.fn() };
      window.techneThemeEditor._setHost(host);
      window.techneThemeEditor.setActiveCustomTheme('custom:mine');
      expect(host.setSetting).toHaveBeenCalledWith('activeCustomTheme', 'custom:mine');
    });

    test('applyCustomTheme() with nonexistent theme should be a no-op', () => {
      // Should not throw
      window.techneThemeEditor.applyCustomTheme('nonexistent');
    });

    test('toHex() should handle rgba format', () => {
      expect(window.techneThemeEditor.toHex('rgba(0, 128, 255, 0.5)')).toBe('#0080ff');
    });

    test('toHex() should handle unrecognized format', () => {
      expect(window.techneThemeEditor.toHex('hsl(0, 100%, 50%)')).toBe('#000000');
    });

    test('restoreTheme() with custom: prefix should apply custom theme', () => {
      jest.useFakeTimers();
      const custom = { myTheme: { name: 'My', base: 'light', vars: { '--techne-accent': '#00ff00' } } };
      window.techneThemeEditor.saveCustomThemes(custom);
      window.techneThemeEditor.setActiveCustomTheme('custom:myTheme');
      window.techneThemeEditor.restoreTheme();
      jest.advanceTimersByTime(500);
      expect(document.documentElement.style.getPropertyValue('--techne-accent')).toBe('#00ff00');
      jest.useRealTimers();
    });
  });

  // =========================================
  // plugin.js
  // =========================================
  describe('plugin.js', () => {
    test('should register theme-manager plugin with TechnePlugins', () => {
      loadPluginFile('plugins/techne-theme-manager/plugin.js');
      const plugin = window.TechnePlugins.getPlugin('techne-theme-manager');
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('Techne Theme Manager');
    });

    test('should define activeTheme and followSystem settings', () => {
      loadPluginFile('plugins/techne-theme-manager/plugin.js');
      const plugin = window.TechnePlugins.getPlugin('techne-theme-manager');
      expect(plugin.settings.activeTheme).toBeDefined();
      expect(plugin.settings.activeTheme.type).toBe('select');
      expect(plugin.settings.activeTheme.options.length).toBeGreaterThan(0);
      expect(plugin.settings.followSystem).toBeDefined();
      expect(plugin.settings.followSystem.type).toBe('boolean');
    });
  });
});
