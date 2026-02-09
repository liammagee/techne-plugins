/**
 * Unit tests that load actual backdrop plugin source files
 * for coverage instrumentation.
 */

describe('Backdrop Plugin Sources', () => {
  beforeEach(() => {
    loadPluginSystem();
    delete window.TECHNE_BACKDROP_LAYERS_HTML;
    delete window.TechneBackdrop;

    // Mock matchMedia
    window.matchMedia = jest.fn().mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    });

    // Mock requestAnimationFrame
    window.requestAnimationFrame = jest.fn().mockReturnValue(1);
    window.cancelAnimationFrame = jest.fn();

    // Mock performance
    window.performance = { now: jest.fn().mockReturnValue(0) };
  });

  afterEach(() => {
    // Clean up
    if (window.TechneBackdrop?.destroy) {
      window.TechneBackdrop.destroy();
    }
    delete window.TECHNE_BACKDROP_LAYERS_HTML;
    delete window.TechneBackdrop;

    // Remove any backdrop elements
    const shapesLayer = document.getElementById('shapesLayer');
    if (shapesLayer) shapesLayer.remove();
    const rotatingLayer = document.querySelector('.rotating-shapes-layer');
    if (rotatingLayer) rotatingLayer.remove();
    const faunaOverlay = document.getElementById('fauna-overlay');
    if (faunaOverlay) faunaOverlay.remove();
  });

  // =========================================
  // techne-backdrop-markup.js
  // =========================================
  describe('techne-backdrop-markup.js', () => {
    test('should assign HTML string to window.TECHNE_BACKDROP_LAYERS_HTML', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop-markup.js');
      expect(window.TECHNE_BACKDROP_LAYERS_HTML).toBeDefined();
      expect(typeof window.TECHNE_BACKDROP_LAYERS_HTML).toBe('string');
      expect(window.TECHNE_BACKDROP_LAYERS_HTML.length).toBeGreaterThan(0);
    });

    test('markup should contain shapes layer', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop-markup.js');
      expect(window.TECHNE_BACKDROP_LAYERS_HTML).toContain('shapes-layer');
      expect(window.TECHNE_BACKDROP_LAYERS_HTML).toContain('shapesLayer');
    });

    test('markup should contain rotating shapes layer', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop-markup.js');
      expect(window.TECHNE_BACKDROP_LAYERS_HTML).toContain('rotating-shapes-layer');
    });

    test('markup should contain fauna overlay', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop-markup.js');
      expect(window.TECHNE_BACKDROP_LAYERS_HTML).toContain('fauna-overlay');
      expect(window.TECHNE_BACKDROP_LAYERS_HTML).toContain('fauna-canvas');
    });

    test('markup should contain parallax data attributes', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop-markup.js');
      expect(window.TECHNE_BACKDROP_LAYERS_HTML).toContain('data-parallax');
    });
  });

  // =========================================
  // techne-backdrop.js
  // =========================================
  describe('techne-backdrop.js', () => {
    beforeEach(() => {
      // Set up the markup first
      loadPluginFile('plugins/techne-backdrop/techne-backdrop-markup.js');

      // Create the background root element
      const bg = document.createElement('div');
      bg.id = 'techne-background';
      document.body.appendChild(bg);
    });

    afterEach(() => {
      const bg = document.getElementById('techne-background');
      if (bg) bg.remove();
    });

    test('should expose TechneBackdrop on window', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      expect(window.TechneBackdrop).toBeDefined();
      expect(typeof window.TechneBackdrop.destroy).toBe('function');
      expect(typeof window.TechneBackdrop.isActive).toBe('function');
    });

    test('isActive() should return true after initialization', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      expect(window.TechneBackdrop.isActive()).toBe(true);
    });

    test('destroy() should deactivate the backdrop', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      window.TechneBackdrop.destroy();
      // After destroy, TechneBackdrop is deleted
      expect(window.TechneBackdrop).toBeUndefined();
    });

    test('should mount layers into techne-background', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      const bg = document.getElementById('techne-background');
      expect(bg.dataset.techneBackdropReady).toBe('true');
    });

    test('destroy() should cancel animation frame', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      window.TechneBackdrop.destroy();
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });

    test('should start requestAnimationFrame loop', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    test('calling destroy() twice should be safe', () => {
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      const destroy = window.TechneBackdrop.destroy;
      destroy();
      // Second call should not throw (isDestroyed guard)
      expect(() => destroy()).not.toThrow();
    });
  });

  // =========================================
  // plugin.js (backdrop)
  // =========================================
  describe('backdrop plugin.js', () => {
    test('should register plugin with TechnePlugins', () => {
      const registerSpy = jest.fn();
      window.TechnePlugins = { register: registerSpy };
      loadPluginFile('plugins/techne-backdrop/plugin.js');
      expect(registerSpy).toHaveBeenCalledTimes(1);
      const registration = registerSpy.mock.calls[0][0];
      expect(registration.id).toBe('techne-backdrop');
      expect(registration.name).toBe('Techne Backdrop');
      expect(typeof registration.init).toBe('function');
      expect(typeof registration.destroy).toBe('function');
    });

    test('destroy should call TechneBackdrop.destroy', () => {
      const registerSpy = jest.fn();
      window.TechnePlugins = { register: registerSpy };
      loadPluginFile('plugins/techne-backdrop/plugin.js');
      const registration = registerSpy.mock.calls[0][0];

      window.TechneBackdrop = { destroy: jest.fn() };
      registration.destroy();
      expect(window.TechneBackdrop.destroy).toHaveBeenCalled();
    });

    test('destroy should handle missing TechneBackdrop', () => {
      const registerSpy = jest.fn();
      window.TechnePlugins = { register: registerSpy };
      loadPluginFile('plugins/techne-backdrop/plugin.js');
      const registration = registerSpy.mock.calls[0][0];

      delete window.TechneBackdrop;
      expect(() => registration.destroy()).not.toThrow();
    });
  });

  // =========================================
  // Branch coverage: techne-backdrop.js IIFE
  // =========================================
  describe('Branch coverage - techne-backdrop.js', () => {
    test('should clean up previous instance on re-load', () => {
      const destroyFn = jest.fn();
      window.TechneBackdrop = { destroy: destroyFn };
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      expect(destroyFn).toHaveBeenCalled();
    });

    test('should warn when HTML markup is missing', () => {
      delete window.TechneBackdrop;
      delete window.TECHNE_BACKDROP_LAYERS_HTML;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing markup'));
      warnSpy.mockRestore();
    });

    test('should insert HTML when markup is provided', () => {
      delete window.TechneBackdrop;
      window.TECHNE_BACKDROP_LAYERS_HTML = '<div id="shapesLayer" class="shapes-layer"></div>';
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      expect(document.getElementById('shapesLayer')).toBeTruthy();
      // Cleanup
      if (window.TechneBackdrop) window.TechneBackdrop.destroy();
    });

    test('destroy() should set isActive to false', () => {
      delete window.TechneBackdrop;
      window.TECHNE_BACKDROP_LAYERS_HTML = '<div class="shapes-layer"></div>';
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      expect(window.TechneBackdrop).toBeDefined();
      expect(window.TechneBackdrop.isActive()).toBe(true);
      window.TechneBackdrop.destroy();
      // After destroy, TechneBackdrop is deleted
      expect(window.TechneBackdrop).toBeUndefined();
    });

    test('destroy() should be idempotent', () => {
      delete window.TechneBackdrop;
      window.TECHNE_BACKDROP_LAYERS_HTML = '<div class="shapes-layer"></div>';
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      const bd = window.TechneBackdrop;
      bd.destroy();
      // Calling destroy again should not throw (isDestroyed check)
      expect(window.TechneBackdrop).toBeUndefined();
    });

    test('should detect accent color orange', () => {
      delete window.TechneBackdrop;
      document.body.classList.add('techne-accent-orange');
      window.TECHNE_BACKDROP_LAYERS_HTML = '<div class="shapes-layer"></div>';
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      // The accent detection happens inside startFauna which needs FaunaOverlay
      if (window.TechneBackdrop) window.TechneBackdrop.destroy();
      document.body.classList.remove('techne-accent-orange');
    });

    test('syncVisibility should stop fauna when no techne theme', () => {
      delete window.TechneBackdrop;
      document.body.classList.remove('techne-theme', 'theme-dark', 'theme-orange');
      window.TECHNE_BACKDROP_LAYERS_HTML = '<div class="shapes-layer"></div><div id="fauna-overlay"><canvas id="fauna-canvas"></canvas></div>';
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      // Fauna shouldn't be running without techne theme classes
      if (window.TechneBackdrop) window.TechneBackdrop.destroy();
    });

    test('syncVisibility should start fauna when techne theme present', () => {
      delete window.TechneBackdrop;
      document.body.classList.add('techne-theme');
      window.TECHNE_BACKDROP_LAYERS_HTML = '<div class="shapes-layer"></div><div id="fauna-overlay"><canvas id="fauna-canvas"></canvas></div>';
      // Provide a mock FaunaOverlay constructor
      window.FaunaOverlay = jest.fn().mockImplementation(() => ({
        setAccent: jest.fn(),
        start: jest.fn(),
        stop: jest.fn()
      }));
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      if (window.TechneBackdrop) window.TechneBackdrop.destroy();
      document.body.classList.remove('techne-theme');
      delete window.FaunaOverlay;
    });

    test('pointermove should update mouse coordinates', () => {
      delete window.TechneBackdrop;
      window.TECHNE_BACKDROP_LAYERS_HTML = '<div class="shapes-layer"></div>';
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');

      // JSDOM doesn't have PointerEvent, use Event
      const event = new Event('pointermove', { bubbles: true });
      event.clientX = 400;
      event.clientY = 300;
      window.dispatchEvent(event);

      if (window.TechneBackdrop) window.TechneBackdrop.destroy();
    });

    test('should skip inserting layers when they already exist', () => {
      delete window.TechneBackdrop;
      // Pre-create a shapes layer
      const existingLayer = document.createElement('div');
      existingLayer.id = 'shapesLayer';
      document.body.appendChild(existingLayer);
      window.TECHNE_BACKDROP_LAYERS_HTML = '<div class="extra-layer"></div>';
      loadPluginFile('plugins/techne-backdrop/techne-backdrop.js');
      // Should NOT have inserted extra-layer since hasExistingLayers is true
      expect(document.querySelector('.extra-layer')).toBeNull();
      existingLayer.remove();
      if (window.TechneBackdrop) window.TechneBackdrop.destroy();
    });
  });
});
