---
title: GSA TraceRT
---

## Overview

GSA Windows clients (v2.24.117+) come with the GSATraceRT tool. This tool can be used to test connectivity and identify network bottlenecks that could be affecting performance. The default path to this tool is: `C:\Program Files\Global Secure Access Client\GSATracert\GSATracert.exe`

<iframe
	width="560"
	height="315"
	src="https://www.youtube.com/embed/0rc1Muk2mzs"
	title="YouTube video player"
	frameborder="0"
	allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
	referrerpolicy="strict-origin-when-cross-origin"
	allowfullscreen
></iframe>

## Parameter Table

| Parameter | Function |
|---|---|
| `GsaTracert.exe --help` | Prints help information |
| `GsaTracert.exe --host <host>:<Port>` | Private Access backend host:port to probe. Host can be either an IP address or FQDN. |
| `GsaTracert.exe --app-id <Appid>` | Private Access backend Application ID to probe. |
| `--speedtest-preview` | Enable experimental throughput (speedtest) measurement |
| `--count <COUNT>` | How many times to run the probe. Must be in the range 1..10. Results from all runs will be displayed in the same table. |

## Example Table

| Command | Description |
|---|---|
| `GsaTracert.exe --host 192.168.112.1:3389` | Will trace to the specified IP and port |
| `GsaTracert.exe --host server.contoso.com:3389` | Will trace to the specified FQDN and port |
| `GsaTracert.exe --app-id 58bbea2b-7010-4098-ab14-15f2effa88ee` | Will trace to the specified app ID |

:::warning
GSA TraceRT does not leverage Private DNS. When using FQDN to probe connectivity, that FQDN must explicitly be defined in the app's network segment.
:::

---