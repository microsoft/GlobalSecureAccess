// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Global Secure Access Community Resources Hub',
  tagline: 'Global Secure Access Community Resources Hub',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://microsoft.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/GlobalSecureAccess/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'microsoft', // Usually your GitHub org/user name.
  projectName: 'GlobalSecureAccess', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: [
    "@docusaurus/theme-mermaid",
    "@easyops-cn/docusaurus-search-local",
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          //editUrl:
          //  'https://github.com/microsoft/GlobalSecureAccess/blob/main/src/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    [
      "@gracefullight/docusaurus-plugin-microsoft-clarity",
      { projectId: "o7yxn2mprq" },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/social-card.jpg',
      navbar: {
        title: 'Global Secure Access - Community Resources Hub',
        logo: {
          alt: 'Global Secure Access - Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            href: 'https://github.com/microsoft/GlobalSecureAccess',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Resources',
            items: [
              {
                label: 'Resources',
                to: '/',
              },
            ],
          },
          {
            title: 'Quick Links',
            items: [
              {
                label: 'Global Secure Access',
                href: 'https://learn.microsoft.com/entra/global-secure-access',
              },
              {
                label: 'Private Access',
                href: 'https://learn.microsoft.com/entra/global-secure-access/concept-private-access',
              },
              {
                label: 'Internet Access',
                href: 'https://learn.microsoft.com/entra/global-secure-access/concept-internet-access',
              },
            ],
          },
          {
            title: 'Have feedback? Open an issue in GitHub or email us',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/microsoft/GlobalSecureAccess',
              },
              {
                label: 'Email us',
                href: 'mailto:GSAPOC@microsoft.com',
              }
            ],
          },
        ],
        copyright: `Built by the Microsoft Identity Customer Acceleration Team.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;

