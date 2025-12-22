/**
 * Techne Plugins Test App (Electron) - Renderer Process Logic
 */

// State
let currentPlugin = null;
let mountedView = null;
let availableModes = {};

// Logging
function log(message, type = 'info') {
  const container = document.getElementById('log-entries');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toISOString().substr(11, 8)}] ${message}`;
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

function clearLogs() {
  document.getElementById('log-entries').innerHTML = '';
}

// Status updates
function setStatus(text, state = 'ready') {
  document.getElementById('status-text').textContent = text;
  const indicator = document.getElementById('status-indicator');
  indicator.className = `status-indicator ${state}`;
}

// Initialize the app
async function init() {
  log('Initializing Electron test app...');

  // Update Electron info
  if (window.electronAPI) {
    document.getElementById('platform').textContent = window.electronAPI.platform || 'unknown';
    document.getElementById('electron-api').textContent = 'Available';
    log('Electron API detected', 'success');
  } else {
    document.getElementById('electron-api').textContent = 'Not Available';
    log('Warning: Electron API not available', 'warn');
  }

  // Set up event listeners
  window.TechnePlugins.on('plugin:registered', ({ id }) => {
    log(`Plugin registered: ${id}`, 'success');
  });

  window.TechnePlugins.on('plugin:enabled', ({ id }) => {
    log(`Plugin enabled: ${id}`, 'success');
    updatePluginList();
  });

  window.TechnePlugins.on('plugin:disabled', ({ id }) => {
    log(`Plugin disabled: ${id}`, 'warn');
    updatePluginList();
  });

  window.TechnePlugins.on('mode:available', (mode) => {
    log(`Mode available: ${mode.id} - ${mode.title}`);
    availableModes[mode.id] = mode;
  });

  window.TechnePlugins.on('plugins:started', ({ enabled }) => {
    log(`Plugins started. Enabled: ${enabled.join(', ') || 'none'}`, 'success');
    setStatus('Ready', 'ready');
    updatePluginList();
  });

  // Enable dev mode for hot reload
  window.TechnePlugins.setDevMode(true);

  // Start the plugin system
  try {
    await window.TechnePlugins.start({
      appId: 'techne-test-electron',
      devMode: true
    });
    log('Plugin system started successfully', 'success');
  } catch (err) {
    log(`Failed to start plugin system: ${err.message}`, 'error');
    setStatus('Error', 'error');
  }
}

// Update the plugin list in the sidebar
function updatePluginList() {
  const list = document.getElementById('plugin-list');
  const manifest = window.TechnePlugins.getManifest();
  const enabled = new Set(window.TechnePlugins.getEnabled());

  list.innerHTML = manifest.map(plugin => {
    const isEnabled = enabled.has(plugin.id);
    const isActive = currentPlugin === plugin.id;
    return `
      <li class="plugin-item ${isActive ? 'active' : ''} ${isEnabled ? '' : 'disabled'}"
          onclick="selectPlugin('${plugin.id}')">
        <div class="name">${plugin.id}</div>
        <span class="status-badge ${isEnabled ? 'enabled' : ''}">${isEnabled ? 'Enabled' : 'Disabled'}</span>
      </li>
    `;
  }).join('');
}

// Select a plugin
function selectPlugin(pluginId) {
  currentPlugin = pluginId;
  updatePluginList();

  const isEnabled = window.TechnePlugins.isEnabled(pluginId);
  document.getElementById('plugin-title').textContent = pluginId;
  document.getElementById('btn-toggle').disabled = false;
  document.getElementById('btn-toggle').textContent = isEnabled ? 'Disable' : 'Enable';
  document.getElementById('btn-mount').disabled = !isEnabled;
  document.getElementById('btn-unmount').disabled = true;

  log(`Selected plugin: ${pluginId}`);
}

// Toggle current plugin enabled state
async function toggleCurrentPlugin() {
  if (!currentPlugin) return;

  const isEnabled = window.TechnePlugins.isEnabled(currentPlugin);

  if (isEnabled) {
    if (mountedView) {
      unmountCurrentPlugin();
    }
    const result = window.TechnePlugins.disablePlugin(currentPlugin);
    if (!result) {
      log(`Failed to disable ${currentPlugin} - may have dependents`, 'error');
    }
  } else {
    await window.TechnePlugins.enablePlugin(currentPlugin);
  }

  selectPlugin(currentPlugin);
}

// Mount current plugin view
async function mountCurrentPlugin() {
  if (!currentPlugin) return;

  const container = document.getElementById('plugin-container');
  container.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';

  const modeId = currentPlugin.replace('techne-', '');
  const mode = availableModes[modeId];

  if (!mode) {
    log(`No mode found for ${currentPlugin}. Available: ${Object.keys(availableModes).join(', ')}`, 'warn');
    container.innerHTML = `
      <div class="empty-state">
        <p>No mountable view found for this plugin.</p>
        <p style="font-size: 0.8rem; margin-top: 0.5rem;">Available modes: ${Object.keys(availableModes).join(', ') || 'none'}</p>
      </div>
    `;
    return;
  }

  try {
    log(`Mounting mode: ${modeId}`);
    mountedView = await mode.mount(container, {
      content: getTestContent(currentPlugin)
    });

    document.getElementById('view-status').textContent = 'Mounted';
    document.getElementById('view-status').className = 'status-badge enabled';
    document.getElementById('btn-unmount').disabled = false;
    log(`Successfully mounted ${modeId}`, 'success');
  } catch (err) {
    log(`Failed to mount ${modeId}: ${err.message}`, 'error');
    container.innerHTML = `
      <div class="empty-state" style="color: var(--error);">
        <p>Error mounting view: ${err.message}</p>
      </div>
    `;
  }
}

// Get test content for a plugin
function getTestContent(pluginId) {
  const testContents = {
    'techne-presentations': `# Electron Test Presentation

---

## Slide 1

Testing in Electron environment.

<!--notes: Speaker notes work in Electron too -->

---

## Slide 2

- IPC communication works
- File system access available
- Native menus supported

---

## End

Thank you!
`,
    'techne-markdown-renderer': `# Markdown in Electron

This tests the markdown renderer in Electron.

## Features

- Native file access
- IPC communication
- Electron-specific APIs

\`\`\`javascript
// Electron preload example
contextBridge.exposeInMainWorld('api', {
  test: () => 'works!'
});
\`\`\`
`,
    'techne-network-diagram': JSON.stringify({
      nodes: [
        { id: 'main', label: 'Main Process', type: 'file' },
        { id: 'renderer', label: 'Renderer', type: 'file' },
        { id: 'preload', label: 'Preload', type: 'heading' }
      ],
      edges: [
        { source: 'main', target: 'preload' },
        { source: 'preload', target: 'renderer' }
      ]
    }),
    'techne-maze': `# Room: Main Process

You are in the Electron main process.

[[north:Renderer|IPC to Renderer]]
[[east:Preload|Through Preload Script]]
`,
    'techne-circle': JSON.stringify({
      center: { label: 'Electron', id: 'center' },
      items: [
        { label: 'Main', id: 'main' },
        { label: 'Renderer', id: 'renderer' },
        { label: 'Preload', id: 'preload' },
        { label: 'IPC', id: 'ipc' }
      ]
    })
  };

  return testContents[pluginId] || 'Test content for ' + pluginId;
}

// Unmount current plugin view
function unmountCurrentPlugin() {
  if (!currentPlugin || !mountedView) return;

  const modeId = currentPlugin.replace('techne-', '');
  const mode = availableModes[modeId];

  if (mode && typeof mode.unmount === 'function') {
    try {
      mode.unmount(mountedView);
      log(`Unmounted ${modeId}`, 'success');
    } catch (err) {
      log(`Error unmounting ${modeId}: ${err.message}`, 'warn');
    }
  }

  mountedView = null;
  document.getElementById('plugin-container').innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
      <p>View unmounted. Click "Mount View" to test again.</p>
    </div>
  `;
  document.getElementById('view-status').textContent = 'Not Mounted';
  document.getElementById('view-status').className = 'status-badge';
  document.getElementById('btn-unmount').disabled = true;
}

// Enable all plugins
async function enableAllPlugins() {
  log('Enabling all plugins...');
  const manifest = window.TechnePlugins.getManifest();
  for (const plugin of manifest) {
    await window.TechnePlugins.enablePlugin(plugin.id);
  }
  updatePluginList();
  log('All plugins enabled', 'success');
}

// Disable all plugins
function disableAllPlugins() {
  log('Disabling all plugins...');
  unmountCurrentPlugin();

  const enabled = [...window.TechnePlugins.getEnabled()];
  for (const id of enabled) {
    window.TechnePlugins.disablePlugin(id);
  }
  updatePluginList();
  log('All plugins disabled', 'success');
}

// Reload all plugins
async function reloadAllPlugins() {
  log('Reloading all plugins...');
  const result = await window.TechnePlugins.reloadAllPlugins();
  if (result.success) {
    log('All plugins reloaded', 'success');
    updatePluginList();
  } else {
    log(`Reload failed: ${result.error}`, 'error');
  }
}

// Test runner
async function runTest(testName) {
  const resultContainer = document.getElementById('test-result');
  resultContainer.style.display = 'block';
  resultContainer.className = 'test-result';
  resultContainer.textContent = `Running ${testName} test...`;

  try {
    const result = await runTestCase(testName);
    resultContainer.className = `test-result ${result.passed ? 'pass' : 'fail'}`;
    resultContainer.textContent = formatTestResult(result);
    log(`Test ${testName}: ${result.passed ? 'PASSED' : 'FAILED'}`, result.passed ? 'success' : 'error');
  } catch (err) {
    resultContainer.className = 'test-result fail';
    resultContainer.textContent = `Error: ${err.message}`;
    log(`Test ${testName} error: ${err.message}`, 'error');
  }
}

async function runTestCase(testName) {
  const tests = {
    lifecycle: testLifecycle,
    events: testEvents,
    settings: testSettings,
    electron: testElectronIPC
  };

  const testFn = tests[testName];
  if (!testFn) {
    return { passed: false, name: testName, error: 'Unknown test' };
  }

  return await testFn();
}

async function testLifecycle() {
  const results = [];

  results.push({
    name: 'getManifest returns array',
    passed: Array.isArray(window.TechnePlugins.getManifest())
  });

  results.push({
    name: 'getEnabled returns array',
    passed: Array.isArray(window.TechnePlugins.getEnabled())
  });

  results.push({
    name: 'listPlugins returns array',
    passed: Array.isArray(window.TechnePlugins.listPlugins())
  });

  const firstPlugin = window.TechnePlugins.getManifest()[0];
  if (firstPlugin) {
    const wasEnabled = window.TechnePlugins.isEnabled(firstPlugin.id);
    await window.TechnePlugins.enablePlugin(firstPlugin.id);
    results.push({
      name: 'enablePlugin enables plugin',
      passed: window.TechnePlugins.isEnabled(firstPlugin.id)
    });

    if (!wasEnabled) {
      window.TechnePlugins.disablePlugin(firstPlugin.id);
      results.push({
        name: 'disablePlugin disables plugin',
        passed: !window.TechnePlugins.isEnabled(firstPlugin.id)
      });
    }
  }

  return {
    passed: results.every(r => r.passed),
    name: 'Lifecycle Tests',
    results
  };
}

async function testEvents() {
  const results = [];
  let eventReceived = false;

  const unsubscribe = window.TechnePlugins.on('test:electron-event', (data) => {
    eventReceived = data?.test === true;
  });

  results.push({
    name: 'on() returns unsubscribe function',
    passed: typeof unsubscribe === 'function'
  });

  window.TechnePlugins.emit('test:electron-event', { test: true });
  await new Promise(r => setTimeout(r, 10));

  results.push({
    name: 'emit() triggers handlers',
    passed: eventReceived
  });

  eventReceived = false;
  unsubscribe();
  window.TechnePlugins.emit('test:electron-event', { test: true });
  await new Promise(r => setTimeout(r, 10));

  results.push({
    name: 'off() removes handler',
    passed: !eventReceived
  });

  return {
    passed: results.every(r => r.passed),
    name: 'Event Tests',
    results
  };
}

async function testSettings() {
  const results = [];
  const testPluginId = 'test-electron-settings';

  const success = window.TechnePlugins.setPluginSettings(testPluginId, { electronMode: true, fontSize: 14 });
  results.push({
    name: 'setPluginSettings returns true',
    passed: success === true
  });

  const settings = window.TechnePlugins.getPluginSettings(testPluginId);
  results.push({
    name: 'getPluginSettings returns saved settings',
    passed: settings?.electronMode === true && settings?.fontSize === 14
  });

  window.TechnePlugins.updatePluginSettings(testPluginId, { fontSize: 18 });
  const updated = window.TechnePlugins.getPluginSettings(testPluginId);
  results.push({
    name: 'updatePluginSettings merges settings',
    passed: updated?.electronMode === true && updated?.fontSize === 18
  });

  window.TechnePlugins.clearPluginSettings(testPluginId);
  const cleared = window.TechnePlugins.getPluginSettings(testPluginId);
  results.push({
    name: 'clearPluginSettings removes settings',
    passed: cleared === null
  });

  return {
    passed: results.every(r => r.passed),
    name: 'Settings Tests',
    results
  };
}

async function testElectronIPC() {
  const results = [];

  // Test electronAPI availability
  results.push({
    name: 'electronAPI is available',
    passed: !!window.electronAPI
  });

  results.push({
    name: 'electronAPI.isElectron is true',
    passed: window.electronAPI?.isElectron === true
  });

  results.push({
    name: 'electronAPI.platform is set',
    passed: typeof window.electronAPI?.platform === 'string'
  });

  results.push({
    name: 'electronAPI.invoke is function',
    passed: typeof window.electronAPI?.invoke === 'function'
  });

  // Test IPC invoke
  if (window.electronAPI?.invoke) {
    try {
      const plugins = await window.electronAPI.invoke('list-plugins');
      results.push({
        name: 'IPC list-plugins returns array',
        passed: Array.isArray(plugins)
      });
    } catch (err) {
      results.push({
        name: 'IPC list-plugins returns array',
        passed: false,
        error: err.message
      });
    }

    try {
      const files = await window.electronAPI.invoke('get-files');
      results.push({
        name: 'IPC get-files returns object',
        passed: files && typeof files === 'object' && 'files' in files
      });
    } catch (err) {
      results.push({
        name: 'IPC get-files returns object',
        passed: false,
        error: err.message
      });
    }
  }

  return {
    passed: results.every(r => r.passed),
    name: 'Electron IPC Tests',
    results
  };
}

async function runAllTests() {
  const allTests = ['lifecycle', 'events', 'settings', 'electron'];
  const results = [];

  for (const test of allTests) {
    const result = await runTestCase(test);
    results.push(result);
  }

  const resultContainer = document.getElementById('test-result');
  resultContainer.style.display = 'block';

  const allPassed = results.every(r => r.passed);
  resultContainer.className = `test-result ${allPassed ? 'pass' : 'fail'}`;
  resultContainer.textContent = results.map(r => formatTestResult(r)).join('\n\n');

  log(`All tests: ${allPassed ? 'PASSED' : 'FAILED'} (${results.filter(r => r.passed).length}/${results.length})`,
      allPassed ? 'success' : 'error');
}

function formatTestResult(result) {
  let output = `${result.passed ? '[PASS]' : '[FAIL]'} ${result.name}\n`;
  if (result.results) {
    for (const r of result.results) {
      output += `  ${r.passed ? '✓' : '✗'} ${r.name}`;
      if (r.error) output += ` (${r.error})`;
      output += '\n';
    }
  }
  if (result.error) {
    output += `  Error: ${result.error}\n`;
  }
  return output;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
