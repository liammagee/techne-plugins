/**
 * Unit tests that load actual network-diagram plugin source files
 * for coverage instrumentation.
 */

describe('Network Diagram Plugin Sources', () => {
  let mockSelection;

  beforeEach(() => {
    loadPluginSystem();
    delete window.UnifiedNetworkVisualization;

    // Mock D3
    mockSelection = {
      append: jest.fn().mockReturnThis(),
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      selectAll: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      call: jest.fn().mockReturnThis(),
      transition: jest.fn().mockReturnThis(),
      duration: jest.fn().mockReturnThis(),
      node: jest.fn().mockReturnValue({
        getBBox: () => ({ width: 100, height: 100, x: 0, y: 0 }),
        getBoundingClientRect: () => ({ width: 800, height: 600 }),
        clientWidth: 800,
        clientHeight: 600
      }),
      select: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      enter: jest.fn().mockReturnThis(),
      exit: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      each: jest.fn().mockReturnThis(),
      merge: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      lower: jest.fn().mockReturnThis(),
      raise: jest.fn().mockReturnThis(),
      classed: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      property: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis()
    };

    window.d3 = {
      select: jest.fn().mockReturnValue(mockSelection),
      selectAll: jest.fn().mockReturnValue(mockSelection),
      zoom: jest.fn().mockReturnValue({
        scaleExtent: jest.fn().mockReturnValue([0.1, 4]),
        on: jest.fn().mockReturnThis(),
        transform: jest.fn().mockReturnThis(),
        translateTo: jest.fn().mockReturnThis(),
        scaleTo: jest.fn().mockReturnThis()
      }),
      zoomIdentity: { translate: jest.fn().mockReturnValue({ scale: jest.fn().mockReturnValue({ k: 1, x: 0, y: 0 }) }), scale: jest.fn().mockReturnThis(), k: 1, x: 0, y: 0 },
      zoomTransform: jest.fn().mockReturnValue({ k: 1, x: 0, y: 0 }),
      forceSimulation: jest.fn().mockReturnValue({
        force: jest.fn().mockReturnThis(),
        nodes: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        alpha: jest.fn().mockReturnThis(),
        alphaTarget: jest.fn().mockReturnThis(),
        restart: jest.fn(),
        stop: jest.fn()
      }),
      forceLink: jest.fn().mockReturnValue({
        id: jest.fn().mockReturnThis(),
        distance: jest.fn().mockReturnThis(),
        strength: jest.fn().mockReturnThis()
      }),
      forceManyBody: jest.fn().mockReturnValue({ strength: jest.fn().mockReturnThis() }),
      forceCenter: jest.fn().mockReturnValue({ strength: jest.fn().mockReturnThis() }),
      forceCollide: jest.fn().mockReturnValue({ radius: jest.fn().mockReturnThis() }),
      forceX: jest.fn().mockReturnValue({ strength: jest.fn().mockReturnThis(), x: jest.fn().mockReturnThis() }),
      forceY: jest.fn().mockReturnValue({ strength: jest.fn().mockReturnThis(), y: jest.fn().mockReturnThis() }),
      drag: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis()
      })
    };
  });

  // =========================================
  // unified-network.js
  // =========================================
  describe('unified-network.js', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should expose UnifiedNetworkVisualization class on window', () => {
      expect(window.UnifiedNetworkVisualization).toBeDefined();
      expect(typeof window.UnifiedNetworkVisualization).toBe('function');
    });

    test('constructor should initialize default properties', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.nodes).toEqual([]);
      expect(viz.links).toEqual([]);
      expect(viz.simulation).toBeNull();
      expect(viz.svg).toBeNull();
      expect(viz.container).toBeNull();
    });

    test('constructor should initialize options with defaults', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.options.theme).toBe('auto');
      expect(viz.options.showLabels).toBe(true);
      expect(viz.options.showStats).toBe(true);
      expect(viz.options.nodeSize).toBe('normal');
      expect(viz.options.linkStrength).toBe(0.5);
      expect(viz.options.includeHeadings).toBe(false);
      expect(viz.options.includeSubheadings).toBe(false);
    });

    test('constructor should initialize theme colors', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.themes.light).toBeDefined();
      expect(viz.themes.dark).toBeDefined();
      expect(viz.themes.light.background).toBe('#f8f9fa');
      expect(viz.themes.dark.background).toBe('#05060c');
      expect(viz.themes.light.nodeFile).toBeTruthy();
      expect(viz.themes.dark.nodeFile).toBeTruthy();
      expect(viz.themes.light.link).toBe('#999');
      expect(viz.themes.dark.link).toBe('#94a3b8');
    });

    test('constructor should initialize stats', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.stats.files).toBe(0);
      expect(viz.stats.headings).toBe(0);
      expect(viz.stats.links).toBe(0);
      expect(viz.stats.avgConnections).toBe(0);
    });

    test('constructor should initialize instance options', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.instanceOptions.showControls).toBe(true);
      expect(viz.instanceOptions.enableSelection).toBe(false);
      expect(viz.instanceOptions.openFileOnClick).toBe(true);
      expect(viz.instanceOptions.focusScale).toBe(1.2);
      expect(viz.instanceOptions.initialScale).toBeNull();
      expect(viz.instanceOptions.preserveScaleOnFocus).toBe(false);
      expect(viz.instanceOptions.vizId).toBe('unified-network-viz');
    });

    test('constructor should initialize interaction state', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.selectionListeners).toBeInstanceOf(Set);
      expect(viz.tickListeners).toBeInstanceOf(Set);
      expect(viz.selectedNodeId).toBeNull();
      expect(viz.nodeElements).toBeNull();
      expect(viz.linkElements).toBeNull();
      expect(viz.currentTransform).toBeNull();
      expect(viz.userAdjustedZoom).toBe(false);
      expect(viz.orientationPair).toBeNull();
      expect(viz.pendingFocus).toBeNull();
      expect(viz.previousSelectedNodeId).toBeNull();
    });

    // --- getEffectiveThemeKey ---
    test('getEffectiveThemeKey() should return light by default', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.getEffectiveThemeKey()).toBe('light');
    });

    test('getEffectiveThemeKey() should return dark when set', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'dark';
      expect(viz.getEffectiveThemeKey()).toBe('dark');
    });

    test('getEffectiveThemeKey() should return techne when set', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'techne';
      expect(viz.getEffectiveThemeKey()).toBe('techne');
    });

    test('getEffectiveThemeKey() auto mode should detect dark-mode class', () => {
      const viz = new window.UnifiedNetworkVisualization();
      document.body.classList.add('dark-mode');
      expect(viz.getEffectiveThemeKey()).toBe('dark');
      document.body.classList.remove('dark-mode');
    });

    test('getEffectiveThemeKey() auto mode should detect techne-theme class', () => {
      const viz = new window.UnifiedNetworkVisualization();
      document.body.classList.add('techne-theme');
      expect(viz.getEffectiveThemeKey()).toBe('techne');
      document.body.classList.remove('techne-theme');
    });

    test('getEffectiveThemeKey() unknown theme should default to light', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'invalid';
      expect(viz.getEffectiveThemeKey()).toBe('light');
    });

    // --- getTechneTheme ---
    test('getTechneTheme() should return red accent by default', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const theme = viz.getTechneTheme();
      expect(theme.background).toBe('transparent');
      expect(theme.nodeFile).toBe('#E63946');
    });

    test('getTechneTheme() should return orange accent when orange class', () => {
      const viz = new window.UnifiedNetworkVisualization();
      document.body.classList.add('techne-accent-orange');
      const theme = viz.getTechneTheme();
      expect(theme.nodeFile).toBe('#ff7a1a');
      document.body.classList.remove('techne-accent-orange');
    });

    // --- getCurrentTheme ---
    test('getCurrentTheme() should return light theme by default', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const theme = viz.getCurrentTheme();
      expect(theme.background).toBe('#f8f9fa');
    });

    test('getCurrentTheme() should return techne theme when set', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'techne';
      const theme = viz.getCurrentTheme();
      expect(theme.background).toBe('transparent');
    });

    // --- getNodeRadius ---
    test('getNodeRadius() should return correct sizes for normal', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.getNodeRadius({ type: 'file' })).toBe(12);
      expect(viz.getNodeRadius({ type: 'heading' })).toBe(10);
      expect(viz.getNodeRadius({ type: 'subheading' })).toBe(8);
    });

    test('getNodeRadius() should return correct sizes for small', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.nodeSize = 'small';
      expect(viz.getNodeRadius({ type: 'file' })).toBe(8);
      expect(viz.getNodeRadius({ type: 'heading' })).toBe(6);
      expect(viz.getNodeRadius({ type: 'subheading' })).toBe(4);
    });

    test('getNodeRadius() should return correct sizes for large', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.nodeSize = 'large';
      expect(viz.getNodeRadius({ type: 'file' })).toBe(16);
      expect(viz.getNodeRadius({ type: 'heading' })).toBe(14);
      expect(viz.getNodeRadius({ type: 'subheading' })).toBe(12);
    });

    test('getNodeRadius() should return default for invalid input', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.getNodeRadius(null)).toBe(12);
      expect(viz.getNodeRadius('invalid')).toBe(12);
    });

    test('getNodeRadius() should use file size for unknown types', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.getNodeRadius({ type: 'unknown' })).toBe(12);
    });

    // --- truncateLabel ---
    test('truncateLabel() should return empty for falsy input', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.truncateLabel('')).toBe('');
      expect(viz.truncateLabel(null)).toBe('');
      expect(viz.truncateLabel(undefined)).toBe('');
    });

    test('truncateLabel() should return short strings unchanged', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.truncateLabel('short')).toBe('short');
      expect(viz.truncateLabel('exactly sixteen!')).toBe('exactly sixteen!');
    });

    test('truncateLabel() should truncate long strings', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const result = viz.truncateLabel('this is a very long label name');
      expect(result.length).toBe(16);
      expect(result).toContain('…');
    });

    test('truncateLabel() should use custom max', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const result = viz.truncateLabel('hello world', 8);
      expect(result.length).toBe(8);
      expect(result).toContain('…');
    });

    // --- parseInternalLinks ---
    test('parseInternalLinks() should parse wiki-style links', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('See [[SomePage]] for more', 'source.md');
      expect(links.length).toBe(1);
      expect(links[0].target).toBe('SomePage.md');
      expect(links[0].type).toBe('reference');
    });

    test('parseInternalLinks() should parse markdown links', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('See [page](./other.md) for more', 'source.md');
      expect(links.length).toBe(1);
      expect(links[0].target).toBe('other.md');
    });

    test('parseInternalLinks() should parse relative links', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('See [page](../parent/file) for more', 'source.md');
      expect(links.length).toBe(1);
      expect(links[0].target).toContain('parent/file');
    });

    test('parseInternalLinks() should ignore external links', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('See [site](https://example.com) for more', 'source.md');
      expect(links.length).toBe(0);
    });

    test('parseInternalLinks() should handle multiple links', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('[[PageA]] and [[PageB]]', 'source.md');
      expect(links.length).toBe(2);
    });

    test('parseInternalLinks() should handle links with anchors', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('See [section](./page#heading)', 'source.md');
      expect(links.length).toBe(1);
      expect(links[0].target).toBe('page');
    });

    test('parseInternalLinks() should handle links without extension', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('See [page](./other) for more', 'source.md');
      expect(links.length).toBe(1);
      expect(links[0].target).toBe('other.md');
    });

    test('parseInternalLinks() should add .md to wiki links', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('[[MyPage]]', 'source.md');
      expect(links[0].target).toBe('MyPage.md');
    });

    test('parseInternalLinks() should not double-add .md', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('[[MyPage.md]]', 'source.md');
      expect(links[0].target).toBe('MyPage.md');
    });

    // --- extractHeadings ---
    test('extractHeadings() should extract h1 headings', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.includeHeadings = true;
      const nodeMap = new Map();
      const record = { id: 'test.md' };
      viz.extractHeadings('# Main Title\nContent\n## Sub Title', record, nodeMap);
      expect(viz.nodes.length).toBe(1); // only h1 since includeSubheadings is false
      expect(viz.nodes[0].type).toBe('heading');
      expect(viz.nodes[0].name).toBe('Main Title');
    });

    test('extractHeadings() should extract subheadings when enabled', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.includeHeadings = true;
      viz.options.includeSubheadings = true;
      const nodeMap = new Map();
      const record = { id: 'test.md' };
      viz.extractHeadings('# Title\n## Section\n### Detail', record, nodeMap);
      expect(viz.nodes.length).toBe(3);
      expect(viz.nodes[0].type).toBe('heading');
      expect(viz.nodes[1].type).toBe('subheading');
      expect(viz.nodes[2].type).toBe('subheading');
    });

    test('extractHeadings() should create hierarchy links', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.includeHeadings = true;
      viz.options.includeSubheadings = true;
      const nodeMap = new Map();
      const record = { id: 'test.md' };
      viz.extractHeadings('# H1\n## H2', record, nodeMap);
      // Should have: contains link (file->h1), contains link (file->h2), hierarchy link (h1->h2)
      const containsLinks = viz.links.filter(l => l.type === 'contains');
      const hierarchyLinks = viz.links.filter(l => l.type === 'hierarchy');
      expect(containsLinks.length).toBe(2);
      expect(hierarchyLinks.length).toBe(1);
    });

    test('extractHeadings() should not extract when disabled', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.includeHeadings = false;
      const nodeMap = new Map();
      viz.extractHeadings('# Title', { id: 'test.md' }, nodeMap);
      // The method is only called when includeHeadings is true in loadData,
      // but the headings check is at the caller level so all h1s pass through
      expect(viz.nodes.length).toBe(1);
    });

    // --- getNodeById ---
    test('getNodeById() should find existing node', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      expect(viz.getNodeById('b')).toEqual({ id: 'b' });
    });

    test('getNodeById() should return null for missing node', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [{ id: 'a' }];
      expect(viz.getNodeById('z')).toBeNull();
    });

    test('getNodeById() should return null for falsy input', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.getNodeById(null)).toBeNull();
      expect(viz.getNodeById('')).toBeNull();
    });

    // --- getNodes / getLinks ---
    test('getNodes() should return nodes array', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [{ id: 'x' }];
      expect(viz.getNodes()).toEqual([{ id: 'x' }]);
    });

    test('getLinks() should return links array', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.links = [{ source: 'a', target: 'b' }];
      expect(viz.getLinks()).toEqual([{ source: 'a', target: 'b' }]);
    });

    // --- selection listeners ---
    test('addSelectionListener() should add function', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const fn = jest.fn();
      viz.addSelectionListener(fn);
      expect(viz.selectionListeners.has(fn)).toBe(true);
    });

    test('addSelectionListener() should ignore non-functions', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.addSelectionListener('not a function');
      expect(viz.selectionListeners.size).toBe(0);
    });

    test('removeSelectionListener() should remove function', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const fn = jest.fn();
      viz.addSelectionListener(fn);
      viz.removeSelectionListener(fn);
      expect(viz.selectionListeners.size).toBe(0);
    });

    // --- tick listeners ---
    test('addTickListener() should add function', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const fn = jest.fn();
      viz.addTickListener(fn);
      expect(viz.tickListeners.has(fn)).toBe(true);
    });

    test('addTickListener() should ignore non-functions', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.addTickListener(42);
      expect(viz.tickListeners.size).toBe(0);
    });

    test('removeTickListener() should remove function', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const fn = jest.fn();
      viz.addTickListener(fn);
      viz.removeTickListener(fn);
      expect(viz.tickListeners.size).toBe(0);
    });

    // --- assignNodeLayout ---
    test('assignNodeLayout() should set target positions on nodes', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.width = 960;
      viz.height = 720;
      viz.nodes = [
        { id: 'a', name: 'FileA', type: 'file' },
        { id: 'b', name: 'FileB', type: 'file' }
      ];
      viz.assignNodeLayout();
      expect(viz.nodes[0].targetX).toBeDefined();
      expect(viz.nodes[0].targetY).toBeDefined();
      expect(viz.nodes[0].x).toBe(viz.nodes[0].targetX);
      expect(viz.nodes[0].y).toBe(viz.nodes[0].targetY);
    });

    test('assignNodeLayout() should handle empty nodes', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [];
      expect(() => viz.assignNodeLayout()).not.toThrow();
    });

    test('assignNodeLayout() should handle mixed node types', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.width = 960;
      viz.height = 720;
      viz.nodes = [
        { id: 'f', name: 'File', type: 'file' },
        { id: 'h', name: 'Heading', type: 'heading' },
        { id: 's', name: 'Sub', type: 'subheading' },
        { id: 'o', name: 'Other', type: 'other' }
      ];
      viz.assignNodeLayout();
      viz.nodes.forEach(n => {
        expect(n.displayName).toBeDefined();
        expect(typeof n.targetX).toBe('number');
        expect(typeof n.targetY).toBe('number');
      });
    });

    // --- updateStats ---
    test('updateStats() should calculate stats from nodes and links', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [
        { id: 'f1', type: 'file' },
        { id: 'f2', type: 'file' },
        { id: 'h1', type: 'heading' },
        { id: 's1', type: 'subheading' }
      ];
      viz.links = [
        { source: 'f1', target: 'f2' },
        { source: 'f1', target: 'h1' },
        { source: 'h1', target: 's1' }
      ];
      viz.updateStats();
      expect(viz.stats.files).toBe(2);
      expect(viz.stats.headings).toBe(2);
      expect(viz.stats.links).toBe(3);
      expect(parseFloat(viz.stats.avgConnections)).toBeGreaterThan(0);
    });

    test('updateStats() should handle empty data', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [];
      viz.links = [];
      viz.updateStats();
      expect(viz.stats.files).toBe(0);
      expect(viz.stats.headings).toBe(0);
      expect(viz.stats.links).toBe(0);
      expect(viz.stats.avgConnections).toBe('0.0');
    });

    test('updateStats() should update stat elements when present', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.statElements = {
        files: { textContent: '' },
        headings: { textContent: '' },
        links: { textContent: '' },
        avg: { textContent: '' }
      };
      viz.nodes = [{ id: 'f1', type: 'file' }];
      viz.links = [];
      viz.updateStats();
      expect(viz.statElements.files.textContent).toBe(1);
    });

    // --- updateTheme ---
    test('updateTheme() should update svg background', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.svg = mockSelection;
      viz.backdrop = mockSelection;
      viz.updateTheme();
      expect(mockSelection.style).toHaveBeenCalledWith('background', expect.any(String));
      expect(mockSelection.attr).toHaveBeenCalledWith('fill', expect.any(String));
    });

    test('updateTheme() should update controls element style', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const controlEl = { style: {} };
      viz.controlsElement = controlEl;
      viz.updateTheme();
      expect(controlEl.style.background).toBeDefined();
      expect(controlEl.style.color).toBeDefined();
    });

    // --- setOrientationHighlight ---
    test('setOrientationHighlight() should set pair', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.setOrientationHighlight('a', 'b');
      expect(viz.orientationPair).toEqual({ source: 'a', target: 'b' });
    });

    test('setOrientationHighlight() should clear pair with null', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.orientationPair = { source: 'a', target: 'b' };
      viz.setOrientationHighlight(null, null);
      expect(viz.orientationPair).toBeNull();
    });

    // --- setSelectedNode ---
    test('setSelectedNode() should not work when selection disabled', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [{ id: 'a' }];
      viz.setSelectedNode('a');
      expect(viz.selectedNodeId).toBeNull();
    });

    test('setSelectedNode() should set node when selection enabled', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions.enableSelection = true;
      viz.nodes = [{ id: 'a', x: 10, y: 20 }];
      viz.setSelectedNode('a');
      expect(viz.selectedNodeId).toBe('a');
    });

    test('setSelectedNode() should clear with null', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions.enableSelection = true;
      viz.selectedNodeId = 'a';
      viz.setSelectedNode(null);
      expect(viz.selectedNodeId).toBeNull();
    });

    test('setSelectedNode() should notify listeners', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions.enableSelection = true;
      viz.nodes = [{ id: 'a' }, { id: 'b' }];
      const fn = jest.fn();
      viz.selectionListeners.add(fn);
      viz.setSelectedNode('a');
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), expect.any(Object));
    });

    test('setSelectedNode() should not notify on same selection', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions.enableSelection = true;
      viz.nodes = [{ id: 'a' }];
      viz.selectedNodeId = 'a';
      const fn = jest.fn();
      viz.selectionListeners.add(fn);
      viz.setSelectedNode('a');
      expect(fn).not.toHaveBeenCalled();
    });

    test('setSelectedNode() should track previous node', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions.enableSelection = true;
      viz.nodes = [{ id: 'a' }, { id: 'b' }];
      viz.setSelectedNode('a');
      viz.setSelectedNode('b');
      expect(viz.previousSelectedNodeId).toBe('a');
    });

    // --- requestFocusOnNode ---
    test('requestFocusOnNode() should defer if node not positioned', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [{ id: 'a' }];
      viz.requestFocusOnNode('a');
      expect(viz.pendingFocus).toEqual({ nodeId: 'a', options: {} });
    });

    test('requestFocusOnNode() should not defer if node has position', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.svg = mockSelection;
      viz.g = mockSelection;
      viz.zoomBehavior = {
        transform: {},
        scaleExtent: jest.fn().mockReturnValue([0.1, 4])
      };
      viz.width = 800;
      viz.height = 600;
      viz.nodes = [{ id: 'a', x: 10, y: 20 }];
      viz.requestFocusOnNode('a');
      expect(viz.pendingFocus).toBeNull();
    });

    // --- injectVisualizationStyles ---
    test('injectVisualizationStyles() should add style element', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.injectVisualizationStyles();
      const style = document.getElementById('library-network-visual-styles');
      expect(style).not.toBeNull();
      expect(style.textContent).toContain('.network-node');
      style.remove();
    });

    test('injectVisualizationStyles() should not duplicate', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.injectVisualizationStyles();
      viz.injectVisualizationStyles();
      const styles = document.querySelectorAll('#library-network-visual-styles');
      expect(styles.length).toBe(1);
      styles.forEach(s => s.remove());
    });

    // --- destroy ---
    test('destroy() should clean up all state', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.simulation = { stop: jest.fn() };
      viz.container = document.createElement('div');
      viz.container.innerHTML = '<div>content</div>';
      viz.selectionListeners.add(jest.fn());
      viz.tickListeners.add(jest.fn());
      viz.selectedNodeId = 'a';
      viz.nodeElements = {};
      viz.linkElements = {};
      viz.labelElements = {};
      viz.backdrop = {};
      viz.controlsElement = {};
      viz.statElements = {};
      viz.pendingFocus = { nodeId: 'a' };
      viz.previousSelectedNodeId = 'b';
      viz.orientationPair = { source: 'a', target: 'b' };

      viz.destroy();

      expect(viz.simulation.stop).toHaveBeenCalled();
      expect(viz.container).toBeNull();
      expect(viz.selectionListeners.size).toBe(0);
      expect(viz.tickListeners.size).toBe(0);
      expect(viz.selectedNodeId).toBeNull();
      expect(viz.nodeElements).toBeNull();
      expect(viz.linkElements).toBeNull();
      expect(viz.orientationPair).toBeNull();
    });

    test('destroy() should remove theme change listener', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const removeListener = jest.spyOn(window, 'removeEventListener');
      viz._appThemeChangedHandler = jest.fn();
      viz.destroy();
      expect(removeListener).toHaveBeenCalledWith('app-theme-changed', expect.any(Function));
      removeListener.mockRestore();
    });

    // --- getFileContent ---
    test('getFileContent() should use electronAPI when available', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      window.electronAPI = { invoke: jest.fn().mockResolvedValue({ success: true, content: 'test content' }) };
      const content = await viz.getFileContent('/test/file.md');
      expect(content).toBe('test content');
    });

    test('getFileContent() should return null on failure', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      window.electronAPI = { invoke: jest.fn().mockResolvedValue({ success: false }) };
      const content = await viz.getFileContent('/test/file.md');
      expect(content).toBeNull();
    });

    test('getFileContent() should return null on error', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      window.electronAPI = { invoke: jest.fn().mockRejectedValue(new Error('fail')) };
      const content = await viz.getFileContent('/test/file.md');
      expect(content).toBeNull();
    });

    test('getFileContent() should return null without electronAPI', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      delete window.electronAPI;
      const content = await viz.getFileContent('/test/file.md');
      expect(content).toBeNull();
    });

    // --- exportVisualization ---
    test('exportVisualization() should call exportVisualizationAsPNG when available', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.svg = mockSelection;
      window.exportVisualizationAsPNG = jest.fn();
      await viz.exportVisualization();
      expect(window.exportVisualizationAsPNG).toHaveBeenCalled();
      delete window.exportVisualizationAsPNG;
    });

    test('exportVisualization() should handle no svg', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.svg = null;
      await expect(viz.exportVisualization()).resolves.not.toThrow();
    });
  });

  // =========================================
  // Branch coverage: initialize, loadData, createSVG, controls, themes
  // =========================================
  describe('Branch coverage - createControlsPanel and updateTheme paths', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('createControlsPanel() should skip when showControls is false', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions = { showControls: false, vizId: 'test' };
      viz.createControlsPanel();
      expect(viz.controlsElement).toBeNull();
    });
  });

  describe('Branch coverage - getEffectiveThemeKey cascading', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should return techne when requested is techne', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'techne';
      expect(viz.getEffectiveThemeKey()).toBe('techne');
    });

    test('should return dark when requested is dark', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'dark';
      expect(viz.getEffectiveThemeKey()).toBe('dark');
    });

    test('should return light for unknown theme', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'unknown-theme';
      expect(viz.getEffectiveThemeKey()).toBe('light');
    });

    test('auto should detect techne-theme class', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'auto';
      document.body.classList.add('techne-theme');
      expect(viz.getEffectiveThemeKey()).toBe('techne');
      document.body.classList.remove('techne-theme');
    });

    test('auto should detect dark-mode class', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'auto';
      document.body.classList.add('dark-mode');
      expect(viz.getEffectiveThemeKey()).toBe('dark');
      document.body.classList.remove('dark-mode');
    });

    test('auto should fall back to light', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'auto';
      expect(viz.getEffectiveThemeKey()).toBe('light');
    });
  });

  describe('Branch coverage - getTechneTheme accent', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should use orange accent when techne-accent-orange class present', () => {
      const viz = new window.UnifiedNetworkVisualization();
      document.body.classList.add('techne-accent-orange');
      const theme = viz.getTechneTheme();
      expect(theme.nodeFile).toBe('#ff7a1a');
      document.body.classList.remove('techne-accent-orange');
    });

    test('should use red accent when no orange class', () => {
      const viz = new window.UnifiedNetworkVisualization();
      document.body.classList.remove('techne-accent-orange');
      const theme = viz.getTechneTheme();
      expect(theme.nodeFile).toBe('#E63946');
    });
  });

  describe('Branch coverage - getCurrentTheme', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should return techne theme object for techne key', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'techne';
      const theme = viz.getCurrentTheme();
      expect(theme).toHaveProperty('nodeFile');
      expect(theme).toHaveProperty('linkContains');
    });

    test('should fallback to light if key not in themes', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.theme = 'nonexistent';
      const theme = viz.getCurrentTheme();
      expect(theme).toBe(viz.themes.light);
    });
  });

  describe('Branch coverage - updateTheme', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should update svg background when svg exists', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.svg = { style: jest.fn() };
      viz.backdrop = { attr: jest.fn() };
      viz.controlsElement = document.createElement('div');
      viz.updateTheme();
      expect(viz.svg.style).toHaveBeenCalledWith('background', expect.any(String));
      expect(viz.backdrop.attr).toHaveBeenCalledWith('fill', expect.any(String));
    });

    test('should handle null svg/backdrop/controls', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.svg = null;
      viz.backdrop = null;
      viz.controlsElement = null;
      expect(() => viz.updateTheme()).not.toThrow();
    });
  });

  describe('Branch coverage - getNodeRadius edge cases', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should return default for null input', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.getNodeRadius(null)).toBe(12);
    });

    test('should return default for string input', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.getNodeRadius('not-an-object')).toBe(12);
    });

    test('should use small sizes when option set', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.nodeSize = 'small';
      expect(viz.getNodeRadius({ type: 'file' })).toBe(8);
      expect(viz.getNodeRadius({ type: 'heading' })).toBe(6);
      expect(viz.getNodeRadius({ type: 'subheading' })).toBe(4);
    });

    test('should use large sizes when option set', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.nodeSize = 'large';
      expect(viz.getNodeRadius({ type: 'file' })).toBe(16);
      expect(viz.getNodeRadius({ type: 'heading' })).toBe(14);
    });

    test('should fall back to file size for unknown type', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.getNodeRadius({ type: 'unknown' })).toBe(12);
    });
  });

  describe('Branch coverage - assignNodeLayout', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should return early for empty nodes', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [];
      expect(() => viz.assignNodeLayout()).not.toThrow();
    });

    test('should return early for non-array nodes', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = null;
      expect(() => viz.assignNodeLayout()).not.toThrow();
    });

    test('should assign positions for mixed node types', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.width = 800;
      viz.height = 600;
      viz.nodes = [
        { id: 'f1', name: 'file1', type: 'file' },
        { id: 'h1', name: 'heading1', type: 'heading' },
        { id: 's1', name: 'sub1', type: 'subheading' },
        { id: 'o1', name: 'other1', type: 'other' }
      ];
      viz.assignNodeLayout();
      expect(viz.nodes[0].targetX).toBeDefined();
      expect(viz.nodes[1].targetX).toBeDefined();
      expect(viz.nodes[2].targetX).toBeDefined();
      expect(viz.nodes[3].targetX).toBeDefined();
    });
  });

  describe('Branch coverage - truncateLabel edge cases', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should return empty string for null', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.truncateLabel(null)).toBe('');
    });

    test('should return empty string for undefined', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.truncateLabel(undefined)).toBe('');
    });

    test('should return short string as-is', () => {
      const viz = new window.UnifiedNetworkVisualization();
      expect(viz.truncateLabel('hi')).toBe('hi');
    });
  });

  describe('Branch coverage - parseInternalLinks edge cases', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should handle wiki link that already has .md extension', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('[[page.md]]', 'source.md');
      expect(links[0].target).toBe('page.md');
    });

    test('should handle markdown link with anchor only', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('[text](other.md#section)', 'source.md');
      expect(links.length).toBe(1);
      expect(links[0].target).toBe('other.md');
    });

    test('should handle link without .md and without anchor', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('[text](other)', 'source.md');
      expect(links.length).toBe(1);
      expect(links[0].target).toBe('other.md');
    });

    test('should skip anchor-only links', () => {
      const viz = new window.UnifiedNetworkVisualization();
      const links = viz.parseInternalLinks('[text](#section)', 'source.md');
      // After removing anchor, target is empty, so no link added
      expect(links.length).toBe(0);
    });
  });

  describe('Branch coverage - extractHeadings', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should skip subheadings when includeSubheadings is false', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.includeSubheadings = false;
      viz.nodes = [];
      viz.links = [];
      const nodeMap = new Map();
      const record = { id: 'test.md', basenameNoExtLower: 'test' };
      viz.extractHeadings('# Heading\n## Subheading', record, nodeMap);
      expect(viz.nodes.length).toBe(1); // Only H1
      expect(viz.nodes[0].type).toBe('heading');
    });

    test('should include subheadings when enabled', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.includeSubheadings = true;
      viz.nodes = [];
      viz.links = [];
      const nodeMap = new Map();
      const record = { id: 'test.md', basenameNoExtLower: 'test' };
      viz.extractHeadings('# Heading\n## Sub\n### Deep', record, nodeMap);
      expect(viz.nodes.length).toBe(3);
    });

    test('should link subheadings to parent H1', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.includeSubheadings = true;
      viz.nodes = [];
      viz.links = [];
      const nodeMap = new Map();
      const record = { id: 'test.md', basenameNoExtLower: 'test' };
      viz.extractHeadings('# Parent\n## Child', record, nodeMap);
      const hierarchyLinks = viz.links.filter(l => l.type === 'hierarchy');
      expect(hierarchyLinks.length).toBe(1);
    });

    test('should not create hierarchy link without parent H1', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.options.includeSubheadings = true;
      viz.nodes = [];
      viz.links = [];
      const nodeMap = new Map();
      const record = { id: 'test.md', basenameNoExtLower: 'test' };
      viz.extractHeadings('## No Parent H1', record, nodeMap);
      const hierarchyLinks = viz.links.filter(l => l.type === 'hierarchy');
      expect(hierarchyLinks.length).toBe(0);
    });
  });

  describe('Branch coverage - setSelectedNode', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should return early if selection not enabled', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions = { enableSelection: false };
      viz.setSelectedNode('some-id');
      expect(viz.selectedNodeId).toBeNull(); // Stays at constructor default
    });

    test('should clear selection when nodeId is null', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions = { enableSelection: true };
      viz.selectedNodeId = 'previous';
      viz.updateSelectionVisuals = jest.fn();
      viz.setSelectedNode(null);
      expect(viz.selectedNodeId).toBeNull();
      expect(viz.previousSelectedNodeId).toBe('previous');
    });

    test('should not notify listeners when selecting same node', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions = { enableSelection: true };
      viz.selectedNodeId = 'nodeA';
      viz.nodes = [{ id: 'nodeA', name: 'A', type: 'file' }];
      viz.updateSelectionVisuals = jest.fn();
      const listener = jest.fn();
      viz.selectionListeners = [listener];
      viz.setSelectedNode('nodeA');
      expect(listener).not.toHaveBeenCalled();
    });

    test('should notify listeners when selecting different node', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions = { enableSelection: true };
      viz.selectedNodeId = 'nodeA';
      viz.nodes = [{ id: 'nodeB', name: 'B', type: 'file' }];
      viz.updateSelectionVisuals = jest.fn();
      const listener = jest.fn();
      viz.selectionListeners = [listener];
      viz.setSelectedNode('nodeB');
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: 'nodeB' }), {});
    });

    test('should notify listeners with force option even if same node', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions = { enableSelection: true };
      viz.selectedNodeId = 'nodeA';
      viz.nodes = [{ id: 'nodeA', name: 'A', type: 'file' }];
      viz.updateSelectionVisuals = jest.fn();
      const listener = jest.fn();
      viz.selectionListeners = [listener];
      viz.setSelectedNode('nodeA', { force: true });
      expect(listener).toHaveBeenCalled();
    });

    test('should center if option specified', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions = { enableSelection: true };
      viz.nodes = [{ id: 'nodeA', name: 'A', type: 'file', x: 100, y: 100 }];
      viz.updateSelectionVisuals = jest.fn();
      viz.requestFocusOnNode = jest.fn();
      viz.selectionListeners = [];
      viz.setSelectedNode('nodeA', { center: true });
      expect(viz.requestFocusOnNode).toHaveBeenCalledWith('nodeA', expect.objectContaining({ center: true }));
    });

    test('should return early if node not found', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions = { enableSelection: true };
      viz.nodes = [];
      viz.updateSelectionVisuals = jest.fn();
      viz.setSelectedNode('nonexistent');
      // selectedNodeId gets set to null through the null-check path, then node lookup fails
      expect(viz.selectedNodeId).toBeNull();
    });

    test('should handle listener errors gracefully', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.instanceOptions = { enableSelection: true };
      viz.nodes = [{ id: 'nodeA', name: 'A', type: 'file' }];
      viz.updateSelectionVisuals = jest.fn();
      const badListener = jest.fn().mockImplementation(() => { throw new Error('listener error'); });
      viz.selectionListeners = [badListener];
      expect(() => viz.setSelectedNode('nodeA')).not.toThrow();
    });
  });

  describe('Branch coverage - setOrientationHighlight', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should clear orientationPair when no args', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.updateOrientationHighlight = jest.fn();
      viz.setOrientationHighlight(null, null);
      expect(viz.orientationPair).toBeNull();
    });

    test('should set orientationPair when both args', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.updateOrientationHighlight = jest.fn();
      viz.setOrientationHighlight('a', 'b');
      expect(viz.orientationPair).toEqual({ source: 'a', target: 'b' });
    });
  });

  describe('Branch coverage - requestFocusOnNode', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should focus immediately if node has coordinates', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [{ id: 'n1', x: 100, y: 200 }];
      viz.focusOnNode = jest.fn();
      viz.requestFocusOnNode('n1');
      expect(viz.focusOnNode).toHaveBeenCalledWith('n1', {});
      expect(viz.pendingFocus).toBeNull();
    });

    test('should set pendingFocus if node has no coordinates', () => {
      const viz = new window.UnifiedNetworkVisualization();
      viz.nodes = [{ id: 'n1' }];
      viz.requestFocusOnNode('n1', { center: true });
      expect(viz.pendingFocus).toEqual({ nodeId: 'n1', options: { center: true } });
    });
  });

  describe('Branch coverage - getFileContent', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-network-diagram/unified-network.js');
    });

    test('should return null when no electronAPI', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      delete window.electronAPI;
      const result = await viz.getFileContent('/path/to/file');
      expect(result).toBeNull();
    });

    test('should return content on success', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      window.electronAPI = {
        invoke: jest.fn().mockResolvedValue({ success: true, content: 'hello' })
      };
      const result = await viz.getFileContent('/path/to/file');
      expect(result).toBe('hello');
    });

    test('should return null on failed result', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      window.electronAPI = {
        invoke: jest.fn().mockResolvedValue({ success: false })
      };
      const result = await viz.getFileContent('/path/to/file');
      expect(result).toBeNull();
    });

    test('should return null on error', async () => {
      const viz = new window.UnifiedNetworkVisualization();
      window.electronAPI = {
        invoke: jest.fn().mockRejectedValue(new Error('read error'))
      };
      const result = await viz.getFileContent('/path/to/file');
      expect(result).toBeNull();
    });
  });

  // =========================================
  // plugin.js (network-diagram)
  // =========================================
  describe('network-diagram plugin.js', () => {
    test('should register plugin with TechnePlugins', () => {
      const registerSpy = jest.fn();
      window.TechnePlugins = { register: registerSpy };
      loadPluginFile('plugins/techne-network-diagram/plugin.js');
      expect(registerSpy).toHaveBeenCalledTimes(1);
      const registration = registerSpy.mock.calls[0][0];
      expect(registration.id).toBe('techne-network-diagram');
      expect(typeof registration.init).toBe('function');
    });
  });
});
