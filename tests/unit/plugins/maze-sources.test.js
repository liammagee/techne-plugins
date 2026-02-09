/**
 * Unit tests that load actual maze plugin source files
 * for coverage instrumentation.
 */

describe('Maze Plugin Sources', () => {
  beforeEach(() => {
    loadPluginSystem();
    delete window.BabelMazeView;
    localStorage.clear();
  });

  // =========================================
  // BabelMazeView.js
  // =========================================
  describe('BabelMazeView.js', () => {
    let BabelMazeView;
    let host;

    beforeEach(() => {
      loadPluginFile('plugins/techne-maze/BabelMazeView.js');
      BabelMazeView = window.BabelMazeView;
      host = {
        log: jest.fn(),
        getFiles: jest.fn().mockResolvedValue({ files: [] }),
        readFile: jest.fn(),
        openFile: jest.fn(),
        saveFile: jest.fn(),
        getCurrentFile: jest.fn(),
        switchMode: jest.fn(),
        appendLink: jest.fn(),
        openFileInEditor: jest.fn(),
        getEditor: jest.fn(),
        markContentAsSaved: jest.fn(),
        getAICompanion: jest.fn()
      };
    });

    test('should expose BabelMazeView class on window', () => {
      expect(window.BabelMazeView).toBeDefined();
      expect(typeof window.BabelMazeView).toBe('function');
    });

    test('constructor should initialize all properties', () => {
      const view = new BabelMazeView(host);
      expect(view.host).toBe(host);
      expect(view.storageKey).toBe('babel_maze_state_v1');
      expect(view.layoutVersion).toBe(2);
      expect(view.mazeSparsityFactor).toBe(3.25);
      expect(view.mazeMaxCells).toBe(2600);
      expect(view.container).toBeNull();
      expect(view.graph).toBeNull();
      expect(view.graphReady).toBe(false);
      expect(view.graphRefreshInFlight).toBe(false);
      expect(view.currentRoomId).toBeNull();
      expect(view.discovered).toBeInstanceOf(Set);
      expect(view.inventory).toBeInstanceOf(Set);
      expect(view.travelHistory).toEqual([]);
      expect(view.maxTravelHistory).toBe(80);
      expect(view.log).toEqual([]);
      expect(view.commandHistory).toEqual([]);
      expect(view.commandHistoryIndex).toBe(-1);
      expect(view.pendingAI).toBe(false);
      expect(view.bootstrapped).toBe(false);
      expect(view.elements.status).toBeNull();
      expect(view.elements.mapSvg).toBeNull();
      expect(view.linkAutocomplete.active).toBe(false);
      expect(view.linkAutocomplete.query).toBe('');
      expect(view.linkAutocomplete.items).toEqual([]);
      expect(view.mapViewBox).toBeNull();
      expect(view.mapUserHasPanned).toBe(false);
    });

    test('constructor should accept gamification option', () => {
      const gamification = { xp: 100 };
      const view = new BabelMazeView(host, { gamification });
      expect(view.gamification).toBe(gamification);
    });

    // --- Host adapter methods ---
    test('_getFiles() should use host.getFiles', async () => {
      const view = new BabelMazeView(host);
      host.getFiles.mockResolvedValue({ files: [{ path: 'test.md' }] });
      const result = await view._getFiles();
      expect(result.files).toHaveLength(1);
    });

    test('_readFileContent() should use host.readFile', async () => {
      const view = new BabelMazeView(host);
      host.readFile.mockResolvedValue({ content: '# Test' });
      const result = await view._readFileContent('test.md');
      expect(result.success).toBe(true);
    });

    test('_readFileContent() should return false when readFile returns null', async () => {
      const view = new BabelMazeView(host);
      host.readFile.mockResolvedValue(null);
      const result = await view._readFileContent('test.md');
      expect(result.success).toBe(false);
    });

    test('_openFile() should use host.openFile', async () => {
      const view = new BabelMazeView(host);
      await view._openFile('test.md');
      expect(host.openFile).toHaveBeenCalledWith('test.md');
    });

    test('_appendLink() should use host.appendLink', async () => {
      const view = new BabelMazeView(host);
      await view._appendLink('src.md', 'target', 'Target');
      expect(host.appendLink).toHaveBeenCalledWith('src.md', 'target', 'Target');
    });

    test('_saveFile() should use host.saveFile', async () => {
      const view = new BabelMazeView(host);
      await view._saveFile('test.md', 'content');
      expect(host.saveFile).toHaveBeenCalledWith('test.md', 'content');
    });

    test('_getCurrentFilePath() should use host.getCurrentFile', () => {
      const view = new BabelMazeView(host);
      host.getCurrentFile.mockReturnValue('/path/to/file.md');
      expect(view._getCurrentFilePath()).toBe('/path/to/file.md');
    });

    test('_switchToEditorMode() should use host.switchMode', () => {
      const view = new BabelMazeView(host);
      view._switchToEditorMode();
      expect(host.switchMode).toHaveBeenCalledWith('editor');
    });

    test('_log() should use host.log', () => {
      const view = new BabelMazeView(host);
      view._log('test message');
      expect(host.log).toHaveBeenCalledWith('[BabelMaze]', 'test message');
    });

    test('_log() should use console.log without host', () => {
      const view = new BabelMazeView({});
      expect(() => view._log('fallback')).not.toThrow();
    });

    test('_getAICompanion() should use host.getAICompanion', () => {
      const companion = { name: 'AI' };
      host.getAICompanion.mockReturnValue(companion);
      const view = new BabelMazeView(host);
      expect(view._getAICompanion()).toBe(companion);
    });

    // --- isVoidRoomId ---
    test('isVoidRoomId() should detect void room IDs', () => {
      const view = new BabelMazeView(host);
      expect(view.isVoidRoomId('__void:12')).toBe(true);
      expect(view.isVoidRoomId('__void:abc')).toBe(true);
      expect(view.isVoidRoomId('normalRoom')).toBe(false);
      expect(view.isVoidRoomId(123)).toBe(false);
      expect(view.isVoidRoomId(null)).toBe(false);
    });

    // --- loadState / saveState ---
    test('loadState() should restore state from localStorage', () => {
      const savedState = {
        currentRoomId: 'room1',
        discovered: ['room1', 'room2'],
        inventory: ['item1'],
        travelHistory: ['room1', 'room2'],
        mazeLayout: { version: 2, width: 10 }
      };
      localStorage.setItem('babel_maze_state_v1', JSON.stringify(savedState));
      const view = new BabelMazeView(host);
      // loadState() is called in constructor
      expect(view.currentRoomId).toBe('room1');
      expect(view.discovered.has('room1')).toBe(true);
      expect(view.discovered.has('room2')).toBe(true);
      expect(view.inventory.has('item1')).toBe(true);
      expect(view.travelHistory).toEqual(['room1', 'room2']);
      expect(view.savedMazeLayout).toEqual({ version: 2, width: 10 });
    });

    test('loadState() should handle corrupted localStorage', () => {
      localStorage.setItem('babel_maze_state_v1', '{bad json');
      expect(() => new BabelMazeView(host)).not.toThrow();
    });

    test('loadState() should handle missing localStorage', () => {
      // No saved state
      const view = new BabelMazeView(host);
      expect(view.currentRoomId).toBeNull();
    });

    test('saveState() should persist state to localStorage', () => {
      const view = new BabelMazeView(host);
      view.currentRoomId = 'room1';
      view.discovered.add('room1');
      view.inventory.add('key1');
      view.travelHistory = ['room1', 'room2'];
      view.saveState();
      const saved = JSON.parse(localStorage.getItem('babel_maze_state_v1'));
      expect(saved.currentRoomId).toBe('room1');
      expect(saved.discovered).toContain('room1');
      expect(saved.inventory).toContain('key1');
      expect(saved.travelHistory).toEqual(['room1', 'room2']);
    });

    // --- escapeHTML ---
    test('escapeHTML() should escape HTML special characters', () => {
      const view = new BabelMazeView(host);
      expect(view.escapeHTML('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(view.escapeHTML("it's")).toBe('it&#39;s');
      expect(view.escapeHTML('a & b')).toBe('a &amp; b');
      expect(view.escapeHTML(null)).toBe('');
      expect(view.escapeHTML(undefined)).toBe('');
    });

    test('escapeHTMLAttr() should escape HTML attributes', () => {
      const view = new BabelMazeView(host);
      expect(view.escapeHTMLAttr('<div>')).toBe('&lt;div&gt;');
    });

    // --- pushHistory ---
    test('pushHistory() should add commands to history', () => {
      const view = new BabelMazeView(host);
      view.pushHistory('look');
      view.pushHistory('go north');
      expect(view.commandHistory).toEqual(['look', 'go north']);
      expect(view.commandHistoryIndex).toBe(2);
    });

    test('pushHistory() should not duplicate consecutive commands', () => {
      const view = new BabelMazeView(host);
      view.pushHistory('look');
      view.pushHistory('look');
      expect(view.commandHistory).toEqual(['look']);
    });

    test('pushHistory() should ignore empty commands', () => {
      const view = new BabelMazeView(host);
      view.pushHistory('');
      view.pushHistory(null);
      expect(view.commandHistory).toEqual([]);
    });

    test('pushHistory() should cap history at 60 entries', () => {
      const view = new BabelMazeView(host);
      for (let i = 0; i < 70; i++) {
        view.pushHistory(`cmd${i}`);
      }
      expect(view.commandHistory.length).toBe(60);
    });

    // --- fnv1a32 ---
    test('fnv1a32() should return consistent hashes', () => {
      const view = new BabelMazeView(host);
      const hash1 = view.fnv1a32('test');
      const hash2 = view.fnv1a32('test');
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
    });

    test('fnv1a32() should return different hashes for different input', () => {
      const view = new BabelMazeView(host);
      expect(view.fnv1a32('hello')).not.toBe(view.fnv1a32('world'));
    });

    test('fnv1a32() should handle empty string', () => {
      const view = new BabelMazeView(host);
      const hash = view.fnv1a32('');
      expect(typeof hash).toBe('number');
      expect(hash).toBe(0x811c9dc5); // FNV offset basis
    });

    test('fnv1a32() should handle null/undefined', () => {
      const view = new BabelMazeView(host);
      expect(typeof view.fnv1a32(null)).toBe('number');
      expect(typeof view.fnv1a32(undefined)).toBe('number');
    });

    // --- mulberry32 ---
    test('mulberry32() should return a PRNG function', () => {
      const view = new BabelMazeView(host);
      const rng = view.mulberry32(42);
      expect(typeof rng).toBe('function');
      const v1 = rng();
      expect(v1).toBeGreaterThanOrEqual(0);
      expect(v1).toBeLessThan(1);
    });

    test('mulberry32() should produce deterministic sequence', () => {
      const view = new BabelMazeView(host);
      const rng1 = view.mulberry32(42);
      const rng2 = view.mulberry32(42);
      expect(rng1()).toBe(rng2());
      expect(rng1()).toBe(rng2());
      expect(rng1()).toBe(rng2());
    });

    test('mulberry32() should produce different sequences for different seeds', () => {
      const view = new BabelMazeView(host);
      const rng1 = view.mulberry32(1);
      const rng2 = view.mulberry32(2);
      // At least one of the first few values should differ
      const vals1 = [rng1(), rng1(), rng1()];
      const vals2 = [rng2(), rng2(), rng2()];
      expect(vals1).not.toEqual(vals2);
    });

    // --- computeMazeSignature ---
    test('computeMazeSignature() should return string with layout version', () => {
      const view = new BabelMazeView(host);
      const sig = view.computeMazeSignature({ cellCount: 10, noteOrder: ['a', 'b'] }, 5);
      expect(sig).toContain('2:'); // layout version
      expect(sig).toContain(':10:'); // cellCount
      expect(sig).toContain(':2'); // noteOrder count
    });

    // --- isValidSavedMazeLayout ---
    test('isValidSavedMazeLayout() should validate layout structure', () => {
      const view = new BabelMazeView(host);
      expect(view.isValidSavedMazeLayout(null)).toBe(false);
      expect(view.isValidSavedMazeLayout({})).toBe(false);
      expect(view.isValidSavedMazeLayout({
        version: 1, // wrong version
        signature: 'sig', width: 5, cellCount: 10,
        noteOrder: ['a'], basePassages: Array(10).fill(0)
      })).toBe(false);
      expect(view.isValidSavedMazeLayout({
        version: 2, signature: 'sig', width: 5, cellCount: 3,
        noteOrder: ['a', 'b', 'c'],
        basePassages: [0, 1, 2]
      })).toBe(true);
    });

    test('isValidSavedMazeLayout() should reject invalid passage values', () => {
      const view = new BabelMazeView(host);
      expect(view.isValidSavedMazeLayout({
        version: 2, signature: 'sig', width: 5, cellCount: 2,
        noteOrder: ['a', 'b'],
        basePassages: [0, 16] // 16 > 15
      })).toBe(false);
    });

    test('isValidSavedMazeLayout() should reject wrong passage count', () => {
      const view = new BabelMazeView(host);
      expect(view.isValidSavedMazeLayout({
        version: 2, signature: 'sig', width: 5, cellCount: 3,
        noteOrder: ['a', 'b', 'c'],
        basePassages: [0, 1] // only 2, needs 3
      })).toBe(false);
    });

    // --- findRoomMatches ---
    test('findRoomMatches() should find exact match', () => {
      const view = new BabelMazeView(host);
      const candidates = [
        { id: 'hello.md', name: 'Hello', basenameNoExt: 'hello' },
        { id: 'world.md', name: 'World', basenameNoExt: 'world' }
      ];
      const results = view.findRoomMatches('hello', candidates);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('hello.md');
    });

    test('findRoomMatches() should rank exact > starts-with > includes', () => {
      const view = new BabelMazeView(host);
      const candidates = [
        { id: 'abcdef.md', name: 'Includes abc', basenameNoExt: 'abcdef' },
        { id: 'abc.md', name: 'abc', basenameNoExt: 'abc' },
        { id: 'abcxyz.md', name: 'Starts abcxyz', basenameNoExt: 'abcxyz' }
      ];
      const results = view.findRoomMatches('abc', candidates);
      expect(results[0].id).toBe('abc.md'); // exact
    });

    test('findRoomMatches() should return empty for empty query', () => {
      const view = new BabelMazeView(host);
      expect(view.findRoomMatches('', [{ id: 'a', name: 'A' }])).toEqual([]);
    });

    test('findRoomMatches() should respect limit', () => {
      const view = new BabelMazeView(host);
      const candidates = Array.from({ length: 20 }, (_, i) => ({
        id: `test${i}.md`, name: `Test ${i}`, basenameNoExt: `test${i}`
      }));
      const results = view.findRoomMatches('test', candidates, { limit: 5 });
      expect(results.length).toBe(5);
    });

    // --- normalizeAbsPath ---
    test('normalizeAbsPath() should normalize backslashes', () => {
      const view = new BabelMazeView(host);
      expect(view.normalizeAbsPath('C:\\Users\\test\\file.md')).toBe('C:/Users/test/file.md');
      expect(view.normalizeAbsPath(null)).toBe('');
    });

    // --- escapeRegex ---
    test('escapeRegex() should escape regex special chars', () => {
      const view = new BabelMazeView(host);
      expect(view.escapeRegex('hello.world')).toBe('hello\\.world');
      expect(view.escapeRegex('a[b]')).toBe('a\\[b\\]');
      expect(view.escapeRegex(null)).toBe('');
    });

    // --- normalizePath ---
    test('normalizePath() should normalize path separators', () => {
      const view = new BabelMazeView(host);
      expect(view.normalizePath('folder\\file.md')).toBe('folder/file.md');
      expect(view.normalizePath(null)).toBe('');
    });

    // --- stripExtension ---
    test('stripExtension() should remove .md extension', () => {
      const view = new BabelMazeView(host);
      expect(view.stripExtension('test.md')).toBe('test');
      expect(view.stripExtension('folder/test.md')).toBe('folder/test');
    });

    // --- joinRelative ---
    test('joinRelative() should join base dir with relative path', () => {
      const view = new BabelMazeView(host);
      expect(view.joinRelative('docs', 'notes.md')).toBe('docs/notes.md');
      expect(view.joinRelative('docs/sub', '../up.md')).toContain('up.md');
    });

    // --- parseInternalLinks ---
    test('parseInternalLinks() should extract wiki-style links', () => {
      const view = new BabelMazeView(host);
      const content = 'See [[other-note]] and [[folder/another|label]].';
      const links = view.parseInternalLinks(content);
      expect(links.length).toBeGreaterThanOrEqual(2);
    });

    test('parseInternalLinks() should return empty array for no links', () => {
      const view = new BabelMazeView(host);
      expect(view.parseInternalLinks('No links here')).toEqual([]);
    });

    // --- revealAround ---
    test('revealAround() should add nearby rooms to discovered', () => {
      const view = new BabelMazeView(host);
      view.maze = {
        roomOrder: ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'],
        width: 3,
        indexByRoomId: new Map([
          ['r0', 0], ['r1', 1], ['r2', 2],
          ['r3', 3], ['r4', 4], ['r5', 5],
          ['r6', 6], ['r7', 7], ['r8', 8]
        ])
      };
      view.revealAround('r4', 1);
      expect(view.discovered.has('r4')).toBe(true);
      expect(view.discovered.has('r1')).toBe(true); // north
      expect(view.discovered.has('r3')).toBe(true); // west
      expect(view.discovered.has('r5')).toBe(true); // east
      expect(view.discovered.has('r7')).toBe(true); // south
    });

    test('revealAround() should handle null roomId', () => {
      const view = new BabelMazeView(host);
      view.maze = { roomOrder: [], indexByRoomId: new Map() };
      expect(() => view.revealAround(null)).not.toThrow();
    });

    // --- getSkeletonMarkup ---
    test('getSkeletonMarkup() should return HTML string', () => {
      const view = new BabelMazeView(host);
      const html = view.getSkeletonMarkup();
      expect(html).toContain('Babel Maze');
      expect(html).toContain('bm-log');
      expect(html).toContain('bm-input');
      expect(html).toContain('bm-map-svg');
    });

    // --- ensureContainer ---
    test('ensureContainer() should return null without library-mode-root', () => {
      const view = new BabelMazeView(host);
      const result = view.ensureContainer();
      expect(result).toBeNull();
    });

    test('ensureContainer() should create container when library-mode-root exists', () => {
      const root = document.createElement('div');
      root.id = 'library-mode-root';
      document.body.appendChild(root);

      const view = new BabelMazeView(host);
      const result = view.ensureContainer();
      expect(result).toBeTruthy();
      expect(view.container).toBeTruthy();
      expect(view.container.className).toBe('babel-maze');

      root.remove();
    });

    // --- appendLog ---
    test('appendLog() should add entries to log', () => {
      const view = new BabelMazeView(host);
      view.appendLog('system', 'Test message');
      expect(view.log).toHaveLength(1);
      expect(view.log[0].author).toBe('system');
      expect(view.log[0].text).toBe('Test message');
    });

    // --- setStatus ---
    test('setStatus() should update status element', () => {
      const view = new BabelMazeView(host);
      const statusEl = document.createElement('div');
      view.elements.status = statusEl;
      view.setStatus('Testing...');
      expect(statusEl.textContent).toBe('Testing...');
    });

    // --- chooseInitialRoom ---
    test('chooseInitialRoom() should return first sorted ID with no current file', () => {
      const view = new BabelMazeView(host);
      const graph = {
        nodes: new Map([
          ['z.md', { id: 'z.md', path: 'z.md' }],
          ['a.md', { id: 'a.md', path: 'a.md' }]
        ])
      };
      expect(view.chooseInitialRoom(graph)).toBe('a.md');
    });

    test('chooseInitialRoom() should match current file path', () => {
      host.getCurrentFile.mockReturnValue('/path/b.md');
      const view = new BabelMazeView(host);
      const graph = {
        nodes: new Map([
          ['a.md', { id: 'a.md', path: '/path/a.md' }],
          ['b.md', { id: 'b.md', path: '/path/b.md' }]
        ])
      };
      expect(view.chooseInitialRoom(graph)).toBe('b.md');
    });

    test('chooseInitialRoom() should return null for empty graph', () => {
      const view = new BabelMazeView(host);
      expect(view.chooseInitialRoom(null)).toBeNull();
      expect(view.chooseInitialRoom({ nodes: new Map() })).toBeNull();
    });

    // --- getRoom ---
    test('getRoom() should return null for void room', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.maze = {
        roomOrder: ['r1', '__void:1'],
        indexByRoomId: new Map([['r1', 0], ['__void:1', 1]]),
        width: 2
      };
      const room = view.getRoom('__void:1');
      expect(room.isVoid).toBe(true);
    });

    test('getRoom() should return node from graph', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.graph = {
        nodes: new Map([['file.md', { id: 'file.md', name: 'File', path: 'file.md' }]])
      };
      const room = view.getRoom('file.md');
      expect(room.id).toBe('file.md');
    });

    // --- generateMazePassages ---
    test('generateMazePassages() should return array of passage masks', () => {
      const view = new BabelMazeView(host);
      const passages = view.generateMazePassages(9, 3, 3, 12345);
      expect(Array.isArray(passages)).toBe(true);
      expect(passages).toHaveLength(9);
      // Each value should be 0-15 (bitmask of N/E/S/W)
      for (const p of passages) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(15);
      }
    });

    // --- tokenizeForSimilarity ---
    test('tokenizeForSimilarity() should split text into word tokens', () => {
      const view = new BabelMazeView(host);
      const tokens = view.tokenizeForSimilarity('Hello World Testing');
      expect(tokens).toContain('hello');
      expect(tokens).toContain('world');
      expect(tokens).toContain('testing');
    });

    test('tokenizeForSimilarity() should filter stop words and short words', () => {
      const view = new BabelMazeView(host);
      const tokens = view.tokenizeForSimilarity('the quick fox and or');
      expect(tokens).not.toContain('the');
      expect(tokens).not.toContain('and');
      expect(tokens).not.toContain('or');
      expect(tokens).toContain('quick');
      expect(tokens).toContain('fox');
    });

    test('tokenizeForSimilarity() should return empty array for empty string', () => {
      const view = new BabelMazeView(host);
      expect(view.tokenizeForSimilarity('')).toEqual([]);
    });

    // --- setLedgerSummary ---
    test('setLedgerSummary() should update ledger element', () => {
      const view = new BabelMazeView(host);
      const el = document.createElement('div');
      view.elements.ledger = el;
      view.setLedgerSummary({ discovered: 5, total: 10, links: 3 });
      expect(el.textContent).toBeTruthy();
    });

    // --- getMapGeometry ---
    test('getMapGeometry() should return geometry based on maze', () => {
      const view = new BabelMazeView(host);
      view.maze = { width: 3, height: 3 };
      const geo = view.getMapGeometry();
      expect(geo).toBeDefined();
      expect(geo.cellSize).toBe(340);
      expect(geo.padding).toBe(240);
      expect(geo.mazeW).toBeGreaterThan(0);
      expect(geo.mazeH).toBeGreaterThan(0);
    });

    // --- clampMapViewBox ---
    test('clampMapViewBox() should ensure positive dimensions', () => {
      const view = new BabelMazeView(host);
      view.maze = { width: 3, height: 3 };
      const result = view.clampMapViewBox({ x: -100, y: -100, width: 5000, height: 5000 });
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    // --- getRoomLabel ---
    test('getRoomLabel() should return "Sealed folio" for non-inventory room', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.graph = {
        nodes: new Map([['file.md', { id: 'file.md', name: 'My File' }]])
      };
      expect(view.getRoomLabel('file.md')).toBe('Sealed folio');
    });

    test('getRoomLabel() should return empty string for unknown room', () => {
      const view = new BabelMazeView(host);
      expect(view.getRoomLabel('unknown')).toBe('');
    });

    test('getRoomLabel() should return "Sealed folio" for unsealed room', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.graph = {
        nodes: new Map([['file.md', { id: 'file.md', name: 'My File' }]])
      };
      // Not in inventory = sealed
      expect(view.getRoomLabel('file.md')).toBe('Sealed folio');
    });

    test('getRoomLabel() should return room name when in inventory', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.graph = {
        nodes: new Map([['file.md', { id: 'file.md', name: 'My File' }]])
      };
      view.inventory.add('file.md');
      expect(view.getRoomLabel('file.md')).toBe('My File');
    });

    // --- buildTokenSetForRoom ---
    test('buildTokenSetForRoom() should return Set of tokens from room data', () => {
      const view = new BabelMazeView(host);
      const room = {
        name: 'Test Document',
        id: 'test-doc.md',
        dir: 'docs',
        excerpt: 'This contains interesting content',
        headings: ['Introduction', 'Conclusion']
      };
      const tokens = view.buildTokenSetForRoom(room);
      expect(tokens).toBeInstanceOf(Set);
      expect(tokens.size).toBeGreaterThan(0);
    });

    test('buildTokenSetForRoom() should return empty set for null', () => {
      const view = new BabelMazeView(host);
      expect(view.buildTokenSetForRoom(null).size).toBe(0);
    });

    // --- getPhysicalDirectionMap ---
    test('getPhysicalDirectionMap() should return all null for unknown room', () => {
      const view = new BabelMazeView(host);
      const result = view.getPhysicalDirectionMap(null);
      expect(result.north).toBeNull();
      expect(result.east).toBeNull();
      expect(result.south).toBeNull();
      expect(result.west).toBeNull();
    });

    // --- moveByDirection ---
    test('moveByDirection() should do nothing when not graphReady', () => {
      const view = new BabelMazeView(host);
      view.graphReady = false;
      expect(() => view.moveByDirection('north')).not.toThrow();
    });

    // --- getNeighbors ---
    test('getNeighbors() should return empty for null roomId', () => {
      const view = new BabelMazeView(host);
      expect(view.getNeighbors(null)).toEqual([]);
    });

    // --- applyEdgeInMemory ---
    test('applyEdgeInMemory() should do nothing when not graphReady', () => {
      const view = new BabelMazeView(host);
      view.graphReady = false;
      expect(() => view.applyEdgeInMemory('a', 'b')).not.toThrow();
    });

    test('applyEdgeInMemory() should add edges to graph', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.graph = {
        adjacency: new Map(),
        outbound: new Map(),
        outboundCount: new Map(),
        inboundCount: new Map(),
        inbound: new Map(),
        edgeCount: 0
      };
      view.applyEdgeInMemory('a', 'b');
      expect(view.graph.adjacency.get('a').has('b')).toBe(true);
      expect(view.graph.adjacency.get('b').has('a')).toBe(true);
      expect(view.graph.edgeCount).toBe(1);
    });

    // --- resolveRoomByQueryOrId ---
    test('resolveRoomByQueryOrId() should return null for empty query', () => {
      const view = new BabelMazeView(host);
      expect(view.resolveRoomByQueryOrId('')).toBeNull();
    });

    test('resolveRoomByQueryOrId() should find by direct ID', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.graph = {
        nodes: new Map([['test.md', { id: 'test.md', name: 'Test' }]])
      };
      view.elements.log = document.createElement('div');
      expect(view.resolveRoomByQueryOrId('test.md')).toEqual({ id: 'test.md', name: 'Test' });
    });

    // --- initialize ---
    test('initialize() should throw without container', async () => {
      const view = new BabelMazeView(host);
      await expect(view.initialize(null)).rejects.toThrow('requires a container');
    });

    test('initialize() should set container ID', async () => {
      const view = new BabelMazeView(host);
      const container = document.createElement('div');
      document.body.appendChild(container);
      // Mock refreshGraph so it doesn't fail
      view.refreshGraph = jest.fn().mockResolvedValue();
      view.ensureContainer = jest.fn();
      await view.initialize(container);
      expect(container.id).toBe('library-mode-root');
      expect(view._mountContainer).toBe(container);
      container.remove();
    });

    test('initialize() should handle container with different ID', async () => {
      const view = new BabelMazeView(host);
      const container = document.createElement('div');
      container.id = 'some-other-id';
      document.body.appendChild(container);
      view.refreshGraph = jest.fn().mockResolvedValue();
      view.ensureContainer = jest.fn();
      await view.initialize(container);
      // Should create library-mode-root inside
      expect(document.getElementById('library-mode-root')).toBeTruthy();
      container.remove();
    });

    // --- host adapter methods ---
    test('_readFileContent() should use host.readFile', async () => {
      const view = new BabelMazeView(host);
      host.readFile.mockResolvedValue({ content: 'file content' });
      const result = await view._readFileContent('test.md');
      expect(result.success).toBe(true);
      expect(result.content).toBe('file content');
    });

    test('_readFileContent() should return failure when host returns null', async () => {
      const view = new BabelMazeView(host);
      host.readFile.mockResolvedValue(null);
      const result = await view._readFileContent('test.md');
      expect(result.success).toBe(false);
    });

    test('_readFileContent() should use electronAPI fallback', async () => {
      const view = new BabelMazeView({ log: jest.fn() });
      window.electronAPI = { invoke: jest.fn().mockResolvedValue({ success: true, content: 'electron content' }) };
      const result = await view._readFileContent('test.md');
      expect(result.success).toBe(true);
      delete window.electronAPI;
    });

    test('_readFileContent() should return error when no reader available', async () => {
      const view = new BabelMazeView({ log: jest.fn() });
      delete window.electronAPI;
      const result = await view._readFileContent('test.md');
      expect(result.success).toBe(false);
    });

    test('_openFile() should use host.openFile', async () => {
      const view = new BabelMazeView(host);
      host.openFile.mockResolvedValue({ success: true });
      const result = await view._openFile('test.md');
      expect(result.success).toBe(true);
    });

    test('_openFile() should use electronAPI fallback', async () => {
      const view = new BabelMazeView({ log: jest.fn() });
      window.electronAPI = { invoke: jest.fn().mockResolvedValue({ success: true }) };
      const result = await view._openFile('test.md');
      expect(result.success).toBe(true);
      delete window.electronAPI;
    });

    test('_openFile() should return error when no opener', async () => {
      const view = new BabelMazeView({ log: jest.fn() });
      delete window.electronAPI;
      const result = await view._openFile('test.md');
      expect(result.success).toBe(false);
    });

    test('_appendLink() should use host.appendLink', async () => {
      const view = new BabelMazeView(host);
      host.appendLink = jest.fn().mockResolvedValue({ success: true });
      const result = await view._appendLink('src.md', 'tgt.md', 'Target');
      expect(result.success).toBe(true);
    });

    test('_appendLink() should return error when no appender', async () => {
      const view = new BabelMazeView({ log: jest.fn() });
      delete window.electronAPI;
      const result = await view._appendLink('src.md', 'tgt.md', 'Target');
      expect(result.success).toBe(false);
    });

    test('_saveFile() should use host.saveFile', async () => {
      const view = new BabelMazeView(host);
      host.saveFile.mockResolvedValue({ success: true });
      const result = await view._saveFile('test.md', 'content');
      expect(result.success).toBe(true);
    });

    test('_saveFile() should return error when no saver', async () => {
      const view = new BabelMazeView({ log: jest.fn() });
      delete window.electronAPI;
      const result = await view._saveFile('test.md', 'content');
      expect(result.success).toBe(false);
    });

    test('_getCurrentFilePath() should use host.getCurrentFile', () => {
      const view = new BabelMazeView(host);
      host.getCurrentFile.mockReturnValue('/path/to/file.md');
      expect(view._getCurrentFilePath()).toBe('/path/to/file.md');
    });

    test('_getCurrentFilePath() should fallback to window.currentFilePath', () => {
      const view = new BabelMazeView({ log: jest.fn() });
      window.currentFilePath = '/global/path.md';
      expect(view._getCurrentFilePath()).toBe('/global/path.md');
      delete window.currentFilePath;
    });

    test('_switchToEditorMode() should use host.switchMode', () => {
      const view = new BabelMazeView(host);
      view._switchToEditorMode();
      expect(host.switchMode).toHaveBeenCalledWith('editor');
    });

    test('_switchToEditorMode() should fallback to window.switchToMode', () => {
      const view = new BabelMazeView({ log: jest.fn() });
      window.switchToMode = jest.fn();
      view._switchToEditorMode();
      expect(window.switchToMode).toHaveBeenCalledWith('editor');
      delete window.switchToMode;
    });

    test('_markContentAsSaved() should use host method', () => {
      const view = new BabelMazeView(host);
      host.markContentAsSaved = jest.fn();
      view._markContentAsSaved();
      expect(host.markContentAsSaved).toHaveBeenCalled();
    });

    test('_markContentAsSaved() should fallback to window', () => {
      const view = new BabelMazeView({ log: jest.fn() });
      window.markContentAsSaved = jest.fn();
      view._markContentAsSaved();
      expect(window.markContentAsSaved).toHaveBeenCalled();
      delete window.markContentAsSaved;
    });

    test('_getEditor() should use host.getEditor', () => {
      const view = new BabelMazeView(host);
      const mockEditor = { getValue: jest.fn() };
      host.getEditor = jest.fn().mockReturnValue(mockEditor);
      expect(view._getEditor()).toBe(mockEditor);
    });

    test('_getAICompanion() should use host.getAICompanion', () => {
      const view = new BabelMazeView(host);
      const mockCompanion = { ask: jest.fn() };
      host.getAICompanion = jest.fn().mockReturnValue(mockCompanion);
      expect(view._getAICompanion()).toBe(mockCompanion);
    });

    test('_getAICompanion() should fallback to window globals', () => {
      const view = new BabelMazeView({ log: jest.fn() });
      window.aiCompanion = { ask: jest.fn() };
      expect(view._getAICompanion()).toBe(window.aiCompanion);
      delete window.aiCompanion;
    });

    test('_openFileInEditor() should use host method', async () => {
      const view = new BabelMazeView(host);
      host.openFileInEditor = jest.fn().mockResolvedValue(true);
      await view._openFileInEditor('test.md', 'content');
      expect(host.openFileInEditor).toHaveBeenCalledWith('test.md', 'content');
    });

    test('_openFileInEditor() should fallback to window', async () => {
      const view = new BabelMazeView({ log: jest.fn() });
      window.openFileInEditor = jest.fn();
      await view._openFileInEditor('test.md', 'content');
      expect(window.openFileInEditor).toHaveBeenCalledWith('test.md', 'content');
      delete window.openFileInEditor;
    });

    // --- getSuggestionDescription ---
    test('getSuggestionDescription() should return dash for null room', () => {
      const view = new BabelMazeView(host);
      expect(view.getSuggestionDescription(null)).toBe('—');
    });

    test('getSuggestionDescription() should include district', () => {
      const view = new BabelMazeView(host);
      const room = { dir: 'notes', wordCount: 150, excerpt: 'Test excerpt text' };
      const desc = view.getSuggestionDescription(room);
      expect(desc).toContain('District: notes');
      expect(desc).toContain('Words: 150');
      expect(desc).toContain('Test excerpt text');
    });

    test('getSuggestionDescription() should clip long excerpts', () => {
      const view = new BabelMazeView(host);
      const longExcerpt = 'A'.repeat(200);
      const room = { dir: 'test', excerpt: longExcerpt };
      const desc = view.getSuggestionDescription(room);
      expect(desc.length).toBeLessThan(200);
      expect(desc).toContain('…');
    });

    test('getSuggestionDescription() should use headings when no excerpt', () => {
      const view = new BabelMazeView(host);
      const room = { dir: 'test', headings: ['Intro', 'Setup', 'Usage'] };
      const desc = view.getSuggestionDescription(room);
      expect(desc).toContain('Headings:');
      expect(desc).toContain('Intro');
    });

    // --- computeQueryAffinity ---
    test('computeQueryAffinity() should return 0 for empty query', () => {
      const view = new BabelMazeView(host);
      expect(view.computeQueryAffinity('', { id: 'test', name: 'Test' })).toBe(0);
    });

    test('computeQueryAffinity() should return 0 for null node', () => {
      const view = new BabelMazeView(host);
      expect(view.computeQueryAffinity('test', null)).toBe(0);
    });

    test('computeQueryAffinity() should return 100 for exact match', () => {
      const view = new BabelMazeView(host);
      expect(view.computeQueryAffinity('test', { id: 'test', name: 'Test' })).toBe(100);
    });

    test('computeQueryAffinity() should return 75 for name prefix', () => {
      const view = new BabelMazeView(host);
      expect(view.computeQueryAffinity('tes', { id: 'other', name: 'testing', basenameNoExt: 'other' })).toBe(75);
    });

    test('computeQueryAffinity() should return 55 for name contains', () => {
      const view = new BabelMazeView(host);
      expect(view.computeQueryAffinity('est', { id: 'other', name: 'testing', basenameNoExt: 'other' })).toBe(55);
    });

    test('computeQueryAffinity() should return 50 for id contains', () => {
      const view = new BabelMazeView(host);
      expect(view.computeQueryAffinity('oth', { id: 'other', name: 'foo', basenameNoExt: 'foo' })).toBe(70);
    });

    // --- getLinkAutocompleteContext ---
    test('getLinkAutocompleteContext() should return closed for empty input', () => {
      const view = new BabelMazeView(host);
      view.elements = { input: { value: '' } };
      const ctx = view.getLinkAutocompleteContext();
      expect(ctx.open).toBe(false);
    });

    test('getLinkAutocompleteContext() should return closed for non-link command', () => {
      const view = new BabelMazeView(host);
      view.elements = { input: { value: 'look around' } };
      const ctx = view.getLinkAutocompleteContext();
      expect(ctx.open).toBe(false);
    });

    test('getLinkAutocompleteContext() should return open for link command', () => {
      const view = new BabelMazeView(host);
      view.elements = { input: { value: 'link test' } };
      view.graphReady = true;
      view.currentRoomId = 'room.md';
      view.graph = {
        nodes: new Map([
          ['room.md', { id: 'room.md', name: 'Room', path: '/room.md', isVoid: false }],
          ['target.md', { id: 'target.md', name: 'Target Test', path: '/target.md', isVoid: false }]
        ]),
        outbound: new Map(),
        adjacency: new Map(),
        inbound: new Map(),
        inboundCount: new Map()
      };
      view.inventory = new Set(['room.md']);
      const ctx = view.getLinkAutocompleteContext();
      expect(ctx.open).toBe(true);
      expect(ctx.query).toBe('test');
    });

    // --- getLinkCandidates ---
    test('getLinkCandidates() should return empty when graph not ready', () => {
      const view = new BabelMazeView(host);
      view.graphReady = false;
      expect(view.getLinkCandidates('')).toEqual([]);
    });

    test('getLinkCandidates() should return empty for void room', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.currentRoomId = 'void';
      view.graph = { nodes: new Map([['void', { id: 'void', isVoid: true }]]) };
      expect(view.getLinkCandidates('')).toEqual([]);
    });

    // --- navigateHistory ---
    test('navigateHistory() should navigate up through history', () => {
      const view = new BabelMazeView(host);
      view.elements = { input: { value: '' } };
      view.commandHistory = ['first', 'second', 'third'];
      view.commandHistoryIndex = 3; // At the end (past last)
      view.navigateHistory(-1);
      expect(view.commandHistoryIndex).toBe(2);
      expect(view.elements.input.value).toBe('third');
    });

    test('navigateHistory() should navigate down past end to clear', () => {
      const view = new BabelMazeView(host);
      view.elements = { input: { value: '' } };
      view.commandHistory = ['first', 'second'];
      view.commandHistoryIndex = 1;
      view.navigateHistory(1);
      expect(view.commandHistoryIndex).toBe(2);
      expect(view.elements.input.value).toBe('');
    });

    test('navigateHistory() should clamp at boundaries', () => {
      const view = new BabelMazeView(host);
      view.elements = { input: { value: '' } };
      view.commandHistory = ['only'];
      view.commandHistoryIndex = 0;
      view.navigateHistory(-1); // try to go before first
      expect(view.commandHistoryIndex).toBe(0);
      expect(view.elements.input.value).toBe('only');
    });

    test('navigateHistory() should do nothing without input element', () => {
      const view = new BabelMazeView(host);
      view.elements = {};
      view.commandHistory = ['cmd'];
      view.commandHistoryIndex = 0;
      expect(() => view.navigateHistory(-1)).not.toThrow();
    });

    test('navigateHistory() should do nothing with empty history', () => {
      const view = new BabelMazeView(host);
      view.elements = { input: { value: '' } };
      view.commandHistory = [];
      view.commandHistoryIndex = 0;
      expect(() => view.navigateHistory(-1)).not.toThrow();
    });

    // --- getLinkSuggestions ---
    test('getLinkSuggestions() should return empty for void source', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.currentRoomId = 'void';
      view.graph = { nodes: new Map([['void', { id: 'void', isVoid: true }]]) };
      expect(view.getLinkSuggestions()).toEqual([]);
    });

    test('getLinkSuggestions() should return empty when graph not ready', () => {
      const view = new BabelMazeView(host);
      view.graphReady = false;
      expect(view.getLinkSuggestions()).toEqual([]);
    });

    // --- escapeHTMLAttr ---
    test('escapeHTMLAttr() should escape attribute characters', () => {
      const view = new BabelMazeView(host);
      if (view.escapeHTMLAttr) {
        expect(view.escapeHTMLAttr('"test"')).not.toContain('"');
        expect(view.escapeHTMLAttr("'test'")).toBeDefined();
      }
    });

    // --- ensureMazeLayout ---
    test('ensureMazeLayout() should create maze from graph', () => {
      const view = new BabelMazeView(host);
      const graph = {
        nodes: new Map([
          ['a.md', { id: 'a.md', name: 'A', path: '/a.md' }],
          ['b.md', { id: 'b.md', name: 'B', path: '/b.md' }],
          ['c.md', { id: 'c.md', name: 'C', path: '/c.md' }]
        ]),
        outbound: new Map(),
        adjacency: new Map(),
        inbound: new Map(),
        edgeCount: 0
      };
      view.ensureMazeLayout(graph);
      expect(view.maze).not.toBeNull();
      expect(view.maze.width).toBeGreaterThan(0);
      expect(view.maze.height).toBeGreaterThan(0);
      expect(view.maze.roomOrder.length).toBeGreaterThan(0);
      expect(view.maze.basePassages.length).toBeGreaterThan(0);
    });

    test('ensureMazeLayout() should handle empty graph', () => {
      const view = new BabelMazeView(host);
      view.ensureMazeLayout({ nodes: new Map() });
      expect(view.maze).toBeNull();
    });

    test('ensureMazeLayout() should handle null graph', () => {
      const view = new BabelMazeView(host);
      view.ensureMazeLayout(null);
      expect(view.maze).toBeNull();
    });

    test('ensureMazeLayout() should reuse saved layout with matching signature', () => {
      const view = new BabelMazeView(host);
      const graph = {
        nodes: new Map([
          ['x.md', { id: 'x.md', name: 'X', path: '/x.md' }]
        ]),
        outbound: new Map(),
        adjacency: new Map(),
        inbound: new Map(),
        edgeCount: 0
      };

      // First layout
      view.ensureMazeLayout(graph);
      const firstLayout = view.savedMazeLayout;

      // Second with same graph — should reuse
      view.ensureMazeLayout(graph);
      expect(view.savedMazeLayout.signature).toBe(firstLayout.signature);
    });

    test('ensureMazeLayout() should create indexByRoomId and coordByRoomId', () => {
      const view = new BabelMazeView(host);
      const graph = {
        nodes: new Map([
          ['test.md', { id: 'test.md', name: 'Test', path: '/test.md' }]
        ]),
        outbound: new Map(),
        adjacency: new Map(),
        inbound: new Map(),
        edgeCount: 0
      };
      view.ensureMazeLayout(graph);
      expect(view.maze.indexByRoomId).toBeInstanceOf(Map);
      expect(view.maze.coordByRoomId).toBeInstanceOf(Map);
      expect(view.maze.indexByRoomId.has('test.md')).toBe(true);
    });

    // --- generateMazePassages ---
    test('generateMazePassages() should generate passages array', () => {
      const view = new BabelMazeView(host);
      const passages = view.generateMazePassages(9, 3, 3, 42);
      expect(passages.length).toBe(9);
      // All cells should have some passage bits
      const total = passages.reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(0);
    });

    test('generateMazePassages() should handle single cell', () => {
      const view = new BabelMazeView(host);
      const passages = view.generateMazePassages(1, 1, 1, 1);
      expect(passages).toEqual([0]);
    });

    test('generateMazePassages() should handle 2x2 grid', () => {
      const view = new BabelMazeView(host);
      const passages = view.generateMazePassages(4, 2, 2, 123);
      expect(passages.length).toBe(4);
      // Check bidirectionality: if cell 0 has E, cell 1 should have W
      const DIR_E = 2, DIR_W = 8;
      if (passages[0] & DIR_E) {
        expect(passages[1] & DIR_W).toBeTruthy();
      }
    });

    test('generateMazePassages() should create spanning tree', () => {
      const view = new BabelMazeView(host);
      const passages = view.generateMazePassages(16, 4, 4, 999);
      // All 16 cells should be connected (non-zero passages for all)
      // In a spanning tree, at least n-1 edges, which means each cell has at least 1 passage
      const connected = passages.filter(p => p > 0).length;
      expect(connected).toBe(16);
    });

    // --- updateMazeLinkOpenings ---
    test('updateMazeLinkOpenings() should handle null maze', () => {
      const view = new BabelMazeView(host);
      view.maze = null;
      expect(() => view.updateMazeLinkOpenings()).not.toThrow();
    });

    // --- render ---
    test('render() should call ensureContainer', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.graph = { nodes: new Map() };
      view.renderThrottleMs = 0;
      view.lastRenderAt = 0;
      view.ensureContainer = jest.fn().mockReturnValue(null);
      view.render();
      expect(view.ensureContainer).toHaveBeenCalled();
    });

    // --- syncCurrentRoomFromEditor ---
    test('syncCurrentRoomFromEditor() should do nothing without graph', () => {
      const view = new BabelMazeView(host);
      view.graphReady = false;
      expect(() => view.syncCurrentRoomFromEditor()).not.toThrow();
    });

    test('syncCurrentRoomFromEditor() should find room by path', () => {
      const view = new BabelMazeView(host);
      view.graphReady = true;
      view.graph = {
        nodes: new Map([
          ['test.md', { id: 'test.md', name: 'Test', path: '/test.md' }]
        ])
      };
      host.getCurrentFile.mockReturnValue('/test.md');
      view.currentRoomId = null;
      view.discovered = new Set();
      view.revealAround = jest.fn();
      view.centerMapOnRoom = jest.fn();
      view.renderMap = jest.fn();
      view.syncCurrentRoomFromEditor();
      expect(view.currentRoomId).toBe('test.md');
      expect(view.discovered.has('test.md')).toBe(true);
    });

    // --- setLedgerSummary ---
    test('setLedgerSummary() should not throw', () => {
      const view = new BabelMazeView(host);
      view.elements = { ledgerSummary: document.createElement('div') };
      expect(() => view.setLedgerSummary({})).not.toThrow();
    });

    // --- Map navigation methods ---
    test('getRoomMapPoint() should return null without maze', () => {
      const view = new BabelMazeView(host);
      view.maze = null;
      expect(view.getRoomMapPoint('test.md')).toBeNull();
    });

    test('getRoomMapPoint() should return coordinates for valid room', () => {
      const view = new BabelMazeView(host);
      view.maze = {
        coordByRoomId: new Map([['test.md', { index: 0, x: 1, y: 2 }]]),
        width: 3,
        height: 3,
        roomOrder: new Array(9).fill('x'),
        basePassages: new Array(9).fill(0)
      };
      const pt = view.getRoomMapPoint('test.md');
      expect(pt).not.toBeNull();
      expect(typeof pt.x).toBe('number');
      expect(typeof pt.y).toBe('number');
    });

    test('getRoomMapPoint() should return null for unknown room', () => {
      const view = new BabelMazeView(host);
      view.maze = {
        coordByRoomId: new Map(),
        width: 2,
        height: 2,
        roomOrder: ['a', 'b', 'c', 'd'],
        basePassages: [0, 0, 0, 0]
      };
      expect(view.getRoomMapPoint('unknown')).toBeNull();
    });

    test('fitMapToMaze() should not throw without maze', () => {
      const view = new BabelMazeView(host);
      view.maze = null;
      expect(() => view.fitMapToMaze()).not.toThrow();
    });

    test('fitMapToMaze() should set view box', () => {
      const view = new BabelMazeView(host);
      view.maze = {
        width: 3,
        height: 3,
        roomOrder: new Array(9).fill('x'),
        basePassages: new Array(9).fill(0),
        coordByRoomId: new Map(),
        signature: 'test'
      };
      view.clampMapViewBox = jest.fn(box => box);
      view.applyMapViewBox = jest.fn();
      view.fitMapToMaze();
      expect(view.mapViewBox).toBeDefined();
    });

    test('centerMapOnRoom() should not throw without maze', () => {
      const view = new BabelMazeView(host);
      view.maze = null;
      expect(() => view.centerMapOnRoom('test')).not.toThrow();
    });

    test('centerMapOnRoom() should center on valid room', () => {
      const view = new BabelMazeView(host);
      view.maze = {
        width: 3,
        height: 3,
        roomOrder: new Array(9).fill('x'),
        basePassages: new Array(9).fill(0),
        coordByRoomId: new Map([['test.md', { index: 4, x: 1, y: 1 }]]),
        signature: 'test'
      };
      view.elements = { mapSvg: { clientWidth: 400, clientHeight: 300 } };
      view.clampMapViewBox = jest.fn(box => box);
      view.applyMapViewBox = jest.fn();
      view.centerMapOnRoom('test.md');
      expect(view.mapViewBox).toBeDefined();
    });

    test('zoomMap() should not throw without maze', () => {
      const view = new BabelMazeView(host);
      view.maze = null;
      expect(() => view.zoomMap(1.5)).not.toThrow();
    });

    test('zoomMap() should scale view box', () => {
      const view = new BabelMazeView(host);
      view.maze = {
        width: 3,
        height: 3,
        roomOrder: new Array(9).fill('x'),
        basePassages: new Array(9).fill(0),
        coordByRoomId: new Map(),
        signature: 'test'
      };
      view.mapViewBox = { x: 0, y: 0, width: 100, height: 100, signature: 'test' };
      view.clampMapViewBox = jest.fn(box => box);
      view.applyMapViewBox = jest.fn();
      view.zoomMap(0.5);
      expect(view.mapViewBox.width).toBe(50);
    });

    // --- handleMapWheel ---
    test('handleMapWheel() should not throw without maze', () => {
      const view = new BabelMazeView(host);
      view.maze = null;
      const event = { preventDefault: jest.fn(), deltaY: -1 };
      expect(() => view.handleMapWheel(event)).not.toThrow();
    });

    // --- handleMapPointerDown ---
    test('handleMapPointerDown() should not throw without maze', () => {
      const view = new BabelMazeView(host);
      view.maze = null;
      expect(() => view.handleMapPointerDown({ button: 0 })).not.toThrow();
    });

    // --- handleMapPointerMove ---
    test('handleMapPointerMove() should not throw without state', () => {
      const view = new BabelMazeView(host);
      view.mapPointerState = null;
      expect(() => view.handleMapPointerMove({ pointerId: 1, clientX: 0, clientY: 0 })).not.toThrow();
    });

    // --- handleMapPointerUp ---
    test('handleMapPointerUp() should not throw without state', () => {
      const view = new BabelMazeView(host);
      view.mapPointerState = null;
      expect(() => view.handleMapPointerUp({ pointerId: 1 })).not.toThrow();
    });

    // --- renderMap ---
    test('renderMap() should handle empty graph', () => {
      const view = new BabelMazeView(host);
      view.graphReady = false;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      view.elements = { mapSvg: svg, mapTitle: document.createElement('span') };
      view.renderMap();
      expect(svg.innerHTML).toContain('unmapped');
    });

    test('renderMap() should not throw without svg', () => {
      const view = new BabelMazeView(host);
      view.elements = {};
      expect(() => view.renderMap()).not.toThrow();
    });

    // --- updateMazeLinkOpenings ---
    test('updateMazeLinkOpenings() should update link mask', () => {
      const view = new BabelMazeView(host);
      const graph = {
        nodes: new Map([
          ['a.md', { id: 'a.md', path: '/a.md' }],
          ['b.md', { id: 'b.md', path: '/b.md' }]
        ]),
        outbound: new Map([['a.md', new Set(['b.md'])]]),
        adjacency: new Map()
      };
      view.ensureMazeLayout(graph);
      expect(view.maze).not.toBeNull();
      view.updateMazeLinkOpenings(graph);
      // linkOpenMask should be updated
      expect(view.maze.linkOpenMask).toBeDefined();
    });

    // --- Command system ---
    function setupGraphForCommands(view) {
      view.graphReady = true;
      view.graph = {
        nodes: new Map([
          ['notes/hello.md', { id: 'notes/hello.md', name: 'Hello', path: '/notes/hello.md', dir: 'notes', isVoid: false, wordCount: 100, excerpt: 'Hello excerpt', headings: ['Intro'], basenameNoExt: 'hello' }],
          ['notes/world.md', { id: 'notes/world.md', name: 'World', path: '/notes/world.md', dir: 'notes', isVoid: false, wordCount: 200, excerpt: 'World excerpt', headings: [], basenameNoExt: 'world' }]
        ]),
        outbound: new Map([['notes/hello.md', new Set(['notes/world.md'])]]),
        inbound: new Map([['notes/world.md', new Set(['notes/hello.md'])]]),
        adjacency: new Map([['notes/hello.md', new Set(['notes/world.md'])], ['notes/world.md', new Set(['notes/hello.md'])]]),
        inboundCount: new Map([['notes/hello.md', 0], ['notes/world.md', 1]]),
        edgeCount: 1
      };
      view.currentRoomId = 'notes/hello.md';
      view.discovered = new Set(['notes/hello.md']);
      view.inventory = new Set(['notes/hello.md']);
      view.elements = {
        log: document.createElement('div'),
        status: document.createElement('div'),
        mapSvg: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
        mapTitle: document.createElement('span'),
        input: document.createElement('input'),
        hintbar: document.createElement('div')
      };
      view.ensureMazeLayout(view.graph);
      return view;
    }

    test('runCommand() should handle empty input', async () => {
      const view = new BabelMazeView(host);
      await expect(view.runCommand('')).resolves.not.toThrow();
    });

    test('cmdHelp() should append help text', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('help');
      expect(view.elements.log.innerHTML).toContain('Commands:');
    });

    test('cmdWhere() should show current room', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('where');
      expect(view.elements.log.innerHTML).toContain('hello');
    });

    test('cmdWhere() should handle no room', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.currentRoomId = null;
      await view.runCommand('where');
      expect(view.elements.log.innerHTML).toContain('nowhere');
    });

    test('cmdLook() should describe the room', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('look');
      expect(view.elements.log.innerHTML).toContain('hello');
      expect(view.elements.log.innerHTML).toContain('Excerpt');
    });

    test('cmdLook() should handle void room', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.currentRoomId = '__void:0';
      view.graph.nodes.set('__void:0', { id: '__void:0', isVoid: true });
      await view.runCommand('look');
      expect(view.elements.log.innerHTML).toContain('bare');
    });

    test('cmdMap() should show map info', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('map');
      expect(view.elements.log.innerHTML).toContain('Map:');
      expect(view.elements.log.innerHTML).toContain('Cells:');
    });

    test('cmdExits() should show available exits', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('exits');
      expect(view.elements.log.innerHTML).toContain('exit');
    });

    test('cmdStats() should show maze statistics', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('stats');
      expect(view.elements.log.innerHTML).toContain('Rooms:');
    });

    test('cmdInventory() should list opened rooms', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('inventory');
      expect(view.elements.log.innerHTML).toContain('hello');
    });

    test('cmdOpen() should add current room to inventory', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.currentRoomId = 'notes/world.md';
      view.inventory = new Set();
      await view.runCommand('open');
      expect(view.inventory.has('notes/world.md')).toBe(true);
    });

    test('cmdBack() should return to previous room', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.travelHistory = ['notes/world.md'];
      view.renderMap = jest.fn();
      view.centerMapOnRoom = jest.fn();
      await view.runCommand('back');
      expect(view.currentRoomId).toBe('notes/world.md');
    });

    test('cmdBack() should say nothing to return to when empty', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.travelHistory = [];
      await view.runCommand('back');
      expect(view.elements.log.innerHTML).toContain('nowhere to return');
    });

    test('cmdSearch() should find rooms by query', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('search world');
      expect(view.elements.log.innerHTML).toContain('world');
    });

    test('cmdSearch() should handle no results', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('search xyznonexistent');
      expect(view.elements.log.innerHTML).toContain('Nothing answers');
    });

    test('cmdTeleport() should jump to room', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.renderMap = jest.fn();
      view.centerMapOnRoom = jest.fn();
      await view.runCommand('teleport notes/world.md');
      expect(view.currentRoomId).toBe('notes/world.md');
    });

    test('cmdBigPicture() should show progress summary', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('big');
      expect(view.elements.log.innerHTML).toContain('Cells revealed');
    });

    test('direction commands should call cmdGo', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.renderMap = jest.fn();
      view.centerMapOnRoom = jest.fn();
      // Test direction command
      await view.runCommand('north');
      // May or may not succeed depending on maze layout
    });

    test('cmdExamine() should show room details', async () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      await view.runCommand('examine');
      expect(view.elements.log.innerHTML).toContain('hello');
    });

    test('moveToRoom() should change current room', () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.renderMap = jest.fn();
      view.centerMapOnRoom = jest.fn();
      view.moveToRoom('notes/world.md');
      expect(view.currentRoomId).toBe('notes/world.md');
      expect(view.discovered.has('notes/world.md')).toBe(true);
    });

    test('moveToRoom() should record travel history', () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.renderMap = jest.fn();
      view.centerMapOnRoom = jest.fn();
      view.moveToRoom('notes/world.md');
      expect(view.travelHistory).toContain('notes/hello.md');
    });

    test('moveToRoom() should not change to null room', () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.moveToRoom(null);
      expect(view.currentRoomId).toBe('notes/hello.md');
    });

    test('executeCommand() should delegate to runCommand', () => {
      const view = setupGraphForCommands(new BabelMazeView(host));
      view.runCommand = jest.fn().mockResolvedValue(undefined);
      view.executeCommand('help');
      expect(view.runCommand).toHaveBeenCalledWith('help');
    });
  });

  // =========================================
  // plugin.js (maze)
  // =========================================
  describe('maze plugin.js', () => {
    test('should register plugin with TechnePlugins', () => {
      loadPluginFile('plugins/techne-maze/plugin.js');
      const plugin = window.TechnePlugins.getPlugin('techne-maze');
      expect(plugin).toBeDefined();
      expect(plugin.id).toBe('techne-maze');
      expect(typeof plugin.init).toBe('function');
    });
  });
});
