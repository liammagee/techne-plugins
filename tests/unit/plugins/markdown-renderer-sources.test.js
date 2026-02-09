/**
 * Unit tests that load actual markdown-renderer plugin source files
 * for coverage instrumentation.
 */

describe('Markdown Renderer Plugin Sources', () => {
  beforeEach(() => {
    loadPluginSystem();

    // Clean up globals from previous tests
    delete window.TechneBibtexParser;
    delete window.TechneCitationRenderer;
    delete window.TechneMarkdownRenderer;
    delete window.previewZoom;
    delete window.sharedSummaryCache;
    delete window.bibEntries;

    // Mock electronAPI
    window.electronAPI = { invoke: jest.fn(), isElectron: true };

    // Mock marked
    window.marked = {
      use: jest.fn(),
      parse: jest.fn((text) => `<p>${text}</p>`)
    };
  });

  // =========================================
  // bibtexParser.js
  // =========================================
  describe('bibtexParser.js', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-markdown-renderer/bibtexParser.js');
    });

    test('should expose TechneBibtexParser on window', () => {
      expect(window.TechneBibtexParser).toBeDefined();
      expect(typeof window.TechneBibtexParser.parse).toBe('function');
      expect(typeof window.TechneBibtexParser.loadFromFile).toBe('function');
      expect(typeof window.TechneBibtexParser.loadAndSetGlobal).toBe('function');
      expect(typeof window.TechneBibtexParser.addEntries).toBe('function');
    });

    test('parse() should parse a simple BibTeX article entry', () => {
      const bibtex = `@article{smith2023,
  author = {Smith, John},
  title = {Test Article},
  journal = {Test Journal},
  year = {2023},
  volume = {1},
  pages = {1-10}
}`;
      const entries = window.TechneBibtexParser.parse(bibtex);
      expect(entries).toHaveLength(1);
      expect(entries[0].key).toBe('smith2023');
      expect(entries[0].type).toBe('article');
      expect(entries[0].author).toBe('Smith, John');
      expect(entries[0].title).toBe('Test Article');
      expect(entries[0].year).toBe('2023');
    });

    test('parse() should handle multiple entries', () => {
      const bibtex = `@article{a2023,
  author = {Alice},
  title = {First},
  year = {2023}
}
@book{b2024,
  author = {Bob},
  title = {Second},
  year = {2024}
}`;
      const entries = window.TechneBibtexParser.parse(bibtex);
      expect(entries).toHaveLength(2);
      expect(entries[0].key).toBe('a2023');
      expect(entries[0].type).toBe('article');
      expect(entries[1].key).toBe('b2024');
      expect(entries[1].type).toBe('book');
    });

    test('parse() should normalize entry types', () => {
      const bibtex = `@inproceedings{conf1,
  author = {Test},
  title = {Conf Paper},
  year = {2023}
}
@phdthesis{thesis1,
  author = {Student},
  title = {My Thesis},
  year = {2024}
}`;
      const entries = window.TechneBibtexParser.parse(bibtex);
      expect(entries[0].type).toBe('conference');
      expect(entries[1].type).toBe('thesis');
    });

    test('parse() should clean LaTeX commands from field values', () => {
      const bibtex = `@article{latex1,
  author = {M\\\"uller, Hans},
  title = {Testing \\textit{italic} and \\textbf{bold}},
  year = {2023}
}`;
      const entries = window.TechneBibtexParser.parse(bibtex);
      expect(entries[0].title).not.toContain('\\textit');
      expect(entries[0].title).not.toContain('\\textbf');
    });

    test('parse() should handle quoted field values', () => {
      const bibtex = `@article{quoted1,
  author = "Smith, John",
  title = "Quoted Title",
  year = {2023}
}`;
      const entries = window.TechneBibtexParser.parse(bibtex);
      expect(entries[0].author).toBe('Smith, John');
      expect(entries[0].title).toBe('Quoted Title');
    });

    test('parse() should handle numeric field values', () => {
      const bibtex = `@article{num1,
  author = {Test},
  title = {Numeric},
  year = 2023
}`;
      const entries = window.TechneBibtexParser.parse(bibtex);
      expect(entries[0].year).toBe('2023');
    });

    test('parse() should map journaltitle to journal', () => {
      const bibtex = `@article{map1,
  author = {Test},
  title = {Mapping},
  journaltitle = {My Journal},
  year = {2023}
}`;
      const entries = window.TechneBibtexParser.parse(bibtex);
      expect(entries[0].journal).toBe('My Journal');
    });

    test('addEntries() should merge entries without duplicates', () => {
      window.bibEntries = [{ key: 'existing1', type: 'article', title: 'Existing' }];
      window.TechneBibtexParser.addEntries([
        { key: 'existing1', type: 'article', title: 'Duplicate' },
        { key: 'new1', type: 'book', title: 'New Entry' }
      ]);
      expect(window.bibEntries).toHaveLength(2);
      expect(window.bibEntries[1].key).toBe('new1');
    });

    test('addEntries() should initialize bibEntries if not set', () => {
      delete window.bibEntries;
      window.TechneBibtexParser.addEntries([
        { key: 'first', type: 'article', title: 'First' }
      ]);
      expect(window.bibEntries).toHaveLength(1);
    });

    test('parse() should return empty array for empty string', () => {
      expect(window.TechneBibtexParser.parse('')).toEqual([]);
    });

    test('parse() should handle LaTeX dashes', () => {
      const bibtex = `@article{dash1,
  author = {Test},
  title = {Long---dash and short--dash},
  year = {2023}
}`;
      const entries = window.TechneBibtexParser.parse(bibtex);
      expect(entries[0].title).toContain('\u2014'); // em-dash
      expect(entries[0].title).toContain('\u2013'); // en-dash
    });
  });

  // =========================================
  // citationRenderer.js
  // =========================================
  describe('citationRenderer.js', () => {
    beforeEach(() => {
      // Fake timers so setInterval in citationRenderer doesn't run
      jest.useFakeTimers();
      loadPluginFile('plugins/techne-markdown-renderer/citationRenderer.js');
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should expose TechneCitationRenderer on window', () => {
      expect(window.TechneCitationRenderer).toBeDefined();
      expect(typeof window.TechneCitationRenderer.renderCitations).toBe('function');
      expect(typeof window.TechneCitationRenderer.invalidateCache).toBe('function');
      expect(typeof window.TechneCitationRenderer.pruneCache).toBe('function');
      expect(typeof window.TechneCitationRenderer.getCacheStats).toBe('function');
      expect(typeof window.TechneCitationRenderer.setStyle).toBe('function');
      expect(typeof window.TechneCitationRenderer.getStyles).toBe('function');
      expect(typeof window.TechneCitationRenderer.getCSS).toBe('function');
    });

    test('getCacheStats() should return initial cache state', () => {
      const stats = window.TechneCitationRenderer.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.maxEntries).toBe(100);
      expect(stats.version).toBe(0);
    });

    test('invalidateCache() should increment version and clear entries', () => {
      window.TechneCitationRenderer.invalidateCache();
      const stats = window.TechneCitationRenderer.getCacheStats();
      expect(stats.version).toBe(1);
      expect(stats.size).toBe(0);
    });

    test('renderCitations() should pass through HTML without citations', () => {
      const html = '<p>No citations here</p>';
      const result = window.TechneCitationRenderer.renderCitations(html);
      expect(result).toBe(html);
    });

    test('renderCitations() should process inline citations with bibEntries', () => {
      window.bibEntries = [{
        key: 'smith2023',
        author: 'Smith, John',
        title: 'Test',
        year: '2023',
        type: 'article'
      }];
      const html = '<p>According to [@smith2023].</p>';
      const result = window.TechneCitationRenderer.renderCitations(html);
      expect(result).toContain('Smith');
      expect(result).toContain('2023');
      expect(result).toContain('citation');
    });

    test('renderCitations() should render unknown citations with warning', () => {
      window.bibEntries = [];
      const html = '<p>See [@unknown2023].</p>';
      const result = window.TechneCitationRenderer.renderCitations(html);
      expect(result).toContain('citation-unknown');
    });

    test('renderCitations() should cache results', () => {
      window.bibEntries = [{
        key: 'cached1',
        author: 'Doe',
        title: 'Cached',
        year: '2024',
        type: 'article'
      }];
      const html = '<p>Test [@cached1].</p>';
      window.TechneCitationRenderer.renderCitations(html);
      const stats = window.TechneCitationRenderer.getCacheStats();
      expect(stats.size).toBe(1);
    });

    test('renderCitations() should generate bibliography when includeBibliography is true', () => {
      window.bibEntries = [{
        key: 'bib1',
        author: 'Author, First',
        title: 'Bibliography Test',
        year: '2024',
        type: 'article',
        journal: 'Test Journal'
      }];
      const html = '<p>See [@bib1].</p>';
      const result = window.TechneCitationRenderer.renderCitations(html, { includeBibliography: true });
      expect(result).toContain('bibliography-section');
      expect(result).toContain('References');
    });

    test('getStyles() should return available styles', () => {
      const styles = window.TechneCitationRenderer.getStyles();
      expect(styles.length).toBeGreaterThanOrEqual(2);
      const keys = styles.map(s => s.key);
      expect(keys).toContain('apa');
      expect(keys).toContain('chicago');
    });

    test('setStyle() should change the citation style', () => {
      window.TechneCitationRenderer.setStyle('chicago');
      // Verify by rendering a citation
      window.bibEntries = [{
        key: 'style1',
        author: 'Test, Author',
        title: 'Style Test',
        year: '2024',
        type: 'article'
      }];
      const html = '<p>[@style1]</p>';
      const result = window.TechneCitationRenderer.renderCitations(html, { useCache: false });
      // Chicago uses "Author Year" format (no comma between author and year)
      expect(result).toContain('Test');
    });

    test('getCSS() should return CSS string', () => {
      const css = window.TechneCitationRenderer.getCSS();
      expect(typeof css).toBe('string');
      expect(css).toContain('.citation');
      expect(css).toContain('.bibliography');
    });

    test('pruneCache() should remove expired entries', () => {
      window.bibEntries = [{
        key: 'prune1',
        author: 'Test',
        title: 'Prune',
        year: '2024',
        type: 'article'
      }];
      window.TechneCitationRenderer.renderCitations('<p>[@prune1]</p>');
      expect(window.TechneCitationRenderer.getCacheStats().size).toBe(1);

      // Advance time past cache expiry (5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000);
      window.TechneCitationRenderer.pruneCache();
      expect(window.TechneCitationRenderer.getCacheStats().size).toBe(0);
    });

    test('renderCitations() should handle multiple citations in one bracket', () => {
      window.bibEntries = [
        { key: 'a1', author: 'Alpha', title: 'A', year: '2023', type: 'article' },
        { key: 'b1', author: 'Beta', title: 'B', year: '2024', type: 'article' }
      ];
      const html = '<p>See [@a1; @b1].</p>';
      const result = window.TechneCitationRenderer.renderCitations(html, { useCache: false });
      expect(result).toContain('Alpha');
      expect(result).toContain('Beta');
    });
  });

  // =========================================
  // techne-markdown-renderer.js
  // =========================================
  describe('techne-markdown-renderer.js', () => {
    beforeEach(() => {
      loadPluginFile('plugins/techne-markdown-renderer/techne-markdown-renderer.js');
    });

    test('should expose TechneMarkdownRenderer on window', () => {
      expect(window.TechneMarkdownRenderer).toBeDefined();
      expect(typeof window.TechneMarkdownRenderer.renderToHtml).toBe('function');
      expect(typeof window.TechneMarkdownRenderer.renderPreview).toBe('function');
    });

    test('renderToHtml() should fallback to escaped pre when marked is unavailable', async () => {
      delete window.marked;
      // Need to reload to pick up missing marked
      delete window.TechneMarkdownRenderer;
      loadPluginFile('plugins/techne-markdown-renderer/techne-markdown-renderer.js');
      const result = await window.TechneMarkdownRenderer.renderToHtml('<script>alert("xss")</script>');
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    test('renderToHtml() should call marked.parse when marked is available', async () => {
      const result = await window.TechneMarkdownRenderer.renderToHtml('# Hello');
      expect(window.marked.parse).toHaveBeenCalled();
    });

    test('renderToHtml() should process speaker notes', async () => {
      const content = 'Text\n```notes\nSpeaker note content\n```\nMore text';
      await window.TechneMarkdownRenderer.renderToHtml(content);
      // Speaker notes should be extracted to window.currentSpeakerNotes
      expect(window.currentSpeakerNotes).toBeDefined();
      expect(window.currentSpeakerNotes.length).toBeGreaterThan(0);
      expect(window.currentSpeakerNotes[0].content).toBe('Speaker note content');
    });

    test('renderToHtml() should add list classes via post-processing', async () => {
      window.marked.parse.mockReturnValue('<ul><li>item</li></ul>');
      const result = await window.TechneMarkdownRenderer.renderToHtml('- item');
      expect(result).toContain('class="markdown-list"');
      expect(result).toContain('class="markdown-list-item"');
    });

    test('renderToHtml() should use marked.use() for extensions', async () => {
      await window.TechneMarkdownRenderer.renderToHtml('test');
      expect(window.marked.use).toHaveBeenCalled();
    });

    test('renderPreview() should return empty string without preview element', async () => {
      const result = await window.TechneMarkdownRenderer.renderPreview({
        markdownContent: '# Test',
        previewElement: null
      });
      expect(result).toBe('');
    });

    test('renderPreview() should set innerHTML of preview element', async () => {
      const el = document.createElement('div');
      await window.TechneMarkdownRenderer.renderPreview({
        markdownContent: '# Test',
        previewElement: el
      });
      expect(el.innerHTML).toBeTruthy();
    });
  });

  // =========================================
  // previewZoom.js
  // =========================================
  describe('previewZoom.js', () => {
    beforeEach(() => {
      // Create required DOM elements
      const previewPane = document.createElement('div');
      previewPane.id = 'preview-pane';
      document.body.appendChild(previewPane);

      const previewContent = document.createElement('div');
      previewContent.id = 'preview-content';
      previewPane.appendChild(previewContent);

      loadPluginFile('plugins/techne-markdown-renderer/previewZoom.js');
    });

    afterEach(() => {
      const previewPane = document.getElementById('preview-pane');
      if (previewPane) previewPane.remove();
      // Clean up style element added by previewZoom
      const styles = document.querySelectorAll('style');
      styles.forEach(s => {
        if (s.textContent.includes('zoom-summary')) s.remove();
      });
    });

    test('should create global previewZoom instance', () => {
      expect(window.previewZoom).toBeDefined();
      expect(window.previewZoom).toBeInstanceOf(Object);
    });

    test('constructor should set default properties', () => {
      const pz = window.previewZoom;
      expect(pz.isEnabled).toBe(false);
      expect(pz.currentZoomLevel).toBe(0);
      expect(pz.maxZoomLevel).toBe(2);
      expect(pz.originalContent).toBeNull();
      expect(pz.summaryParagraph).toBeNull();
      expect(pz.summarySentence).toBeNull();
      expect(pz.currentFilePath).toBeNull();
      expect(pz.summariesGenerated).toBe(false);
    });

    test('generateContentHash() should return consistent hash for same content', () => {
      const pz = window.previewZoom;
      const hash1 = pz.generateContentHash('test content');
      const hash2 = pz.generateContentHash('test content');
      expect(hash1).toBe(hash2);
    });

    test('generateContentHash() should return different hashes for different content', () => {
      const pz = window.previewZoom;
      const hash1 = pz.generateContentHash('content A');
      const hash2 = pz.generateContentHash('content B');
      expect(hash1).not.toBe(hash2);
    });

    test('generateContentHash() should return 0 for empty string', () => {
      const pz = window.previewZoom;
      expect(pz.generateContentHash('')).toBe(0);
    });

    test('calculateContentSimilarity() should return 1 for identical content', () => {
      const pz = window.previewZoom;
      const sim = pz.calculateContentSimilarity(
        'this is a long enough test string',
        'this is a long enough test string'
      );
      expect(sim).toBe(1);
    });

    test('calculateContentSimilarity() should return 0 for completely different content', () => {
      const pz = window.previewZoom;
      const sim = pz.calculateContentSimilarity(
        'alpha bravo charlie delta',
        'echo foxtrot golf hotel'
      );
      expect(sim).toBe(0);
    });

    test('calculateContentSimilarity() should return 0 for null inputs', () => {
      const pz = window.previewZoom;
      expect(pz.calculateContentSimilarity(null, 'test')).toBe(0);
      expect(pz.calculateContentSimilarity('test', null)).toBe(0);
    });

    test('areCachedSummariesValid() should return false when no cache exists', () => {
      const pz = window.previewZoom;
      expect(pz.areCachedSummariesValid('nonexistent.md', 'content')).toBe(false);
    });

    test('areCachedSummariesValid() should return true for cached content within expiry', () => {
      const pz = window.previewZoom;
      const content = 'this is some longer content for testing purposes with many words';
      pz.cacheSummaries('test.md', content, 'summary paragraph', 'summary sentence');
      expect(pz.areCachedSummariesValid('test.md', content)).toBe(true);
    });

    test('areCachedSummariesValid() should return false for significantly changed content', () => {
      const pz = window.previewZoom;
      pz.cacheSummaries('test.md', 'original content with many words here for comparison', 'p', 's');
      expect(pz.areCachedSummariesValid('test.md', 'completely different brand new text written today')).toBe(false);
    });

    test('setZoomLevel() should reject out-of-bounds levels', () => {
      const pz = window.previewZoom;
      pz.isEnabled = true;
      pz.setZoomLevel(-1);
      expect(pz.currentZoomLevel).toBe(0);
      pz.setZoomLevel(5);
      expect(pz.currentZoomLevel).toBe(0);
    });

    test('setZoomLevel() should reject when not enabled', () => {
      const pz = window.previewZoom;
      pz.isEnabled = false;
      pz.setZoomLevel(1);
      expect(pz.currentZoomLevel).toBe(0);
    });

    test('loadCachedSummaries() should restore summaries from cache', () => {
      const pz = window.previewZoom;
      pz.cacheSummaries('cached.md', 'content here', 'cached paragraph', 'cached sentence');
      const result = pz.loadCachedSummaries('cached.md', 'content here');
      expect(result).toBe(true);
      expect(pz.summaryParagraph).toBe('cached paragraph');
      expect(pz.summarySentence).toBe('cached sentence');
      expect(pz.summariesGenerated).toBe(true);
    });

    test('loadCachedSummaries() should return false for missing path', () => {
      const pz = window.previewZoom;
      expect(pz.loadCachedSummaries('missing.md')).toBe(false);
    });

    test('destroy() should clean up', () => {
      const pz = window.previewZoom;
      pz.initialize();
      pz.destroy();
      expect(pz.controls).toBeNull();
      expect(pz.isInitialized).toBe(false);
    });

    test('onPreviewUpdate() should store content for markdown files', async () => {
      const pz = window.previewZoom;
      const html = '<p>Test content</p>';
      const result = await pz.onPreviewUpdate('test.md', html);
      expect(result).toBe(html);
      expect(pz.currentFilePath).toBe('test.md');
      expect(pz.originalContent).toBe(html);
      expect(pz.currentZoomLevel).toBe(0);
    });

    test('onPreviewUpdate() should not store content for non-markdown files', async () => {
      const pz = window.previewZoom;
      pz.currentFilePath = null;
      await pz.onPreviewUpdate('test.pdf', '<p>PDF</p>');
      expect(pz.currentFilePath).toBeNull();
    });

    test('onPreviewUpdate() should initialize if not initialized', async () => {
      const pz = window.previewZoom;
      pz.isInitialized = false;
      await pz.onPreviewUpdate('test.md', '<p>Content</p>');
      expect(pz.isInitialized).toBe(true);
    });

    test('onPreviewUpdate() should use cached summaries if valid', async () => {
      const pz = window.previewZoom;
      const content = 'this is enough content for a meaningful test string with enough words';
      const html = `<p>${content}</p>`;
      pz.cacheSummaries('test.md', content, 'paragraph summary', 'sentence summary');
      await pz.onPreviewUpdate('test.md', html);
      expect(pz.summaryParagraph).toBe('paragraph summary');
      expect(pz.summarySentence).toBe('sentence summary');
    });

    test('generateFallbackSummaries() should create paragraph and sentence summaries', () => {
      const pz = window.previewZoom;
      pz.currentFilePath = 'test.md';
      const text = 'First paragraph with enough text to be meaningful.\n\nSecond paragraph with more content here.\n\nThird paragraph is also important.';
      pz.generateFallbackSummaries(text);
      expect(pz.summaryParagraph).toBeDefined();
      expect(pz.summarySentence).toBeDefined();
      expect(pz.summariesGenerated).toBe(true);
    });

    test('generateFallbackSummaries() should handle null input', () => {
      const pz = window.previewZoom;
      pz.generateFallbackSummaries(null);
      expect(pz.summariesGenerated).toBeFalsy();
    });

    test('generateFallbackSummaries() should handle single paragraph', () => {
      const pz = window.previewZoom;
      pz.currentFilePath = 'test.md';
      pz.generateFallbackSummaries('Only a single paragraph of text with enough words to form a sentence.');
      expect(pz.summaryParagraph).toBeDefined();
      expect(pz.summarySentence).toBeDefined();
    });

    test('generateSummaries() should skip if already generated', async () => {
      const pz = window.previewZoom;
      pz.summariesGenerated = true;
      pz.originalContent = '<p>test</p>';
      pz.currentFilePath = 'test.md';
      await pz.generateSummaries();
      // Should return early without generating
    });

    test('generateSummaries() should skip without content', async () => {
      const pz = window.previewZoom;
      pz.originalContent = null;
      await pz.generateSummaries();
      expect(pz.summariesGenerated).toBe(false);
    });

    test('generateSummaries() should use custom AI generator', async () => {
      const pz = window.previewZoom;
      pz.originalContent = '<p>Test content for summary</p>';
      pz.currentFilePath = 'test.md';
      pz.summariesGenerated = false;
      pz.aiSummaryGenerator = jest.fn().mockResolvedValue({
        paragraph: 'AI paragraph summary',
        sentence: 'AI sentence.'
      });
      await pz.generateSummaries('Test content for summary');
      expect(pz.summaryParagraph).toBe('AI paragraph summary');
      expect(pz.summarySentence).toBe('AI sentence.');
      expect(pz.summariesGenerated).toBe(true);
    });

    test('generateSummaries() should fallback when AI fails', async () => {
      const pz = window.previewZoom;
      pz.originalContent = '<p>Test content for summary that is long enough to create meaningful text</p>';
      pz.currentFilePath = 'test.md';
      pz.summariesGenerated = false;
      pz.aiSummaryGenerator = jest.fn().mockRejectedValue(new Error('AI unavailable'));
      delete window.electronAPI;
      delete window.generateDocumentSummaries;
      await pz.generateSummaries('Test content for summary that is long enough to create meaningful text');
      expect(pz.summariesGenerated).toBe(true); // fallback should set this
    });

    test('generateSummaries() should use electronAPI when available', async () => {
      const pz = window.previewZoom;
      pz.originalContent = '<p>Content</p>';
      pz.currentFilePath = 'test.md';
      pz.summariesGenerated = false;
      pz.aiSummaryGenerator = null;
      window.electronAPI = {
        invoke: jest.fn().mockResolvedValue({
          success: true,
          paragraph: 'Electron paragraph',
          sentence: 'Electron sentence.'
        })
      };
      await pz.generateSummaries('Content');
      expect(pz.summaryParagraph).toBe('Electron paragraph');
      expect(pz.summariesGenerated).toBe(true);
    });

    test('generateSummaries() should use global generator as fallback', async () => {
      const pz = window.previewZoom;
      pz.originalContent = '<p>Content</p>';
      pz.currentFilePath = 'test.md';
      pz.summariesGenerated = false;
      pz.aiSummaryGenerator = null;
      delete window.electronAPI;
      window.generateDocumentSummaries = jest.fn().mockResolvedValue({
        success: true,
        paragraph: 'Global paragraph',
        sentence: 'Global sentence.'
      });
      await pz.generateSummaries('Content');
      expect(pz.summaryParagraph).toBe('Global paragraph');
      delete window.generateDocumentSummaries;
    });

    test('zoomOut() should increase zoom level', () => {
      const pz = window.previewZoom;
      pz.isEnabled = true;
      pz.currentZoomLevel = 0;
      pz.originalContent = '<p>content</p>';
      pz.summariesGenerated = true;
      pz.summaryParagraph = 'paragraph';
      pz.summarySentence = 'sentence';
      pz.zoomOut();
      expect(pz.currentZoomLevel).toBe(1);
    });

    test('zoomIn() should decrease zoom level', () => {
      const pz = window.previewZoom;
      pz.isEnabled = true;
      pz.currentZoomLevel = 2;
      pz.originalContent = '<p>content</p>';
      pz.zoomIn();
      expect(pz.currentZoomLevel).toBe(1);
    });

    test('zoomIn() should not go below 0', () => {
      const pz = window.previewZoom;
      pz.isEnabled = true;
      pz.currentZoomLevel = 0;
      pz.zoomIn();
      expect(pz.currentZoomLevel).toBe(0);
    });

    test('zoomOut() should not exceed maxZoomLevel', () => {
      const pz = window.previewZoom;
      pz.isEnabled = true;
      pz.currentZoomLevel = 2;
      pz.zoomOut();
      expect(pz.currentZoomLevel).toBe(2);
    });

    test('resetZoom() should set zoom to 0', () => {
      const pz = window.previewZoom;
      pz.isEnabled = true;
      pz.currentZoomLevel = 2;
      pz.originalContent = '<p>content</p>';
      pz.resetZoom();
      expect(pz.currentZoomLevel).toBe(0);
    });

    test('resetZoom() should do nothing when not enabled', () => {
      const pz = window.previewZoom;
      pz.isEnabled = false;
      pz.currentZoomLevel = 1;
      pz.resetZoom();
      expect(pz.currentZoomLevel).toBe(1);
    });

    test('setZoomLevel() should not change to same level', () => {
      const pz = window.previewZoom;
      pz.isEnabled = true;
      pz.currentZoomLevel = 1;
      // Calling with same level should be no-op
      pz.setZoomLevel(1);
      expect(pz.currentZoomLevel).toBe(1);
    });

    test('updatePreviewContent() should handle missing preview element', () => {
      const pz = window.previewZoom;
      document.getElementById('preview-content').remove();
      expect(() => pz.updatePreviewContent()).not.toThrow();
    });

    test('updatePreviewContent() should handle missing original content', () => {
      const pz = window.previewZoom;
      pz.originalContent = null;
      expect(() => pz.updatePreviewContent()).not.toThrow();
    });

    test('zoom levels should be bounded between 0 and maxZoomLevel', () => {
      const pz = window.previewZoom;
      expect(pz.maxZoomLevel).toBe(2);
      expect(pz.currentZoomLevel).toBe(0);
    });

    test('initialize() should create controls', () => {
      const pz = window.previewZoom;
      pz.isInitialized = false;
      pz.initialize();
      expect(pz.isInitialized).toBe(true);
      expect(pz.controls).toBeDefined();
    });

    test('initialize() should not reinitialize', () => {
      const pz = window.previewZoom;
      pz.initialize();
      const firstControls = pz.controls;
      pz.initialize();
      expect(pz.controls).toBe(firstControls);
    });

    test('addScrollNavigation() should not throw', () => {
      const pz = window.previewZoom;
      expect(() => pz.addScrollNavigation()).not.toThrow();
    });

    test('addKeyboardNavigation() should not throw', () => {
      const pz = window.previewZoom;
      expect(() => pz.addKeyboardNavigation()).not.toThrow();
    });

    test('toggleEnabled() should set isEnabled', () => {
      const pz = window.previewZoom;
      pz.originalContent = '<p>test</p>';
      pz.toggleEnabled(true);
      expect(pz.isEnabled).toBe(true);
    });

    test('toggleEnabled(false) should disable and reset zoom', () => {
      const pz = window.previewZoom;
      pz.isEnabled = true;
      pz.currentZoomLevel = 2;
      pz.originalContent = '<p>test</p>';
      pz.toggleEnabled(false);
      expect(pz.isEnabled).toBe(false);
      expect(pz.currentZoomLevel).toBe(0);
    });

    test('setAISummaryGenerator() should set generator function', () => {
      const pz = window.previewZoom;
      const gen = jest.fn();
      pz.setAISummaryGenerator(gen);
      expect(pz.aiSummaryGenerator).toBe(gen);
    });

    test('setAISummaryGenerator() should reject non-functions', () => {
      const pz = window.previewZoom;
      pz.aiSummaryGenerator = null;
      pz.setAISummaryGenerator('not a function');
      expect(pz.aiSummaryGenerator).toBeNull();
    });

    test('isAISummarizationAvailable() should return false by default', () => {
      const pz = window.previewZoom;
      delete window.electronAPI;
      pz.aiSummaryGenerator = null;
      expect(pz.isAISummarizationAvailable()).toBe(false);
    });

    test('isAISummarizationAvailable() should return true with electronAPI', () => {
      const pz = window.previewZoom;
      window.electronAPI = { invoke: jest.fn() };
      expect(pz.isAISummarizationAvailable()).toBe(true);
    });

    test('isAISummarizationAvailable() should return true with custom generator', () => {
      const pz = window.previewZoom;
      delete window.electronAPI;
      pz.aiSummaryGenerator = jest.fn();
      expect(pz.isAISummarizationAvailable()).toBe(true);
    });

    test('cacheSummaries() should store in summaryCache', () => {
      const pz = window.previewZoom;
      pz.cacheSummaries('test.md', 'content', 'para', 'sent');
      expect(pz.summaryCache.has('test.md')).toBe(true);
      const cached = pz.summaryCache.get('test.md');
      expect(cached.summaries.paragraph).toBe('para');
      expect(cached.summaries.sentence).toBe('sent');
    });

    test('setupEventListeners() should not throw', () => {
      const pz = window.previewZoom;
      expect(() => pz.setupEventListeners()).not.toThrow();
    });

    test('updateControlsContent() should update controls HTML', () => {
      const pz = window.previewZoom;
      pz.initialize();
      expect(() => pz.updateControlsContent()).not.toThrow();
    });
  });

  // =========================================
  // plugin.js (markdown-renderer)
  // =========================================
  describe('markdown-renderer plugin.js', () => {
    test('should register plugin with TechnePlugins', () => {
      const registerSpy = jest.fn();
      window.TechnePlugins = { register: registerSpy };
      loadPluginFile('plugins/techne-markdown-renderer/plugin.js');
      expect(registerSpy).toHaveBeenCalledTimes(1);
      const registration = registerSpy.mock.calls[0][0];
      expect(registration.id).toBe('techne-markdown-renderer');
      expect(typeof registration.init).toBe('function');
    });
  });
});
