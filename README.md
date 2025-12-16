# Techne Plugins

A lightweight plugin system and collection of UI plugins for web applications.

## Structure

```
techne-plugins/
├── core/
│   └── techne-plugin-system.js    # Plugin loader and lifecycle management
├── plugins/
│   ├── techne-backdrop/           # Animated background effects
│   ├── techne-presentations/      # Slide-based presentation mode
│   ├── techne-markdown-renderer/  # Enhanced markdown rendering
│   ├── techne-network-diagram/    # Network/graph visualization
│   ├── techne-circle/             # Hermeneutic circle visualization
│   └── techne-maze/               # Babel maze navigation
├── themes/
│   └── presentations/             # Presentation theme stylesheets
│       ├── default.css
│       ├── academic.css
│       ├── dark.css
│       ├── minimal.css
│       ├── techne-red.css
│       └── techne-orange.css
└── README.md
```

## Usage

### 1. Include the plugin system

```html
<script src="path/to/techne-plugin-system.js"></script>
```

### 2. Define your manifest

The manifest can be defined inline or loaded from a file:

```javascript
window.TECHNE_PLUGIN_MANIFEST = [
    {
        id: 'techne-backdrop',
        entry: 'plugins/techne-backdrop/plugin.js',
        enabledByDefault: true
    },
    // ... more plugins
];
```

### 3. Extend the host (optional)

Provide app-specific capabilities to plugins:

```javascript
window.TechnePlugins.extendHost({
    getFiles: async () => { /* return file list */ },
    readFile: async (path) => { /* return file content */ },
    // ... other capabilities
});
```

### 4. Start the plugin system

```javascript
await window.TechnePlugins.start({
    enabled: ['techne-backdrop', 'techne-presentations']
});
```

## Plugin API

Each plugin receives a `host` object with these methods:

- `host.log(message)` - Log messages
- `host.warn(message)` - Log warnings
- `host.error(message)` - Log errors
- `host.loadScript(path)` - Load a JavaScript file
- `host.loadCSS(path)` - Load a CSS file
- `host.loadScriptsSequential(paths)` - Load scripts in order
- `host.emit(event, data)` - Emit events to the host app
- `host.on(event, handler)` - Listen for events

Plus any capabilities added via `extendHost()`.

## Creating a Plugin

```javascript
(function() {
    window.TechnePlugins.register({
        id: 'my-plugin',
        name: 'My Plugin',
        version: '1.0.0',

        async init(host) {
            host.log('[my-plugin] Initializing...');

            // Load dependencies
            await host.loadCSS('plugins/my-plugin/styles.css');
            await host.loadScript('plugins/my-plugin/main.js');

            // Emit events for host app
            host.emit('mode:available', {
                id: 'my-mode',
                title: 'My Mode',
                icon: '★'
            });

            host.log('[my-plugin] Initialized');
        },

        destroy() {
            // Cleanup when plugin is disabled
        }
    });
})();
```

## Presentation Themes

The `themes/presentations/` directory contains CSS themes for the presentations plugin:

| Theme | Description |
|-------|-------------|
| `default.css` | Full-featured default theme with all styling options |
| `academic.css` | Clean, professional theme for academic presentations |
| `dark.css` | Dark mode theme with high contrast |
| `minimal.css` | Stripped-down minimal styling |
| `techne-red.css` | Techne brand theme with red accents |
| `techne-orange.css` | Techne brand theme with orange accents |

To use a theme, load it before starting a presentation:

```javascript
// Load theme dynamically
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'styles/templates/presentations/dark.css';
document.head.appendChild(link);
```

## Integration

### Git Submodule

```bash
git submodule add https://github.com/yourusername/techne-plugins.git plugins
```

### Sync Script

For non-submodule setups, use a sync script:

```bash
rsync -av --delete \
    /path/to/techne-plugins/core/ \
    /path/to/your-app/plugins/
rsync -av --delete \
    /path/to/techne-plugins/plugins/ \
    /path/to/your-app/plugins/
rsync -av --delete \
    /path/to/techne-plugins/themes/ \
    /path/to/your-app/styles/templates/
```

## License

MIT
