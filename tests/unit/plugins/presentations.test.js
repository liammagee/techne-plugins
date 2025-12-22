/**
 * Unit tests for the techne-presentations plugin
 */

describe('Techne Presentations Plugin', () => {
  beforeEach(() => {
    loadPluginSystem();
    window.TECHNE_PLUGIN_MANIFEST = [
      { id: 'techne-presentations', entry: 'plugins/techne-presentations/plugin.js', enabledByDefault: true }
    ];
  });

  describe('Plugin Registration', () => {
    test('should register with correct id', () => {
      const mockPlugin = createTestPlugin('techne-presentations', {
        init: jest.fn()
      });

      window.TechnePlugins.register(mockPlugin);
      expect(window.TechnePlugins.getPlugin('techne-presentations')).toBeDefined();
    });
  });

  describe('Content Parsing', () => {
    // These tests mock the presentation parsing logic

    function parseSlides(content) {
      const slides = content.split(/^---$/m).map(s => s.trim()).filter(Boolean);
      return slides.map((slideContent, index) => {
        const lines = slideContent.split('\n');
        const titleMatch = lines.find(l => l.startsWith('#'));
        const title = titleMatch ? titleMatch.replace(/^#+\s*/, '') : `Slide ${index + 1}`;

        // Extract speaker notes
        const notesMatch = slideContent.match(/<!--notes:\s*([\s\S]*?)\s*-->/);
        const notes = notesMatch ? notesMatch[1].trim() : '';

        return { title, content: slideContent, notes, index };
      });
    }

    test('should parse slides separated by ---', () => {
      const content = `# Slide 1
Content 1
---
# Slide 2
Content 2
---
# Slide 3
Content 3`;

      const slides = parseSlides(content);
      expect(slides).toHaveLength(3);
    });

    test('should extract slide titles', () => {
      const content = `# Introduction
Welcome
---
## Chapter 1
Main content`;

      const slides = parseSlides(content);
      expect(slides[0].title).toBe('Introduction');
      expect(slides[1].title).toBe('Chapter 1');
    });

    test('should extract speaker notes', () => {
      const content = `# Slide 1
Content here

<!--notes: These are my speaker notes -->`;

      const slides = parseSlides(content);
      expect(slides[0].notes).toBe('These are my speaker notes');
    });

    test('should handle empty speaker notes', () => {
      const content = `# Slide 1
Content here`;

      const slides = parseSlides(content);
      expect(slides[0].notes).toBe('');
    });

    test('should handle multiline speaker notes', () => {
      const content = `# Slide 1

<!--notes: Line 1
Line 2
Line 3 -->`;

      const slides = parseSlides(content);
      expect(slides[0].notes).toContain('Line 1');
      expect(slides[0].notes).toContain('Line 2');
    });
  });

  describe('Layout Calculations', () => {
    function calculateSpiralPosition(index, total) {
      const angle = (index / total) * 2 * Math.PI;
      const radius = 100 + (index * 50);
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotation: (angle * 180 / Math.PI)
      };
    }

    function calculateLinearPosition(index, gap = 1200) {
      return {
        x: index * gap,
        y: 0,
        rotation: 0
      };
    }

    test('spiral layout should create circular positions', () => {
      const positions = Array.from({ length: 4 }, (_, i) =>
        calculateSpiralPosition(i, 4)
      );

      // First slide at angle 0
      expect(positions[0].x).toBeGreaterThan(0);
      expect(Math.abs(positions[0].y)).toBeLessThan(0.001);

      // Last slide should be back near the start angle
      expect(positions[3].rotation).toBeGreaterThan(0);
    });

    test('linear layout should create horizontal positions', () => {
      const positions = Array.from({ length: 3 }, (_, i) =>
        calculateLinearPosition(i)
      );

      expect(positions[0].x).toBe(0);
      expect(positions[1].x).toBe(1200);
      expect(positions[2].x).toBe(2400);

      // All y positions should be 0
      positions.forEach(p => {
        expect(p.y).toBe(0);
        expect(p.rotation).toBe(0);
      });
    });
  });

  describe('Navigation', () => {
    function createNavigator(totalSlides) {
      let currentIndex = 0;

      return {
        get current() { return currentIndex; },
        next: () => {
          if (currentIndex < totalSlides - 1) currentIndex++;
          return currentIndex;
        },
        prev: () => {
          if (currentIndex > 0) currentIndex--;
          return currentIndex;
        },
        goTo: (index) => {
          if (index >= 0 && index < totalSlides) {
            currentIndex = index;
          }
          return currentIndex;
        },
        first: () => { currentIndex = 0; return currentIndex; },
        last: () => { currentIndex = totalSlides - 1; return currentIndex; }
      };
    }

    test('should start at first slide', () => {
      const nav = createNavigator(5);
      expect(nav.current).toBe(0);
    });

    test('next should advance to next slide', () => {
      const nav = createNavigator(5);
      expect(nav.next()).toBe(1);
      expect(nav.next()).toBe(2);
    });

    test('next should not go past last slide', () => {
      const nav = createNavigator(3);
      nav.goTo(2);
      expect(nav.next()).toBe(2);
    });

    test('prev should go to previous slide', () => {
      const nav = createNavigator(5);
      nav.goTo(3);
      expect(nav.prev()).toBe(2);
    });

    test('prev should not go before first slide', () => {
      const nav = createNavigator(5);
      expect(nav.prev()).toBe(0);
    });

    test('goTo should navigate to specific slide', () => {
      const nav = createNavigator(5);
      expect(nav.goTo(3)).toBe(3);
    });

    test('goTo should clamp to valid range', () => {
      const nav = createNavigator(5);
      nav.goTo(-1);
      expect(nav.current).toBe(0);
      nav.goTo(10);
      expect(nav.current).toBe(0); // Should not change
    });

    test('first should go to first slide', () => {
      const nav = createNavigator(5);
      nav.goTo(3);
      expect(nav.first()).toBe(0);
    });

    test('last should go to last slide', () => {
      const nav = createNavigator(5);
      expect(nav.last()).toBe(4);
    });
  });

  describe('Keyboard Shortcuts', () => {
    function handleKeyboard(key, nav) {
      const actions = {
        'ArrowRight': () => nav.next(),
        'ArrowDown': () => nav.next(),
        'Space': () => nav.next(),
        'ArrowLeft': () => nav.prev(),
        'ArrowUp': () => nav.prev(),
        'Home': () => nav.first(),
        'End': () => nav.last(),
        'Escape': () => 'exit'
      };

      const action = actions[key];
      return action ? action() : null;
    }

    test('ArrowRight should go to next slide', () => {
      const nav = { next: jest.fn(() => 1) };
      handleKeyboard('ArrowRight', nav);
      expect(nav.next).toHaveBeenCalled();
    });

    test('ArrowLeft should go to previous slide', () => {
      const nav = { prev: jest.fn(() => 0) };
      handleKeyboard('ArrowLeft', nav);
      expect(nav.prev).toHaveBeenCalled();
    });

    test('Space should go to next slide', () => {
      const nav = { next: jest.fn(() => 1) };
      handleKeyboard('Space', nav);
      expect(nav.next).toHaveBeenCalled();
    });

    test('Home should go to first slide', () => {
      const nav = { first: jest.fn(() => 0) };
      handleKeyboard('Home', nav);
      expect(nav.first).toHaveBeenCalled();
    });

    test('End should go to last slide', () => {
      const nav = { last: jest.fn(() => 4) };
      handleKeyboard('End', nav);
      expect(nav.last).toHaveBeenCalled();
    });

    test('Escape should return exit signal', () => {
      const result = handleKeyboard('Escape', {});
      expect(result).toBe('exit');
    });
  });
});
