import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { PluginOptions as TypeDocOptions } from 'docusaurus-plugin-typedoc';

// The stock themes paint comments in muted gray; give them a distinct
// green in both variants so shell sessions read clearly.
const lightCodeTheme: typeof prismThemes.github = {
  ...prismThemes.github,
  styles: [
    ...prismThemes.github.styles.filter((s) => !s.types.includes('comment')),
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {color: '#0b8235', fontStyle: 'italic' as const},
    },
    // synth CLI sessions (tokens from src/theme/prism-include-languages):
    // every flag amber, every operand (ref/path/name/URL) blue.
    {types: ['parameter'], style: {color: '#e36209'}},
    {types: ['operand-path', 'operand-name'], style: {color: '#005cc5'}},
  ],
};
const darkCodeTheme: typeof prismThemes.dracula = {
  ...prismThemes.dracula,
  styles: [
    ...prismThemes.dracula.styles.filter((s) => !s.types.includes('comment')),
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {color: '#6a9955', fontStyle: 'italic' as const},
    },
    {types: ['parameter'], style: {color: '#ffb86c'}},
    {types: ['operand-path', 'operand-name'], style: {color: '#8be9fd'}},
  ],
};

const GITHUB_ORG = 'AelasticS';
const SOURCE_REPO = 'Synthesis';
const PAGES_REPO = 'aelastics';

const config: Config = {
  title: 'Synthesis',
  tagline: 'TypeScript libraries for robust application development',
  favicon: 'img/favicon.ico',

  url: `https://${GITHUB_ORG}.github.io`,
  baseUrl: `/${PAGES_REPO}/`,
  organizationName: GITHUB_ORG,
  projectName: PAGES_REPO,
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  markdown: {
    format: 'detect',
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        // The site was restructured into User Guide / Developer Guide tracks
        // (2026-08); these keep the previously published URLs working.
        redirects: [
          { from: '/cli/intro', to: '/user-guide/concepts' },
          { from: '/cli/installation', to: '/user-guide/getting-started/installation' },
          { from: '/cli/commands', to: '/user-guide/reference/commands' },
          { from: '/cli/configurations', to: '/user-guide/guides/configurations' },
          { from: '/cli/pipelines', to: '/user-guide/guides/pipelines' },
          { from: '/cli/packaging-transformations', to: '/developer-guide/guides/packaging-transformations' },
          { from: '/synthesis', to: '/developer-guide' },
          { from: '/synthesis/defining-metamodels', to: '/developer-guide/guides/defining-metamodels' },
          { from: '/synthesis/jsx-components', to: '/developer-guide/guides/jsx-components' },
          { from: '/synthesis/building-models', to: '/developer-guide/guides/building-models' },
          { from: '/synthesis/writing-transformations', to: '/developer-guide/guides/writing-transformations' },
          { from: '/synthesis/polymorphic-dispatch', to: '/developer-guide/guides/polymorphic-dispatch' },
          { from: '/synthesis/variability', to: '/developer-guide/guides/variability' },
        ],
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-result',
        entryPoints: ['../../libraries/aelastics-result/src/aelastics-result.ts'],
        tsconfig: '../../libraries/aelastics-result/tsconfig.json',
        out: 'docs/result/api',
      } satisfies Partial<TypeDocOptions>,
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-types',
        entryPoints: ['../../libraries/aelastics-types/src/index.ts'],
        tsconfig: '../../libraries/aelastics-types/tsconfig.json',
        out: 'docs/types/api',
      } satisfies Partial<TypeDocOptions>,
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-store',
        entryPoints: ['../../libraries/aelastics-store/src/index.ts'],
        tsconfig: '../../libraries/aelastics-store/tsconfig.json',
        out: 'docs/store/api',
      } satisfies Partial<TypeDocOptions>,
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Synthesis',
      items: [
        { type: 'docSidebar', sidebarId: 'userGuide', position: 'left', label: 'User Guide' },
        { type: 'docSidebar', sidebarId: 'developerGuide', position: 'left', label: 'Developer Guide' },
        {
          label: 'Libraries',
          position: 'left',
          type: 'dropdown',
          items: [
            { type: 'docSidebar', sidebarId: 'types', label: '@aelastics/types' },
            { type: 'docSidebar', sidebarId: 'store', label: '@aelastics/store' },
            { type: 'docSidebar', sidebarId: 'result', label: '@aelastics/result' },
          ],
        },
        {
          label: 'Resources',
          position: 'left',
          type: 'dropdown',
          items: [
            {
              label: 'Download synth CLI',
              to: '/user-guide/getting-started/download',
            },
            {
              label: 'Contributing',
              href: `https://github.com/${GITHUB_ORG}/${SOURCE_REPO}/blob/main/CONTRIBUTING.md`,
            },
            {
              label: 'GitHub',
              href: `https://github.com/${GITHUB_ORG}/${SOURCE_REPO}`,
            },
          ],
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © 2019–${new Date().getFullYear()} AelasticS.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ['typescript', 'bash', 'powershell'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
