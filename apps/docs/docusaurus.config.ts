import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { PluginOptions as TypeDocOptions } from 'docusaurus-plugin-typedoc';

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
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
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
        {
          label: 'Documentation',
          position: 'left',
          type: 'dropdown',
          items: [
            { type: 'docSidebar', sidebarId: 'synthesis', label: 'Synthesis eDSL' },
            { type: 'docSidebar', sidebarId: 'cli', label: 'synth CLI' },
            { type: 'docSidebar', sidebarId: 'types', label: 'aelastics-types' },
            { type: 'docSidebar', sidebarId: 'store', label: 'aelastics-store' },
            { type: 'docSidebar', sidebarId: 'result', label: 'aelastics-result' },
          ],
        },
        {
          label: 'Resources',
          position: 'left',
          type: 'dropdown',
          items: [
            {
              label: 'Contributing',
              to: '/contributing',
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
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
