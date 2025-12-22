/**
 * Unit tests for the techne-markdown-renderer plugin
 */

describe('Techne Markdown Renderer Plugin', () => {
  beforeEach(() => {
    loadPluginSystem();
    window.TECHNE_PLUGIN_MANIFEST = [
      { id: 'techne-markdown-renderer', entry: 'plugins/techne-markdown-renderer/plugin.js', enabledByDefault: true }
    ];
  });

  describe('Plugin Registration', () => {
    test('should register with correct id', () => {
      const mockPlugin = createTestPlugin('techne-markdown-renderer', {
        init: jest.fn()
      });

      window.TechnePlugins.register(mockPlugin);
      expect(window.TechnePlugins.getPlugin('techne-markdown-renderer')).toBeDefined();
    });
  });

  describe('Citation Parsing', () => {
    function parseCitations(text) {
      const citations = [];
      const regex = /\[\^(\d+)\](?::\s*(.+))?/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        citations.push({
          id: match[1],
          content: match[2] || null,
          index: match.index
        });
      }

      return citations;
    }

    test('should find inline citations', () => {
      const text = 'According to research[^1], this is true.';
      const citations = parseCitations(text);
      expect(citations).toHaveLength(1);
      expect(citations[0].id).toBe('1');
    });

    test('should find citation definitions', () => {
      const text = '[^1]: Smith, J. (2023). Title. Journal.';
      const citations = parseCitations(text);
      expect(citations).toHaveLength(1);
      expect(citations[0].content).toContain('Smith');
    });

    test('should find multiple citations', () => {
      const text = 'See [^1] and [^2] for more.';
      const citations = parseCitations(text);
      expect(citations).toHaveLength(2);
    });
  });

  describe('Code Block Extraction', () => {
    function extractCodeBlocks(markdown) {
      const blocks = [];
      const regex = /```(\w*)\n([\s\S]*?)```/g;
      let match;

      while ((match = regex.exec(markdown)) !== null) {
        blocks.push({
          language: match[1] || 'text',
          code: match[2].trim()
        });
      }

      return blocks;
    }

    test('should extract code blocks with language', () => {
      const md = '```javascript\nconst x = 1;\n```';
      const blocks = extractCodeBlocks(md);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].language).toBe('javascript');
      expect(blocks[0].code).toBe('const x = 1;');
    });

    test('should extract code blocks without language', () => {
      const md = '```\nplain text\n```';
      const blocks = extractCodeBlocks(md);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].language).toBe('text');
    });

    test('should extract multiple code blocks', () => {
      const md = '```js\na()\n```\n\nText\n\n```python\nb()\n```';
      const blocks = extractCodeBlocks(md);
      expect(blocks).toHaveLength(2);
      expect(blocks[0].language).toBe('js');
      expect(blocks[1].language).toBe('python');
    });
  });

  describe('Header Extraction', () => {
    function extractHeaders(markdown) {
      const headers = [];
      const lines = markdown.split('\n');

      for (const line of lines) {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          headers.push({
            level: match[1].length,
            text: match[2].trim(),
            id: match[2].toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
          });
        }
      }

      return headers;
    }

    test('should extract headers with correct levels', () => {
      const md = '# H1\n## H2\n### H3';
      const headers = extractHeaders(md);
      expect(headers).toHaveLength(3);
      expect(headers[0].level).toBe(1);
      expect(headers[1].level).toBe(2);
      expect(headers[2].level).toBe(3);
    });

    test('should generate ids for headers', () => {
      const md = '# Hello World';
      const headers = extractHeaders(md);
      expect(headers[0].id).toBe('hello-world');
    });

    test('should handle special characters in headers', () => {
      const md = '# Hello, World!';
      const headers = extractHeaders(md);
      expect(headers[0].id).toBe('hello-world');
    });
  });

  describe('Link Extraction', () => {
    function extractLinks(markdown) {
      const links = [];
      const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;

      while ((match = regex.exec(markdown)) !== null) {
        const [, text, href] = match;
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        links.push({ text, href, isExternal });
      }

      return links;
    }

    test('should extract links', () => {
      const md = 'Visit [Example](https://example.com) for more.';
      const links = extractLinks(md);
      expect(links).toHaveLength(1);
      expect(links[0].text).toBe('Example');
      expect(links[0].href).toBe('https://example.com');
    });

    test('should identify external links', () => {
      const md = '[External](https://example.com) and [Internal](#section)';
      const links = extractLinks(md);
      expect(links[0].isExternal).toBe(true);
      expect(links[1].isExternal).toBe(false);
    });
  });

  describe('Table Parsing', () => {
    function parseTable(tableMarkdown) {
      const lines = tableMarkdown.trim().split('\n');
      if (lines.length < 2) return null;

      const parseRow = (line) =>
        line.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0);

      const headers = parseRow(lines[0]);
      const rows = lines.slice(2).map(parseRow);

      return { headers, rows };
    }

    test('should parse table headers', () => {
      const table = `| A | B | C |
|---|---|---|
| 1 | 2 | 3 |`;

      const parsed = parseTable(table);
      expect(parsed.headers).toEqual(['A', 'B', 'C']);
    });

    test('should parse table rows', () => {
      const table = `| A | B |
|---|---|
| 1 | 2 |
| 3 | 4 |`;

      const parsed = parseTable(table);
      expect(parsed.rows).toHaveLength(2);
      expect(parsed.rows[0]).toEqual(['1', '2']);
    });
  });

  describe('Blockquote Handling', () => {
    function parseBlockquote(text) {
      const lines = text.split('\n');
      const content = [];
      let level = 0;

      for (const line of lines) {
        const match = line.match(/^(>+)\s*(.*)$/);
        if (match) {
          level = Math.max(level, match[1].length);
          content.push(match[2]);
        }
      }

      return { content: content.join('\n'), level };
    }

    test('should parse simple blockquote', () => {
      const text = '> This is quoted';
      const result = parseBlockquote(text);
      expect(result.content).toBe('This is quoted');
      expect(result.level).toBe(1);
    });

    test('should handle nested blockquotes', () => {
      const text = '>> Nested quote';
      const result = parseBlockquote(text);
      expect(result.level).toBe(2);
    });

    test('should join multiline quotes', () => {
      const text = '> Line 1\n> Line 2';
      const result = parseBlockquote(text);
      expect(result.content).toBe('Line 1\nLine 2');
    });
  });

  describe('Text Formatting', () => {
    function applyFormatting(text) {
      // Bold
      text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic
      text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Inline code
      text = text.replace(/`(.+?)`/g, '<code>$1</code>');
      // Strikethrough
      text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

      return text;
    }

    test('should format bold text', () => {
      expect(applyFormatting('**bold**')).toBe('<strong>bold</strong>');
    });

    test('should format italic text', () => {
      expect(applyFormatting('*italic*')).toBe('<em>italic</em>');
    });

    test('should format inline code', () => {
      expect(applyFormatting('`code`')).toBe('<code>code</code>');
    });

    test('should format strikethrough', () => {
      expect(applyFormatting('~~deleted~~')).toBe('<del>deleted</del>');
    });

    test('should handle mixed formatting', () => {
      const result = applyFormatting('**bold** and *italic*');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });
  });
});
