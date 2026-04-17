/**
 * GSA Private Access Sizing Planner - Cloud VM Matcher
 * 
 * Handles Azure VM recommendation logic:
 * - Loading VM data from JSON
 * - Filtering VMs by requirements
 * - Ranking by cost efficiency
 * - Calculating over-provisioning
 */

// ============================================
// Data Loading - Embedded for Offline Support
// ============================================

// Embedded Azure VM data (updated from ConfigPresets/azure-vms.json)
// This eliminates the need for HTTP server and enables true offline usage
const azureVMDataEmbedded = {
  "lastUpdated": "2026-03-22",
  "source": "Microsoft Azure VM Documentation (learn.microsoft.com)",
  "currency": "USD",
  "pricingNote": "Prices as of March 2026 for Linux on-demand. Subject to change. Verify with Azure Pricing Calculator.",
  "disclaimer": "Prices shown are estimates. Actual costs may vary based on region, usage patterns, and Azure commitment discounts.",
  "regions": {
    "eastus": { "name": "East US", "location": "Virginia, USA" },
    "westus2": { "name": "West US 2", "location": "Washington, USA" },
    "westeurope": { "name": "West Europe", "location": "Netherlands" },
    "southeastasia": { "name": "Southeast Asia", "location": "Singapore" },
    "australiaeast": { "name": "Australia East", "location": "New South Wales" }
  },
  "vms": [
    {
      "sku": "Standard_D4s_v5",
      "series": "Dsv5-series",
      "family": "General Purpose",
      "vCPUs": 4,
      "memory_gb": 16,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 0.192,
        "westus2": 0.192,
        "westeurope": 0.211,
        "southeastasia": 0.230,
        "australiaeast": 0.240
      },
      "recommendation_score": 75,
      "use_cases": ["Small Deployments", "Dev/Test"],
      "notes": "Entry-level VM. Suitable for small connector deployments with light traffic."
    },
    {
      "sku": "Standard_D8s_v5",
      "series": "Dsv5-series",
      "family": "General Purpose",
      "vCPUs": 8,
      "memory_gb": 32,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 0.384,
        "westus2": 0.384,
        "westeurope": 0.422,
        "southeastasia": 0.461,
        "australiaeast": 0.480
      },
      "recommendation_score": 78,
      "use_cases": ["Small to Medium Deployments"],
      "notes": "Good balance for smaller connector groups with moderate traffic."
    },
    {
      "sku": "Standard_D16s_v5",
      "series": "Dsv5-series",
      "family": "General Purpose",
      "vCPUs": 16,
      "memory_gb": 64,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 0.768,
        "westus2": 0.768,
        "westeurope": 0.845,
        "southeastasia": 0.922,
        "australiaeast": 0.960
      },
      "recommendation_score": 82,
      "use_cases": ["Medium Deployments", "Private Access Connectors"],
      "notes": "Popular choice for mid-sized connector deployments."
    },
    {
      "sku": "Standard_D32s_v5",
      "series": "Dsv5-series",
      "family": "General Purpose",
      "vCPUs": 32,
      "memory_gb": 128,
      "network_mbps": 16000,
      "network_label": "16 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 1.536,
        "westus2": 1.536,
        "westeurope": 1.690,
        "southeastasia": 1.843,
        "australiaeast": 1.920
      },
      "recommendation_score": 90,
      "use_cases": ["Medium to Large Deployments", "Private Access Connectors"],
      "notes": "Excellent choice for connector servers. Balanced compute, memory, and high-speed network."
    },
    {
      "sku": "Standard_D48s_v5",
      "series": "Dsv5-series",
      "family": "General Purpose",
      "vCPUs": 48,
      "memory_gb": 192,
      "network_mbps": 24000,
      "network_label": "24 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 2.304,
        "westus2": 2.304,
        "westeurope": 2.535,
        "southeastasia": 2.765,
        "australiaeast": 2.880
      },
      "recommendation_score": 88,
      "use_cases": ["Large Deployments", "High-Throughput Connectors"],
      "notes": "Good mid-point between D32 and D64. Strong network performance at 24 Gbps."
    },
    {
      "sku": "Standard_D64s_v5",
      "series": "Dsv5-series",
      "family": "General Purpose",
      "vCPUs": 64,
      "memory_gb": 256,
      "network_mbps": 30000,
      "network_label": "30 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 3.072,
        "westus2": 3.072,
        "westeurope": 3.379,
        "southeastasia": 3.686,
        "australiaeast": 3.840
      },
      "recommendation_score": 92,
      "use_cases": ["Large Deployments", "High-Performance Connectors"],
      "notes": "High-performance VM for demanding connector workloads. Excellent 30 Gbps network."
    },
    {
      "sku": "Standard_D96s_v5",
      "series": "Dsv5-series",
      "family": "General Purpose",
      "vCPUs": 96,
      "memory_gb": 384,
      "network_mbps": 35000,
      "network_label": "35 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 4.608,
        "westus2": 4.608,
        "westeurope": 5.069,
        "southeastasia": 5.530,
        "australiaeast": 5.760
      },
      "recommendation_score": 85,
      "use_cases": ["Very Large Deployments", "Enterprise Scale"],
      "notes": "Maximum Dsv5 size with 35 Gbps network. Suitable for very high user counts."
    },
    {
      "sku": "Standard_E8s_v5",
      "series": "Esv5-series",
      "family": "Memory Optimized",
      "vCPUs": 8,
      "memory_gb": 64,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 0.504,
        "westus2": 0.504,
        "westeurope": 0.554,
        "southeastasia": 0.605,
        "australiaeast": 0.630
      },
      "recommendation_score": 72,
      "use_cases": ["Memory-Intensive Workloads", "Small High-Memory Deployments"],
      "notes": "Memory-optimized with 8 GB/core ratio. Good when memory is the limiting factor."
    },
    {
      "sku": "Standard_E16s_v5",
      "series": "Esv5-series",
      "family": "Memory Optimized",
      "vCPUs": 16,
      "memory_gb": 128,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 1.008,
        "westus2": 1.008,
        "westeurope": 1.109,
        "southeastasia": 1.210,
        "australiaeast": 1.261
      },
      "recommendation_score": 70,
      "use_cases": ["Memory-Intensive Workloads"],
      "notes": "Memory-optimized. Use if memory is the limiting factor. Higher cost per core."
    },
    {
      "sku": "Standard_E32s_v5",
      "series": "Esv5-series",
      "family": "Memory Optimized",
      "vCPUs": 32,
      "memory_gb": 256,
      "network_mbps": 16000,
      "network_label": "16 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 2.016,
        "westus2": 2.016,
        "westeurope": 2.218,
        "southeastasia": 2.419,
        "australiaeast": 2.522
      },
      "recommendation_score": 72,
      "use_cases": ["Memory-Intensive Workloads"],
      "notes": "Memory-optimized with strong network. Higher cost but excellent for memory-limited scenarios."
    },
    {
      "sku": "Standard_E48s_v5",
      "series": "Esv5-series",
      "family": "Memory Optimized",
      "vCPUs": 48,
      "memory_gb": 384,
      "network_mbps": 24000,
      "network_label": "24 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 3.024,
        "westus2": 3.024,
        "westeurope": 3.326,
        "southeastasia": 3.629,
        "australiaeast": 3.780
      },
      "recommendation_score": 74,
      "use_cases": ["Large Memory-Intensive Workloads"],
      "notes": "High memory capacity (384 GB) with 24 Gbps network. Ideal for memory-limited large deployments."
    },
    {
      "sku": "Standard_E64s_v5",
      "series": "Esv5-series",
      "family": "Memory Optimized",
      "vCPUs": 64,
      "memory_gb": 512,
      "network_mbps": 30000,
      "network_label": "30 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 4.032,
        "westus2": 4.032,
        "westeurope": 4.435,
        "southeastasia": 4.838,
        "australiaeast": 5.040
      },
      "recommendation_score": 75,
      "use_cases": ["Very Large Memory-Intensive Workloads"],
      "notes": "512 GB RAM with 30 Gbps network. Use for extreme memory requirements."
    },
    {
      "sku": "Standard_E96s_v5",
      "series": "Esv5-series",
      "family": "Memory Optimized",
      "vCPUs": 96,
      "memory_gb": 672,
      "network_mbps": 35000,
      "network_label": "35 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8473C (Sapphire Rapids) / 8370C (Ice Lake)",
      "generation": "4th/3rd Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 6.048,
        "westus2": 6.048,
        "westeurope": 6.653,
        "southeastasia": 7.258,
        "australiaeast": 7.560
      },
      "recommendation_score": 70,
      "use_cases": ["Enterprise Memory-Intensive Workloads"],
      "notes": "Maximum Esv5 with 672 GB RAM and 35 Gbps network. For extreme memory requirements."
    },
    {
      "sku": "Standard_F8s_v2",
      "series": "Fsv2-series",
      "family": "Compute Optimized",
      "vCPUs": 8,
      "memory_gb": 16,
      "network_mbps": 6250,
      "network_label": "6.25 Gbps",
      "temp_storage_gb": 64,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8370C (Ice Lake) / 8272CL (Cascade Lake) / 8168 (Skylake)",
      "generation": "3rd/2nd Gen Intel",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 0.338,
        "westus2": 0.338,
        "westeurope": 0.372,
        "southeastasia": 0.406,
        "australiaeast": 0.423
      },
      "recommendation_score": 62,
      "use_cases": ["Compute-Intensive Workloads", "CPU-Bound Applications"],
      "notes": "Compute-optimized entry point. Lower memory (2 GB/core). Use if CPU is primary bottleneck."
    },
    {
      "sku": "Standard_F16s_v2",
      "series": "Fsv2-series",
      "family": "Compute Optimized",
      "vCPUs": 16,
      "memory_gb": 32,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 128,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8370C (Ice Lake) / 8272CL (Cascade Lake) / 8168 (Skylake)",
      "generation": "3rd/2nd Gen Intel",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 0.677,
        "westus2": 0.677,
        "westeurope": 0.745,
        "southeastasia": 0.813,
        "australiaeast": 0.847
      },
      "recommendation_score": 65,
      "use_cases": ["Compute-Intensive Workloads", "CPU-Bound Applications"],
      "notes": "Compute-optimized. Lower memory (2 GB/core). Use if CPU is primary bottleneck."
    },
    {
      "sku": "Standard_F32s_v2",
      "series": "Fsv2-series",
      "family": "Compute Optimized",
      "vCPUs": 32,
      "memory_gb": 64,
      "network_mbps": 14000,
      "network_label": "14 Gbps",
      "temp_storage_gb": 256,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8370C (Ice Lake) / 8272CL (Cascade Lake) / 8168 (Skylake)",
      "generation": "3rd/2nd Gen Intel",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 1.354,
        "westus2": 1.354,
        "westeurope": 1.490,
        "southeastasia": 1.626,
        "australiaeast": 1.694
      },
      "recommendation_score": 68,
      "use_cases": ["Compute-Intensive Workloads", "CPU-Bound Applications"],
      "notes": "Compute-optimized with good network bandwidth. Cost-effective for CPU-limited workloads."
    },
    {
      "sku": "Standard_F48s_v2",
      "series": "Fsv2-series",
      "family": "Compute Optimized",
      "vCPUs": 48,
      "memory_gb": 96,
      "network_mbps": 21000,
      "network_label": "21 Gbps",
      "temp_storage_gb": 384,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8370C (Ice Lake) / 8272CL (Cascade Lake) / 8168 (Skylake)",
      "generation": "3rd/2nd Gen Intel",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 2.032,
        "westus2": 2.032,
        "westeurope": 2.235,
        "southeastasia": 2.438,
        "australiaeast": 2.540
      },
      "recommendation_score": 69,
      "use_cases": ["Compute-Intensive Workloads", "CPU-Bound Applications"],
      "notes": "Mid-range compute-optimized with 21 Gbps network. Good for CPU-intensive workloads."
    },
    {
      "sku": "Standard_F64s_v2",
      "series": "Fsv2-series",
      "family": "Compute Optimized",
      "vCPUs": 64,
      "memory_gb": 128,
      "network_mbps": 28000,
      "network_label": "28 Gbps",
      "temp_storage_gb": 512,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8370C (Ice Lake) / 8272CL (Cascade Lake) / 8168 (Skylake)",
      "generation": "3rd/2nd Gen Intel",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 2.708,
        "westus2": 2.708,
        "westeurope": 2.979,
        "southeastasia": 3.251,
        "australiaeast": 3.387
      },
      "recommendation_score": 70,
      "use_cases": ["High-Performance Computing", "CPU-Bound Applications"],
      "notes": "High CPU and excellent network (28 Gbps). Good for CPU + network-intensive workloads."
    },
    {
      "sku": "Standard_F72s_v2",
      "series": "Fsv2-series",
      "family": "Compute Optimized",
      "vCPUs": 72,
      "memory_gb": 144,
      "network_mbps": 30000,
      "network_label": "30 Gbps",
      "temp_storage_gb": 576,
      "premium_storage": true,
      "processor": "Intel Xeon Platinum 8370C (Ice Lake) / 8272CL (Cascade Lake) / 8168 (Skylake)",
      "generation": "3rd/2nd Gen Intel",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 3.045,
        "westus2": 3.045,
        "westeurope": 3.350,
        "southeastasia": 3.654,
        "australiaeast": 3.807
      },
      "recommendation_score": 71,
      "use_cases": ["High-Performance Computing", "Maximum Compute"],
      "notes": "Maximum Fsv2 with 72 cores and 30 Gbps network. Best for extreme CPU requirements."
    },
    {
      "sku": "Standard_D4as_v5",
      "series": "Dasv5-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 4,
      "memory_gb": 16,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9004 (Genoa) / 7763v (Milan)",
      "generation": "AMD 4th/3rd Gen",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 0.172,
        "westus2": 0.172,
        "westeurope": 0.189,
        "southeastasia": 0.207,
        "australiaeast": 0.215
      },
      "recommendation_score": 76,
      "use_cases": ["Cost-Optimized Deployments"],
      "notes": "AMD-based VM. Lower cost than Intel equivalent. Good for budget-conscious deployments."
    },
    {
      "sku": "Standard_D8as_v5",
      "series": "Dasv5-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 8,
      "memory_gb": 32,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9004 (Genoa) / 7763v (Milan)",
      "generation": "AMD 4th/3rd Gen",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 0.344,
        "westus2": 0.344,
        "westeurope": 0.378,
        "southeastasia": 0.414,
        "australiaeast": 0.431
      },
      "recommendation_score": 80,
      "use_cases": ["Cost-Optimized Small Deployments"],
      "notes": "AMD-based VM. Competitive pricing vs Intel Dsv5. Good balance of cost and performance."
    },
    {
      "sku": "Standard_D16as_v5",
      "series": "Dasv5-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 16,
      "memory_gb": 64,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9004 (Genoa) / 7763v (Milan)",
      "generation": "AMD 4th/3rd Gen",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 0.688,
        "westus2": 0.688,
        "westeurope": 0.757,
        "southeastasia": 0.827,
        "australiaeast": 0.861
      },
      "recommendation_score": 83,
      "use_cases": ["Cost-Optimized Medium Deployments"],
      "notes": "AMD Genoa/Milan. Competitive cost vs Intel Dsv5. Excellent value for connector servers."
    },
    {
      "sku": "Standard_D32as_v5",
      "series": "Dasv5-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 32,
      "memory_gb": 128,
      "network_mbps": 16000,
      "network_label": "16 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9004 (Genoa) / 7763v (Milan)",
      "generation": "AMD 4th/3rd Gen",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 1.376,
        "westus2": 1.376,
        "westeurope": 1.514,
        "southeastasia": 1.652,
        "australiaeast": 1.722
      },
      "recommendation_score": 93,
      "use_cases": ["Cost-Optimized Large Deployments", "Best Value"],
      "notes": "AMD Genoa/Milan with 16 Gbps network. Excellent price/performance for connector servers."
    },
    {
      "sku": "Standard_D48as_v5",
      "series": "Dasv5-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 48,
      "memory_gb": 192,
      "network_mbps": 24000,
      "network_label": "24 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9004 (Genoa) / 7763v (Milan)",
      "generation": "AMD 4th/3rd Gen",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 2.064,
        "westus2": 2.064,
        "westeurope": 2.270,
        "southeastasia": 2.478,
        "australiaeast": 2.581
      },
      "recommendation_score": 91,
      "use_cases": ["Cost-Optimized Large Deployments"],
      "notes": "AMD Genoa/Milan with 24 Gbps network. Great value for high-throughput deployments."
    },
    {
      "sku": "Standard_D64as_v5",
      "series": "Dasv5-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 64,
      "memory_gb": 256,
      "network_mbps": 32000,
      "network_label": "32 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9004 (Genoa) / 7763v (Milan)",
      "generation": "AMD 4th/3rd Gen",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 2.752,
        "westus2": 2.752,
        "westeurope": 3.027,
        "southeastasia": 3.304,
        "australiaeast": 3.44
      },
      "recommendation_score": 94,
      "use_cases": ["High-Performance Cost-Optimized", "Best Value for 64 cores"],
      "notes": "AMD Genoa/Milan. Best value for 64-core deployments. Competitive cost vs Intel Dsv5."
    },
    {
      "sku": "Standard_D96as_v5",
      "series": "Dasv5-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 96,
      "memory_gb": 384,
      "network_mbps": 40000,
      "network_label": "40 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9004 (Genoa) / 7763v (Milan)",
      "generation": "AMD 4th/3rd Gen",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 4.128,
        "westus2": 4.128,
        "westeurope": 4.541,
        "southeastasia": 4.955,
        "australiaeast": 5.162
      },
      "recommendation_score": 88,
      "use_cases": ["Very Large Cost-Optimized Deployments"],
      "notes": "AMD Genoa/Milan with 40 Gbps network. Maximum Dasv5 size. Cost-effective for very high user counts."
    },
    {
      "sku": "Standard_D4s_v6",
      "series": "Dsv6-series",
      "family": "General Purpose",
      "vCPUs": 4,
      "memory_gb": 16,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 0.192,
        "westus2": 0.192,
        "westeurope": 0.211,
        "southeastasia": 0.230,
        "australiaeast": 0.240
      },
      "recommendation_score": 77,
      "use_cases": ["Small Deployments", "Dev/Test"],
      "notes": "Latest Intel Granite Rapids. Improved IPC over Dsv5. Entry-level for small connector deployments."
    },
    {
      "sku": "Standard_D8s_v6",
      "series": "Dsv6-series",
      "family": "General Purpose",
      "vCPUs": 8,
      "memory_gb": 32,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 0.384,
        "westus2": 0.384,
        "westeurope": 0.422,
        "southeastasia": 0.461,
        "australiaeast": 0.480
      },
      "recommendation_score": 80,
      "use_cases": ["Small to Medium Deployments"],
      "notes": "Latest Intel Granite Rapids. Better per-core performance than Dsv5 at same price point."
    },
    {
      "sku": "Standard_D16s_v6",
      "series": "Dsv6-series",
      "family": "General Purpose",
      "vCPUs": 16,
      "memory_gb": 64,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 0.768,
        "westus2": 0.768,
        "westeurope": 0.845,
        "southeastasia": 0.922,
        "australiaeast": 0.960
      },
      "recommendation_score": 84,
      "use_cases": ["Medium Deployments", "Private Access Connectors"],
      "notes": "Recommended upgrade path from D16s_v5. Granite Rapids delivers ~10% better throughput per vCPU."
    },
    {
      "sku": "Standard_D32s_v6",
      "series": "Dsv6-series",
      "family": "General Purpose",
      "vCPUs": 32,
      "memory_gb": 128,
      "network_mbps": 16000,
      "network_label": "16 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 1.536,
        "westus2": 1.536,
        "westeurope": 1.690,
        "southeastasia": 1.843,
        "australiaeast": 1.920
      },
      "recommendation_score": 92,
      "use_cases": ["Medium to Large Deployments", "Private Access Connectors"],
      "notes": "Top Intel pick for connector servers. Granite Rapids with 16 Gbps network at same price as Dsv5."
    },
    {
      "sku": "Standard_D48s_v6",
      "series": "Dsv6-series",
      "family": "General Purpose",
      "vCPUs": 48,
      "memory_gb": 192,
      "network_mbps": 24000,
      "network_label": "24 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 2.304,
        "westus2": 2.304,
        "westeurope": 2.535,
        "southeastasia": 2.765,
        "australiaeast": 2.880
      },
      "recommendation_score": 90,
      "use_cases": ["Large Deployments", "High-Throughput Connectors"],
      "notes": "Granite Rapids with 24 Gbps. Excellent choice for high-throughput connector deployments."
    },
    {
      "sku": "Standard_D64s_v6",
      "series": "Dsv6-series",
      "family": "General Purpose",
      "vCPUs": 64,
      "memory_gb": 256,
      "network_mbps": 30000,
      "network_label": "30 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 3.072,
        "westus2": 3.072,
        "westeurope": 3.379,
        "southeastasia": 3.686,
        "australiaeast": 3.840
      },
      "recommendation_score": 94,
      "use_cases": ["Large Deployments", "High-Performance Connectors"],
      "notes": "Current top-tier Intel option. Granite Rapids with 30 Gbps for demanding connector workloads."
    },
    {
      "sku": "Standard_D96s_v6",
      "series": "Dsv6-series",
      "family": "General Purpose",
      "vCPUs": 96,
      "memory_gb": 384,
      "network_mbps": 40000,
      "network_label": "40 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 4.608,
        "westus2": 4.608,
        "westeurope": 5.069,
        "southeastasia": 5.530,
        "australiaeast": 5.760
      },
      "recommendation_score": 87,
      "use_cases": ["Very Large Deployments", "Enterprise Scale"],
      "notes": "Maximum Dsv6 with 40 Gbps network. 5 Gbps faster than D96s_v5. Enterprise-scale Intel option."
    },
    {
      "sku": "Standard_D4as_v6",
      "series": "Dasv6-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 4,
      "memory_gb": 16,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9005 (Turin)",
      "generation": "AMD 5th Gen (Turin)",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 0.172,
        "westus2": 0.172,
        "westeurope": 0.189,
        "southeastasia": 0.207,
        "australiaeast": 0.215
      },
      "recommendation_score": 78,
      "use_cases": ["Cost-Optimized Deployments"],
      "notes": "Latest AMD Turin. Better single-thread and multi-thread performance than Dasv5 at same price."
    },
    {
      "sku": "Standard_D8as_v6",
      "series": "Dasv6-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 8,
      "memory_gb": 32,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9005 (Turin)",
      "generation": "AMD 5th Gen (Turin)",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 0.344,
        "westus2": 0.344,
        "westeurope": 0.378,
        "southeastasia": 0.414,
        "australiaeast": 0.431
      },
      "recommendation_score": 82,
      "use_cases": ["Cost-Optimized Small Deployments"],
      "notes": "AMD Turin. Excellent value with competitive pricing and newer-generation performance gains."
    },
    {
      "sku": "Standard_D16as_v6",
      "series": "Dasv6-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 16,
      "memory_gb": 64,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9005 (Turin)",
      "generation": "AMD 5th Gen (Turin)",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 0.688,
        "westus2": 0.688,
        "westeurope": 0.757,
        "southeastasia": 0.827,
        "australiaeast": 0.861
      },
      "recommendation_score": 85,
      "use_cases": ["Cost-Optimized Medium Deployments"],
      "notes": "AMD Turin with improved IPC. Better value vs Intel Dsv6 counterpart. Great for mid-sized connector deployments."
    },
    {
      "sku": "Standard_D32as_v6",
      "series": "Dasv6-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 32,
      "memory_gb": 128,
      "network_mbps": 16000,
      "network_label": "16 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9005 (Turin)",
      "generation": "AMD 5th Gen (Turin)",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 1.376,
        "westus2": 1.376,
        "westeurope": 1.514,
        "southeastasia": 1.652,
        "australiaeast": 1.722
      },
      "recommendation_score": 95,
      "use_cases": ["Cost-Optimized Large Deployments", "Best Value"],
      "notes": "AMD Turin with 16 Gbps. Best price/performance for 32-vCPU connector deployments. Highly recommended."
    },
    {
      "sku": "Standard_D48as_v6",
      "series": "Dasv6-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 48,
      "memory_gb": 192,
      "network_mbps": 24000,
      "network_label": "24 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9005 (Turin)",
      "generation": "AMD 5th Gen (Turin)",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 2.064,
        "westus2": 2.064,
        "westeurope": 2.270,
        "southeastasia": 2.478,
        "australiaeast": 2.581
      },
      "recommendation_score": 93,
      "use_cases": ["Cost-Optimized Large Deployments"],
      "notes": "AMD Turin with 24 Gbps. Great value for high-throughput deployments at lower cost than Intel equivalent."
    },
    {
      "sku": "Standard_D64as_v6",
      "series": "Dasv6-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 64,
      "memory_gb": 256,
      "network_mbps": 32000,
      "network_label": "32 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9005 (Turin)",
      "generation": "AMD 5th Gen (Turin)",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 2.752,
        "westus2": 2.752,
        "westeurope": 3.027,
        "southeastasia": 3.304,
        "australiaeast": 3.440
      },
      "recommendation_score": 96,
      "use_cases": ["High-Performance Cost-Optimized", "Best Value for 64 cores"],
      "notes": "AMD Turin with 32 Gbps. Top value for 64-vCPU deployments. Significant savings vs Intel Dsv6 equivalent."
    },
    {
      "sku": "Standard_D96as_v6",
      "series": "Dasv6-series",
      "family": "General Purpose (AMD)",
      "vCPUs": 96,
      "memory_gb": 384,
      "network_mbps": 40000,
      "network_label": "40 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "AMD EPYC 9005 (Turin)",
      "generation": "AMD 5th Gen (Turin)",
      "deployment_types": ["VM"],
      "pricing": {
        "eastus": 4.128,
        "westus2": 4.128,
        "westeurope": 4.541,
        "southeastasia": 4.955,
        "australiaeast": 5.162
      },
      "recommendation_score": 90,
      "use_cases": ["Very Large Cost-Optimized Deployments"],
      "notes": "Maximum Dasv6 with 40 Gbps network. AMD Turin for enterprise-scale deployments at lower cost than Intel v6."
    },
    {
      "sku": "Standard_E8s_v6",
      "series": "Esv6-series",
      "family": "Memory Optimized",
      "vCPUs": 8,
      "memory_gb": 64,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 0.504,
        "westus2": 0.504,
        "westeurope": 0.554,
        "southeastasia": 0.605,
        "australiaeast": 0.630
      },
      "recommendation_score": 74,
      "use_cases": ["Memory-Intensive Workloads", "Small High-Memory Deployments"],
      "notes": "Memory-optimized Granite Rapids. 8 GB/vCPU ratio. Use when memory is the limiting factor."
    },
    {
      "sku": "Standard_E16s_v6",
      "series": "Esv6-series",
      "family": "Memory Optimized",
      "vCPUs": 16,
      "memory_gb": 128,
      "network_mbps": 12500,
      "network_label": "12.5 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 1.008,
        "westus2": 1.008,
        "westeurope": 1.109,
        "southeastasia": 1.210,
        "australiaeast": 1.261
      },
      "recommendation_score": 72,
      "use_cases": ["Memory-Intensive Workloads"],
      "notes": "Memory-optimized Granite Rapids. Higher memory density vs Dsv6 at increased cost per vCPU."
    },
    {
      "sku": "Standard_E32s_v6",
      "series": "Esv6-series",
      "family": "Memory Optimized",
      "vCPUs": 32,
      "memory_gb": 256,
      "network_mbps": 16000,
      "network_label": "16 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 2.016,
        "westus2": 2.016,
        "westeurope": 2.218,
        "southeastasia": 2.419,
        "australiaeast": 2.522
      },
      "recommendation_score": 74,
      "use_cases": ["Memory-Intensive Workloads"],
      "notes": "Memory-optimized Granite Rapids with 16 Gbps. Strong choice for memory-limited connector scenarios."
    },
    {
      "sku": "Standard_E48s_v6",
      "series": "Esv6-series",
      "family": "Memory Optimized",
      "vCPUs": 48,
      "memory_gb": 384,
      "network_mbps": 24000,
      "network_label": "24 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 3.024,
        "westus2": 3.024,
        "westeurope": 3.326,
        "southeastasia": 3.629,
        "australiaeast": 3.780
      },
      "recommendation_score": 76,
      "use_cases": ["Large Memory-Intensive Workloads"],
      "notes": "384 GB RAM with 24 Gbps and latest Granite Rapids. For large memory-constrained deployments."
    },
    {
      "sku": "Standard_E64s_v6",
      "series": "Esv6-series",
      "family": "Memory Optimized",
      "vCPUs": 64,
      "memory_gb": 512,
      "network_mbps": 30000,
      "network_label": "30 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 4.032,
        "westus2": 4.032,
        "westeurope": 4.435,
        "southeastasia": 4.838,
        "australiaeast": 5.040
      },
      "recommendation_score": 77,
      "use_cases": ["Very Large Memory-Intensive Workloads"],
      "notes": "512 GB RAM with 30 Gbps and Granite Rapids. Latest generation for extreme memory requirements."
    },
    {
      "sku": "Standard_E96s_v6",
      "series": "Esv6-series",
      "family": "Memory Optimized",
      "vCPUs": 96,
      "memory_gb": 672,
      "network_mbps": 40000,
      "network_label": "40 Gbps",
      "temp_storage_gb": 0,
      "premium_storage": true,
      "processor": "Intel Xeon 6 (Granite Rapids P-cores)",
      "generation": "6th Gen Intel",
      "deployment_types": ["VM", "Azure Dedicated Host"],
      "pricing": {
        "eastus": 6.048,
        "westus2": 6.048,
        "westeurope": 6.653,
        "southeastasia": 7.258,
        "australiaeast": 7.560
      },
      "recommendation_score": 72,
      "use_cases": ["Enterprise Memory-Intensive Workloads"],
      "notes": "Maximum Esv6 with 672 GB RAM and 40 Gbps (5 Gbps faster than Esv5 equivalent). Ultimate memory option."
    }
  ]
};

let azureVMData = null;

async function loadAzureVMData() {
    if (azureVMData) return azureVMData;
    
    // Detect if running from file:// protocol (offline mode)
    if (window.location.protocol === 'file:') {
        console.log('Running in offline mode (file://), using embedded Azure VM data');
        azureVMData = azureVMDataEmbedded;
        return azureVMData;
    }
    
    // Try to fetch from JSON file (when running on web server)
    try {
        const response = await fetch('ConfigPresets/azure-vms.json');
        azureVMData = await response.json();
        console.log('Azure VM data loaded from JSON:', azureVMData.vms.length, 'VMs');
        return azureVMData;
    } catch (error) {
        // Fall back to embedded data if fetch fails
        console.log('Failed to load JSON, using embedded Azure VM data');
        azureVMData = azureVMDataEmbedded;
        return azureVMData;
    }
}

// ============================================
// VM Matching Algorithm
// ============================================

/**
 * Find Azure VMs that meet or exceed the calculated requirements
 * @param {Object} requirements - Server requirements from capacity calculation
 * @param {string} region - Azure region (e.g., 'eastus')
 * @returns {Array} Filtered VM list
 */
function findMatchingVMs(requirements, region = 'eastus') {
    if (!azureVMData) {
        console.error('Azure VM data not loaded');
        return [];
    }

    console.group('🔍 cloud-vm-matcher.js::findMatchingVMs()');
    console.log('%c📥 Requirements', 'color:#0078D4;font-weight:bold', requirements);
    console.log('Region:', region);
    console.log('Total VMs in dataset:', azureVMData.vms.length);

    const rejectedLog = [];

    const matches = azureVMData.vms.filter(vm => {
        // Must meet or exceed calculated requirements
        const meetsSpecs =
            vm.vCPUs >= requirements.coresPerServer &&
            vm.memory_gb >= requirements.memoryGB &&
            vm.network_mbps >= requirements.nicLinkSpeed;

        // Must have pricing for selected region
        const hasRegionPricing = vm.pricing[region] !== undefined;

        // NOTE: No hard over-provisioning cap here.
        // When network bandwidth is the bottleneck (e.g. RDP at scale), the only Azure VMs
        // with sufficient NIC speed are large SKUs that will inevitably have much more
        // CPU/memory than the per-server floor. Cost-efficiency ranking handles this naturally.

        if (!meetsSpecs || !hasRegionPricing) {
            rejectedLog.push({
                sku: vm.sku,
                reason: !hasRegionPricing
                    ? `no pricing for ${region}`
                    : `specs too low (vCPUs:${vm.vCPUs}/${requirements.coresPerServer}, mem:${vm.memory_gb}/${requirements.memoryGB}GB, net:${vm.network_mbps}/${requirements.nicLinkSpeed}Mbps)`
            });
        }

        return meetsSpecs && hasRegionPricing;
    });

    if (rejectedLog.length > 0) {
        console.groupCollapsed(`❌ Rejected VMs (${rejectedLog.length})`);
        console.table(rejectedLog);
        console.groupEnd();
    }

    console.log(`%c✅ Matched ${matches.length} VM(s)`, 'color:#107C10;font-weight:bold',
        matches.map(v => v.sku).join(', ') || '(none)');
    console.groupEnd();

    return matches;
}

/**
 * Rank VMs by cost efficiency
 * @param {Array} vms - List of matching VMs
 * @param {Object} requirements - Server requirements
 * @param {string} region - Azure region
 * @returns {Array} Sorted VMs with cost analysis
 */
function rankByCostEfficiency(vms, requirements, region) {
    const rankedVMs = vms.map(vm => {
        // Pricing calculations
        const hourlyRate = vm.pricing[region];
        const monthlyRatePerServer = hourlyRate * 730; // 730 hours per month
        const totalMonthlyCost = monthlyRatePerServer * requirements.serversRequired;
        
        // Performance score (weighted by importance for connector servers)
        // CPU: 40%, Memory: 30%, Network: 30%
        const performanceScore = 
            (vm.vCPUs * 0.40) +
            (vm.memory_gb * 0.30) +
            (vm.network_mbps / 1000 * 0.30);
        
        // Cost efficiency: performance per dollar spent
        const costEfficiency = performanceScore / monthlyRatePerServer;
        
        // Over-provisioning calculation
        const cpuOverprovisionRatio = vm.vCPUs / requirements.coresPerServer;
        const memOverprovisionRatio = vm.memory_gb / requirements.memoryGB;
        const netOverprovisionRatio = vm.network_mbps / requirements.nicLinkSpeed;
        
        const cpuOverprovisionPct = (cpuOverprovisionRatio - 1) * 100;
        const memOverprovisionPct = (memOverprovisionRatio - 1) * 100;
        const netOverprovisionPct = (netOverprovisionRatio - 1) * 100;
        
        // Overall over-provisioning (max of the three)
        const overProvisioningPct = Math.max(
            cpuOverprovisionPct,
            memOverprovisionPct,
            netOverprovisionPct
        );
        
        // Match quality score (0-100)
        // Penalize over-provisioning, reward balanced specs
        let matchScore = 100;
        
        // Penalize over-provisioning (lose points for each 10% over)
        matchScore -= Math.min(overProvisioningPct / 10, 30);
        
        // Bonus for balanced specs (all resources within 50% of each other)
        const specSpread = Math.max(cpuOverprovisionRatio, memOverprovisionRatio, netOverprovisionRatio) -
                          Math.min(cpuOverprovisionRatio, memOverprovisionRatio, netOverprovisionRatio);
        if (specSpread < 0.5) matchScore += 10;
        
        // Bonus for premium storage support
        if (vm.premium_storage) matchScore += 5;
        
        // Bonus for newer generations
        if (vm.generation && (vm.generation.includes('3rd') || vm.generation.includes('4th'))) {
            matchScore += 5;
        }
        
        return {
            ...vm,
            hourlyRate,
            monthlyRatePerServer,
            totalMonthlyCost,
            performanceScore,
            costEfficiency,
            overProvisioningPct,
            cpuOverprovisionPct,
            memOverprovisionPct,
            netOverprovisionPct,
            matchScore: Math.max(0, Math.min(100, matchScore))
        };
    });
    
    // Sort by cost efficiency (higher is better)
    rankedVMs.sort((a, b) => {
        // Primary sort: cost efficiency
        if (Math.abs(b.costEfficiency - a.costEfficiency) > 0.001) {
            return b.costEfficiency - a.costEfficiency;
        }
        // Secondary sort: match score
        if (Math.abs(b.matchScore - a.matchScore) > 1) {
            return b.matchScore - a.matchScore;
        }
        // Tertiary sort: recommendation score from data
        return b.recommendation_score - a.recommendation_score;
    });
    
    return rankedVMs;
}

/**
 * Generate Azure VM recommendations
 * @param {Object} requirements - Server requirements from capacity calculation
 * @param {string} region - Azure region (default: 'eastus')
 * @param {number} topN - Number of recommendations to return (default: 3)
 * @returns {Object} Recommendations with metadata
 */
async function generateAzureVMRecommendations(requirements, region = 'eastus', topN = 3) {
    console.group('☁️ cloud-vm-matcher.js::generateAzureVMRecommendations()');
    console.log('%c📥 Inputs', 'color:#0078D4;font-weight:bold');
    console.table({ ...requirements, region, topN });

    // Ensure data is loaded
    if (!azureVMData) {
        await loadAzureVMData();
        if (!azureVMData) {
            console.error('❌ Failed to load Azure VM data');
            console.groupEnd();
            return {
                success: false,
                error: 'Failed to load Azure VM data'
            };
        }
    }

    // Find matching VMs
    const matchingVMs = findMatchingVMs(requirements, region);

    if (matchingVMs.length === 0) {
        console.warn('⚠️ No VMs matched. Per-server requirements were:',
            `vCPUs≥${requirements.coresPerServer}, mem≥${requirements.memoryGB}GB, net≥${requirements.nicLinkSpeed}Mbps`);
        console.log('Highest NIC speed in dataset:',
            Math.max(...azureVMData.vms.map(v => v.network_mbps)), 'Mbps');
        console.groupEnd();
        return {
            success: false,
            error: 'No VMs found matching your requirements',
            requirements,
            region
        };
    }

    // Rank by cost efficiency
    const rankedVMs = rankByCostEfficiency(matchingVMs, requirements, region);

    // Return top N recommendations
    const topRecommendations = rankedVMs.slice(0, topN);

    console.log('%c📊 Top recommendations', 'color:#107C10;font-weight:bold');
    console.table(topRecommendations.map(v => ({
        sku: v.sku,
        vCPUs: v.vCPUs,
        memory_gb: v.memory_gb,
        network_label: v.network_label,
        monthlyPerServer: `$${Math.round(v.monthlyRatePerServer)}`,
        totalMonthly: `$${Math.round(v.totalMonthlyCost)}`,
        costEfficiency: v.costEfficiency.toFixed(4)
    })));
    console.groupEnd();

    return {
        success: true,
        requirements,
        region,
        regionName: azureVMData.regions[region]?.name || region,
        totalMatches: matchingVMs.length,
        recommendations: topRecommendations,
        allMatches: rankedVMs,
        metadata: {
            lastUpdated: azureVMData.lastUpdated,
            currency: azureVMData.currency,
            pricingNote: azureVMData.pricingNote
        }
    };
}

/**
 * Get available Azure regions
 * @returns {Array} List of region objects
 */
function getAvailableRegions() {
    if (!azureVMData) return [];
    
    return Object.entries(azureVMData.regions).map(([id, info]) => ({
        id,
        name: info.name,
        location: info.location
    }));
}

/**
 * Format currency
 * @param {number} value - Dollar amount
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value) {
    return value >= 0 
        ? `+${value.toFixed(0)}%` 
        : `${value.toFixed(0)}%`;
}
