---
sidebar_position: 60
title: "Using PowerShell to manage Private Access"
---

This is a community-supported PowerShell module which simplifies managing Microsoft Entra Private Access apps. The module calls the Graph API endpoints to perform common operations.
https://github.com/andres-canello/GlobalSecureAccess.ps

==============================================================

NOTE: The commands in this module are being created in the Microsoft Entra PowerShell Beta module https://learn.microsoft.com/powershell/entra-powershell/installation
Once I finish, I'll flag this module as deprecated.
These are the commands already implemented in Entra PS Beta:

Get-GSAPrivateAccessAppNetworkSegment -> `Get-EntraBetaPrivateAccessApplicationSegment`

New-GSAPrivateAccessAppNetworkSegment -> `New-EntraBetaPrivateAccessApplicationSegment`

Remove-GSAPrivateAccessAppNetworkSegment -> `Remove-EntraBetaPrivateAccessApplicationSegment`

New commands added on Nov 4 2024:

`Enable-EntraBetaGlobalSecureAccessTenant`

`New-EntraBetaPrivateAccessApplication`

`Get-EntraBetaPrivateAccessApplication`

`Get-EntraBetaGlobalSecureAccessTenantStatus`


==============================================================