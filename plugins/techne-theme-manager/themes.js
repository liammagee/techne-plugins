/* Techne Theme Definitions
   Each theme has: name, description, bodyClass (applied to <body>),
   and tokens (override map for --techne-* vars beyond the CSS defaults).
*/

(function () {
    'use strict';

    const THEMES = {
        light: {
            name: 'Light',
            description: 'Clean light theme with red accents',
            bodyClass: '',           // no extra class — :root defaults
            tokens: {}               // all defaults from techne-tokens.css
        },

        dark: {
            name: 'Dark',
            description: 'Dark theme with red accents',
            bodyClass: 'techne-dark',
            tokens: {
                '--techne-bg': '#0a0a0a',
                '--techne-surface': '#111111',
                '--techne-surface-elevated': '#1a1a1a',
                '--techne-text': '#e0e0e0',
                '--techne-text-muted': 'rgba(224, 224, 224, 0.55)',
                '--techne-text-inverted': '#0a0a0a',
                '--techne-border': 'rgba(255, 255, 255, 0.18)',
                '--techne-border-subtle': 'rgba(255, 255, 255, 0.08)',
                '--techne-glass-bg': 'rgba(10, 10, 10, 0.85)',
                '--techne-glass-border': 'rgba(255, 255, 255, 0.08)'
            }
        },

        'techne-red-light': {
            name: 'Red Light',
            description: 'Light theme with bold red accent',
            bodyClass: '',
            tokens: {
                '--techne-accent': '#E63946',
                '--techne-accent-hover': '#c1121f',
                '--techne-accent-active': '#a30f19',
                '--techne-bg': '#ffffff',
                '--techne-surface': '#fafafa',
                '--techne-surface-elevated': '#ffffff',
                '--techne-text': '#0a0a0a',
                '--techne-text-muted': 'rgba(10, 10, 10, 0.55)',
                '--techne-text-inverted': '#ffffff',
                '--techne-border': 'rgba(10, 10, 10, 0.22)',
                '--techne-border-subtle': 'rgba(10, 10, 10, 0.10)',
                '--techne-glass-bg': 'rgba(255, 255, 255, 0.85)',
                '--techne-glass-border': 'rgba(255, 255, 255, 0.18)'
            }
        },

        'techne-red-dark': {
            name: 'Red Dark',
            description: 'Dark theme with bold red accent',
            bodyClass: 'techne-dark',
            tokens: {
                '--techne-accent': '#E63946',
                '--techne-accent-hover': '#c1121f',
                '--techne-accent-active': '#a30f19',
                '--techne-bg': '#0a0a0a',
                '--techne-surface': '#111111',
                '--techne-surface-elevated': '#1a1a1a',
                '--techne-text': '#e0e0e0',
                '--techne-text-muted': 'rgba(224, 224, 224, 0.55)',
                '--techne-text-inverted': '#0a0a0a',
                '--techne-border': 'rgba(255, 255, 255, 0.18)',
                '--techne-border-subtle': 'rgba(255, 255, 255, 0.08)',
                '--techne-glass-bg': 'rgba(10, 10, 10, 0.85)',
                '--techne-glass-border': 'rgba(255, 255, 255, 0.08)'
            }
        },

        'techne-orange-light': {
            name: 'Orange Light',
            description: 'Light theme with orange accent',
            bodyClass: '',
            tokens: {
                '--techne-accent': '#ff7a1a',
                '--techne-accent-hover': '#d45a00',
                '--techne-accent-active': '#b34900',
                '--techne-bg': '#ffffff',
                '--techne-surface': '#fafafa',
                '--techne-surface-elevated': '#ffffff',
                '--techne-text': '#0a0a0a',
                '--techne-text-muted': 'rgba(10, 10, 10, 0.55)',
                '--techne-text-inverted': '#ffffff',
                '--techne-border': 'rgba(10, 10, 10, 0.22)',
                '--techne-border-subtle': 'rgba(10, 10, 10, 0.10)',
                '--techne-glass-bg': 'rgba(255, 255, 255, 0.85)',
                '--techne-glass-border': 'rgba(255, 255, 255, 0.18)'
            }
        },

        'techne-orange-dark': {
            name: 'Orange Dark',
            description: 'Dark theme with orange accent',
            bodyClass: 'techne-dark',
            tokens: {
                '--techne-accent': '#ff7a1a',
                '--techne-accent-hover': '#d45a00',
                '--techne-accent-active': '#b34900',
                '--techne-bg': '#0a0a0a',
                '--techne-surface': '#111111',
                '--techne-surface-elevated': '#1a1a1a',
                '--techne-text': '#e0e0e0',
                '--techne-text-muted': 'rgba(224, 224, 224, 0.55)',
                '--techne-text-inverted': '#0a0a0a',
                '--techne-border': 'rgba(255, 255, 255, 0.18)',
                '--techne-border-subtle': 'rgba(255, 255, 255, 0.08)',
                '--techne-glass-bg': 'rgba(10, 10, 10, 0.85)',
                '--techne-glass-border': 'rgba(255, 255, 255, 0.08)'
            }
        },

        // Solarized Light and Solarized Dark themes were removed for brand
        // coherence — they use a blue accent (#268bd2) that conflicts with the
        // brand red. Restore from git history if needed.
    };

    // Expose for theme-manager.js (loaded next)
    window._TECHNE_THEMES = THEMES;
})();
