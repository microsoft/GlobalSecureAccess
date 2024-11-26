---
sidebar_position: 40
title: "Block certain FQDNs"
---


## POC scenario: Block a group from accessing websites based on FQDN

In some cases, it's necessary to block specific websites rather than using broad web categories. Complete the following tasks to block access to the site based on FQDN. Ensure you include relevant fully qualified domain names (FQDNs) in use by the site that you want to block.

- Configure a block rule for a specific FQDN. [Create a web filtering policy](#create-a-web-filtering-policy).
- Group and prioritize your web filtering policies. [Create a security profile](#create-a-security-policy-profile).
- Configure your test group (the user is a member) to use the security profile. [Create and assign a Conditional Access policy](#create-a-conditional-access-policy).
- Confirm rule application by using your test user to [attempt to access a blocked site](#attempt-to-access-blocked-sites).
- [View activity in the traffic log](#view-activity-in-the-traffic-log).

### Create a web filtering policy

1. In the **Microsoft Entra admin center**, go to **Global Secure Access** \> **Secure** \> **Web content filtering policies** \> **Create policy** \> **[Configure Global Secure Access content filtering](https://learn.microsoft.com/entra/global-secure-access/how-to-configure-web-content-filtering)**.
2. On **Create a web content filtering policy** \> **Basics**, provide the following details.
   * **Name**: Blocking test FQDN.
   * **Description:** Add a description.
   * **Action**: Block.
3. Select **Next**.
4. On **Create a web content filtering policy** \> **Policy Rules**, select **Add Rule**.
5. In the **Add Rule** dialog box, provide the following details.
   * **Name**: Enter the name, such as *Block test FQDN*.
   * **Destination type:** FQDN.
   * **Destination**: enter the test FQDN in the format *\*.domainname.com* or *domainname.com*.
6. Select **Add**.
7. On **Create a web content filtering policy** \> **Policy Rules**, confirm your selections.
8. Select **Next**.
9. On **Create a web content filtering policy** \> **Review**, confirm your policy configuration.
10. Select **Create policy**.
11. To confirm policy creation, view it in the **Manage web content filtering policies** list.

### Create a security policy profile

1. In the **Microsoft Entra admin center**, go to **Global Secure Access** \> **Secure** \> **Security profiles**. Select **Create profile**.
2. On **Create a profile** \> **Basics**, provide the following details.
   * **Profile name**: Block FQDNs Internet Access Profile.
   * **Description:** Add a description.
   * **State**: enabled.
   ***Priority:** 2000.
3. Select **Next**.
4. On **Create a profile** \> **Link policies**, select **Link a policy**.
5. Select **Existing policy**.
6. In the **Link a policy** dialog box, provide the following details.
   * **Policy name**: Blocking test FQDN.
   * **Priority:** 100.
   * **State**: Enabled.
7. Select **Add**.
8. On the **Link policies** tab, confirm **Blocking test FQDN** in list.
9. Select **Next**.
10. On the **Review** tab, confirm your profile configuration.
11. Select **Create a profile**.

### Create a Conditional Access policy

1. In the **Microsoft Entra admin center**, go to **Protection** \> **Conditional Access**. Select **Create new policy**.
2. In the **New Conditional Access Policy** dialog box, configure the following.
   * **Name**: FQDN Internet Access Policy.
   * **Users or workload identities:** Specific users included.
   * **What does this policy apply to?** Users and groups.
   * **Include** \> **Select users and groups** \> Select **Users and groups**.
   * Select your test group. Click **Select**.
4. **Target resources**.
   * **Select "All internet resources with Global Secure Access"**.
5. In the **Session** dialog box, select **Block FQDNs Internet Access Profile**. Select **Internet Access Profile**.
6. In **Conditional Access Overview** \> **Enable policy**, select **On**. Select **Create**.

### Attempt to access blocked sites

1. Sign in to your test device where you installed the GSA agent.
2. Attempt to open the FQDN you configured to confirm blocked access. You should see **Access Denied** for http websites and **Can't reach this page** notification for https websites. It can take up to 20 minutes for the policy to apply to your client device.

### View activity in the traffic log

1. In the **Microsoft Entra admin center** \> **Global Secure Access** \> **Monitor**, select **Traffic logs**.
2. If needed, select **Add filter**. Filter when **User principal name** contains *testuser* and **Action** set to **Block**.
3. Observe the entries for your target FQDN that show traffic as blocked and then allowed. There can be a delay of up to 20 minutes for entries to appear in the log.
