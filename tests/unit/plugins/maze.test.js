/**
 * Unit tests for the techne-maze plugin
 */

describe('Techne Maze Plugin', () => {
  beforeEach(() => {
    loadPluginSystem();
    window.TECHNE_PLUGIN_MANIFEST = [
      { id: 'techne-maze', entry: 'plugins/techne-maze/plugin.js', enabledByDefault: true }
    ];
  });

  describe('Plugin Registration', () => {
    test('should register with correct id', () => {
      const mockPlugin = createTestPlugin('techne-maze', {
        init: jest.fn()
      });

      window.TechnePlugins.register(mockPlugin);
      expect(window.TechnePlugins.getPlugin('techne-maze')).toBeDefined();
    });
  });

  describe('Room Parsing', () => {
    function parseRooms(content) {
      const rooms = new Map();
      const roomRegex = /^#\s*Room:\s*(.+)$/gm;
      const sections = content.split(/(?=^#\s*Room:)/gm);

      for (const section of sections) {
        const titleMatch = section.match(/^#\s*Room:\s*(.+)$/m);
        if (!titleMatch) continue;

        const title = titleMatch[1].trim();
        const id = title.toLowerCase().replace(/\s+/g, '-');
        const body = section.slice(titleMatch[0].length).trim();

        rooms.set(id, {
          id,
          title,
          content: body
        });
      }

      return rooms;
    }

    test('should parse room titles', () => {
      const content = `# Room: Entrance Hall

You are here.

# Room: Library

Books everywhere.`;

      const rooms = parseRooms(content);
      expect(rooms.size).toBe(2);
      expect(rooms.get('entrance-hall')).toBeDefined();
      expect(rooms.get('library')).toBeDefined();
    });

    test('should extract room content', () => {
      const content = `# Room: Test Room

This is the room content.

Some more text.`;

      const rooms = parseRooms(content);
      const room = rooms.get('test-room');
      expect(room.content).toContain('This is the room content');
    });
  });

  describe('Link Parsing', () => {
    function parseLinks(content) {
      const links = [];
      const linkRegex = /\[\[(\w+):([^|]+)\|([^\]]+)\]\]/g;
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        links.push({
          direction: match[1],
          target: match[2],
          text: match[3]
        });
      }

      return links;
    }

    test('should parse navigation links', () => {
      const content = '[[north:Library|Go to the Library]]';
      const links = parseLinks(content);

      expect(links).toHaveLength(1);
      expect(links[0].direction).toBe('north');
      expect(links[0].target).toBe('Library');
      expect(links[0].text).toBe('Go to the Library');
    });

    test('should parse multiple links', () => {
      const content = `[[north:Room1|North]]
[[south:Room2|South]]
[[east:Room3|East]]`;

      const links = parseLinks(content);
      expect(links).toHaveLength(3);
    });

    test('should parse item links', () => {
      const content = '[[item:Sword|Pick up the sword]]';
      const links = parseLinks(content);

      expect(links[0].direction).toBe('item');
      expect(links[0].target).toBe('Sword');
    });
  });

  describe('Navigation State', () => {
    function createMazeState(rooms) {
      return {
        currentRoom: null,
        visitedRooms: new Set(),
        inventory: [],

        enter(roomId) {
          if (!rooms.has(roomId)) return false;
          this.currentRoom = roomId;
          this.visitedRooms.add(roomId);
          return true;
        },

        canNavigate(direction, roomLinks) {
          const link = roomLinks.find(l => l.direction === direction);
          return link ? link.target : null;
        },

        pickupItem(item) {
          this.inventory.push(item);
        },

        hasItem(item) {
          return this.inventory.includes(item);
        }
      };
    }

    test('should track current room', () => {
      const rooms = new Map([['start', { id: 'start' }]]);
      const state = createMazeState(rooms);

      state.enter('start');
      expect(state.currentRoom).toBe('start');
    });

    test('should track visited rooms', () => {
      const rooms = new Map([
        ['room1', { id: 'room1' }],
        ['room2', { id: 'room2' }]
      ]);
      const state = createMazeState(rooms);

      state.enter('room1');
      state.enter('room2');

      expect(state.visitedRooms.has('room1')).toBe(true);
      expect(state.visitedRooms.has('room2')).toBe(true);
    });

    test('should fail to enter non-existent room', () => {
      const rooms = new Map();
      const state = createMazeState(rooms);

      const result = state.enter('nonexistent');
      expect(result).toBe(false);
    });

    test('should manage inventory', () => {
      const rooms = new Map();
      const state = createMazeState(rooms);

      state.pickupItem('key');
      expect(state.hasItem('key')).toBe(true);
      expect(state.hasItem('sword')).toBe(false);
    });
  });

  describe('Command Parser', () => {
    function parseCommand(input) {
      const normalized = input.trim().toLowerCase();
      const words = normalized.split(/\s+/);
      const verb = words[0];
      const args = words.slice(1).join(' ');

      const directions = ['north', 'south', 'east', 'west', 'up', 'down', 'n', 's', 'e', 'w', 'u', 'd'];
      const directionMap = { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down' };

      if (directions.includes(verb)) {
        return { type: 'move', direction: directionMap[verb] || verb };
      }

      switch (verb) {
        case 'look':
        case 'l':
          return { type: 'look', target: args || null };
        case 'take':
        case 'get':
        case 'pickup':
          return { type: 'take', item: args };
        case 'use':
          return { type: 'use', item: args };
        case 'inventory':
        case 'i':
          return { type: 'inventory' };
        case 'help':
        case '?':
          return { type: 'help' };
        default:
          return { type: 'unknown', input: normalized };
      }
    }

    test('should parse direction commands', () => {
      expect(parseCommand('north')).toEqual({ type: 'move', direction: 'north' });
      expect(parseCommand('n')).toEqual({ type: 'move', direction: 'north' });
    });

    test('should parse look command', () => {
      expect(parseCommand('look')).toEqual({ type: 'look', target: null });
      expect(parseCommand('look around')).toEqual({ type: 'look', target: 'around' });
    });

    test('should parse take command', () => {
      expect(parseCommand('take sword')).toEqual({ type: 'take', item: 'sword' });
      expect(parseCommand('get key')).toEqual({ type: 'take', item: 'key' });
    });

    test('should parse inventory command', () => {
      expect(parseCommand('inventory')).toEqual({ type: 'inventory' });
      expect(parseCommand('i')).toEqual({ type: 'inventory' });
    });

    test('should parse help command', () => {
      expect(parseCommand('help')).toEqual({ type: 'help' });
      expect(parseCommand('?')).toEqual({ type: 'help' });
    });

    test('should handle unknown commands', () => {
      expect(parseCommand('dance')).toEqual({ type: 'unknown', input: 'dance' });
    });
  });

  describe('Graph Building', () => {
    function buildGraph(rooms, links) {
      const nodes = [];
      const edges = [];

      for (const [id, room] of rooms) {
        nodes.push({
          id,
          label: room.title,
          type: 'room'
        });
      }

      for (const link of links) {
        edges.push({
          source: link.sourceRoom,
          target: link.target.toLowerCase().replace(/\s+/g, '-'),
          direction: link.direction
        });
      }

      return { nodes, edges };
    }

    test('should create nodes for rooms', () => {
      const rooms = new Map([
        ['room1', { id: 'room1', title: 'Room 1' }],
        ['room2', { id: 'room2', title: 'Room 2' }]
      ]);

      const { nodes } = buildGraph(rooms, []);
      expect(nodes).toHaveLength(2);
      expect(nodes[0].label).toBe('Room 1');
    });

    test('should create edges for links', () => {
      const rooms = new Map([
        ['room1', { id: 'room1', title: 'Room 1' }],
        ['room2', { id: 'room2', title: 'Room 2' }]
      ]);

      const links = [
        { sourceRoom: 'room1', target: 'Room 2', direction: 'north' }
      ];

      const { edges } = buildGraph(rooms, links);
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe('room1');
      expect(edges[0].target).toBe('room-2');
    });
  });

  describe('History Tracking', () => {
    function createHistory() {
      const entries = [];
      let position = -1;

      return {
        add(entry) {
          // Remove future entries if we're not at the end
          entries.splice(position + 1);
          entries.push(entry);
          position = entries.length - 1;
        },

        back() {
          if (position > 0) {
            position--;
            return entries[position];
          }
          return null;
        },

        forward() {
          if (position < entries.length - 1) {
            position++;
            return entries[position];
          }
          return null;
        },

        current() {
          return position >= 0 ? entries[position] : null;
        },

        getAll() {
          return [...entries];
        }
      };
    }

    test('should track visited rooms', () => {
      const history = createHistory();
      history.add('entrance');
      history.add('library');
      history.add('study');

      expect(history.getAll()).toEqual(['entrance', 'library', 'study']);
    });

    test('should allow going back', () => {
      const history = createHistory();
      history.add('room1');
      history.add('room2');

      expect(history.back()).toBe('room1');
    });

    test('should allow going forward', () => {
      const history = createHistory();
      history.add('room1');
      history.add('room2');
      history.back();

      expect(history.forward()).toBe('room2');
    });

    test('should return null when at start', () => {
      const history = createHistory();
      history.add('room1');

      expect(history.back()).toBe(null);
    });
  });
});
