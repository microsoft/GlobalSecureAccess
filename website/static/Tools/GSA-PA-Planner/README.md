# Entra Private Access Connector Planner

**Plan the right number of connector servers for your Microsoft Entra Private Access deployment.**

---

## 🌐 Use it now — no download needed

> **[https://aka.ms/gsaPAPlanner/](https://aka.ms/gsaPAPlanner/)**

Open in any modern browser — no login, no install, no account required.

> ⚠️ **Desktop only.** This tool requires a full-sized screen to use effectively. It is not designed for smartphones or small tablets. Use a laptop or desktop browser for best results.

**Or run it offline:** download this repository as a ZIP, extract it, and open `index.html` directly. Works with no internet connection.

---

## What does it do?

Answers one practical question:

> *"How many Entra Private Access connector servers do I need — and how big should they be?"*

You describe your users and their applications. The tool calculates what your network traffic actually demands in bandwidth, CPU cores, and RAM — then tells you the minimum server count across three safety scenarios.

---

## How it works — the network-first approach

Most sizing tools start from hardware specs: *"how many users fit on this CPU?"* This tool works the other way around. It starts from **your traffic**.

Think of a connector server as a **water pipe system**:

```
  Your Users & Apps
        │
        ▼
  ┌─────────────────────┐
  │  Network Bandwidth  │  ← The pipe: how much data flows per second?
  │  (Gbps)             │     Driven by user count × protocol × request size
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │  CPU Cores          │  ← The pump: processing power to move that data
  │                     │     TLS, packet inspection, forwarding
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │  Memory (RAM)       │  ← The reservoir: buffer space for active connections
  │                     │     ~0.25 MB per connection × 3 connections per user
  └─────────────────────┘
```

**Key insight:** once you know how much bandwidth your users generate, CPU and memory requirements follow directly. A bigger pipe needs a more powerful pump and a larger reservoir. The tool calculates all three from your inputs, then determines how many servers are needed given your hardware specs.

---

## Why "actual demand" ≠ servers you need

The tool first calculates your **Actual Demand** — the raw bandwidth, cores, and RAM your workload generates at 100% theoretical efficiency. This is displayed at the top of the results.

But you should **never size for 100%**. In production:

- Traffic is **bursty** — a meeting invite, end-of-day sync, or batch job can spike load instantly
- Rolling maintenance requires **spare capacity** — restarting a server while others absorb its load
- A misbehaving application shouldn't take the whole deployment down

This is where the **three provisioning scenarios** come in.

---

## The three provisioning scenarios

The scenarios express how much *infrastructure capacity* you need so that your actual demand only consumes a safe percentage of that capacity:

```
Required Capacity = Actual Demand ÷ Target Utilization
```

| Scenario | You use… | Headroom for spikes | Best for |
|----------|----------|---------------------|---------|
| **Conservative** | 60% of capacity | 40% | Critical services, unpredictable workloads, regulated environments |
| **Balanced** | 70% of capacity | 30% | Standard enterprise deployments ← most common choice |
| **Efficient** | 80% of capacity | 20% | Stable, well-monitored workloads |

**Example:** if your users generate 2 Gbps of actual demand:
- Conservative → you need infrastructure capable of 3.3 Gbps (2 ÷ 0.60)
- Balanced → 2.9 Gbps (2 ÷ 0.70)
- Efficient → 2.5 Gbps (2 ÷ 0.80)

The **Limiting Factor** column tells you which resource (Network / CPU / Memory) is driving the server count — so you know exactly what to tune.

---

## Protocol blending — matching your real app portfolio

The bandwidth calculation is driven by two things:
- **User count** — how many users are concurrently active
- **Protocol profile** — what those users are doing

Different protocols generate very different traffic patterns. A file share (SMB) generates large sequential transfers; RDP generates many small packets at high frequency; generic web apps sit in between.

If your users access a mix of applications, use **Protocol Blending** to build an accurate composite profile. The tool computes weighted averages across your mix — so you're not over- or under-sizing for a single protocol assumption.

---

## Quick start

1. Open the [live app](https://tdetzner.github.io/GSA-PrivateAccess-Connector-Planner/) or `index.html`
2. Choose **Single-Site** (one location) or **Multi-Site** (multi-region enterprise)
3. Enter your concurrent user count and select a protocol profile
4. Review the **Actual Demand** bar and the **Provisioning Scenarios** table
5. Pick your scenario and note the **Limiting Factor**

> Chrome 80+, Firefox 75+, Safari 13+, Edge 80+ on desktop are supported. **Not optimized for mobile or small-screen devices.**

---

## Sizing tips

1. **Concurrent users, not total users.** If 10,000 employees exist but only 3,000 are ever online simultaneously, enter 3,000.
2. **Deployment type matters.** Cloud VMs carry virtualization overhead — they need more total resources than bare metal to deliver the same effective capacity.
3. **Blend protocols for mixed portfolios.** Web apps + file shares + RDP all have different profiles. Use blending for accuracy.
4. **Always add N+1 for fault tolerance.** The tool shows the minimum. In production, run one extra server so losing one node doesn't push you over your utilization target.
5. **Check Azure VM Recommendations** (Single-Site) for cost-optimized VM suggestions based on your Balanced scenario.

---

## Exporting results

| Format | How | Contains |
|--------|-----|---------|
| **PDF** | Click "Export PDF" | Actual demand, all 3 scenarios table, server & workload config |
| **JSON** | Click "Export JSON" (Multi-Site) | Full configuration for archiving or re-importing |

---

*For technical details on the calculation engine, see the [project repository](https://github.com/tdetzner/GSA-PrivateAccess-Connector-Planner).*

