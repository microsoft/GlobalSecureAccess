---
sidebar_position: 700
title:  Known Issues
---

This is a list of known issues you might hit while working with Global Secure Access. We'll keep this list updated and note when issues have been fixed.

## Global Secure Access Windows client

### NRPT policies missing on devices managed by Group Policies
The GSA client creates NRPT policies to route DNS queries for Private DNS suffixes through the tunnel. In some cases, the NRPT policies fail to be created.
Check using `Get-DNSClientNRPTPolicy`.

This happens because of a malformed GPO that applies NRPT settings.

Use this script to identify the offending policy and delete it after moving the relevant settings to other policies.
Please edit the script and modify the variables as per your environment.

[FindDNSNRPTGPO PowerShell Script](https://github.com/microsoft/GlobalSecureAccess/blob/main/website/content/FindDNSNRPTGPO.ps1)

### NTLM auth requires fully functional Kerberos when signing in with Windows Hello for Business
When signing in with WHfB, there is no user password to hash :smiley:. NTLM behavior has been modified to work in this scenario. When Windows client exchange the cloud TGT for a full TGT using from domain controllers, they add a special flag on the request to ask for additional SSO credentials.
More info: [Hybrid Authentication with FIDO](https://syfuhs.net/hybrid-authentication-with-fido) and [What if I'm unable to get single sign-on to my NTLM network resource after I sign in with FIDO and get a credential prompt?](https://learn.microsoft.com/entra/identity/authentication/howto-authentication-passwordless-security-key-on-premises#what-if-im-unable-to-get-single-sign-on-to-my-ntlm-network-resource-after-i-sign-in-with-fido-and-get-a-credential-prompt)