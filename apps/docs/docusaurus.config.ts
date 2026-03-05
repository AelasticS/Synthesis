import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { PluginOptions as TypeDocOptions } from 'docusaurus-plugin-typedoc';

// Replace with your GitHub username / org name
const GITHUB_ORG = 'YOUR_GITHUB_USERNAME';
const REPO_NAME = 'Synthesis';

const config: Config = {
  title: 'Synthesis',
  tagline: 'TypeScript libraries for robust application development',
  favicon: 'img/favicon.ico',

  url: `https://${GITHUB_ORG}.github.io`,
  baseUrl: `/${REPO_NAME}/`,
  organizationName: GITHUB_ORG,
  projectName: REPO_NAME,
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

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
        out: 'result/api',
        sidebar: { categoryLabel: 'API Reference' },
      } satisfies Partial<TypeDocOptions>,
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-types',
        entryPoints: ['../../libraries/aelastics-types/src/index.ts'],
        tsconfig: '../../libraries/aelastics-types/tsconfig.json',
        out: 'types/api',
        sidebar: { categoryLabel: 'API Reference' },
      } satisfies Partial<TypeDocOptions>,
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-store',
        entryPoints: ['../../libraries/aelastics-store/src/index.ts'],
        tsconfig: '../../libraries/aelastics-store/tsconfig.json',
        out: 'store/api',
        sidebar: { categoryLabel: 'API Reference' },
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
          type: 'docSidebar',
          sidebarId: 'result',
          position: 'left',
          label: 'aelastics-result',
        },
        {
          type: 'docSidebar',
          sidebarId: 'types',
          position: 'left',
          label: 'aelastics-types',
        },
        {
          type: 'docSidebar',
          sidebarId: 'store',
          position: 'left',
          label: 'aelastics-store',
        },
        {
          href: `https://github.com/${GITHUB_ORG}/${REPO_NAME}`,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Sinisa Neskovic. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
