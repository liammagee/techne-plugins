## Plugin Development Workflow

This repository is the **source of truth** for all plugin code. It is consumed as an npm package (`@machinespirits/techne-plugins`) by:
- `~/Dev/machinespirits-website` (web LMS)
- `~/Dev/hegel-pedagogy-ai` (Electron app)

### Syncing to consumers

Both consumers have `@machinespirits/techne-plugins` as a `file:../techne-plugins` dependency. Running `npm install` or `npm run sync-plugins` in either consumer copies plugin files into their `plugins/` directory.

```bash
# After making changes here, sync to consumers:
cd ~/Dev/machinespirits-website && npm run sync-plugins
cd ~/Dev/hegel-pedagogy-ai && npm run sync-plugins
```

### Package structure

- `scripts/sync-to-consumer.js` — the sync script, exposed as `bin: sync-techne-plugins`
- `scripts/extract-backdrop-from-website.js` — reverse-sync for backdrop layers from the website
- `files` in package.json controls what gets published/installed

### Backdrop reverse sync

Visual layer definitions are authored in `machinespirits-website/index.html` and extracted into `plugins/techne-backdrop/`:

```bash
node scripts/extract-backdrop-from-website.js ~/Dev/machinespirits-website
```

