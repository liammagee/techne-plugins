/**
 * Minimal test server for techne-plugins
 * Serves the test web app and plugin files
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3456;

// Root directory for techne-plugins
const ROOT = path.resolve(__dirname, '../..');

// Serve static files from the web test app
app.use('/app', express.static(__dirname));

// Serve plugin system core
app.use('/core', express.static(path.join(ROOT, 'core')));

// Serve plugins
app.use('/plugins', express.static(path.join(ROOT, 'plugins')));

// Serve themes
app.use('/themes', express.static(path.join(ROOT, 'themes')));

// Serve shared test resources
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Serve test fixtures
app.use('/fixtures', express.static(path.join(ROOT, 'tests/fixtures')));

// API: List available plugins
app.get('/api/plugins', (req, res) => {
  const pluginsDir = path.join(ROOT, 'plugins');
  const plugins = [];

  try {
    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('techne-')) {
        const pluginPath = path.join(pluginsDir, entry.name, 'plugin.js');
        if (fs.existsSync(pluginPath)) {
          plugins.push({
            id: entry.name,
            entry: `plugins/${entry.name}/plugin.js`
          });
        }
      }
    }
  } catch (err) {
    console.error('Error listing plugins:', err);
  }

  res.json(plugins);
});

// API: Read file content (for plugins that need it)
app.get('/api/files/:filepath(*)', (req, res) => {
  const filePath = path.join(ROOT, 'tests/fixtures', req.params.filepath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content, path: req.params.filepath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for root and any unmatched routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
  // For SPA-style routing, serve index.html
  if (!req.path.includes('.')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`Techne Plugins Test Server running at http://localhost:${PORT}`);
  console.log(`Plugin system: http://localhost:${PORT}/core/techne-plugin-system.js`);
  console.log(`Plugins: http://localhost:${PORT}/plugins/`);
});
