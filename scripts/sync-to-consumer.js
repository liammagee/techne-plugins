#!/usr/bin/env node
'use strict';

// sync-to-consumer.js
//
// Copies techne-plugins files into a consuming app's directories.
// Called automatically via postinstall when the consumer runs `npm install`,
// or manually via `npm run sync-plugins`.
//
// What it syncs:
//   core/techne-plugin-system.js  -> <consumer>/plugins/
//   plugins/techne-*              -> <consumer>/plugins/techne-*  (mirror, removes stale)
//   themes/presentations          -> <consumer>/styles/templates/presentations
//
// What it skips (app-specific):
//   manifest.js, lms-host-adapter.js, plugins/activities

const fs = require('fs');
const path = require('path');

// Package root is one level up from scripts/
const PKG_ROOT = path.resolve(__dirname, '..');
// Consumer root is the working directory (where npm install was run)
const CONSUMER_ROOT = process.env.INIT_CWD || process.cwd();

// Don't sync into ourselves
if (path.resolve(CONSUMER_ROOT) === path.resolve(PKG_ROOT)) {
  process.exit(0);
}

const CONSUMER_PLUGINS = path.join(CONSUMER_ROOT, 'plugins');
const CONSUMER_THEMES = path.join(CONSUMER_ROOT, 'styles', 'templates', 'presentations');

/**
 * Recursively copy a directory, mirroring contents (new/changed files copied,
 * stale files in dest removed).
 */
function mirrorDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  // Copy source files
  const srcEntries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of srcEntries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      mirrorDir(srcPath, destPath);
    } else {
      // Only copy if content differs (or file doesn't exist)
      if (!fs.existsSync(destPath) || !buffersEqual(fs.readFileSync(srcPath), fs.readFileSync(destPath))) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // Remove stale files in dest that don't exist in source
  const destEntries = fs.readdirSync(dest, { withFileTypes: true });
  for (const entry of destEntries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (!fs.existsSync(srcPath)) {
      if (entry.isDirectory()) {
        fs.rmSync(destPath, { recursive: true });
      } else {
        fs.unlinkSync(destPath);
      }
    }
  }
}

function buffersEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.equals(b);
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  fs.mkdirSync(destDir, { recursive: true });
  if (!fs.existsSync(dest) || !buffersEqual(fs.readFileSync(src), fs.readFileSync(dest))) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

// --- Main ---

console.log('sync-techne-plugins: syncing to', CONSUMER_ROOT);

// 1. Core plugin system
const coreSrc = path.join(PKG_ROOT, 'core', 'techne-plugin-system.js');
const coreDest = path.join(CONSUMER_PLUGINS, 'techne-plugin-system.js');
if (fs.existsSync(coreSrc)) {
  fs.mkdirSync(CONSUMER_PLUGINS, { recursive: true });
  if (copyFile(coreSrc, coreDest)) {
    console.log('  copied core/techne-plugin-system.js');
  } else {
    console.log('  core/techne-plugin-system.js (unchanged)');
  }
}

// 2. Plugin directories (techne-*)
const pluginsDir = path.join(PKG_ROOT, 'plugins');
if (fs.existsSync(pluginsDir)) {
  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('techne-')) {
      const src = path.join(pluginsDir, entry.name);
      const dest = path.join(CONSUMER_PLUGINS, entry.name);
      console.log(`  syncing ${entry.name}/`);
      mirrorDir(src, dest);
    }
  }
}

// 3. Presentation themes
const themesSrc = path.join(PKG_ROOT, 'themes', 'presentations');
if (fs.existsSync(themesSrc)) {
  console.log('  syncing themes/presentations/');
  mirrorDir(themesSrc, CONSUMER_THEMES);
}

console.log('sync-techne-plugins: done');
