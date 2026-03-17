/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // Manual sidebar with external links positioned where needed
  docSidebar: [
    'intro',
    {
      type: 'doc',
      id: 'TutorialsAndLabs',
      label: 'Tutorials and Labs',
    },
    {
      type: 'doc',
      id: 'UsefulVideos',
      label: 'Useful Videos',
    },
    {
      type: 'doc',
      id: 'Migrate2GSA',
      label: 'GSA Migration Tool',
    },
    {
      type: 'doc',
      id: 'GSA-TraceRT',
      label: 'GSA TraceRT',
    },
    {
      type: 'doc',
      id: 'PAConnectorSizing',
      label: 'Private Network Connector Sizing Tool',
    },
    {
      type: 'doc',
      id: 'GSAFeatureUsageAnalysis',
      label: 'GSA Feature Usage Analysis',
    },
    {
      type: 'category',
      label: 'Archives',
      collapsed: true,
      items: [
        {
          type: 'doc',
          id: 'Archives/InstallWindowsClientWithIntune',
          label: 'Install Windows client with Intune',
        },
      ],
    },
    {
      type: 'doc',
      id: 'Changelog',
      label: 'Change Log',
    },
  ],
};

export default sidebars;
