---
sidebar_position: 30
title: "Block certain web categories"
---

## POC scenario: Block social networking sites for a group of users

Use Microsoft Entra Internet Access to block or allow access to Internet sites based on category. Manually managing blocklists isn't required. 
In this scenario, we block Social Networking sites for a group of users.

Complete the following tasks to configure the scenario:

- Configure a block rule for category sites. [Create a web filtering policy](#create-a-web-filtering-policy).
- Group and prioritize your web filtering policies. [Create a security profile](#create-a-security-policy-profile).
- Configure your test group, with the test user, to use the security profile. [Create and assign a Conditional Access policy](#create-a-conditional-access-policy).
- Confirm rule application by using your test user to [attempt to access a blocked site](#attempt-to-access-blocked-sites).
- [View activity in the traffic log](#view-activity-in-the-traffic-log).

### Create a web filtering policy

1. In the **Microsoft Entra admin center**, go to **Global Secure Access** \> **Secure** \> **Web content filtering policies** \> **Create policy** \> **[Configure Global Secure Access content filtering](https://learn.microsoft.com/entra/global-secure-access/how-to-configure-web-content-filtering)**.

   
1. On **Create a web content filtering policy** \> **Basics**, provide the following details.
   * **Name**: Block Social Networking.
   * **Description:** Add a description.
   * **Action**: Block.
2. Select **Next**.
3. On **Create a web content filtering policy** \> **Policy Rules**, select **Add Rule**.
4. In the **Add Rule** dialog box, provide the following details.
   * **Name**: Social Networking.
   * **Destination type**: webCategory.
   * **Search**: Social Networking
   * Select **Social Networking**.
5. Select **Add**.
6. On **Create a web content filtering policy** \> **Policy Rules**, select **Next**.
7. On **Create a web content filtering policy** \> **Review**, confirm your policy configuration.
8. Select **Create policy**.
9. To confirm policy creation, view it in the **Manage web content filtering policies** list.


### Create a security policy profile

1. In the **Microsoft Entra admin center**, go to **Global Secure Access** \> **Secure** \> **Security profiles**. Select **Create profile**.
2. On **Create a profile** \> **Basics**, provide the following details.
   * **Profile name**: Internet Access Profile.
   * **Description:** Add a description.
   * **State**: enabled.
   * **Priority:** 1000.
3. Select **Next**.
4. On **Create a profile** \> **Link policies**, select **Link a policy**.
5. Select **Existing policy**.
6. In the **Link a policy** dialog box, provide the following details.
   * **Policy name**: Block Social Networking.
   * **Priority:** 1000.
   * **State**: Enabled.
7. Select **Add**.
8. On **Create a profile** \> **Link policies**, confirm **Block Social Networking** in list.
9. Select **Next**.
10. On **Create a profile** \> **Review**, confirm your profile configuration.
11. Select **Create a profile**.

### Create a Conditional Access policy

1. In the **Microsoft Entra admin center**, go to **Protection** \> **Conditional Access**. Select **Create new policy**.
2. In the **New Conditional Access Policy** dialog box, configure the following details.
   * **Name**: **Internet Access Policy**.
   * **Users or workload identities:** **Specific users included**.
   * **What does this policy apply to?** **Users and groups**.
   * **Include** \> **Select users and groups** \> Select **Users and groups**.
3. Select your test group \> click **Select**.
4. **Target resources**.
   * **Select "All internet resources with Global Secure Access"**.
5. Leave the **Grant** control at default to grant access so that your defined security profile defines block functionality.
6. In the **Session** dialog box, select **Use Global Secure Access security profile**.
7. Select **Internet Access Profile**.  
8. In **Conditional Access Overview** \> **Enable policy**, select **On**. Select **Create**.

### Attempt to access blocked sites

1. Sign in to your test device where you installed the GSA agent with a user included in the above test group.
2. Attempt to open a Social Networking site to confirm blocked access. You should see **DeniedTraffic** for http websites and a **Can't reach this page** notification for https websites. It can take up to 20 minutes for the policy to apply to your client device.

### View activity in the traffic log

1. In the **Microsoft Entra admin center** \> **Global Secure Access** \> **Monitor**, select **Traffic logs**.
2. If needed, select **Add filter**. Filter when **User principal name** contains *testuser* and **Action** set to **Block**.
3. Observe the entries for your target FQDN that show traffic as blocked and then allowed. There can be a delay of up to 20 minutes for entries to appear in the log.

