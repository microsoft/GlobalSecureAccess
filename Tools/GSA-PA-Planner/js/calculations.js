/**
 * GSA Private Access Sizing Planner - Pure Calculation Engine
 * 
 * This module contains ONLY the core capacity calculation logic.
 * It takes 24 attributes as input and returns server capacity results.
 * 
 * NO DEPENDENCIES - Pure math that works in browser and Node.js.
 * Protocol presets and blending moved to separate modules:
 *   - preset-loader.js: Contains all preset data
 *   - protocol-blending.js: Protocol blending UI logic
 */

// ============================================
// Capacity Calculation - Pure Engine
// ============================================

function calculateCapacity(inputs) {
    // Console logging for debugging - All 24 parameters
    console.group('🧮 calculation.js::calculateCapacity() called');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Full inputs object:', inputs);
    
    // Log all 24 parameters individually
    if (inputs) {
        console.log('📊 All 24 Parameters:');
        console.log('  1. coresPerServer:', inputs.coresPerServer);
        console.log('  2. cpuPerfMultiplier:', inputs.cpuPerfMultiplier);
        console.log('  3. memoryGB:', inputs.memoryGB);
        console.log('  4. cpuCapacityPerCore:', inputs.cpuCapacityPerCore);
        console.log('  5. expectedConcurrentUsers:', inputs.expectedConcurrentUsers);
        console.log('  6. requestsPerUser:', inputs.requestsPerUser);
        console.log('  7. growthRate:', inputs.growthRate);
        console.log('  8. cpuCostPer1000:', inputs.cpuCostPer1000);
        console.log('  9. memoryCostPer1000:', inputs.memoryCostPer1000);
        console.log(' 10. baseIdleMemory:', inputs.baseIdleMemory);
        console.log(' 11. avgRequestSize:', inputs.avgRequestSize);
        console.log(' 12. avgResponseSize:', inputs.avgResponseSize);
        console.log(' 13. targetNicUtil:', inputs.targetNicUtil);
        console.log(' 14. nicLinkSpeed:', inputs.nicLinkSpeed);
        console.log(' 15. nicOffloads:', inputs.nicOffloads);
        console.log(' 16. nicCpuReduction:', inputs.nicCpuReduction);
        console.log(' 17. mtuPayload:', inputs.mtuPayload);
        console.log(' 18. packetProcCost:', inputs.packetProcCost);
        console.log(' 19. protocolOverhead:', inputs.protocolOverhead);
        console.log(' 20. virtCpuOverhead:', inputs.virtCpuOverhead);
        console.log(' 21. virtMemoryOverhead:', inputs.virtMemoryOverhead);
        console.log(' 22. virtNetworkOverhead:', inputs.virtNetworkOverhead);
        console.log(' 23. numberOfApps:', inputs.numberOfApps);
        console.log(' 24. appRequestMultiplier:', inputs.appRequestMultiplier);
    }
    
    console.groupEnd();
    
    // Destructure all inputs with defaults (matching SPEC.md)
    const {
        coresPerServer = 64,
        cpuPerfMultiplier = 1.59,
        memoryGB = 16,
        cpuCapacityPerCore = 85,
        expectedConcurrentUsers = 50000,
        requestsPerUser = 2,
        growthRate = 10,
        cpuCostPer1000 = 44.5,
        memoryCostPer1000 = 512,
        baseIdleMemory = 512,
        avgRequestSize = 2,
        avgResponseSize = 16,
        targetNicUtil = 80,
        nicLinkSpeed = 1024,
        nicOffloads = true,
        nicCpuReduction = 30,
        mtuPayload = 1460,
        packetProcCost = 0.02,
        protocolOverhead = 6,
        // Virtualization overhead parameters
        virtCpuOverhead = 0,
        virtMemoryOverhead = 0,
        virtNetworkOverhead = 0,
        // Number of apps - affects request rate (more apps = more requests)
        numberOfApps = 1,
        appRequestMultiplier = 0.02, // 2% increase in requests per additional app
    } = inputs;

    // 0. Apply numberOfApps multiplier to effective requests per user
    // More apps typically means more concurrent connections and requests
    const appMultiplier = 1 + (Math.max(0, numberOfApps - 1) * appRequestMultiplier);
    const effectiveRequestsPerUser = requestsPerUser * appMultiplier;

    // 1. Packet processing cores calculation
    const baselineRps = expectedConcurrentUsers * effectiveRequestsPerUser;
    const avgBytesPerRequest = avgRequestSize + avgResponseSize;
    const packetsPerRequest = Math.ceil(avgBytesPerRequest * 1024 / mtuPayload);
    const pps = baselineRps * packetsPerRequest;
    const packetProcessingCoresRaw = (pps / 1000) * packetProcCost;

    // 2. Offload adjustment factor - Apply NIC offload reduction
    const offloadAdjustment = nicOffloads ? (1 - nicCpuReduction / 100) : 1;
    const packetProcessingCores = packetProcessingCoresRaw * offloadAdjustment;

    // 3. Cores for users raw - BASE CPU COST (no longer scaled by request rate)
    // Request rate scaling is handled by packet processing calculation below.
    // GSA Private Access is router-like: packet processing dominates, not connection handling.
    // Setting requestMultiplier = 1.0 fixes double-counting issue where both base CPU and
    // packet processing were scaling with request rate.
    const requestMultiplier = 1.0; // Fixed: router-like workload, packet processing handles scaling
    const coresForUsersRaw = (expectedConcurrentUsers / 1000) * (cpuCostPer1000 / 100) * requestMultiplier;

    // 4. Total cores required for the workload
    const totalCoresRequired = coresForUsersRaw + packetProcessingCores;

    // 5. Cores adjusted for CPU performance
    const coresAdjustedForPerf = totalCoresRequired / cpuPerfMultiplier;

    // 6. Available CPU capacity per server
    // Apply virtualization CPU overhead - reduces effective capacity
    const virtCpuEfficiency = 1 - (virtCpuOverhead / 100);
    const cpuCapacity = coresPerServer * cpuPerfMultiplier * (cpuCapacityPerCore / 100) * virtCpuEfficiency;
    
    // 7. Max users this server can handle (CPU-limited)
    // Calculate effective packet processing cost per user with offload adjustment
    const packetsPerUser = packetsPerRequest * effectiveRequestsPerUser;
    const packetProcCostPerUser = (packetsPerUser / 1000) * packetProcCost * offloadAdjustment;
    
    // Total CPU cost per user = base CPU cost (fixed) + packet processing cost (scales with requests)
    // Base cost is now constant per user, packet processing provides the request rate scaling
    const baseCpuCostPerUser = ((cpuCostPer1000 / 100) / 1000) * requestMultiplier; // requestMultiplier = 1.0
    const totalCpuCostPerUser = baseCpuCostPerUser + packetProcCostPerUser;
    
    const maxUsersCpu = Math.floor(cpuCapacity / totalCpuCostPerUser);

    // 8. Max users (Memory-limited)
    // Total memory available in MB
    const totalMemoryMB = memoryGB * 1024;
    // Apply virtualization memory overhead (hypervisor reserves memory)
    const virtMemoryReserved = totalMemoryMB * (virtMemoryOverhead / 100);
    // Subtract base idle memory and virtualization overhead
    const usableMemory = totalMemoryMB - baseIdleMemory - virtMemoryReserved;
    // Memory consumption is FIXED at memoryCostPer1000 MB per 1000 users
    const memoryPerUser = memoryCostPer1000 / 1000;
    // Calculate max users based on available memory
    const maxUsersMemory = Math.floor(usableMemory / memoryPerUser);

    // 9. Max users (Network-limited) - with virtualization overhead
    // nicLinkSpeed is in Mbps (Megabits per second)
    // Apply virtualization network overhead - reduces effective bandwidth
    const virtNetworkEfficiency = 1 - (virtNetworkOverhead / 100);
    const effectiveNicSpeed = nicLinkSpeed * virtNetworkEfficiency;
    
    // Available bandwidth at target utilization
    const availableBandwidthMbps = effectiveNicSpeed * (targetNicUtil / 100);
    // Convert Mbps to bps (bits per second)
    const availableBandwidthBps = availableBandwidthMbps * 1_000_000;
    
    // Calculate bandwidth per user per second
    const totalDataPerRequestKB = avgRequestSize + avgResponseSize;
    const bytesPerUserPerSec = totalDataPerRequestKB * 1024 * effectiveRequestsPerUser;
    const bytesPerUserPerSecWithOverhead = bytesPerUserPerSec * (1 + protocolOverhead / 100);
    const bitsPerUserPerSec = bytesPerUserPerSecWithOverhead * 8;
    
    // Max users based on network bandwidth
    const maxUsersNetwork = Math.floor(availableBandwidthBps / bitsPerUserPerSec);

    // 10. Limiting factor - find which resource is the bottleneck
    const maxUsersPerServer = Math.min(maxUsersCpu, maxUsersMemory, maxUsersNetwork);
    let limitingFactor = "CPU";
    if (maxUsersPerServer === maxUsersMemory) {
        limitingFactor = "Memory";
    } else if (maxUsersPerServer === maxUsersNetwork) {
        limitingFactor = "Network";
    }

    // 11. Calculate servers required based on core needs
    // Effective cores per server considers performance multiplier, capacity target, and virtualization
    const effectiveCoresPerServer = coresPerServer * cpuPerfMultiplier * (cpuCapacityPerCore / 100) * virtCpuEfficiency;
    const serversRequiredForCores = Math.ceil(totalCoresRequired / effectiveCoresPerServer);

    // 12. Growth Projections (5 years)
    let growthProjections = [];
    let users = expectedConcurrentUsers;
    for (let year = 0; year <= 5; year++) {
        const serversRequired = Math.max(1, Math.ceil(users / maxUsersPerServer));
        growthProjections.push({
            year,
            expectedUsers: Math.round(users),
            serversRequired,
        });
        users *= 1 + growthRate / 100;
    }

    return {
        maxUsersCpu,
        maxUsersMemory,
        maxUsersNetwork,
        maxUsersPerServer,
        coresForUsersRaw,
        packetProcessingCores,
        totalCoresRequired,
        coresAdjustedForPerf,
        serversRequiredForCores,
        limitingFactor,
        growthProjections,
        // Additional debug values
        debug: {
            totalMemoryMB,
            usableMemory,
            memoryPerUser,
            totalCpuCostPerUser,
            baseCpuCostPerUser,
            packetProcCostPerUser,
            cpuCapacity,
            availableBandwidthMbps,
            availableBandwidthBps,
            bitsPerUserPerSec,
            bytesPerUserPerSec,
            offloadAdjustment,
            virtCpuEfficiency,
            virtMemoryReserved,
            virtNetworkEfficiency,
            effectiveNicSpeed,
            coresPerServer,
            numberOfApps,
            appMultiplier,
            effectiveRequestsPerUser,
        }
    };
}

// ============================================
// Universal Export (Browser + Node.js)
// ============================================

if (typeof window !== 'undefined') {
    // Browser: attach to window
    window.calculateCapacity = calculateCapacity;
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js: use CommonJS exports
    module.exports = { calculateCapacity };
}
