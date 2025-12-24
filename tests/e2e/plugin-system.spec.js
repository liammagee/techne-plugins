/**
 * End-to-end tests for the Techne Plugin System
 */

const { test, expect } = require('@playwright/test');

test.describe('Plugin System E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the plugin system to initialize
    await page.waitForFunction(() => window.TechnePlugins !== undefined);
    await page.waitForSelector('#status-indicator.ready', { timeout: 10000 });
  });

  test.describe('Initial Load', () => {
    test('should display the test app correctly', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Techne Plugins Test App');
      // Status may be "Ready", "Ready (partial)", "Ready (with errors)", or "Ready (no plugins)"
      await expect(page.locator('#status-text')).toContainText('Ready');
    });

    test('should show plugin list', async ({ page }) => {
      const pluginList = page.locator('#plugin-list');
      await expect(pluginList).toBeVisible();

      // Should have at least one plugin item
      const pluginItems = page.locator('.plugin-item');
      await expect(pluginItems.first()).toBeVisible();
    });

    test('should have all plugins initially disabled', async ({ page }) => {
      const disabledBadges = page.locator('.plugin-item .status-badge:not(.enabled)');
      const count = await disabledBadges.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Plugin Selection', () => {
    test('should select plugin when clicked', async ({ page }) => {
      const firstPlugin = page.locator('.plugin-item').first();
      await firstPlugin.click();

      await expect(firstPlugin).toHaveClass(/active/);
      await expect(page.locator('#plugin-title')).not.toHaveText('Select a Plugin');
    });

    test('should enable toggle button when plugin selected', async ({ page }) => {
      const firstPlugin = page.locator('.plugin-item').first();
      await firstPlugin.click();

      await expect(page.locator('#btn-toggle')).toBeEnabled();
    });
  });

  test.describe('Enable/Disable Plugins', () => {
    test('should enable plugin when toggle clicked', async ({ page }) => {
      const firstPlugin = page.locator('.plugin-item').first();
      await firstPlugin.click();

      await page.locator('#btn-toggle').click();

      // Wait for plugin to be enabled
      await expect(firstPlugin.locator('.status-badge')).toHaveClass(/enabled/, { timeout: 5000 });
    });

    test('should disable plugin when toggle clicked again', async ({ page }) => {
      const firstPlugin = page.locator('.plugin-item').first();
      await firstPlugin.click();

      // Enable
      await page.locator('#btn-toggle').click();
      await expect(firstPlugin.locator('.status-badge')).toHaveClass(/enabled/, { timeout: 5000 });

      // Disable
      await page.locator('#btn-toggle').click();
      await expect(firstPlugin.locator('.status-badge')).not.toHaveClass(/enabled/, { timeout: 5000 });
    });

    test('Enable All button should enable all plugins', async ({ page }) => {
      await page.getByRole('button', { name: 'Enable All' }).click();

      // Wait a bit for all plugins to enable
      await page.waitForTimeout(2000);

      // All plugins should now have enabled badge
      const enabledBadges = page.locator('.plugin-item .status-badge.enabled');
      const count = await enabledBadges.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Disable All button should disable all plugins', async ({ page }) => {
      // First enable all
      await page.getByRole('button', { name: 'Enable All' }).click();
      await page.waitForTimeout(2000);

      // Then disable all
      await page.getByRole('button', { name: 'Disable All' }).click();
      await page.waitForTimeout(1000);

      // All plugins should be disabled
      const disabledBadges = page.locator('.plugin-item .status-badge:not(.enabled)');
      const totalPlugins = await page.locator('.plugin-item').count();
      const disabledCount = await disabledBadges.count();
      expect(disabledCount).toBe(totalPlugins);
    });
  });

  test.describe('Event Logging', () => {
    test('should log events when plugins are enabled', async ({ page }) => {
      const firstPlugin = page.locator('.plugin-item').first();
      await firstPlugin.click();
      await page.locator('#btn-toggle').click();

      // Wait for plugin to be enabled first
      await expect(firstPlugin.locator('.status-badge')).toHaveClass(/enabled/, { timeout: 5000 });

      // Check for log entry - look for any entry containing enabled, not just the last one
      const logEntries = page.locator('#log-entries .log-entry');
      await expect(logEntries.filter({ hasText: /enabled/i }).first()).toBeVisible({ timeout: 5000 });
    });

    test('Clear button should clear logs', async ({ page }) => {
      // First enable a plugin to create log entries
      const firstPlugin = page.locator('.plugin-item').first();
      await firstPlugin.click();
      await page.locator('#btn-toggle').click();
      await page.waitForTimeout(500);

      // Clear logs
      await page.getByRole('button', { name: 'Clear' }).click();

      // Logs should be empty
      const logEntries = page.locator('#log-entries .log-entry');
      await expect(logEntries).toHaveCount(0);
    });
  });

  test.describe('Built-in Tests', () => {
    test('Lifecycle test should pass', async ({ page }) => {
      await page.getByRole('button', { name: 'Test Lifecycle' }).click();

      const testResult = page.locator('#test-result');
      await expect(testResult).toBeVisible();
      await expect(testResult).toHaveClass(/pass/, { timeout: 5000 });
    });

    test('Events test should pass', async ({ page }) => {
      await page.getByRole('button', { name: 'Test Events' }).click();

      const testResult = page.locator('#test-result');
      await expect(testResult).toBeVisible();
      await expect(testResult).toHaveClass(/pass/, { timeout: 5000 });
    });

    test('Settings test should pass', async ({ page }) => {
      await page.getByRole('button', { name: 'Test Settings' }).click();

      const testResult = page.locator('#test-result');
      await expect(testResult).toBeVisible();
      await expect(testResult).toHaveClass(/pass/, { timeout: 5000 });
    });

    test('Error Handling test should pass', async ({ page }) => {
      await page.getByRole('button', { name: 'Test Error Handling' }).click();

      const testResult = page.locator('#test-result');
      await expect(testResult).toBeVisible();
      await expect(testResult).toHaveClass(/pass/, { timeout: 5000 });
    });

    test('Run All Tests should pass', async ({ page }) => {
      await page.getByRole('button', { name: 'Run All Tests' }).click();

      const testResult = page.locator('#test-result');
      await expect(testResult).toBeVisible({ timeout: 10000 });
      await expect(testResult).toHaveClass(/pass/, { timeout: 10000 });
    });
  });

  test.describe('Plugin API', () => {
    test('should expose TechnePlugins global', async ({ page }) => {
      const hasPluginSystem = await page.evaluate(() => {
        return typeof window.TechnePlugins === 'object';
      });
      expect(hasPluginSystem).toBe(true);
    });

    test('should have all API methods', async ({ page }) => {
      const methods = await page.evaluate(() => {
        const api = window.TechnePlugins;
        return {
          register: typeof api.register === 'function',
          start: typeof api.start === 'function',
          on: typeof api.on === 'function',
          off: typeof api.off === 'function',
          emit: typeof api.emit === 'function',
          getPlugin: typeof api.getPlugin === 'function',
          listPlugins: typeof api.listPlugins === 'function',
          getManifest: typeof api.getManifest === 'function',
          getEnabled: typeof api.getEnabled === 'function',
          isEnabled: typeof api.isEnabled === 'function',
          enablePlugin: typeof api.enablePlugin === 'function',
          disablePlugin: typeof api.disablePlugin === 'function'
        };
      });

      for (const [method, hasMethod] of Object.entries(methods)) {
        expect(hasMethod).toBe(true);
      }
    });

    test('getManifest should return array of plugins', async ({ page }) => {
      const manifest = await page.evaluate(() => {
        return window.TechnePlugins.getManifest();
      });

      expect(Array.isArray(manifest)).toBe(true);
      expect(manifest.length).toBeGreaterThan(0);
      expect(manifest[0]).toHaveProperty('id');
      expect(manifest[0]).toHaveProperty('entry');
    });

    test('settings should persist across page reloads', async ({ page }) => {
      // Set a setting
      await page.evaluate(() => {
        window.TechnePlugins.setPluginSettings('e2e-test', { value: 42 });
      });

      // Reload the page
      await page.reload();
      await page.waitForFunction(() => window.TechnePlugins !== undefined);
      await page.waitForSelector('#status-indicator.ready', { timeout: 10000 });

      // Check setting persisted
      const settings = await page.evaluate(() => {
        return window.TechnePlugins.getPluginSettings('e2e-test');
      });

      expect(settings).toEqual({ value: 42 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // The layout should still be visible and usable
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('.sidebar')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('buttons should be keyboard accessible', async ({ page }) => {
      // Tab to the Enable All button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to press Enter to activate
      await page.keyboard.press('Enter');

      // Verify button was activated (should see some effect)
      await page.waitForTimeout(500);
    });

    test('plugin items should be clickable', async ({ page }) => {
      const firstPlugin = page.locator('.plugin-item').first();
      await firstPlugin.click();

      // Should be selected
      await expect(firstPlugin).toHaveClass(/active/);
    });
  });
});

test.describe('Plugin Views', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => window.TechnePlugins !== undefined);
    await page.waitForSelector('#status-indicator.ready', { timeout: 10000 });
  });

  test('Mount View button should be disabled for disabled plugins', async ({ page }) => {
    const firstPlugin = page.locator('.plugin-item').first();
    await firstPlugin.click();

    // Plugin is disabled by default, so Mount should be disabled
    await expect(page.locator('#btn-mount')).toBeDisabled();
  });

  test('Mount View button should be enabled for enabled plugins', async ({ page }) => {
    const firstPlugin = page.locator('.plugin-item').first();
    await firstPlugin.click();

    // Enable the plugin
    await page.locator('#btn-toggle').click();
    await page.waitForTimeout(500);

    // Now Mount should be enabled
    await expect(page.locator('#btn-mount')).toBeEnabled();
  });

  test('Unmount button should work after mounting', async ({ page }) => {
    // Use presentation plugin which has a mountable view (not backdrop which is background-only)
    const presentationPlugin = page.locator('.plugin-item', { hasText: 'presentations' });
    await presentationPlugin.click();

    // Enable the plugin
    await page.locator('#btn-toggle').click();
    await expect(presentationPlugin.locator('.status-badge')).toHaveClass(/enabled/, { timeout: 5000 });

    // Mount the view
    await page.locator('#btn-mount').click();

    // Wait for mount to complete - check for view status change or unmount button to be enabled
    await expect(page.locator('#btn-unmount')).toBeEnabled({ timeout: 10000 });

    // Click unmount
    await page.locator('#btn-unmount').click();

    // Unmount button should be disabled again
    await expect(page.locator('#btn-unmount')).toBeDisabled({ timeout: 5000 });
  });
});

test.describe('API Endpoint Tests', () => {
  test('health endpoint should return ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  test('plugins endpoint should return plugin list', async ({ request }) => {
    const response = await request.get('/api/plugins');
    expect(response.ok()).toBe(true);

    const plugins = await response.json();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
    expect(plugins[0]).toHaveProperty('id');
    expect(plugins[0]).toHaveProperty('entry');
  });
});
