/* Techne Theme Manager Plugin
   - Unified design tokens, theme switching, and (future) theme editing.
   - Defines canonical --techne-* CSS custom properties.
   - Each host app provides an adapter CSS that maps --techne-* → app-specific vars.
*/

(function () {
    const baseUrl = (() => {
        const src = document.currentScript?.src;
        if (src) return new URL('./', src).toString();
        return 'plugins/techne-theme-manager/';
    })();

    const resolve = (rel) => new URL(rel, baseUrl).toString();

    window.TechnePlugins?.register?.({
        id: 'techne-theme-manager',
        name: 'Techne Theme Manager',
        version: '0.1.0',
        settings: {
            activeTheme: {
                type: 'select',
                label: 'Active Theme',
                options: [
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'techne-red', label: 'Techne Red' },
                    { value: 'techne-orange', label: 'Techne Orange' }
                ],
                default: 'light'
            },
            followSystem: {
                type: 'boolean',
                label: 'Follow system light/dark preference',
                default: false
            }
        },
        async init(host) {
            await host.loadCSS(resolve('techne-tokens.css'));

            // Load host-provided adapter CSS (maps --techne-* → app vars).
            // Convention: styles/techne-theme-adapter.css (website) or
            //             css/techne-theme-adapter.css (NightOwl).
            const adapterPaths = [
                'styles/techne-theme-adapter.css',
                'css/techne-theme-adapter.css'
            ];
            for (const path of adapterPaths) {
                try {
                    const resp = await fetch(path, { method: 'HEAD' });
                    if (resp.ok) {
                        await host.loadCSS(path);
                        break;
                    }
                } catch (_) { /* not found, try next */ }
            }

            await host.loadScript(resolve('themes.js'));
            await host.loadScript(resolve('theme-manager.js'));

            // Initialize the manager with the host API
            if (window.techneThemeManager) {
                window.techneThemeManager._init(host);
            }
        },
        destroy() {
            if (window.techneThemeManager) {
                window.techneThemeManager._destroy();
            }
        }
    });
})();
