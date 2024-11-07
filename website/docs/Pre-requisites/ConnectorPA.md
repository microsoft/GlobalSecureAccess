---
sidebar_position: 330
title: "Private Network Connector"
---


Connectors are lightweight agents that sit on a server in a private network and facilitate the outbound connection to the Global Secure Access service. Connectors must be installed on a Windows Server that has access to the backend resources and applications. 
You can organize connectors into connector groups, with each group handling traffic to specific applications. 


Follow the steps in this article to plan and deploy your connectors in preparation for testing Private Access:

[Understand the Microsoft Entra private network connector](https://learn.microsoft.com/entra/global-secure-access/concept-connectors)

[How to configure private network connectors for Microsoft Entra Private Access and Microsoft Entra application proxy](https://learn.microsoft.com/entra/global-secure-access/how-to-configure-connectors)

> The minimum version of connector required for Private Access is **1.5.3417.0**, however it's recommended to install the [latest available version](https://learn.microsoft.com/entra/global-secure-access/reference-version-history)


## Tips for avoiding issues on your POCs
* Avoid placing connectors on DMZ networks, instead consider placing the connector/s servers on a network location close to the resources you are planning to make available through Private Access.

* Avoid using **proxy servers** to provide connector access to Internet. If you must, then consider TLS inspection and proxy authentication are not supported and will break connectivity with the Private Access service.
Additionally, make sure the server can reach Internet for certificate chain validation by setting the system proxy using:
```
netsh winhttp set proxy address:port
```
See: [RustSslCertificateValidator: Failed to validate chain of certificate](../Troubleshooting/PrivateNetworkConnector.md#rustsslcertificatevalidator-failed-to-validate-chain-of-certificate)

* Make sure your firewalls are not doing TLS inspection.