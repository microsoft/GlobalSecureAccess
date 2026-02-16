---
sidebar_position: 60
title: "Using PowerShell to manage Private Access"
---

Several Global Secure Access related commands have been added to the Entra PowerShell Beta module.

Install the module running:

`Install-Module -Name Microsoft.Graph.Entra -Repository PSGallery -Scope CurrentUser -AllowPrerelease -Force`

For more information on installing the module, visit this site: https://learn.microsoft.com/powershell/entra-powershell/installation

## Private Access application segment management
 [Get-EntraBetaPrivateAccessApplicationSegment](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.networkaccess/get-entrabetaprivateaccessapplicationsegment?view=entra-powershell-beta)

 [New-EntraBetaPrivateAccessApplicationSegment](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.networkaccess/new-entrabetaprivateaccessapplicationsegment?view=entra-powershell-beta)
 
 [Remove-EntraBetaPrivateAccessApplicationSegment](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.networkaccess/remove-entrabetaprivateaccessapplicationsegment?view=entra-powershell-beta)

### Examples:

#### Retrieve all application segments associated to an application
```
Connect-Entra -Scopes 'NetworkAccessPolicy.ReadWrite.All', 'Application.ReadWrite.All', 'NetworkAccess.ReadWrite.All'

$application = Get-EntraBetaApplication -Filter "DisplayName eq '<GlobalSecureAccess_Application_DisplayName>'"

Get-EntraBetaPrivateAccessApplicationSegment -ApplicationId $application.Id

destinationHost : 10.1.1.20
destinationType : ip
port            : 0
ports           : {22-22}
protocol        : tcp
id              : cccc2222-dd33-4444-55ee-666666ffffff
```

#### Create an application segment using ranges of IPs and multiple ports
```
Connect-Entra -Scopes 'NetworkAccessPolicy.ReadWrite.All', 'Application.ReadWrite.All', 'NetworkAccess.ReadWrite.All'

$application = Get-EntraBetaApplication -Filter "DisplayName eq '<GlobalSecureAccess_Application_DisplayName>'"
$params = @{
    ApplicationId = $application.Id
    DestinationHost = '192.168.1.100..192.168.1.110'
    Ports = '22,3389'
    Protocol = 'TCP,UDP'
    DestinationType = 'ipRange'
}
New-EntraBetaPrivateAccessApplicationSegment @params

destinationHost : 192.168.1.100..192.168.1.110
destinationType : ipRange
port            : 0
ports           : {22-22, 3389-3389}
protocol        : tcp,udp
id              : cccc2222-dd33-4444-55ee-666666ffffff
```

#### Create application segment using an input file

*AppSegments.csv*

AppObjectId,DestHost,ports,protocol,type
00001111-aaaa-2222-bbbb-3333cccc4444,10.106.97.0/24,"1-21,23-442,444-65535","TCP,udp",ipRangeCidr
00001111-aaaa-2222-bbbb-3333cccc4444,10.106.96.0/24,"1-21,23-442,444-65535","udp",ipRangeCidr
00001111-aaaa-2222-bbbb-3333cccc4444,10.106.95.0/24,"1-21","udp",ipRangeCidr

*CreateAppSegments.ps1*

```
$csvFile = "C:\temp\AppSegments.csv"

# Assuming the CSV file has columns named 'AppObjectId', 'DestHost', 'ports', 'protocol', 'type'
$variables = Import-Csv $csvFile

# Loop through each row of the CSV and execute the command for each set of variables
foreach ($variable in $variables) {
    $appObjectId = $variable.AppObjectId
    $destHost = $variable.DestHost
    $ports = $variable.ports -split ","
    $protocol = $variable.protocol -split ","
    $type = $variable.type

# Execute the command
    $params = @{
        ApplicationId = $appObjectId
        DestinationHost = $destHost
        Ports = $ports
        Protocol = $protocol
        DestinationType = $type
    }
    New-EntraBetaPrivateAccessApplicationSegment @params
}
```

## Private Access app management

[Get-EntraBetaPrivateAccessApplication](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.networkaccess/get-entrabetaprivateaccessapplication?view=entra-powershell-beta)

[New-EntraBetaPrivateAccessApplication](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.networkaccess/new-entrabetaprivateaccessapplication?view=entra-powershell-beta)

### Examples:

#### Create a new Private Access app and assign a specific connector group
```
Connect-Entra -Scopes 'NetworkAccessPolicy.ReadWrite.All', 'Application.ReadWrite.All', 'NetworkAccess.ReadWrite.All'
$connectorGroup = Get-EntraBetaApplicationProxyConnectorGroup -Filter "Name eq 'Contoso GSA Group'"

New-EntraBetaPrivateAccessApplication -ApplicationName 'Contoso GSA Application' -ConnectorGroupId $connectorGroup.Id
```

#### Retrieve all Private Access applications
```
Connect-Entra -Scopes 'NetworkAccessPolicy.ReadWrite.All', 'Application.ReadWrite.All', 'NetworkAccess.ReadWrite.All'
Get-EntraBetaPrivateAccessApplication

displayName     : testApp1
appId           : aaaaaaaa-0000-1111-2222-bbbbbbbbbbbb
id              : bbbbbbbb-1111-2222-3333-cccccccccccc
tags            : {IsAccessibleViaZTNAClient, HideApp, PrivateAccessNonWebApplication}
createdDateTime : 14/06/2024 12:38:50 AM

displayName     : QuickAccess
appId           : dddddddd-3333-4444-5555-eeeeeeeeeeee
id              : eeeeeeee-4444-5555-6666-ffffffffffff
tags            : {HideApp, NetworkAccessQuickAccessApplication}
createdDateTime : 4/07/2023 4:00:07 AM
```

#### Retrieve a specific Private Access application by name
```
Connect-Entra -Scopes 'NetworkAccessPolicy.ReadWrite.All', 'Application.ReadWrite.All', 'NetworkAccess.ReadWrite.All'
Get-EntraBetaPrivateAccessApplication -ApplicationName 'Finance team file share'

displayName     : Finance team file share
appId           : aaaaaaaa-0000-1111-2222-bbbbbbbbbbbb
id              : bbbbbbbb-1111-2222-3333-cccccccccccc
tags            : {IsAccessibleViaZTNAClient, HideApp, PrivateAccessNonWebApplication}
createdDateTime : 14/06/2024 12:38:50 AM
```

## Private Access connector management

|Command| Details|
|---|---|
|[Get-EntraBetaApplicationProxyApplicationConnectorGroup](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/get-entrabetaapplicationproxyapplicationconnectorgroup?view=entra-powershell-beta)| The Get-EntraBetaApplicationProxyApplicationConnectorGroup cmdlet retrieves the connector group assigned for a specific application.|
|[Get-EntraBetaApplicationProxyConnector](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/get-entrabetaapplicationproxyconnector?view=entra-powershell-beta)|The Get-EntraBetaApplicationProxyConnector cmdlet a list of all connectors, or if specified, details of a specific connector.|
|[Get-EntraBetaApplicationProxyConnectorGroup](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/get-entrabetaapplicationproxyconnectorgroup?view=entra-powershell-beta)|The Get-EntraBetaApplicationProxyConnectorGroup cmdlet retrieves a list of all connector groups, or if specified, details of a specific connector group.|
|[Get-EntraBetaApplicationProxyConnectorGroupMembers](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/get-entrabetaapplicationproxyconnectorgroupmembers?view=entra-powershell-beta)	| The Get-EntraBetaApplicationProxyConnectorGroupMembers get all the Application Proxy connectors associated with the given connector group.|
|[Get-EntraBetaApplicationProxyConnectorMemberOf](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/get-entrabetaapplicationproxyconnectormemberof?view=entra-powershell-beta)	| The Get-EntraBetaApplicationProxyConnectorMemberOf command gets the ConnectorGroup that the specified Connector is a member of.|
|[New-EntraBetaApplicationProxyConnectorGroup](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/new-entrabetaapplicationproxyconnectorgroup?view=entra-powershell-beta)	| The New-EntraBetaApplicationProxyConnectorGroup cmdlet creates a new Application Proxy Connector group.|
|[Remove-EntraBetaApplicationProxyApplicationConnectorGroup](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/remove-entrabetaapplicationproxyapplicationconnectorgroup?view=entra-powershell-beta)	| The Remove-EntraBetaApplicationProxyApplicationConnectorGroupcmdlet sets the connector group assigned for the specified application to 'Default' and removes the current assignment.|
|[Remove-EntraBetaApplicationProxyConnectorGroup](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/remove-entrabetaapplicationproxyconnectorgroup?view=entra-powershell-beta)	| The Remove-EntraBetaApplicationProxyConnectorGroup cmdlet deletes an Application Proxy Connector group.|
|[Set-EntraBetaApplicationProxyApplicationConnectorGroup](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/set-entrabetaapplicationproxyapplicationconnectorgroup?view=entra-powershell-beta)	| The Set-EntraBetaApplicationProxyApplicationConnectorGroup cmdlet assigns the given connector group to a specified application.|
|[Set-EntraBetaApplicationProxyConnector](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/set-entrabetaapplicationproxyconnector?view=entra-powershell-beta)	| The Set-EntraBetaApplicationProxyConnector cmdlet allows reassignment of the connector to another connector group.|
|[Set-EntraBetaApplicationProxyConnectorGroup](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.applications/set-entrabetaapplicationproxyconnectorgroup?view=entra-powershell-beta)	| The Set-EntraBetaApplicationProxyConnectorGroup cmdlet allows you to change the name of a given Application Proxy connector group.|

### Examples

#### Retrieve the connector group assigned for the specified application
```
Connect-Entra -Scopes 'Directory.ReadWrite.All'
$application = Get-EntraBetaApplication -Filter "DisplayName eq 'Contoso App Proxy'"

Get-EntraBetaApplicationProxyApplicationConnectorGroup -ObjectId $application.Id

Id                                   Name       ConnectorGroupType IsDefault
--                                   ----       ------------------ ---------
bbbbbbbb-1111-2222-3333-cccccccccccc test-group applicationProxy       False
```

#### Retrieve all connector groups
```
Connect-Entra -Scopes 'Directory.ReadWrite.All'
Get-EntraBetaApplicationProxyConnectorGroup

Id                                   ConnectorGroupType IsDefault Name                       Region
--                                   ------------------ --------- ----                       ------
bbbbbbbb-1111-2222-3333-cccccccccccc applicationProxy   False     Test                       eur
aaaaaaaa-0000-1111-2222-bbbbbbbbbbbb applicationProxy   True      Default                    eur
```

#### Gets all the connectors in the group
```
Connect-Entra -Scopes 'Directory.ReadWrite.All'
Get-EntraBetaApplicationProxyConnectorGroupMembers -OnPremisesPublishingProfileId 'aaaaaaaa-0000-1111-2222-bbbbbbbbbbbb'

Id                                   ExternalIP    MachineName           Status Version
--                                   ----------    -----------           ------ -------
bbbbbbbb-1111-2222-3333-cccccccccccc 106.195.6.123 AppProxy Machine active 1.5.3437.0
```


## GSA tenant enablement

[Enable-EntraBetaGlobalSecureAccessTenant](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.networkaccess/enable-entrabetaglobalsecureaccesstenant?view=entra-powershell-beta)

[Get-EntraBetaGlobalSecureAccessTenantStatus](https://learn.microsoft.com/powershell/module/microsoft.entra.beta.networkaccess/get-entrabetaglobalsecureaccesstenantstatus?view=entra-powershell-beta)


