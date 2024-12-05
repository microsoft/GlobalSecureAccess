---
sidebar_position: 500
title:  Understand and test Universal Tenant Restrictions
---

Tenant Restrictions is a complex topic. In this article we'll explain why you should care about TR, the benefits of Universal Tenant Restrictions and how to test it.

## Why do I need Tenant Restrictions

Data exfiltration is the answer. Say you have an employee trying to exfiltrate some data and you block file sharing sites. People can create their own Microsoft 365 tenant with trial licenses that allow them to access their own SharePoint Online instance they can use to copy data. People can simply sign in with admin@myexfiltenant.onmicrosoft.com user (perhaps in an InPrivate browser session), access SharePoint Online and copy all the stuff they are trying to exfiltrate. **You can block this implementing Tenant Restrictions authentication plane**.

Now, say you have Tenant Restrictions configured and blocking these attempts to sign in to potentially malicious tenants.
There are 2 ways around this:
* SharePoint anonymous sharing: create a folder in Sharepoint and share it so only the link is required to access it. SharePoint won't need users to authenticate. No authentication flows against Entra ID means Tenant Restriction authentication plane cannot block this. **Universal Tenant Restrictions data plane protection can block this**.
* Token infiltration: this involves signing in on some other device that is not subject to Tenant Restrictions, like a personal device, getting a token like an Access Token for Graph API and copying that token to a corporate device and using the token to get to Exchange Online or SharePoint via Graph API and copying data. Again, no authentication flows to Entra ID means Tenant Restrictions cannot block this. **Universal Tenant Restrictions data plane protection can block this**.

## A bit of history
There are 3 flavours of Tenant Restrictions:
* The original Tenant Restrictions, or v1. To implement you need to break and inspect traffic to login.microsoftonline.com with a proxy server of similar, inject an htttp header allowed-tenant-list with a list of tenants you allow. There are a few problems with v1: lack of user/app granularity, exception handling, managing the http header, length limits, etc.
* Tenant Restrictions v2: TRv2 provides user/app granularity, exception handling and the configuration is on the Entra Portal. The enforcement is still done by injecting an http header sec-Restrict-Tenant-Access-Policy on login.microsoftonline.com however now you only need the TRv2 policy id referenced there. B2B-specific controls also got better by providing Cross Tenant Access policies which provide lots of flexibility. However, data plane controls are only available for Windows devices.
* Universal Tenant Restrictions: this is TRv2 auth and data plane controls, enforced by Global Secure Access. The deployment is simplified as GSA is doing the enforcement. Simply deploy the GSA client to devices, enable the Microsoft Traffic Forwarding Profile and configure TRv2.

## Testing Data Plane Controls in Universal Tenant Restrictions

Here is a quick video on how to test Universal Tenant Restrictions data plane protection in Graph API.
The video shows a user getting an Access Token for Graph API on a device without the Global Secure Access agent running, like a personal device, and saving it to a file to use it to exfiltrate data on a corporate device.
The demo is done on the same device though, by having GSA stopped to be able to sign in and get the token (otherwise Universal Tenant Restrictions authentication plane would stop it), and then starting GSA and simulating the use of the token on a corporate device.

If you want to test it yourself, here is the PowerShell code with instructions:
```
$tenant = "yourtenant.onmicrosoft.com"
$user = "youruser@yourtenant.onmicrosoft.com"

# Install Graph module if you haven't: "Install-Module Microsoft.Graph.Authentication -Scope CurrentUser"
# Disable GSA client
# Connect to Graph
Connect-MgGraph -Scopes "User.Read","Mail.Read" -TenantId $tenant

# Get and save the Access Token
$response = Invoke-MgGraphRequest -Uri "https://graph.microsoft.com/v1.0/me" -Method GET -OutputType HttpResponseMessage
$at = $response.RequestMessage.Headers.Authorization.Parameter
$at | Out-File c:\temp\AT.txt

# Get mails
$headers = @{Authorization="Bearer $at"}
Invoke-RestMethod -Method GET -Uri "https://graph.microsoft.com/v1.0/users/$user/messages?`$top=3" -Headers $headers | select -ExpandProperty value | ft Subject

# Start GSA client (or move your Access Token to a GSA machine)
# Open a new PS console (to avoid connection reuse)
$at = Get-Content C:\temp\AT.txt
$headers = @{Authorization="Bearer $at"}

Invoke-RestMethod -Method GET -Uri "https://graph.microsoft.com/v1.0/users/$user/messages?`$top=3" -Headers $headers | select -ExpandProperty value | ft Subject
```





<iframe width="560" height="315" src="https://www.youtube.com/embed/5g5SIgkVtso?si=D8_AYaS3sJBJRm7w" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


Download the original video from here: [Universal Tenant Restrictions Data Plane Protection in Graph API](https://github.com/microsoft/GlobalSecureAccess/blob/main/website/content/UniversalTenantRestrictionsDataPlaneProtectioninGraphAPI.mp4)