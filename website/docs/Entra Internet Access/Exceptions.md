---
sidebar_position: 50
title: "Handling exceptions"
---

## POC scenario: Allow a user to access a blocked website

In some cases, you might have users that require access to blocked sites for groups in which the user is a member. Complete the following tasks to override a block configured for your test group, so the test user can access the blocked site.

- Configure an allow rule for the same FQDN that you blocked in the previous scenario. [Create a web filtering policy](#create-a-web-filtering-policy).
- Group and prioritize your web filtering policies. [Create a security profile](#create-a-security-policy-profile) with a higher priority than the block policy created previously.
- Configure your test user to use the security profile. [Create and assign a Conditional Access policy](#create-a-conditional-access-policy).
- Confirm rule application by using your test user to [attempt to access a blocked site](#attempt-to-access-blocked-sites) that is now allowed for the user.
- [View activity in the traffic log](#view-activity-in-the-traffic-log).

### Create a web filtering policy

1. In the **Microsoft Entra admin center**, go to **Global Secure Access** \> **Secure** \> **Web content filtering policies** \> **Create policy** \> **[Configure Global Secure Access content filtering](https://learn.microsoft.com/entra/global-secure-access/how-to-configure-web-content-filtering.md)**.
2. On **Create a web content filtering policy** \> **Basics**, provide the following details.
   * **Name**: Allow test FQDN.
   * **Description:** Add a description.
   * **Action**: Allow.
3. Select **Next**.
4. On **Create a web content filtering policy** \> **Policy Rules**, select **Add Rule**.
5. In the **Add Rule** dialog box, provide the following details. Select **Add**.
   * **Name**: Enter a name, such as *Allow FQDN Override*.
   * **Destination type:** *FQDN*.
   * **Destination**: enter the FQDN in the format *\*.domainname.com* or *domain.com*. Select **Add**.
6. On **Create a web content filtering policy** \> **Policy Rules**, confirm your selections.
7. Select **Next**.
8. On **Create a web content filtering policy** \> **Review**, confirm your policy configuration.
9. Select **Create policy**.
10. To confirm policy creation, view it in the **Manage web content filtering policies** list.

### Create a security policy profile

1. In the **Microsoft Entra admin center**, go to **Global Secure Access** \> **Secure** \> **Security profiles**. Select **Create profile**.
2. On **Create a profile** \> **Basics**, provide the following details.
   * **Profile name**: Allow FQDNs Internet Access Profile.
   * **Description:** Add a description.
   * **State**: enabled.
   * **Priority:** 500.
3. Select **Next**.
4. On **Create a profile** \> **Link policies**, select **Link a policy**.
5. Select **Existing policy**.
6. In the **Link a policy** dialog box, provide the following details.
   * **Policy name**: Allow test FQDN.
   * **Priority:** 100.
   * **State**: Enabled.
7. Select **Add**.
8. On **Create a profile** \> **Link policies**, confirm **Allow test FQDN** in list.
9. Select **Next**.
10. On the **Review** tab, confirm your profile configuration.
11. Select **Create a profile**.

### Create a Conditional Access policy

1. In the **Microsoft Entra admin center**, go to **Protection** \> **Conditional Access**. Select **Create new policy**.
2. In the **New Conditional Access Policy** dialog box, configure the following.
   * **Name**: FQDN Exception Override IA Policy.
   * **Users or workload identities:** Specific users included.
   * **What does this policy apply to?** Users and groups.
   * **Include** \> **Select users and groups** \> Select **Users and groups**.
   * Select your test group. Click **Select**.
4. **Target resources**.
   * **Select "All internet resources with Global Secure Access"**.
5. **Session** \> select **Use Global Secure Access security profile**, select **Allow FQDNs Internet Access Profile**. Click **Select**.
6. In **Conditional Access Overview** \> **Enable policy**, select **On**. Select **Create**.


### Attempt to access blocked sites

1. Sign in to your test device where you installed the GSA agent.
2. To confirm access for this specific user, attempt to open the FQDN that you configured as an exception. It can take up to 20 minutes for the policy to apply to your client device.

### View activity in the traffic log

1. In the **Microsoft Entra admin center** \> **Global Secure Access** \> **Monitor**, select **Traffic logs**. If needed, select **Add filter**. Filter when **User principal name** contains *testuser* and **Action** set to **Block**.
1. Observe the entries for your target FQDN that show traffic as blocked and then allowed. There can be a delay of up to 20 minutes for entries to appear in the log.

