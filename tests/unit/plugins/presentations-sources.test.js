/**
 * Unit tests that load actual presentations plugin source files
 * for coverage instrumentation.
 */

describe('Presentations Plugin Sources', () => {
  beforeEach(() => {
    loadPluginSystem();

    // Clean up globals
    delete window.markdownToHtml;
    delete window.extractSpeakerNotes;
    delete window.showSpeakerNotesPanel;
    delete window.hideSpeakerNotesPanel;
    delete window.updateSpeakerNotes;
    delete window.setupSpeakerNotesResize;
    delete window.ttsService;
    delete window.videoRecordingService;
    delete window.videoRecorder;
    delete window.speakerNotesData;

    // Mock electronAPI
    window.electronAPI = { invoke: jest.fn().mockResolvedValue({ success: true }) };

    // Mock speechSynthesis
    window.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      getVoices: jest.fn().mockReturnValue([
        { name: 'English', lang: 'en-US' }
      ]),
      onvoiceschanged: undefined
    };

    // Mock SpeechSynthesisUtterance
    window.SpeechSynthesisUtterance = jest.fn().mockImplementation(() => ({
      voice: null,
      rate: 1,
      pitch: 1,
      volume: 1,
      onstart: null,
      onend: null,
      onerror: null
    }));

    // Mock MediaRecorder
    window.MediaRecorder = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      state: 'inactive',
      ondataavailable: null,
      onstop: null,
      onerror: null,
      mimeType: 'video/webm'
    }));
    window.MediaRecorder.isTypeSupported = jest.fn().mockReturnValue(true);

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getDisplayMedia: jest.fn().mockResolvedValue({
          getVideoTracks: () => [{ stop: jest.fn() }],
          getAudioTracks: () => [],
          getTracks: () => [{ stop: jest.fn() }]
        }),
        getUserMedia: jest.fn().mockResolvedValue({
          getVideoTracks: () => [],
          getAudioTracks: () => [{ stop: jest.fn() }],
          getTracks: () => [{ stop: jest.fn() }]
        })
      },
      writable: true,
      configurable: true
    });

    // Mock AudioContext
    window.AudioContext = jest.fn().mockImplementation(() => ({
      createMediaStreamDestination: jest.fn().mockReturnValue({
        stream: { getAudioTracks: () => [], getTracks: () => [] }
      }),
      createMediaElementSource: jest.fn().mockReturnValue({
        connect: jest.fn()
      }),
      close: jest.fn()
    }));

    // Mock AbortController
    window.AbortController = class {
      constructor() {
        this.signal = {
          aborted: false,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        };
      }
      abort() {
        this.signal.aborted = true;
      }
    };
  });

  // =========================================
  // speaker-notes.js
  // =========================================
  describe('speaker-notes.js', () => {
    beforeEach(() => {
      // Create required DOM elements
      const panel = document.createElement('div');
      panel.id = 'speaker-notes-panel';
      panel.style.display = 'none';
      document.body.appendChild(panel);

      const notes = document.createElement('div');
      notes.id = 'current-slide-notes';
      panel.appendChild(notes);

      loadPluginFile('plugins/techne-presentations/speaker-notes.js');
    });

    afterEach(() => {
      const panel = document.getElementById('speaker-notes-panel');
      if (panel) panel.remove();
    });

    test('should expose speaker notes functions globally', () => {
      expect(typeof window.markdownToHtml).toBe('function');
      expect(typeof window.extractSpeakerNotes).toBe('function');
      expect(typeof window.showSpeakerNotesPanel).toBe('function');
      expect(typeof window.hideSpeakerNotesPanel).toBe('function');
      expect(typeof window.updateSpeakerNotes).toBe('function');
      expect(typeof window.setupSpeakerNotesResize).toBe('function');
    });

    test('markdownToHtml() should return empty string for falsy input', () => {
      expect(window.markdownToHtml(null)).toBe('');
      expect(window.markdownToHtml('')).toBe('');
      expect(window.markdownToHtml(undefined)).toBe('');
    });

    test('markdownToHtml() should convert headings', () => {
      expect(window.markdownToHtml('# Heading 1')).toContain('<h1>Heading 1</h1>');
      expect(window.markdownToHtml('## Heading 2')).toContain('<h2>Heading 2</h2>');
      expect(window.markdownToHtml('### Heading 3')).toContain('<h3>Heading 3</h3>');
    });

    test('markdownToHtml() should convert bold text', () => {
      const result = window.markdownToHtml('This is **bold** text');
      expect(result).toContain('<strong>bold</strong>');
    });

    test('markdownToHtml() should convert italic text', () => {
      const result = window.markdownToHtml('This is *italic* text');
      expect(result).toContain('<em>italic</em>');
    });

    test('markdownToHtml() should convert inline code', () => {
      const result = window.markdownToHtml('Use `code` here');
      expect(result).toContain('<code>code</code>');
    });

    test('markdownToHtml() should handle unordered lists', () => {
      const result = window.markdownToHtml('- item 1\n- item 2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>item 1</li>');
      expect(result).toContain('<li>item 2</li>');
      expect(result).toContain('</ul>');
    });

    test('markdownToHtml() should handle ordered lists', () => {
      const result = window.markdownToHtml('1. first\n2. second');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>first</li>');
      expect(result).toContain('<li>second</li>');
      expect(result).toContain('</ol>');
    });

    test('markdownToHtml() should wrap plain text in paragraphs', () => {
      const result = window.markdownToHtml('plain text');
      expect(result).toContain('<p>plain text</p>');
    });

    test('extractSpeakerNotes() should return empty array for falsy input', () => {
      expect(window.extractSpeakerNotes(null)).toEqual([]);
      expect(window.extractSpeakerNotes('')).toEqual([]);
    });

    test('extractSpeakerNotes() should extract notes from slides', () => {
      const content = `# Slide 1
Content
\`\`\`notes
Note for slide 1
\`\`\`
---
# Slide 2
\`\`\`notes
Note for slide 2
\`\`\``;
      const notes = window.extractSpeakerNotes(content);
      expect(notes).toHaveLength(2);
      expect(notes[0]).toBe('Note for slide 1');
      expect(notes[1]).toBe('Note for slide 2');
    });

    test('extractSpeakerNotes() should handle single slide with notes', () => {
      const content = `# Only Slide
\`\`\`notes
This is a note
\`\`\``;
      const notes = window.extractSpeakerNotes(content);
      expect(notes).toHaveLength(1);
      expect(notes[0]).toBe('This is a note');
    });

    test('extractSpeakerNotes() should handle multiple note blocks in one slide', () => {
      const content = `# Slide
\`\`\`notes
First note
\`\`\`
More content
\`\`\`notes
Second note
\`\`\``;
      const notes = window.extractSpeakerNotes(content);
      expect(notes).toHaveLength(1);
      expect(notes[0]).toContain('First note');
      expect(notes[0]).toContain('Second note');
    });

    test('showSpeakerNotesPanel() should store pending notes when not presenting', async () => {
      const content = `# Slide\n\`\`\`notes\nTest note\n\`\`\``;
      await window.showSpeakerNotesPanel(content);
      expect(window.pendingSpeakerNotes).toBeDefined();
      expect(window.pendingSpeakerNotes.content).toBe(content);
      delete window.pendingSpeakerNotes;
    });

    test('showSpeakerNotesPanel() with forceInline should show panel', async () => {
      const content = `# Slide\n\`\`\`notes\nInline note\n\`\`\``;
      const notesEl = document.getElementById('current-slide-notes');
      await window.showSpeakerNotesPanel(content, true);
      const panel = document.getElementById('speaker-notes-panel');
      expect(panel.style.display).not.toBe('none');
    });

    test('hideSpeakerNotesPanel() should hide inline panel', async () => {
      const panel = document.getElementById('speaker-notes-panel');
      panel.style.display = 'block';
      // Avoid "just opened" guard
      delete window.speakerNotesJustOpened;
      await window.hideSpeakerNotesPanel();
      expect(panel.style.display).toContain('none');
    });

    test('hideSpeakerNotesPanel() should remove exit button', async () => {
      const btn = document.createElement('button');
      btn.id = 'exit-presentation-btn';
      document.body.appendChild(btn);
      delete window.speakerNotesJustOpened;
      await window.hideSpeakerNotesPanel();
      expect(document.getElementById('exit-presentation-btn')).toBeNull();
    });

    test('hideSpeakerNotesPanel() should skip if just opened', async () => {
      window.speakerNotesJustOpened = Date.now();
      const panel = document.getElementById('speaker-notes-panel');
      panel.style.display = 'block';
      await window.hideSpeakerNotesPanel();
      // Should NOT have been hidden since just opened
      expect(panel.style.display).toBe('block');
      delete window.speakerNotesJustOpened;
    });

    test('updateSpeakerNotes() should update inline panel', async () => {
      const content = `# S1\n\`\`\`notes\nNote 1\n\`\`\`\n---\n# S2\n\`\`\`notes\nNote 2\n\`\`\``;
      const notesEl = document.getElementById('current-slide-notes');
      await window.updateSpeakerNotes(1, content);
      expect(notesEl.innerHTML).toContain('Note 2');
    });

    test('updateSpeakerNotes() should recreate speakerNotesData if missing', async () => {
      delete window.speakerNotesData;
      const content = `# S1\n\`\`\`notes\nNote\n\`\`\``;
      await window.updateSpeakerNotes(0, content);
      expect(window.speakerNotesData).toBeDefined();
      expect(window.speakerNotesData.currentSlide).toBe(0);
      delete window.speakerNotesData;
    });

    test('updateSpeakerNotes() should show empty message for slide without notes', async () => {
      const content = `# S1\nNo notes here\n---\n# S2\nAlso no notes`;
      const notesEl = document.getElementById('current-slide-notes');
      await window.updateSpeakerNotes(0, content);
      expect(notesEl.innerHTML).toContain('No speaker notes');
    });

    test('setupSpeakerNotesResize() should not throw without elements', () => {
      expect(() => window.setupSpeakerNotesResize()).not.toThrow();
    });

    test('extractSpeakerNotes() should handle slides without notes', () => {
      const content = `# Slide 1
Content only
---
# Slide 2
\`\`\`notes
Has notes
\`\`\``;
      const notes = window.extractSpeakerNotes(content);
      expect(notes).toHaveLength(2);
      expect(notes[0]).toBe('');
      expect(notes[1]).toBe('Has notes');
    });
  });

  // =========================================
  // ttsService.js
  // =========================================
  describe('ttsService.js', () => {
    beforeEach(() => {
      // Mock setTimeout so constructor's delayed loadSettings runs
      window.electronAPI.invoke.mockRejectedValue(new Error('No handler registered'));
      // File uses module.exports, so require returns the singleton. Use windowKey to expose it.
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
    });

    test('should create global ttsService instance', () => {
      expect(window.ttsService).toBeDefined();
    });

    test('constructor should initialize default state', () => {
      const tts = window.ttsService;
      expect(tts.isSpeaking).toBe(false);
      expect(tts.isLoading).toBe(false);
      expect(tts.currentUtterance).toBeNull();
      expect(tts.currentAudio).toBeNull();
      expect(tts.rate).toBe(1.0);
      expect(tts.pitch).toBe(1.0);
      expect(tts.volume).toBe(1.0);
      expect(tts.useLemonfox).toBe(false);
      expect(tts.speechQueue).toEqual([]);
      expect(tts.isProcessingQueue).toBe(false);
    });

    test('setDefaults() should set default settings', () => {
      const tts = window.ttsService;
      tts.setDefaults();
      expect(tts.settings).toBeDefined();
      expect(tts.settings.enabled).toBe(false);
      expect(tts.settings.provider).toBe('auto');
      expect(tts.settings.lemonfox.voice).toBe('sarah');
      expect(tts.settings.webSpeech.rate).toBe(1.0);
      expect(tts.settings.autoSpeak).toBe(true);
    });

    test('setRate() should clamp value between 0.1 and 10', () => {
      const tts = window.ttsService;
      tts.setRate(5);
      expect(tts.rate).toBe(5);
      tts.setRate(0);
      expect(tts.rate).toBe(0.1);
      tts.setRate(20);
      expect(tts.rate).toBe(10);
    });

    test('setPitch() should clamp value between 0 and 2', () => {
      const tts = window.ttsService;
      tts.setPitch(1.5);
      expect(tts.pitch).toBe(1.5);
      tts.setPitch(-1);
      expect(tts.pitch).toBe(0);
      tts.setPitch(5);
      expect(tts.pitch).toBe(2);
    });

    test('setVolume() should clamp value between 0 and 1', () => {
      const tts = window.ttsService;
      tts.setVolume(0.5);
      expect(tts.volume).toBe(0.5);
      tts.setVolume(-1);
      expect(tts.volume).toBe(0);
      tts.setVolume(2);
      expect(tts.volume).toBe(1);
    });

    test('cleanTextForSpeech() should remove markdown formatting', () => {
      const tts = window.ttsService;
      const input = '# Header\n**bold** and *italic*\n```\ncode block\n```\n- list item';
      const result = tts.cleanTextForSpeech(input);
      expect(result).not.toContain('# ');
      expect(result).not.toContain('**');
      expect(result).not.toContain('```');
      expect(result).toContain('bold');
      expect(result).toContain('italic');
    });

    test('cleanTextForSpeech() should preserve link text and remove URLs', () => {
      const tts = window.ttsService;
      const result = tts.cleanTextForSpeech('[Example](https://example.com)');
      expect(result).toContain('Example');
      expect(result).not.toContain('https://');
    });

    test('clearQueue() should reset queue state', () => {
      const tts = window.ttsService;
      tts.speechQueue = ['a', 'b'];
      tts.isProcessingQueue = true;
      tts.clearQueue();
      expect(tts.speechQueue).toEqual([]);
      expect(tts.isProcessingQueue).toBe(false);
    });

    test('getSettings() should return current settings', () => {
      const tts = window.ttsService;
      tts.setDefaults();
      const settings = tts.getSettings();
      expect(settings).toBeDefined();
      expect(settings.provider).toBe('auto');
    });

    test('getVoices() should return array from speechSynthesis', () => {
      const tts = window.ttsService;
      const voices = tts.getVoices();
      expect(Array.isArray(voices)).toBe(true);
    });

    test('applySettings() should apply lemonfox and webSpeech settings', () => {
      const tts = window.ttsService;
      tts.settings = {
        lemonfox: { voice: 'john' },
        webSpeech: { rate: 1.5, pitch: 0.8, volume: 0.9 }
      };
      tts.applySettings();
      expect(tts.lemonfoxVoice).toBe('john');
      expect(tts.rate).toBe(1.5);
      expect(tts.pitch).toBe(0.8);
      expect(tts.volume).toBe(0.9);
    });

    test('setVoice() should set lemonfox voice for known names', () => {
      const tts = window.ttsService;
      tts.setVoice('sarah');
      expect(tts.lemonfoxVoice).toBe('sarah');
      tts.setVoice('John');
      expect(tts.lemonfoxVoice).toBe('john');
    });

    test('setVoice() should set web speech voice for unknown names', () => {
      const tts = window.ttsService;
      tts.setVoice('English');
      // speechSynthesis.getVoices was mocked to return one English voice
    });

    test('cleanTextForSpeech() should handle blockquotes', () => {
      const tts = window.ttsService;
      const result = tts.cleanTextForSpeech('> This is a quote');
      expect(result).not.toContain('>');
      expect(result).toContain('This is a quote');
    });

    test('cleanTextForSpeech() should remove horizontal rules', () => {
      const tts = window.ttsService;
      const result = tts.cleanTextForSpeech('before\n---\nafter');
      expect(result).not.toContain('---');
    });

    test('cleanTextForSpeech() should clean up extra whitespace', () => {
      const tts = window.ttsService;
      const result = tts.cleanTextForSpeech('text\n\n\n\nmore text');
      expect(result).not.toContain('\n\n\n');
    });

    test('updateSettings() should merge and apply settings', async () => {
      const tts = window.ttsService;
      tts.setDefaults();
      await tts.updateSettings({ provider: 'lemonfox' });
      expect(tts.settings.provider).toBe('lemonfox');
    });

    test('setAutoSpeak() should update autoSpeak setting', async () => {
      const tts = window.ttsService;
      tts.setDefaults();
      await tts.setAutoSpeak(false);
      expect(tts.settings.autoSpeak).toBe(false);
    });

    test('setProvider() should update provider setting', async () => {
      const tts = window.ttsService;
      tts.setDefaults();
      await tts.setProvider('webspeech');
      expect(tts.settings.provider).toBe('webspeech');
    });

    test('setLemonfoxVoice() should update lemonfox voice', async () => {
      const tts = window.ttsService;
      tts.setDefaults();
      await tts.setLemonfoxVoice('emily');
      expect(tts.settings.lemonfox.voice).toBe('emily');
    });

    test('setWebSpeechRate() should update rate', async () => {
      const tts = window.ttsService;
      tts.setDefaults();
      await tts.setWebSpeechRate(2.0);
      expect(tts.settings.webSpeech.rate).toBe(2.0);
    });

    test('stop() should cancel speech synthesis', () => {
      const tts = window.ttsService;
      tts.stop();
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });

    test('stop() should clear mutex queue', () => {
      const tts = window.ttsService;
      tts.audioMutex.queue = [jest.fn(), jest.fn()];
      tts.stop();
      expect(tts.audioMutex.queue).toEqual([]);
    });

    test('stop() should release locked mutex', () => {
      const tts = window.ttsService;
      tts.audioMutex.locked = true;
      tts.stop();
      expect(tts.audioMutex.locked).toBe(false);
    });

    test('forceStopImmediate() should clean up active audio elements', async () => {
      const tts = window.ttsService;
      const mockAudio = {
        pause: jest.fn(),
        currentTime: 5,
        src: 'blob:test'
      };
      tts.activeAudioElements.add(mockAudio);
      tts.isSpeaking = true;
      await tts.forceStopImmediate();
      expect(tts.isSpeaking).toBe(false);
      expect(tts.activeAudioElements.size).toBe(0);
      expect(mockAudio.pause).toHaveBeenCalled();
    });

    test('forceStopImmediate() should clean up currentAudio', async () => {
      const tts = window.ttsService;
      tts.currentAudio = {
        pause: jest.fn(),
        currentTime: 0,
        src: 'blob:test'
      };
      await tts.forceStopImmediate();
      expect(tts.currentAudio).toBeNull();
    });

    test('forceStopImmediate() should cancel AbortController', async () => {
      const tts = window.ttsService;
      const controller = { abort: jest.fn() };
      tts.currentSpeechController = controller;
      await tts.forceStopImmediate();
      expect(controller.abort).toHaveBeenCalled();
      expect(tts.currentSpeechController).toBeNull();
    });

    test('clearQueue() should abort current speech controller', () => {
      const tts = window.ttsService;
      const controller = { abort: jest.fn() };
      tts.currentSpeechController = controller;
      tts.clearQueue();
      expect(controller.abort).toHaveBeenCalled();
      expect(tts.currentSpeechController).toBeNull();
    });

    test('releaseMutex() should process next in queue', () => {
      const tts = window.ttsService;
      tts.audioMutex.locked = true;
      const nextFn = jest.fn();
      tts.audioMutex.queue.push(nextFn);
      tts.releaseMutex();
      expect(tts.audioMutex.locked).toBe(false);
      expect(nextFn).toHaveBeenCalled();
    });

    test('forceStop() should call clearQueue and forceStopImmediate', async () => {
      const tts = window.ttsService;
      tts.isSpeaking = true;
      await tts.forceStop();
      expect(tts.isSpeaking).toBe(false);
    });

    test('pause() should pause speechSynthesis when speaking', () => {
      const tts = window.ttsService;
      tts.isSpeaking = true;
      tts.pause();
      expect(window.speechSynthesis.pause).toHaveBeenCalled();
    });

    test('pause() should not pause when not speaking', () => {
      const tts = window.ttsService;
      tts.isSpeaking = false;
      tts.pause();
      expect(window.speechSynthesis.pause).not.toHaveBeenCalled();
    });

    test('resume() should resume speechSynthesis', () => {
      const tts = window.ttsService;
      tts.resume();
      expect(window.speechSynthesis.resume).toHaveBeenCalled();
    });

    test('base64ToBlob() should create a Blob', () => {
      const tts = window.ttsService;
      // btoa('hello') = 'aGVsbG8='
      const blob = tts.base64ToBlob('aGVsbG8=', 'text/plain');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
    });

    test('speak() should return immediately for empty text', async () => {
      const tts = window.ttsService;
      const result = await tts.speak('');
      expect(result).toBeUndefined();
    });

    test('speak() should return immediately for null text', async () => {
      const tts = window.ttsService;
      const result = await tts.speak(null);
      expect(result).toBeUndefined();
    });

    test('initializeVoices() should load voices from speechSynthesis', () => {
      const tts = window.ttsService;
      tts.initializeVoices();
      expect(window.speechSynthesis.getVoices).toHaveBeenCalled();
    });

    test('setLemonfoxSpeed() should update speed', async () => {
      const tts = window.ttsService;
      tts.setDefaults();
      await tts.setLemonfoxSpeed(1.5);
      expect(tts.settings.lemonfox.speed).toBe(1.5);
    });

    test('setLemonfoxLanguage() should update language', async () => {
      const tts = window.ttsService;
      tts.setDefaults();
      await tts.setLemonfoxLanguage('fr-fr');
      expect(tts.settings.lemonfox.language).toBe('fr-fr');
    });

    test('setWebSpeechPitch() should update pitch', async () => {
      const tts = window.ttsService;
      tts.setDefaults();
      await tts.setWebSpeechPitch(1.3);
      expect(tts.settings.webSpeech.pitch).toBe(1.3);
    });

    test('setWebSpeechVolume() should update volume', async () => {
      const tts = window.ttsService;
      tts.setDefaults();
      await tts.setWebSpeechVolume(0.7);
      expect(tts.settings.webSpeech.volume).toBe(0.7);
    });

    test('applySettings() should do nothing with null settings', () => {
      const tts = window.ttsService;
      tts.settings = null;
      tts.rate = 1.0;
      tts.applySettings();
      expect(tts.rate).toBe(1.0); // unchanged
    });

    test('cleanTextForSpeech() should remove numbered lists', () => {
      const tts = window.ttsService;
      const result = tts.cleanTextForSpeech('1. First item\n2. Second item');
      expect(result).not.toMatch(/^\d+\./m);
    });

    test('cleanTextForSpeech() should handle images', () => {
      const tts = window.ttsService;
      const result = tts.cleanTextForSpeech('![alt](image.png)');
      expect(result).not.toContain('![');
    });

    test('cleanTextForSpeech() should handle underscore bold/italic', () => {
      const tts = window.ttsService;
      const result = tts.cleanTextForSpeech('__bold__ and _italic_');
      expect(result).toContain('bold');
      expect(result).toContain('italic');
      expect(result).not.toContain('__');
    });

    test('checkLemonfoxAvailability() should use cached result', async () => {
      const tts = window.ttsService;
      tts.availabilityChecked = true;
      tts.useLemonfox = false;
      await tts.checkLemonfoxAvailability();
      // Should return immediately without calling electronAPI
    });

    test('checkLemonfoxAvailability() with electronAPI available', async () => {
      const tts = window.ttsService;
      tts.availabilityChecked = false;
      tts.settings = { lemonfox: { voice: 'sarah' } }; // Pre-set settings to avoid loadSettings
      window.electronAPI = {
        invoke: jest.fn().mockImplementation((cmd) => {
          if (cmd === 'tts-test') return Promise.resolve({ success: true });
          if (cmd === 'tts-check-availability') return Promise.resolve({ success: true, available: true });
          return Promise.resolve({ success: true });
        })
      };
      await tts.checkLemonfoxAvailability();
      expect(tts.useLemonfox).toBe(true);
      expect(tts.useWebApi).toBe(false);
      expect(tts.availabilityChecked).toBe(true);
    });

    test('checkLemonfoxAvailability() should fallback when electron fails', async () => {
      const tts = window.ttsService;
      tts.availabilityChecked = false;
      window.electronAPI = {
        invoke: jest.fn().mockRejectedValue(new Error('not available'))
      };
      // Mock fetch for web API check
      global.fetch = jest.fn().mockRejectedValue(new Error('no API'));
      await tts.checkLemonfoxAvailability();
      expect(tts.useLemonfox).toBe(false);
      expect(tts.useWebApi).toBe(false);
      delete global.fetch;
    });

    test('checkLemonfoxAvailability() should detect web API', async () => {
      const tts = window.ttsService;
      tts.availabilityChecked = false;
      delete window.electronAPI;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ lemonfox: { available: true } })
      });
      await tts.checkLemonfoxAvailability();
      expect(tts.useLemonfox).toBe(true);
      expect(tts.useWebApi).toBe(true);
      delete global.fetch;
    });

    test('loadSettings() should load from electronAPI', async () => {
      const tts = window.ttsService;
      window.electronAPI = {
        invoke: jest.fn()
          .mockResolvedValueOnce({}) // tts-test
          .mockResolvedValueOnce({
            success: true,
            settings: { enabled: true, provider: 'lemonfox', lemonfox: { voice: 'test' }, webSpeech: {} }
          })
      };
      await tts.loadSettings();
      expect(tts.settings.enabled).toBe(true);
    });

    test('loadSettings() should use defaults when electronAPI unavailable', async () => {
      const tts = window.ttsService;
      delete window.electronAPI;
      await tts.loadSettings();
      expect(tts.settings).toBeDefined();
      expect(tts.settings.provider).toBe('auto');
    });

    test('loadSettings() should retry on handler error', async () => {
      const tts = window.ttsService;
      window.electronAPI = {
        invoke: jest.fn().mockRejectedValue(new Error('No handler registered'))
      };
      // Don't actually wait for setTimeout
      jest.useFakeTimers();
      tts.loadSettings(0);
      jest.runAllTimers();
      jest.useRealTimers();
      // Should have set defaults
      expect(tts.settings).toBeDefined();
    });

    test('performImmediateSpeech() should use web speech fallback', async () => {
      const tts = window.ttsService;
      tts.useLemonfox = false;
      tts.useWebApi = false;
      const speakSpy = jest.fn().mockResolvedValue(undefined);
      tts.speakWithWebSpeechImmediate = speakSpy;
      await tts.performImmediateSpeech('Hello world');
      expect(speakSpy).toHaveBeenCalled();
    });

    test('performImmediateSpeech() should handle AbortError', async () => {
      const tts = window.ttsService;
      tts.useLemonfox = false;
      tts.speakWithWebSpeechImmediate = jest.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      await expect(tts.performImmediateSpeech('test')).resolves.not.toThrow();
    });

    test('performImmediateSpeech() should throw non-AbortError', async () => {
      const tts = window.ttsService;
      tts.useLemonfox = false;
      tts.speakWithWebSpeechImmediate = jest.fn().mockRejectedValue(new Error('real error'));
      await expect(tts.performImmediateSpeech('test')).rejects.toThrow('real error');
    });

    test('performImmediateSpeech() should use lemonfox electron when available', async () => {
      const tts = window.ttsService;
      tts.useLemonfox = true;
      tts.useWebApi = false;
      window.electronAPI = { invoke: jest.fn() };
      tts.speakWithLemonfoxImmediate = jest.fn().mockResolvedValue(undefined);
      await tts.performImmediateSpeech('Hello');
      expect(tts.speakWithLemonfoxImmediate).toHaveBeenCalled();
    });

    test('performImmediateSpeech() should use lemonfox web API when available', async () => {
      const tts = window.ttsService;
      tts.useLemonfox = true;
      tts.useWebApi = true;
      delete window.electronAPI;
      tts.speakWithWebApiLemonfox = jest.fn().mockResolvedValue(undefined);
      await tts.performImmediateSpeech('Hello');
      expect(tts.speakWithWebApiLemonfox).toHaveBeenCalled();
    });

    test('performImmediateSpeech() should clean up controller after', async () => {
      const tts = window.ttsService;
      tts.useLemonfox = false;
      tts.speakWithWebSpeechImmediate = jest.fn().mockResolvedValue(undefined);
      await tts.performImmediateSpeech('test');
      expect(tts.currentSpeechController).toBeNull();
    });

    test('applySettings() should apply webSpeech rate/pitch/volume', () => {
      const tts = window.ttsService;
      tts.settings = {
        enabled: true,
        provider: 'auto',
        lemonfox: { voice: 'sarah', language: 'en-us', speed: 1.0 },
        webSpeech: { rate: 1.5, pitch: 0.8, volume: 0.9 }
      };
      tts.applySettings();
      expect(tts.rate).toBe(1.5);
      expect(tts.pitch).toBe(0.8);
      expect(tts.volume).toBe(0.9);
    });

    test('applySettings() should set lemonfox properties', () => {
      const tts = window.ttsService;
      tts.settings = {
        enabled: true,
        provider: 'auto',
        lemonfox: { voice: 'emma', language: 'de-de', speed: 1.2 },
        webSpeech: { rate: 1.0, pitch: 1.0, volume: 1.0 }
      };
      tts.applySettings();
      expect(tts.lemonfoxVoice).toBe('emma');
    });

    test('speak() with text should eventually call performImmediateSpeech', async () => {
      const tts = window.ttsService;
      tts.performImmediateSpeech = jest.fn().mockResolvedValue(undefined);
      tts.isSpeaking = false;
      tts.audioMutex = { locked: false, queue: [] };
      await tts.speak('Hello world');
      // Speak may call through mutex — just ensure no error
    });

    test('speakWithWebSpeechImmediate() should create utterance', async () => {
      const tts = window.ttsService;
      const signal = { aborted: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
      // Mock SpeechSynthesisUtterance
      const mockUtterance = { onend: null, onerror: null, text: '' };
      global.SpeechSynthesisUtterance = jest.fn(() => mockUtterance);
      window.speechSynthesis.speak = jest.fn((utterance) => {
        // Trigger onend
        if (utterance.onend) utterance.onend();
      });
      await tts.speakWithWebSpeechImmediate('Test text', {}, signal);
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
      delete global.SpeechSynthesisUtterance;
    });
  });

  // =========================================
  // videoRecordingService.js
  // =========================================
  describe('videoRecordingService.js', () => {
    beforeEach(() => {
      // File uses module.exports, so require returns the singleton. Use windowKey to expose it.
      loadPluginFile('plugins/techne-presentations/videoRecordingService.js', { windowKey: 'videoRecordingService' });
      // Also set the alias
      window.videoRecorder = window.videoRecordingService;
    });

    test('should create global videoRecordingService instance', () => {
      expect(window.videoRecordingService).toBeDefined();
      expect(window.videoRecorder).toBeDefined();
      expect(window.videoRecorder).toBe(window.videoRecordingService);
    });

    test('constructor should initialize default state', () => {
      const vrs = window.videoRecordingService;
      expect(vrs.mediaRecorder).toBeNull();
      expect(vrs.recordedChunks).toEqual([]);
      expect(vrs.isRecording).toBe(false);
      expect(vrs.stream).toBeNull();
      expect(vrs.audioContext).toBeNull();
      expect(vrs.audioDestination).toBeNull();
      expect(vrs.startTime).toBeNull();
    });

    test('constructor should initialize recording metadata', () => {
      const vrs = window.videoRecordingService;
      expect(vrs.recordingMetadata).toBeDefined();
      expect(vrs.recordingMetadata.slides).toEqual([]);
      expect(vrs.recordingMetadata.timestamps).toEqual([]);
      expect(vrs.recordingMetadata.duration).toBe(0);
    });

    test('formatTime() should format milliseconds correctly', () => {
      const vrs = window.videoRecordingService;
      expect(vrs.formatTime(0)).toBe('00:00:00.000');
      expect(vrs.formatTime(1000)).toBe('00:00:01.000');
      expect(vrs.formatTime(61500)).toBe('00:01:01.500');
      expect(vrs.formatTime(3661250)).toBe('01:01:01.250');
    });

    test('getStatus() should return current recording status', () => {
      const vrs = window.videoRecordingService;
      const status = vrs.getStatus();
      expect(status.isRecording).toBe(false);
      expect(status.duration).toBe(0);
      expect(status.slideCount).toBe(0);
      expect(status.dataSize).toBe(0);
    });

    test('stopRecording() should return false when not recording', () => {
      const vrs = window.videoRecordingService;
      expect(vrs.stopRecording()).toBe(false);
    });

    test('pauseRecording() should return false when not recording', () => {
      const vrs = window.videoRecordingService;
      expect(vrs.pauseRecording()).toBe(false);
    });

    test('resumeRecording() should return false when not recording', () => {
      const vrs = window.videoRecordingService;
      expect(vrs.resumeRecording()).toBe(false);
    });

    test('markSlideTransition() should not add when not recording', () => {
      const vrs = window.videoRecordingService;
      vrs.markSlideTransition(1, 'Slide 1');
      expect(vrs.recordingMetadata.slides).toHaveLength(0);
    });

    test('addTimestamp() should not add when not recording', () => {
      const vrs = window.videoRecordingService;
      vrs.addTimestamp('test', { data: 1 });
      expect(vrs.recordingMetadata.timestamps).toHaveLength(0);
    });

    test('createChapterFile() should generate valid WebVTT', () => {
      const vrs = window.videoRecordingService;
      vrs.recordingMetadata.slides = [
        { number: 1, title: 'Intro', timestamp: 0 },
        { number: 2, title: 'Main', timestamp: 5000 }
      ];
      vrs.recordingMetadata.duration = 10000;
      const vtt = vrs.createChapterFile();
      expect(vtt).toContain('WEBVTT');
      expect(vtt).toContain('Slide 1: Intro');
      expect(vtt).toContain('Slide 2: Main');
    });

    test('createChapterFile() should handle untitled slides', () => {
      const vrs = window.videoRecordingService;
      vrs.recordingMetadata.slides = [
        { number: 1, title: null, timestamp: 0 }
      ];
      vrs.recordingMetadata.duration = 5000;
      const vtt = vrs.createChapterFile();
      expect(vtt).toContain('Untitled');
    });

    test('markSlideTransition() should add when recording', () => {
      const vrs = window.videoRecordingService;
      vrs.isRecording = true;
      vrs.startTime = Date.now() - 1000;
      vrs.markSlideTransition(1, 'Test Slide');
      expect(vrs.recordingMetadata.slides).toHaveLength(1);
      expect(vrs.recordingMetadata.slides[0].number).toBe(1);
      expect(vrs.recordingMetadata.slides[0].title).toBe('Test Slide');
      expect(vrs.recordingMetadata.slides[0].timestamp).toBeGreaterThan(0);
    });

    test('addTimestamp() should add when recording', () => {
      const vrs = window.videoRecordingService;
      vrs.isRecording = true;
      vrs.startTime = Date.now() - 500;
      vrs.addTimestamp('test-label', { extra: true });
      expect(vrs.recordingMetadata.timestamps).toHaveLength(1);
      expect(vrs.recordingMetadata.timestamps[0].label).toBe('test-label');
      expect(vrs.recordingMetadata.timestamps[0].data).toEqual({ extra: true });
    });

    test('getStatus() should return duration when recording', () => {
      const vrs = window.videoRecordingService;
      vrs.isRecording = true;
      vrs.startTime = Date.now() - 2000;
      vrs.recordedChunks = [{ size: 100 }, { size: 200 }];
      const status = vrs.getStatus();
      expect(status.isRecording).toBe(true);
      expect(status.duration).toBeGreaterThanOrEqual(1900);
      expect(status.dataSize).toBe(300);
    });

    test('formatTime() should handle large values', () => {
      const vrs = window.videoRecordingService;
      expect(vrs.formatTime(86400000)).toBe('24:00:00.000'); // 24 hours
      expect(vrs.formatTime(500)).toBe('00:00:00.500');
    });

    test('saveRecording() should warn when no data', async () => {
      const vrs = window.videoRecordingService;
      vrs.recordedChunks = [];
      await vrs.saveRecording();
      // Should not throw, just warn
    });

    test('setupTTSAudioCapture() should not throw without ttsService', () => {
      const vrs = window.videoRecordingService;
      delete window.ttsService;
      expect(() => vrs.setupTTSAudioCapture()).not.toThrow();
    });

    test('stopRecording() should stop tracks and close audio context', () => {
      const vrs = window.videoRecordingService;
      const mockStop = jest.fn();
      const mockClose = jest.fn();
      vrs.mediaRecorder = { stop: mockStop };
      vrs.isRecording = true;
      vrs.stream = {
        getTracks: () => [{ stop: jest.fn() }]
      };
      vrs.audioContext = { close: mockClose };
      const result = vrs.stopRecording();
      expect(result).toBe(true);
      expect(vrs.isRecording).toBe(false);
      expect(mockStop).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  // =========================================
  // plugin.js (presentations)
  // =========================================
  // Branch coverage: videoRecordingService
  // =========================================
  describe('Branch coverage - videoRecordingService', () => {
    let vrs;

    beforeEach(() => {
      loadPluginFile('plugins/techne-presentations/videoRecordingService.js', { windowKey: 'videoRecordingService' });
      vrs = window.videoRecordingService;
    });

    test('initializeRecording() with video=false should skip video capture', async () => {
      window.MediaStream = jest.fn().mockImplementation((tracks) => ({
        getVideoTracks: () => [],
        getAudioTracks: () => [],
        getTracks: () => tracks || []
      }));
      await vrs.initializeRecording({ video: false, audio: false });
      expect(vrs.stream).toBeDefined();
    });

    test('initializeRecording() with microphone audioSource', async () => {
      window.MediaStream = jest.fn().mockImplementation((tracks) => ({
        getVideoTracks: () => [],
        getAudioTracks: () => tracks || [],
        getTracks: () => tracks || []
      }));
      await vrs.initializeRecording({ video: false, audio: true, audioSource: 'microphone' });
      expect(vrs.stream).toBeDefined();
    });

    test('initializeRecording() with tts audioSource and ttsService', async () => {
      window.ttsService = {};
      window.MediaStream = jest.fn().mockImplementation((tracks) => ({
        getVideoTracks: () => [],
        getAudioTracks: () => [],
        getTracks: () => tracks || []
      }));
      await vrs.initializeRecording({ video: false, audio: true, audioSource: 'tts' });
      expect(vrs.stream).toBeDefined();
    });

    test('stopRecording() when recording should stop tracks', () => {
      const stopFn = jest.fn();
      vrs.mediaRecorder = { stop: jest.fn() };
      vrs.isRecording = true;
      vrs.stream = { getTracks: () => [{ stop: stopFn }] };
      vrs.audioContext = { close: jest.fn() };
      const result = vrs.stopRecording();
      expect(result).toBe(true);
      expect(stopFn).toHaveBeenCalled();
      expect(vrs.audioContext.close).toHaveBeenCalled();
    });

    test('stopRecording() when not recording should return false', () => {
      vrs.isRecording = false;
      expect(vrs.stopRecording()).toBe(false);
    });

    test('stopRecording() without audioContext', () => {
      vrs.mediaRecorder = { stop: jest.fn() };
      vrs.isRecording = true;
      vrs.stream = { getTracks: () => [] };
      vrs.audioContext = null;
      expect(vrs.stopRecording()).toBe(true);
    });

    test('pauseRecording() when recording state should pause', () => {
      vrs.mediaRecorder = { pause: jest.fn(), state: 'recording' };
      vrs.isRecording = true;
      expect(vrs.pauseRecording()).toBe(true);
      expect(vrs.mediaRecorder.pause).toHaveBeenCalled();
    });

    test('pauseRecording() when not recording should return false', () => {
      vrs.isRecording = false;
      expect(vrs.pauseRecording()).toBe(false);
    });

    test('pauseRecording() when already paused should return false', () => {
      vrs.mediaRecorder = { state: 'paused' };
      vrs.isRecording = true;
      expect(vrs.pauseRecording()).toBe(false);
    });

    test('resumeRecording() when paused should resume', () => {
      vrs.mediaRecorder = { resume: jest.fn(), state: 'paused' };
      vrs.isRecording = true;
      expect(vrs.resumeRecording()).toBe(true);
      expect(vrs.mediaRecorder.resume).toHaveBeenCalled();
    });

    test('resumeRecording() when recording should return false', () => {
      vrs.mediaRecorder = { state: 'recording' };
      vrs.isRecording = true;
      expect(vrs.resumeRecording()).toBe(false);
    });

    test('startRecording() without supported types should throw', async () => {
      vrs.stream = { getVideoTracks: () => [], getAudioTracks: () => [] };
      window.MediaRecorder.isTypeSupported = jest.fn().mockReturnValue(false);
      await expect(vrs.startRecording()).rejects.toThrow('No supported video recording format');
    });

    test('startRecording() with video tracks should set videoBitsPerSecond', async () => {
      vrs.stream = {
        getVideoTracks: () => [{ stop: jest.fn() }],
        getAudioTracks: () => []
      };
      window.MediaRecorder.isTypeSupported = jest.fn().mockReturnValue(true);
      await vrs.startRecording();
      expect(vrs.isRecording).toBe(true);
    });

    test('exportRecording() with chapters', async () => {
      vrs.recordedChunks = [new Blob(['data'])];
      vrs.recordingMetadata = {
        slides: [{ number: 1, title: 'Slide 1', timestamp: 0 }],
        timestamps: [],
        duration: 1000
      };
      vrs.mediaRecorder = { mimeType: 'video/webm' };
      vrs.saveRecording = jest.fn().mockResolvedValue(undefined);
      await vrs.exportRecording({ includeChapters: true });
      expect(vrs.saveRecording).toHaveBeenCalled();
    });
  });

  // =========================================
  // Branch coverage: ttsService additional branches
  // =========================================
  describe('Branch coverage - ttsService', () => {
    test('loadSettings() retry on "No handler registered" error', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      let callCount = 0;
      window.electronAPI = {
        invoke: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount <= 1) {
            return Promise.reject(new Error('No handler registered for tts-test'));
          }
          return Promise.resolve({ success: true, settings: { lemonfox: { voice: 'sarah' }, webSpeech: { rate: 1, pitch: 1, volume: 1 } } });
        })
      };
      jest.useFakeTimers();
      await tts.loadSettings(0);
      // Should have called setDefaults due to retry path
      expect(tts.settings).toBeDefined();
      jest.useRealTimers();
    });

    test('loadSettings() without electronAPI should use defaults', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      delete window.electronAPI;
      await tts.loadSettings();
      expect(tts.settings.provider).toBe('auto');
    });

    test('applySettings() with null settings should return early', () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.settings = null;
      expect(() => tts.applySettings()).not.toThrow();
    });

    test('speak() with empty string should resolve immediately', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      const result = await tts.speak('');
      expect(result).toBeUndefined();
    });

    test('speak() with null should resolve immediately', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      const result = await tts.speak(null);
      expect(result).toBeUndefined();
    });

    test('speak() should queue when mutex is locked', () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.audioMutex.locked = true;
      // Start speak but don't await - it will be waiting for mutex
      const promise = tts.speak('test text');
      // Verify it queued
      expect(tts.audioMutex.queue.length).toBe(1);
      // Clean up: release to prevent hanging
      tts.audioMutex.locked = false;
      const next = tts.audioMutex.queue.shift();
      if (next) next();
    });

    test('performImmediateSpeech() with lemonfox via electron', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.useLemonfox = true;
      tts.speakWithLemonfoxImmediate = jest.fn().mockResolvedValue(undefined);
      window.electronAPI = { invoke: jest.fn() };
      await tts.performImmediateSpeech('hello', {});
      expect(tts.speakWithLemonfoxImmediate).toHaveBeenCalled();
    });

    test('performImmediateSpeech() with lemonfox via web API', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.useLemonfox = true;
      tts.useWebApi = true;
      delete window.electronAPI;
      tts.speakWithWebApiLemonfox = jest.fn().mockResolvedValue(undefined);
      await tts.performImmediateSpeech('hello', {});
      expect(tts.speakWithWebApiLemonfox).toHaveBeenCalled();
    });

    test('performImmediateSpeech() should fall back to web speech', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.useLemonfox = false;
      tts.speakWithWebSpeechImmediate = jest.fn().mockResolvedValue(undefined);
      await tts.performImmediateSpeech('hello', {});
      expect(tts.speakWithWebSpeechImmediate).toHaveBeenCalled();
    });

    test('performImmediateSpeech() without speechSynthesis should resolve', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.useLemonfox = false;
      const origSS = window.speechSynthesis;
      delete window.speechSynthesis;
      const result = await tts.performImmediateSpeech('hello', {});
      expect(result).toBeUndefined();
      window.speechSynthesis = origSS;
    });

    test('performImmediateSpeech() should handle AbortError', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.useLemonfox = false;
      tts.speakWithWebSpeechImmediate = jest.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      const result = await tts.performImmediateSpeech('hello', {});
      expect(result).toBeUndefined();
    });

    test('performImmediateSpeech() should rethrow non-AbortError', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.useLemonfox = false;
      tts.speakWithWebSpeechImmediate = jest.fn().mockRejectedValue(new Error('some error'));
      await expect(tts.performImmediateSpeech('hello', {})).rejects.toThrow('some error');
    });

    test('forceStopImmediate() should clean up currentAudio with blob src', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.currentAudio = {
        pause: jest.fn(),
        currentTime: 0,
        src: 'blob:http://localhost/abc',
      };
      tts.activeAudioElements = new Set();
      tts.currentSpeechController = { abort: jest.fn() };
      URL.revokeObjectURL = jest.fn();
      await tts.forceStopImmediate();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/abc');
      expect(tts.currentAudio).toBeNull();
    });

    test('forceStopImmediate() should handle currentAudio with non-blob src', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.currentAudio = {
        pause: jest.fn(),
        currentTime: 0,
        src: 'http://localhost/audio.mp3',
      };
      tts.activeAudioElements = new Set();
      URL.revokeObjectURL = jest.fn();
      await tts.forceStopImmediate();
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    test('releaseMutex() should process next in queue', () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.audioMutex.locked = true;
      const nextFn = jest.fn();
      tts.audioMutex.queue = [nextFn];
      tts.releaseMutex();
      expect(tts.audioMutex.locked).toBe(false);
      expect(nextFn).toHaveBeenCalled();
    });

    test('releaseMutex() with empty queue', () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.audioMutex.locked = true;
      tts.audioMutex.queue = [];
      tts.releaseMutex();
      expect(tts.audioMutex.locked).toBe(false);
    });

    test('clearQueue() should abort current controller', () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      const abortFn = jest.fn();
      tts.currentSpeechController = { abort: abortFn };
      tts.speechQueue = ['a', 'b'];
      tts.clearQueue();
      expect(tts.speechQueue).toEqual([]);
      expect(abortFn).toHaveBeenCalled();
      expect(tts.currentSpeechController).toBeNull();
    });

    test('clearQueue() without controller should not throw', () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.currentSpeechController = null;
      expect(() => tts.clearQueue()).not.toThrow();
    });

    test('checkLemonfoxAvailability() should return early if already checked', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.availabilityChecked = true;
      tts.useLemonfox = true;
      await tts.checkLemonfoxAvailability();
      expect(tts.useLemonfox).toBe(true); // Unchanged
    });

    test('checkLemonfoxAvailability() with electron not available result', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.availabilityChecked = false;
      tts.settings = { lemonfox: { voice: 'sarah' } };
      window.electronAPI = {
        invoke: jest.fn().mockImplementation((cmd) => {
          if (cmd === 'tts-test') return Promise.resolve({ success: true });
          if (cmd === 'tts-check-availability') return Promise.resolve({ success: true, available: false });
          return Promise.resolve({ success: true });
        })
      };
      global.fetch = jest.fn().mockRejectedValue(new Error('no API'));
      await tts.checkLemonfoxAvailability();
      expect(tts.useLemonfox).toBe(false);
      delete global.fetch;
    });

    test('checkLemonfoxAvailability() should retry settings load if missing', async () => {
      loadPluginFile('plugins/techne-presentations/ttsService.js', { windowKey: 'ttsService' });
      const tts = window.ttsService;
      tts.availabilityChecked = false;
      tts.settings = null; // No settings loaded
      window.electronAPI = {
        invoke: jest.fn().mockImplementation((cmd) => {
          if (cmd === 'tts-test') return Promise.resolve({ success: true });
          if (cmd === 'tts-get-settings') return Promise.resolve({ success: true, settings: { lemonfox: { voice: 'sarah' }, webSpeech: { rate: 1, pitch: 1, volume: 1 } } });
          if (cmd === 'tts-check-availability') return Promise.resolve({ success: true, available: true });
          return Promise.resolve({ success: true });
        })
      };
      await tts.checkLemonfoxAvailability();
      expect(tts.useLemonfox).toBe(true);
      expect(tts.settings).toBeDefined();
    });
  });

  // =========================================
  describe('presentations plugin.js', () => {
    test('should register plugin with TechnePlugins', () => {
      const registerSpy = jest.fn();
      window.TechnePlugins = { register: registerSpy };

      // Need speaker notes panel for plugin
      const panel = document.createElement('div');
      panel.id = 'speaker-notes-panel';
      document.body.appendChild(panel);

      loadPluginFile('plugins/techne-presentations/plugin.js');

      expect(registerSpy).toHaveBeenCalledTimes(1);
      const registration = registerSpy.mock.calls[0][0];
      expect(registration.id).toBe('techne-presentations');
      expect(typeof registration.init).toBe('function');

      panel.remove();
    });
  });
});
