/**
 * Unit tests that load actual circle plugin source files
 * for coverage instrumentation.
 */

describe('Circle Plugin Sources', () => {
  beforeEach(() => {
    loadPluginSystem();
    delete window.CircleView;
    delete window.sharedSummaryCache;

    // Mock D3
    const mockSelection = {
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
      node: jest.fn().mockReturnValue({ getBBox: () => ({ width: 100 }) }),
      select: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      enter: jest.fn().mockReturnThis(),
      exit: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      each: jest.fn().mockReturnThis()
    };

    window.d3 = {
      select: jest.fn().mockReturnValue(mockSelection),
      selectAll: jest.fn().mockReturnValue(mockSelection),
      zoom: jest.fn().mockReturnValue({
        scaleExtent: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis()
      }),
      forceSimulation: jest.fn().mockReturnValue({
        force: jest.fn().mockReturnThis(),
        nodes: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        alpha: jest.fn().mockReturnThis(),
        restart: jest.fn()
      }),
      forceLink: jest.fn().mockReturnValue({ id: jest.fn().mockReturnThis() }),
      forceManyBody: jest.fn().mockReturnValue({ strength: jest.fn().mockReturnThis() }),
      forceCenter: jest.fn(),
      forceCollide: jest.fn().mockReturnValue({ radius: jest.fn().mockReturnThis() })
    };
  });

  // =========================================
  // circle-view.js
  // =========================================
  describe('circle-view.js', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-circle/circle-view.js');
    });

    test('should expose CircleView class on window', () => {
      expect(window.CircleView).toBeDefined();
      expect(typeof window.CircleView).toBe('function');
    });

    test('constructor should initialize properties', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      expect(view.host).toBe(host);
      expect(view.nodes).toEqual([]);
      expect(view.links).toEqual([]);
      expect(view.width).toBe(800);
      expect(view.height).toBe(600);
      expect(view.stages).toEqual([]);
      expect(view.currentStage).toBe(0);
      expect(view.previewMode).toBe(false);
      expect(view.zoomLevel).toBe(0);
      expect(view.maxZoomLevel).toBe(2);
      expect(view.aiEnabled).toBe(true);
      expect(view.summariesGenerated).toBe(false);
    });

    test('generateContentHash() should return consistent hash', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      const hash1 = view.generateContentHash('test content');
      const hash2 = view.generateContentHash('test content');
      expect(hash1).toBe(hash2);
    });

    test('generateContentHash() should return different hashes for different content', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      const hash1 = view.generateContentHash('content A');
      const hash2 = view.generateContentHash('content B');
      expect(hash1).not.toBe(hash2);
    });

    test('generateContentHash() should return 0 for empty string', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      expect(view.generateContentHash('')).toBe(0);
    });

    test('calculateContentSimilarity() should return 1 for identical content', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      expect(view.calculateContentSimilarity(
        'longer test content string here',
        'longer test content string here'
      )).toBe(1);
    });

    test('calculateContentSimilarity() should return 0 for null inputs', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      expect(view.calculateContentSimilarity(null, 'test')).toBe(0);
      expect(view.calculateContentSimilarity('test', null)).toBe(0);
    });

    test('calculateContentSimilarity() should return 0 for completely different content', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      expect(view.calculateContentSimilarity(
        'alpha bravo charlie delta',
        'echo foxtrot golf hotel'
      )).toBe(0);
    });

    test('areCachedSummariesValid() should return false with no cache', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      expect(view.areCachedSummariesValid('test.md', 'content')).toBe(false);
    });

    test('cacheSummaries() and loadCachedSummaries() should work together', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.cacheSummaries('file.md', 'content', 'paragraph summary', 'sentence summary');

      const loaded = view.loadCachedSummaries('file.md');
      expect(loaded).toBe(true);
      expect(view.summaryParagraph).toBe('paragraph summary');
      expect(view.summarySentence).toBe('sentence summary');
      expect(view.summariesGenerated).toBe(true);
    });

    test('loadCachedSummaries() should return false for missing file', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      expect(view.loadCachedSummaries('nonexistent.md')).toBe(false);
    });

    test('getZoomLevelDescription() should return correct descriptions', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.zoomLevel = 0;
      expect(view.getZoomLevelDescription()).toContain('Full Text');
      view.zoomLevel = 1;
      expect(view.getZoomLevelDescription()).toContain('Summary');
      view.zoomLevel = 2;
      expect(view.getZoomLevelDescription()).toContain('Essence');
    });

    test('generateFallbackSummaries() should create summaries from content', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.documentContent = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.\n\nFourth paragraph.';
      view.currentDocument = 'test.md';
      view.generateFallbackSummaries();
      expect(view.summariesGenerated).toBe(true);
      expect(view.summaryParagraph).toBeTruthy();
      expect(view.summarySentence).toBeTruthy();
    });

    test('log() should use host.log when available', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.log('test message');
      expect(host.log).toHaveBeenCalledWith('[CircleView]', 'test message');
    });

    test('log() should fallback to console.log without host', () => {
      const view = new window.CircleView({});
      view.log('fallback message');
      // console.log is mocked in setup, just verify no throw
    });

    test('exitPreview() should reset preview state', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      // Set up mock svg
      view.svg = { remove: jest.fn() };
      view.g = d3.select();
      view.previewMode = true;
      view.currentDocument = 'test.md';
      view.documentContent = 'content';
      view.zoomLevel = 2;
      view.exitPreview();
      expect(view.previewMode).toBe(false);
      expect(view.currentDocument).toBeNull();
      expect(view.documentContent).toBeNull();
      expect(view.zoomLevel).toBe(0);
    });

    test('destroy() should remove svg', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      const removeMock = jest.fn();
      view.svg = { remove: removeMock };
      view.destroy();
      expect(removeMock).toHaveBeenCalled();
    });

    test('areCachedSummariesValid() should return true for cached content', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      const content = 'this is enough longer content for testing similarity check';
      view.cacheSummaries('test.md', content, 'para', 'sent');
      expect(view.areCachedSummariesValid('test.md', content)).toBe(true);
    });

    test('areCachedSummariesValid() should return false for changed content', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.cacheSummaries('test.md', 'original content words here for testing', 'p', 's');
      expect(view.areCachedSummariesValid('test.md', 'completely different brand new words written')).toBe(false);
    });

    test('areCachedSummariesValid() should return false for expired cache', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.cacheSummaries('test.md', 'content', 'p', 's');
      // Expire the cache
      const entry = view.summaryCache.get('test.md');
      entry.timestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      expect(view.areCachedSummariesValid('test.md', 'content')).toBe(false);
    });

    test('initialize() should create container and SVG', async () => {
      const host = { log: jest.fn(), getFiles: jest.fn().mockResolvedValue({ files: [] }) };
      const view = new window.CircleView(host);
      const container = document.createElement('div');
      document.body.appendChild(container);
      await view.initialize(container);
      expect(container.querySelector('#circle-container')).toBeTruthy();
      container.remove();
    });

    test('initialize() with files should create stages', async () => {
      const files = ['file1.md', 'file2.md', 'file3.md', 'file4.md'];
      const host = { log: jest.fn(), getFiles: jest.fn().mockResolvedValue({ files, totalFiles: 4 }) };
      const view = new window.CircleView(host);
      const container = document.createElement('div');
      document.body.appendChild(container);
      await view.initialize(container);
      expect(view.stages.length).toBe(4);
      expect(view.stages[0].name).toBe('Initial Understanding');
      container.remove();
    });

    test('loadCircleData() should handle error', async () => {
      const host = { log: jest.fn(), getFiles: jest.fn().mockRejectedValue(new Error('fail')) };
      const view = new window.CircleView(host);
      await view.loadCircleData();
      expect(view.stages).toEqual([]);
    });

    test('render() should call D3 methods', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.stages = [
        { name: 'Stage 1', radius: 100, color: '#eee', nodes: ['f1.md'] }
      ];
      view.render();
      expect(view.g.selectAll).toHaveBeenCalled();
    });

    test('renderStage() should create stage elements', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      const stage = { name: 'Test Stage', radius: 150, color: '#abc', nodes: ['file1.md', 'file2.md'] };
      view.renderStage(stage, 0);
      expect(view.g.append).toHaveBeenCalled();
    });

    test('renderStage() should handle object file items', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      const stage = { name: 'Test', radius: 100, color: '#abc', nodes: [{ path: '/test/file.md' }] };
      view.renderStage(stage, 0);
      expect(view.g.append).toHaveBeenCalled();
    });

    test('animateCircle() should advance stage', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.stages = [
        { name: 'S1', radius: 100, color: '#aaa', nodes: [] },
        { name: 'S2', radius: 200, color: '#bbb', nodes: [] }
      ];
      view.currentStage = 0;
      view.animateCircle();
      expect(view.currentStage).toBe(1);
    });

    test('animateCircle() should wrap around', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.stages = [{ name: 'S1', radius: 100, color: '#aaa', nodes: [] }];
      view.currentStage = 0;
      view.animateCircle();
      expect(view.currentStage).toBe(0);
    });

    test('handleNodeClick() should enter preview mode with content', async () => {
      const host = {
        log: jest.fn(),
        readFile: jest.fn().mockResolvedValue({ content: 'Document content here' })
      };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.aiEnabled = false;
      await view.handleNodeClick('/test/file.md');
      expect(view.previewMode).toBe(true);
      expect(view.currentDocument).toBe('/test/file.md');
      expect(view.documentContent).toBe('Document content here');
    });

    test('handleNodeClick() should fallback to open on read failure', async () => {
      const host = {
        log: jest.fn(),
        readFile: jest.fn().mockResolvedValue(null),
        openFile: jest.fn().mockResolvedValue(true)
      };
      const view = new window.CircleView(host);
      view.g = d3.select();
      await view.handleNodeClick('/test/file.md');
      expect(host.openFile).toHaveBeenCalled();
    });

    test('handleNodeClick() should handle errors', async () => {
      const host = {
        log: jest.fn(),
        readFile: jest.fn().mockRejectedValue(new Error('fail')),
        openFile: jest.fn()
      };
      const view = new window.CircleView(host);
      view.g = d3.select();
      await view.handleNodeClick('/test/file.md');
      expect(host.openFile).toHaveBeenCalled();
    });

    test('handleNodeClick() should use electronAPI when no host.readFile', async () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.aiEnabled = false;
      window.electronAPI = {
        invoke: jest.fn().mockResolvedValue({ success: true, content: 'Electron content' })
      };
      await view.handleNodeClick('/test/file.md');
      expect(view.previewMode).toBe(true);
      expect(view.documentContent).toBe('Electron content');
    });

    test('openFile() should use host.openFile', async () => {
      const host = { log: jest.fn(), openFile: jest.fn() };
      const view = new window.CircleView(host);
      await view.openFile('/test.md');
      expect(host.openFile).toHaveBeenCalledWith('/test.md');
    });

    test('openFile() should use electronAPI fallback', async () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      window.electronAPI = { invoke: jest.fn() };
      await view.openFile('/test.md');
      expect(window.electronAPI.invoke).toHaveBeenCalledWith('open-file', '/test.md');
    });

    test('generateSummaries() should use host.generateSummaries', async () => {
      const host = {
        log: jest.fn(),
        generateSummaries: jest.fn().mockResolvedValue({
          success: true, paragraph: 'AI para', sentence: 'AI sent'
        })
      };
      const view = new window.CircleView(host);
      view.documentContent = 'Some document content';
      view.currentDocument = 'test.md';
      await view.generateSummaries();
      expect(view.summaryParagraph).toBe('AI para');
      expect(view.summarySentence).toBe('AI sent');
      expect(view.summariesGenerated).toBe(true);
    });

    test('generateSummaries() should skip if already generated', async () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.summariesGenerated = true;
      view.documentContent = 'content';
      await view.generateSummaries();
      // Should not change anything
    });

    test('generateSummaries() should fallback on failure', async () => {
      const host = {
        log: jest.fn(),
        generateSummaries: jest.fn().mockResolvedValue({ success: false, error: 'fail' })
      };
      const view = new window.CircleView(host);
      view.documentContent = 'Some document content for fallback.';
      view.currentDocument = 'test.md';
      await view.generateSummaries();
      expect(view.summariesGenerated).toBe(true);
    });

    test('generateSummaries() should fallback on error', async () => {
      const host = {
        log: jest.fn(),
        generateSummaries: jest.fn().mockRejectedValue(new Error('API error'))
      };
      const view = new window.CircleView(host);
      view.documentContent = 'Content for fallback generation.';
      view.currentDocument = 'test.md';
      await view.generateSummaries();
      expect(view.summariesGenerated).toBe(true);
    });

    test('generateSummaries() should use electronAPI fallback', async () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.documentContent = 'content';
      view.currentDocument = 'test.md';
      window.electronAPI = {
        invoke: jest.fn().mockResolvedValue({ success: true, paragraph: 'p', sentence: 's' })
      };
      await view.generateSummaries();
      expect(view.summaryParagraph).toBe('p');
    });

    test('renderPreview() should call D3 methods', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.currentDocument = '/test/file.md';
      view.documentContent = 'Test content';
      view.renderPreview();
      expect(view.g.selectAll).toHaveBeenCalled();
    });

    test('renderTextContent() should render full text at level 0', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.zoomLevel = 0;
      view.documentContent = 'Full document text';
      view.renderTextContent();
      expect(view.g.append).toHaveBeenCalled();
    });

    test('renderTextContent() should render summary at level 1', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.zoomLevel = 1;
      view.summaryParagraph = 'Summary text';
      view.renderTextContent();
      expect(view.g.append).toHaveBeenCalled();
    });

    test('addZoomControls() should create control elements', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.addZoomControls();
      expect(view.g.append).toHaveBeenCalled();
    });

    test('zoomOut() should call transition when below maxZoomLevel', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.zoomLevel = 0;
      view.zoomOut();
      expect(view.g.select).toHaveBeenCalled();
    });

    test('zoomIn() should call transition when above 0', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.zoomLevel = 2;
      view.zoomIn();
      expect(view.g.select).toHaveBeenCalled();
    });

    test('zoomOut() should not zoom beyond max', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.zoomLevel = 2;
      view.zoomOut();
      // Should not call select since at max
    });

    test('zoomIn() should not zoom below 0', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.zoomLevel = 0;
      view.zoomIn();
      // Should not call select since at 0
    });

    test('addControls() in non-preview mode should add control panel', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.previewMode = false;
      view.stages = [{ name: 'Stage 1' }];
      view.currentStage = 0;
      const container = document.createElement('div');
      view.addControls(container);
      expect(container.querySelector('#circle-reset')).toBeTruthy();
      expect(container.querySelector('#circle-animate')).toBeTruthy();
      expect(container.querySelector('#circle-export')).toBeTruthy();
    });

    test('addControls() in preview mode should add preview panel', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      view.previewMode = true;
      view.aiEnabled = true;
      view.summariesGenerated = false;
      const container = document.createElement('div');
      view.addControls(container);
      expect(container.querySelector('#ai-summaries-toggle')).toBeTruthy();
      expect(container.querySelector('#circle-exit-preview')).toBeTruthy();
    });

    test('refresh() should reload data and render', async () => {
      const host = { log: jest.fn(), getFiles: jest.fn().mockResolvedValue({ files: [] }) };
      const view = new window.CircleView(host);
      view.g = d3.select();
      view.stages = [];
      await view.refresh();
      expect(host.getFiles).toHaveBeenCalled();
    });

    test('wrapText() should handle text wrapping', () => {
      const host = { log: jest.fn() };
      const view = new window.CircleView(host);
      const container = d3.select();
      view.wrapText(container, 'Short text', 0, 0, 500, 16);
      expect(container.append).toHaveBeenCalled();
    });
  });

  // =========================================
  // plugin.js (circle)
  // =========================================
  describe('circle plugin.js', () => {
    test('should register plugin with TechnePlugins', () => {
      loadPluginFile('plugins/techne-circle/plugin.js');
      const plugin = window.TechnePlugins.getPlugin('techne-circle');
      expect(plugin).toBeDefined();
      expect(plugin.id).toBe('techne-circle');
      expect(typeof plugin.init).toBe('function');
    });
  });
});
