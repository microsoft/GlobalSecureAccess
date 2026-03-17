---
sidebar_position: 100
slug: /
title: Overview
---
# Global Secure Access Community Resources Hub

Maintained by the Global Secure Access Customer Engineering Team.

Use this site as a quick-start companion for practical tools, demos, and guidance around Microsoft Entra Internet Access and Microsoft Entra Private Access.

## Start Here

- [Tutorials and Lab](./TutorialsAndLabs.md)
- [Useful Videos](./UsefulVideos.md)
- [GSA Migration Tool](./Migrate2GSA.md)
- [GSA TraceRT](./GSA-TraceRT.md)
- [Connector Sizing Tool](./PAConnectorSizing.md)
- [Archives](./Archives/InstallWindowsClientWithIntune.md)
- [Change Log](./Changelog.md)

## Official Microsoft Documentation

### Getting Started
- [Global Secure Access overview and licensing](https://learn.microsoft.com/entra/global-secure-access/overview-what-is-global-secure-access)
- [Microsoft SSE deployment guides](https://learn.microsoft.com/entra/architecture/gsa-deployment-guide-intro)
- [Microsoft SSE proof-of-concept guidance](https://learn.microsoft.com/entra/architecture/gsa-poc-guidance-intro)
- [Microsoft Entra Internet Access documentation](https://learn.microsoft.com/entra/global-secure-access/concept-internet-access)
- [Microsoft Entra Private Access documentation](https://learn.microsoft.com/entra/global-secure-access/concept-private-access)

### Entra Private Access key capabilities

| Capability | Why it's important | Documentation |
|---|---|---|
| **Private Network Connector** | It provides the secure outbound bridge between private resources and Global Secure Access so you can publish internal apps without inbound firewall exposure. | https://learn.microsoft.com/entra/global-secure-access/how-to-configure-connectors |
| **Quick Access** | It accelerates VPN replacement by onboarding broad private destinations quickly, then enforcing user assignment and Conditional Access. Quick Access traffic populates the Application Discovery report enabling a seamless transition to stricter per-app segmentation. | https://learn.microsoft.com/entra/global-secure-access/how-to-configure-quick-access |
| **Application Discovery** | Populated by Quick Access traffic, it gives visibility into which private destinations users actually access, including usage, users, devices, and traffic patterns. That data helps you prioritize onboarding and move from broad access to least-privilege app definitions. | https://learn.microsoft.com/entra/global-secure-access/how-to-application-discovery |
| **Per-app Access** | It enables granular segmentation by defining exact FQDN/IP and port combinations per enterprise app, instead of exposing large network ranges. This reduces lateral movement risk and lets you apply app-specific user assignments and Conditional Access policies. | https://learn.microsoft.com/entra/global-secure-access/how-to-configure-per-app-access |
| **Kerberos SSO** | It enables modern identity controls for on-prem resources that still rely on Kerberos, including support for cloud and hybrid sign-in flows. This improves user experience with seamless access while preserving strong policy enforcement. | https://learn.microsoft.com/entra/global-secure-access/how-to-configure-kerberos-sso |
| **Source IP Anchoring** | It routes selected app traffic through controlled private egress so SaaS apps that enforce network allowlists see approved source IPs. This lets you satisfy app-side network controls while still applying identity-based protections in Global Secure Access. | https://learn.microsoft.com/entra/global-secure-access/source-ip-anchoring |
| **Intelligent Local Access** | It reduces backhaul and latency by intelligently bypassing cloud tunneling when users are on trusted corporate networks. This preserves a consistent security posture while improving performance and user experience on-premises. | https://learn.microsoft.com/entra/global-secure-access/enable-intelligent-local-access |
| **DC Sensors** | It helps prevent lateral movement and Conditional Access bypass by controlling direct Kerberos ticket requests to domain controllers outside Global Secure Access tunnels. This ensures Kerberos access stays under expected policy enforcement. | https://learn.microsoft.com/entra/global-secure-access/how-to-configure-domain-controllers |
| **Multi-geo** | It optimizes traffic paths by allowing connector groups to use region-aligned backends instead of only the tenant default geography. This can lower latency and improve global user experience for distributed environments. | https://learn.microsoft.com/entra/global-secure-access/how-to-enable-multi-geo |

### Entra Internet Access key capabilities

| Capability | Why it's important | Documentation |
|---|---|---|
| **Web Content Filtering** | It provides user- and context-aware control over internet destinations using categories, URLs, and FQDN rules. This helps reduce exposure to risky or noncompliant sites while enforcing policy consistently through security profiles and Conditional Access. | https://learn.microsoft.com/entra/global-secure-access/how-to-configure-web-content-filtering?tabs=microsoft-entra-admin-center |
| **TLS Inspection** | It decrypts and inspects encrypted web traffic so hidden threats and policy violations can be detected and enforced. This is a prerequisite for advanced controls like URL-based inspection, content inspection, and AI Gateway capabilities. | https://learn.microsoft.com/entra/global-secure-access/how-to-transport-layer-security-settings <br /> <br /> https://learn.microsoft.com/entra/global-secure-access/how-to-transport-layer-security |
| **Threat Intelligence** | It blocks access to high-confidence malicious destinations, including phishing, malware, and command-and-control infrastructure, using Microsoft and partner threat feeds.  | https://learn.microsoft.com/entra/global-secure-access/how-to-configure-threat-intelligence |
| **Network Content filtering** | It enables inline file-level controls to audit or block uploads and downloads based on file type, sensitivity labels, sensitive data, and user risk. Integration with Purview scanning helps prevent data leakage to unmanaged web and AI destinations. | https://learn.microsoft.com/entra/global-secure-access/how-to-network-content-filtering |
| **AI Gateway Prompt Shield** | It helps defend enterprise GenAI traffic against prompt injection and jailbreak attempts before requests reach models. This enforces centralized guardrails across supported and custom JSON-based AI endpoints without app code changes. | https://learn.microsoft.com/entra/global-secure-access/how-to-ai-prompt-shield |
| **Remote Network** | It secures branch and site traffic through IPSec tunnels without requiring client installation on every device. This extends policy enforcement to unmanaged, guest, and endpoints without GSA clients while simplifying branch security operations. | https://learn.microsoft.com/entra/global-secure-access/concept-remote-network-connectivity |
| **Cloud Firewall** | It gives centralized 5-tuple network rule enforcement (source/destination IP, ports, protocol) for remote network internet egress. | https://learn.microsoft.com/entra/global-secure-access/how-to-configure-cloud-firewall |
| **AI Gateway for Copilot Studio** | It brings web and AI gateway security controls to Copilot Studio agent traffic, including filtering and threat policies. This helps govern agent outbound access and monitor activity through the same Global Secure Access policy framework. | https://learn.microsoft.com/entra/global-secure-access/how-to-secure-web-ai-gateway-agents |

### Entra Internet Access for Microsoft Services

| Capability | Why it's important | Documentation |
|---|---|---|
| **Universal Tenant Restrictions** | It enforces tenant restrictions v2 consistently across browsers, devices, and networks by tagging traffic through Global Secure Access. This helps prevent data exfiltration to unsanctioned external tenants at both sign-in and Microsoft Graph data access paths. | https://learn.microsoft.com/entra/global-secure-access/how-to-universal-tenant-restrictions |
| **Compliant Network Check** | It adds a tenant-specific Conditional Access signal that verifies users are connected through your approved Global Secure Access path, reducing token replay risk from unmanaged networks. It also removes the need to maintain large IP allowlists for network-based controls. | https://learn.microsoft.com/entra/global-secure-access/how-to-compliant-network |


### Global Secure Access Platform Capabilities

| Capability | Why it's important | Documentation |
|---|---|---|
| **Universal Continuous Access Evaluation** | It shrinks the exposure window after identity risk changes by forcing near real-time reauthentication for Global Secure Access sessions. This improves protection against stale sessions and token misuse, with optional strict enforcement for location-sensitive controls. | https://learn.microsoft.com/entra/global-secure-access/concept-universal-continuous-access-evaluation |
| **Source IP Restoration** | It preserves the user’s original egress IP for Microsoft services and logs, so IP-based Conditional Access and location-aware detections remain effective behind SSE routing. This improves both policy accuracy and investigation fidelity. | https://learn.microsoft.com/entra/global-secure-access/how-to-source-ip-restoration |
| **Windows** | GSA client is supported on Windows devices (including ARM). | https://learn.microsoft.com/entra/global-secure-access/how-to-install-windows-client |
| **MacOS** | GSA client is supported on MacOS. | https://learn.microsoft.com/entra/global-secure-access/how-to-install-macos-client |
| **iOS/iPadOS** | GSA client is part of the Defender for Endpoint application on iOS and iPadOS. | https://learn.microsoft.com/entra/global-secure-access/how-to-install-ios-client |
| **Android** | GSA client is part of the Defender for Endpoint application on Android.  | https://learn.microsoft.com/entra/global-secure-access/how-to-install-android-client |

### Global Secure Access Coexistence 

| Partner Solution | Documentation |
|---|---|
| **Cisco** | https://learn.microsoft.com/entra/global-secure-access/how-to-cisco-coexistence?tabs=cisco-umbrella-portal <br />  https://learn.microsoft.com/entra/global-secure-access/how-to-cisco-secure-access-coexistence?tabs=cisco-secure-access-portal <br /> https://learn.microsoft.com/entra/global-secure-access/how-to-cisco-vpn-coexistence|
| **Palo Alto** | https://learn.microsoft.com/entra/global-secure-access/how-to-palo-alto-coexistence |
| **Zscaler** | https://learn.microsoft.com/entra/global-secure-access/how-to-zscaler-coexistence |
| **Netskope** | https://learn.microsoft.com/entra/global-secure-access/how-to-netskope-coexistence |



---