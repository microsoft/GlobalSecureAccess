---
sidebar_position: 40
title: "Kerberos SSO to AD resources"
---

This article details the minimum configuration required to enable Kerberos single sign on to on-premises resources protected by Active Directory.
It includes making Domain Controllers available through Private Access and configuring Private DNS to enable DNS resolution to on-premises names.

[Use Kerberos for single sign-on (SSO) to your resources with Microsoft Entra Private Access](https://learn.microsoft.com/entra/global-secure-access/how-to-configure-kerberos-sso)


## Tips for avoiding SSO issues

### Is NTLM not working when signing in with Windows Hello for Bussiness?
Check this known issue: [NTLM auth requires fully functional Kerberos when signing in with Windows Hello for Business](../Troubleshooting/KnownIssues.md#ntlm-auth-requires-fully-functional-kerberos-when-signing-in-with-windows-hello-for-business)

### Kerberos Negative cache
 When you ask the system to get you a ticket to host/foo.bar.com and it fails to get a ticket for various reasons, it puts the SPN in what's called a negative cache. Every time you ask for a ticket to an SPN the first thing the system does is check this negative cache and asks, "have I tried this recently and if so, did it fail?" If it failed, then it knows don't bother trying and short circuit the same error. This cache is valid for a certain period of time and is controlled by the "SpnCacheTimeout" value. There is a separate cache controlled by FarKdcTimeout that does exactly the same thing, except for when it can't contact a given KDC.

Whenever a network changes to an "UP" state it triggers the Kerberos stack to refresh itself, including tickets, etc. We try and get a new TGT. 
Global Secure Access doesn't trigger a network change when it connects because it's not implemented as a network interface. Windows might try to find a KDC before the Private Access tunnel/channel is up, when it fails the KDC is put into the negative cache.

To avoid these kind of issues, that happen to be hard to troubleshoot and discover, it's recommended to push this regkey to Windows devices running GSA and using Private Access to reach Domain Controllers to set the time-out value that's used to invalidate a domain controller from a different site in the domain controller cache to 0.

`HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa\Kerberos\Parameters`

> If the Parameters key isn't listed under Kerberos, you must create it.

**Modify the following `FarKdcTimeout` registry entry**
- Entry: `FarKdcTimeout`
- Type: `REG_DWORD` 
- Default value: `0 (minutes)` 

More info: https://learn.microsoft.com/entra/global-secure-access/how-to-configure-kerberos-sso#option-1-change-the-default-farkdctimeout-time-on-the-registry
