---
sidebar_position: 30
title: "Provide access to specific apps"
---

This section covers how to create Enterprise Application to define access to specific applications or resources using Private Access.
When to use Enterprise Applications to define access:
* After you have configured the VPN Replacement scenario and want to start [segmenting access](SegmentAccess.md)
* If you haven't configured VPN Replacement and wish to use Private Access to provide access to specific, known application or resources.

## Create a private network connector group

To configure a Global Secure Access app, you must have a connector group with at least one active private network connector.

If you don't already have a connector set up, see [Configure connectors](../Pre-requisites/ConnectorPA.md)



## Create a Global Secure Access application

To create a new app, you provide a name, select a connector group, and then add application segments. App segments include the fully qualified domain names (FQDNs) and IP addresses you want to tunnel through the service. You can complete all three steps at the same time, or you can add them after the initial setup is complete.

### Choose name and connector group

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) with the appropriate roles. 
1. Browse to **Global Secure Access** > **Applications** > **Enterprise applications**.
1. Select **New application**.

    ![Screenshot of the Enterprise apps and Add new application button.](../img/new-enterprise-app.png)

1. Enter a name for the app.
1. Select a Connector group from the dropdown menu.
    > [!IMPORTANT]
    > You must have at least one active connector in order to create an application. To learn more about connectors, see [Understand the Microsoft Entra private network connector](https://learn.microsoft.com/entra/global-secure-access/concept-connectors).
1. Select the **Save** button at the bottom of the page to create your app without adding private resources.

### Add application segment

The **Add application segment** process is where you define the FQDNs and IP addresses that you want to include in the traffic for the Global Secure Access app. You can add sites when you create the app and return to add more or edit them later.

You can add fully qualified domain names (FQDN), IP addresses, and IP address ranges. Within each application segment, you can add multiple ports and port ranges.

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com).
1. Browse to **Global Secure Access** > **Applications** > **Enterprise applications**.
1. Select **New application**.
1. Select **Add application segment**.
1. In the **Create application segment** panel that opens, select a **Destination type**.
1. Enter the appropriate details for the selected destination type. Depending on what you select, the subsequent fields change accordingly.
    - **IP address**:
        - Internet Protocol version 4 (IPv4) address, such as 192.168.2.1, that identifies a device on the network.
        - Provide the ports that you want to include.
    - **Fully qualified domain name** (including wildcard FQDNs):
        - Domain name that specifies the exact location of a computer or a host in the Domain Name System (DNS).
        - Provide the ports that you want to include.
        - NetBIOS isn't supported. For example, use `contoso.local/app1` instead of `contoso/app1.`
    - **IP address range (CIDR)**:
        - Classless Inter-Domain Routing (CIDR) represents a range of IP addresses where an IP address is followed by a suffix that indicates the number of network bits in the subnet mask.
        - For example, 192.168.2.0/24 indicates that the first 24 bits of the IP address represent the network address, while the remaining 8 bits represents the host address.
        - Provide the starting address, network mask, and ports.
    - **IP address range (IP to IP)**:
        - Range of IP addresses from start IP (such as 192.168.2.1) to end IP (such as 192.168.2.10).
        - Provide the IP address start, end, and ports.

1. Enter the ports and select the **Apply** button.
    - Separate multiple ports with a comma.
    - Specify port ranges with a hyphen.
    - Spaces between values are removed when you apply the changes.
    - For example, `400-500, 80, 443`.

    ![Screenshot of the create app segment panel with multiple ports added.](../img/app-segment-multiple-ports.png)

    The following table provides the most commonly used ports and their associated networking protocols:

    | Port | Protocol |
    | --- | --- |
    | `22` | `Secure Shell (SSH)` |
    | `80` | `Hypertext Transfer Protocol (HTTP)` |
    | `443` | `Hypertext Transfer Protocol Secure (HTTPS)` |
    | `445` | `Server Message Block (SMB) file sharing` |
    | `3389` | `Remote Desktop Protocol (RDP)` |

1. Select **Save**.

> [!NOTE]
> You can add up to 500 application segments to your app.
>
> Do not overlap FQDNs, IP addresses, and IP ranges between your Quick Access app and any Private Access apps.

## Assign users and groups

You need to grant access to the app you created by assigning users and/or groups to the app. For more information, see [Assign users and groups to an application.](https://learn.microsoft.com/entra/identity/enterprise-apps/assign-user-or-group-access-portal?pivots=portal)

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com).
1. Browse to **Global Secure Access** > **Applications** > **Enterprise applications**.
1. Search for and select your application.
1. Select **Users and groups** from the side menu.
1. Add users and groups as needed.

> [!NOTE]
> Users must be directly assigned to the app or to the group assigned to the app. Nested groups are not supported.

## Update application segments

You can add or update the FQDNs and IP addresses included in your app at any time.

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com).
1. Browse to **Global Secure Access** > **Applications** > **Enterprise applications**.
1. Search for and select your application.
1. Select **Network access properties** from the side menu.
    - To add a new FQDN or IP address, select **Add  application segment**.
    - To edit an existing app, select it from the **Destination type** column.

## Enable or disable access with the Global Secure Access Client

You can enable or disable access to the Global Secure Access app using the Global Secure Access Client. This option is selected by default, but can be disabled, so the FQDNs and IP addresses included in the app segments aren't tunneled through the service.

![Screenshot of the enable access checkbox.](../img/per-app-access-enable-checkbox.png)

## Assign Conditional Access policies

Conditional Access policies for per-app access are configured at the application level for each app. Conditional Access policies can be created and applied to the application from two places:

- Go to **Global Secure Access** > **Applications** > **Enterprise applications**. Select an application and then select **Conditional Access** from the side menu.
- Go to **Protection** > **Conditional Access** > **Policies**. Select **+ Create new policy**.

For more information, see [Apply Conditional Access policies to Private Access apps](https://learn.microsoft.com/entra/global-secure-access/how-to-target-resource-private-access-apps).

