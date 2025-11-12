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
    'Changelog',
    'RunningPOCs',
    {
      type: 'category',
      label: 'Pre-requisites',
      collapsed: false,
      items: [
        'Pre-requisites/Baseline',
        'Pre-requisites/ActivateGSA',
        'Pre-requisites/DeployClient',
        'Pre-requisites/ConnectorPA',
      ],
    },
    {
      type: 'category',
      label: 'Entra Private Access',
      collapsed: false,
      items: [
        'Entra Private Access/VPNReplacement',
        'Entra Private Access/SegmentAccess',
        'Entra Private Access/per-appAccess',
        'Entra Private Access/OnPremSSO',
        'Entra Private Access/PrivAccessPIM',
        'Entra Private Access/powershell',
      ],
    },
    {
      type: 'category',
      label: 'Entra Internet Access',
      collapsed: false,
      items: [
        'Entra Internet Access/EIAPOCScenarios',
        'Entra Internet Access/BaselineBlock',
        'Entra Internet Access/BlockWebCat',
        'Entra Internet Access/BlockFQDN',
        'Entra Internet Access/Exceptions',
      ],
    },
    {
      type: 'category',
      label: 'Migrating to GSA',
      collapsed: false,
      items: [
        'Migrating to GSA/Migrate2GSA',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      collapsed: false,
      items: [
        'Troubleshooting/GSAClientLogging',
        'Troubleshooting/PrivateNetworkConnector',
        'Troubleshooting/KnownIssues',
        'Troubleshooting/WindowsClientTroubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'How-To',
      collapsed: false,
      items: [
        'How-To/TestUTRDataPlane',
      ],
    },
    {
      type: 'category',
      label: 'Partners',
      collapsed: false,
      items: [
        'partners/Partner content',
      ],
    },
  ],
};

export default sidebars;
