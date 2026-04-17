/**
 * GSA Private Access - Network IO-based Sizing Calculator
 * 
 * Network-first approach: Bandwidth determines CPU and Memory requirements
 * Philosophy: "The network pipe determines everything else"
 * 
 * Calculation Flow:
 * 1. Network Bandwidth (Gbps) - Primary driver
 * 2. CPU Cores - To process that bandwidth
 * 3. Memory (GB) - To buffer and manage that load
 * 
 * NO DEPENDENCIES - Pure calculation engine (browser + Node.js compatible)
 * 
 * ═══════════════════════════════════════════════════════════════════════
 * INPUT PARAMETERS (accepted by calculateNetworkCapacity function)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * REQUIRED INPUTS:
 * ----------------
 * • expectedConcurrentUsers (number)  - Number of simultaneous active users
 * • requestsPerUser (number)          - Requests per user per second
 * • avgRequestSize (number)           - Average request payload size in KB
 * • avgResponseSize (number)          - Average response payload size in KB
 * 
 * OPTIONAL INPUTS (with defaults):
 * ---------------------------------
 * • protocolOverhead (number)         - Protocol overhead % (default: 6)
 * • packetProcCost (number)           - CPU cores per 1000 pps (default: 0.02)
 * • mtuPayload (number)               - MTU payload in bytes (default: 1460)
 * • cpuPerfMultiplier (number)        - CPU performance multiplier (default: 1.00 baseline)
 * 
 * ═══════════════════════════════════════════════════════════════════════
 * OUTPUT STRUCTURE
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Returns object with:
 * 
 * • inputs (object)                   - Final configuration with defaults applied
 * 
 * • requestedWorkload (object):
 *   ├─ users (number)                 - Input user count
 *   ├─ bandwidth (object)             - Bandwidth metrics
 *   │  ├─ bandwidthGbps               - Total bandwidth in Gbps
 *   │  ├─ totalDataMBps               - Bandwidth in MB/s
 *   │  ├─ totalDataKBps               - Bandwidth in KB/s
 *   │  └─ dataPerUserKBps             - Bandwidth per user
 *   ├─ packets (object)               - Packet metrics
 *   │  ├─ packetsPerSec               - Total packets per second
 *   │  ├─ totalRequestsPerSec         - Total requests per second
 *   │  └─ packetsPerRequest           - Packets per request
 *   ├─ cpu (object)                   - CPU requirements
 *   │  ├─ baselineCoresRequired       - Cores for baseline CPU (1.00x)
 *   │  ├─ actualCoresRequired         - Cores for actual CPU (adjusted)
 *   │  ├─ cpuPerfMultiplier           - CPU performance multiplier used
 *   │  ├─ baseCpuCores                - Cores for connection management
 *   │  ├─ packetProcessingCores       - Cores for packet processing
 *   │  └─ throughputCores             - Cores for throughput processing
 *   └─ memory (object)                - Memory requirements
 *      ├─ totalMemoryGB               - Total memory in GB
 *      ├─ totalMemoryMB               - Total memory in MB
 *      ├─ activeConnections           - Number of active connections
 *      ├─ connectionBufferMemoryMB    - Memory for connection buffers
 *      └─ sessionStateMemoryMB        - Memory for session state
 * 
 * • scenarios (object):
 *   ├─ conservative (object)          - 60% utilization scenario (40% headroom)
 *   ├─ balanced (object)              - 70% utilization scenario (30% headroom)
 *   └─ efficient (object)             - 80% utilization scenario (20% headroom)
 *      Each scenario contains:
 *      ├─ targetUtilization           - Target utilization % (60, 70, 80)
 *      ├─ utilizationPercent          - "60%", "70%", "80%"
 *      ├─ description                 - Human-readable description
 *      ├─ users                       - Same user count (full workload)
 *      ├─ bandwidthGbps               - Required bandwidth capacity
 *      ├─ baselineCoresRequired       - CPU cores for baseline (1.00x)
 *      ├─ actualCoresRequired         - CPU cores for actual CPU
 *      ├─ cpuPerfMultiplier           - CPU multiplier used
 *      ├─ coresRequired               - CPU cores (defaults to actual)
 *      ├─ memoryGB                    - Memory capacity needed
 *      ├─ workloadBandwidth           - Actual workload bandwidth
 *      ├─ workloadCores               - Actual workload cores
 *      └─ workloadMemory              - Actual workload memory
 * 
 * • models (object)                   - Configuration models used
 *   ├─ cpu                            - CPU_MODEL constants
 *   └─ memory                         - MEMORY_MODEL constants
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

// ============================================
// CONFIGURATION - Easy to adjust models
// ============================================

/**
 * CPU Model (Hybrid - Model 3)
 * CPU requirements come from three sources:
 * 1. Base CPU for connection management (scales with users)
 * 2. Packet processing (scales with packet rate)
 * 3. Throughput processing (scales with bandwidth)
 * 
 * IMPORTANT: All coefficients below are tuned for BASELINE CPU performance.
 * Baseline = 1.00 performance multiplier (Intel Xeon E5-v3 2014 or AMD EPYC Rome 2019)
 * Actual CPU requirements are adjusted using cpuPerfMultiplier input.
 */
const CPU_MODEL = {
    // Baseline CPU reference for coefficient tuning
    BASELINE_CPU: "Intel Xeon E5-v3 (2014) or AMD EPYC Rome (2019)",
    BASELINE_MULTIPLIER: 1.00,
    
    // Base CPU cost for connection management (% per 1000 users)
    // Handles: connection establishment, TLS handshakes, routing decisions
    // Tuned for baseline CPU (1.00 multiplier)
    BASE_CPU_PER_1000_USERS: 2.5,
    
    // CPU cores required per Gbps of throughput
    // Handles: data forwarding, encryption/decryption, protocol conversion
    // Tuned for baseline CPU (1.00 multiplier)
    CORES_PER_GBPS_THROUGHPUT: 0.8,
    
    // Packet processing cost (cores per 1000 packets/sec)
    // Inherited from packetProcCost input (default: 0.02)
    // Handles: packet inspection, header processing, fragmentation
    // Tuned for baseline CPU (1.00 multiplier)

    // GSA Private Access connector CPU bounds (validated via real-world testing)
    // A single connector instance can utilise between 4 and 32 cores.
    // A connector *group* may contain many connectors, so the group total can exceed 32.
    // MAX_CORES_PER_CONNECTOR drives the server-count formula: even on a 64-core host,
    // only 32 cores are usable by one connector, so the divisor is capped here.
    MIN_CORES_PER_CONNECTOR: 4,
    MAX_CORES_PER_CONNECTOR: 32,
};

/**
 * Memory Model (Connection Buffer - Model 1)
 * Memory scales with active connections, not just users
 * Reverse proxy pattern: buffer incoming requests/responses
 */
const MEMORY_MODEL = {
    // Average number of concurrent connections per user
    // Typical: 2-5 for web apps, 10-20 for complex apps
    CONNECTIONS_PER_USER: 3,
    
    // Buffer size per connection in MB
    // Includes: request buffer, response buffer, connection state
    BUFFER_SIZE_PER_CONNECTION_MB: 0.25,
    
    // Base memory for OS and connector service (MB)
    BASE_MEMORY_MB: 512,
    
    // Additional memory per 1000 users for session state (MB)
    // Handles: auth tokens, routing tables, metrics
    SESSION_STATE_PER_1000_USERS_MB: 128,
};

/**
 * Proxy traffic multiplier for bandwidth calculation.
 *
 * The PA connector is a reverse proxy: every byte of user traffic crosses the
 * server's NIC(s) twice — once on the cloud-tunnel leg and once on the LAN leg
 * (and the same in reverse for the response). The total NIC load is therefore
 * always 2× the single-pass user payload, regardless of the number of NICs.
 *
 * Applying this multiplier here means bandwidthGbps represents the real
 * physical NIC load, so all downstream calculations (CPU throughput cores,
 * NIC server-count constraint) are automatically correct.
 *
 * Current value: 1.0 (single-pass — proxy doubling effect NOT yet applied).
 * Change to 2.0 to account for the full reverse-proxy NIC load.
 */
const PROXY_TRAFFIC_MULTIPLIER = 1.0;

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculate bandwidth requirements from user traffic profile
 * 
 * @param {Object} inputs - Traffic profile parameters
 * @returns {Object} Bandwidth metrics
 */
function calculateBandwidthRequirements(inputs) {
    const {
        expectedConcurrentUsers,
        requestsPerUser,
        avgRequestSize,      // KB
        avgResponseSize,     // KB
        protocolOverhead = 6, // %
    } = inputs;

    // Total data per user per second (KB/s)
    const totalDataPerUserPerSec = (avgRequestSize + avgResponseSize) * requestsPerUser;
    
    // Apply protocol overhead (encryption, framing, headers)
    const dataWithOverhead = totalDataPerUserPerSec * (1 + protocolOverhead / 100);
    
    // Total bandwidth for all users
    const totalDataKBps = dataWithOverhead * expectedConcurrentUsers;
    const totalDataMBps = totalDataKBps / 1024;
    const totalDataGBps = totalDataMBps / 1024;
    
    // Convert to Gbps (Gigabits per second).
    // PROXY_TRAFFIC_MULTIPLIER accounts for the reverse-proxy double-pass:
    // every byte crosses the NIC twice (cloud-tunnel leg + LAN leg).
    const bandwidthGbps = totalDataGBps * 8 * PROXY_TRAFFIC_MULTIPLIER;

    return {
        totalDataKBps,
        totalDataMBps,
        totalDataGBps,
        bandwidthGbps,
        dataPerUserKBps: dataWithOverhead,
    };
}

/**
 * Calculate packet rate for packet processing CPU cost
 * 
 * @param {Object} inputs - Traffic and network parameters
 * @param {number} bandwidthGbps - Total bandwidth in Gbps
 * @returns {Object} Packet metrics
 */
function calculatePacketRate(inputs, bandwidthGbps) {
    const {
        expectedConcurrentUsers,
        requestsPerUser,
        avgRequestSize,
        avgResponseSize,
        mtuPayload = 1460,  // MTU payload size in bytes
    } = inputs;

    // Average bytes per request (request + response)
    const avgBytesPerRequest = (avgRequestSize + avgResponseSize) * 1024; // Convert KB to bytes
    
    // Packets per request (round up to handle fragmentation)
    const packetsPerRequest = Math.ceil(avgBytesPerRequest / mtuPayload);
    
    // Total requests per second
    const totalRequestsPerSec = expectedConcurrentUsers * requestsPerUser;
    
    // Total packets per second
    const packetsPerSec = totalRequestsPerSec * packetsPerRequest;

    return {
        packetsPerRequest,
        packetsPerSec,
        totalRequestsPerSec,
    };
}

/**
 * Calculate CPU requirements using Hybrid Model 3
 * 
 * All calculations are first performed for BASELINE CPU (1.00 multiplier),
 * then adjusted based on actual CPU performance multiplier.
 * 
 * @param {Object} inputs - Configuration parameters
 * @param {Object} bandwidth - Bandwidth metrics
 * @param {Object} packets - Packet metrics
 * @returns {Object} CPU requirements (baseline and adjusted)
 */
function calculateCPURequirements(inputs, bandwidth, packets) {
    const {
        expectedConcurrentUsers,
        packetProcCost = 0.02,  // Cores per 1000 pps
        cpuPerfMultiplier = 1.00,  // CPU performance multiplier (default: baseline)
    } = inputs;

    // Step 1: Calculate for BASELINE CPU (coefficients are tuned for 1.00 multiplier)
    
    // 1a. Base CPU for connection management
    const baseCpuCores = (expectedConcurrentUsers / 1000) * (CPU_MODEL.BASE_CPU_PER_1000_USERS / 100);
    
    // 1b. Packet processing CPU
    // Note: Assumes NIC offloads are enabled (RSS, TSO, LRO) with ~30% CPU reduction
    const packetProcessingCoresRaw = (packets.packetsPerSec / 1000) * packetProcCost;
    const NIC_OFFLOAD_REDUCTION = 0.30; // 30% reduction with modern NIC offloads
    const packetProcessingCores = packetProcessingCoresRaw * (1 - NIC_OFFLOAD_REDUCTION);
    
    // 1c. Throughput processing CPU
    const throughputCores = bandwidth.bandwidthGbps * CPU_MODEL.CORES_PER_GBPS_THROUGHPUT;
    
    // 1d. Total baseline CPU cores required (for 1.00 multiplier CPU)
    const baselineCoresRequired = baseCpuCores + packetProcessingCores + throughputCores;
    
    // Step 2: Adjust for actual CPU performance
    // Higher multiplier = fewer cores needed (e.g., 1.85x CPU needs only 54% of baseline cores)
    const actualCoresRequired = baselineCoresRequired / cpuPerfMultiplier;

    return {
        // Component breakdown (always for baseline CPU)
        baseCpuCores,
        packetProcessingCores,
        packetProcessingCoresRaw,
        throughputCores,
        
        // Total results
        baselineCoresRequired,    // Cores needed for baseline CPU (1.00 multiplier)
        cpuPerfMultiplier,        // The multiplier used
        actualCoresRequired,      // Cores needed for actual CPU
        
        // Legacy compatibility
        totalCoresRequired: baselineCoresRequired,  // Keep for backward compatibility
    };
}

/**
 * Calculate memory requirements using Connection Buffer Model 1
 * 
 * @param {Object} inputs - Configuration parameters
 * @returns {Object} Memory requirements in MB and GB
 */
function calculateMemoryRequirements(inputs) {
    const {
        expectedConcurrentUsers,
    } = inputs;

    // Active connections = users × connections per user
    const activeConnections = expectedConcurrentUsers * MEMORY_MODEL.CONNECTIONS_PER_USER;
    
    // Connection buffer memory
    const connectionBufferMemoryMB = activeConnections * MEMORY_MODEL.BUFFER_SIZE_PER_CONNECTION_MB;
    
    // Session state memory
    const sessionStateMemoryMB = (expectedConcurrentUsers / 1000) * MEMORY_MODEL.SESSION_STATE_PER_1000_USERS_MB;
    
    // Total memory
    const totalMemoryMB = MEMORY_MODEL.BASE_MEMORY_MB + connectionBufferMemoryMB + sessionStateMemoryMB;
    const totalMemoryGB = totalMemoryMB / 1024;

    return {
        activeConnections,
        baseMemoryMB: MEMORY_MODEL.BASE_MEMORY_MB,
        connectionBufferMemoryMB,
        sessionStateMemoryMB,
        totalMemoryMB,
        totalMemoryGB,
    };
}

/**
 * Calculate infrastructure sizing for a target utilization level
 * 
 * This calculates the infrastructure capacity needed to run at a specific utilization percentage.
 * For example, if workload needs 10 Gbps and target is 80% utilization,
 * you need 10 / 0.80 = 12.5 Gbps capacity (leaving 20% headroom for bursts).
 * 
 * @param {Object} workloadResults - Calculated requirements for the full workload
 * @param {number} targetUtilization - Target utilization percentage (60, 70, 80)
 * @returns {Object} Infrastructure requirements at this utilization target
 */
function calculateUtilizationScenario(workloadResults, targetUtilization) {
    const utilizationFactor = targetUtilization / 100;
    
    // Calculate required capacity to achieve target utilization
    // If workload needs X and you want to run at Y% util, you need X / (Y/100) capacity
    return {
        targetUtilization: targetUtilization,
        utilizationPercent: `${targetUtilization}%`,
        description: `${targetUtilization}% utilization (${100 - targetUtilization}% headroom)`,
        
        // Infrastructure capacity needed
        bandwidthGbps: parseFloat((workloadResults.bandwidth.bandwidthGbps / utilizationFactor).toFixed(3)),
        baselineCoresRequired: Math.ceil(workloadResults.cpu.baselineCoresRequired / utilizationFactor),
        actualCoresRequired: Math.ceil(workloadResults.cpu.actualCoresRequired / utilizationFactor),
        cpuPerfMultiplier: workloadResults.cpu.cpuPerfMultiplier,
        coresRequired: Math.ceil(workloadResults.cpu.actualCoresRequired / utilizationFactor),
        memoryGB: Math.ceil(workloadResults.memory.totalMemoryGB / utilizationFactor),
        memoryMB: Math.ceil(workloadResults.memory.totalMemoryMB / utilizationFactor),
        
        // Workload at this capacity
        users: workloadResults.users,
        workloadBandwidth: workloadResults.bandwidth.bandwidthGbps,
        workloadCores: Math.ceil(workloadResults.cpu.actualCoresRequired),
        workloadMemory: Math.ceil(workloadResults.memory.totalMemoryGB),
        
        // Detailed breakdown (scaled)
        bandwidth: {
            ...workloadResults.bandwidth,
            provisionedGbps: parseFloat((workloadResults.bandwidth.bandwidthGbps / utilizationFactor).toFixed(3))
        },
        cpu: {
            ...workloadResults.cpu,
            baselineCoresRequired: workloadResults.cpu.baselineCoresRequired / utilizationFactor,
            actualCoresRequired: workloadResults.cpu.actualCoresRequired / utilizationFactor
        },
        memory: {
            ...workloadResults.memory,
            totalMemoryGB: workloadResults.memory.totalMemoryGB / utilizationFactor,
            totalMemoryMB: workloadResults.memory.totalMemoryMB / utilizationFactor
        }
    };
}

// ============================================
// Main Calculation Function
// ============================================

/**
 * Network IO-based capacity calculation
 * 
 * Primary approach: Network bandwidth drives CPU and Memory requirements
 * 
 * @param {Object} inputs - User workload and network parameters
 * @returns {Object} Complete sizing analysis with 3 utilization scenarios
 */
function calculateNetworkCapacity(inputs) {
    console.group('🌐 network-calculations.js::calculateNetworkCapacity() called');
    console.log('Timestamp:', new Date().toISOString());
    console.log('%c═══════════════════════════════════════════════════', 'color: #0078D4; font-weight: bold');
    console.log('%c📥 RAW INPUTS (as received from UI)', 'color: #0078D4; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════', 'color: #0078D4; font-weight: bold');
    console.table(inputs);
    
    // Validate required inputs
    const required = ['expectedConcurrentUsers', 'requestsPerUser', 'avgRequestSize', 'avgResponseSize'];
    console.log('%c\n✓ Validating required fields:', 'color: #107C10; font-weight: bold', required);
    for (const field of required) {
        if (inputs[field] === undefined || inputs[field] === null) {
            console.error(`❌ Missing required field: ${field}`);
            console.groupEnd();
            throw new Error(`Missing required input: ${field}`);
        }
        console.log(`  ✓ ${field}:`, inputs[field]);
    }
    
    // Set defaults for optional parameters
    const config = {
        expectedConcurrentUsers: inputs.expectedConcurrentUsers,
        requestsPerUser: inputs.requestsPerUser || 2,
        avgRequestSize: inputs.avgRequestSize || 2,
        avgResponseSize: inputs.avgResponseSize || 16,
        protocolOverhead: inputs.protocolOverhead || 6,
        packetProcCost: inputs.packetProcCost || 0.02,
        mtuPayload: inputs.mtuPayload || 1460,
        cpuPerfMultiplier: inputs.cpuPerfMultiplier || 1.00,  // CPU performance multiplier (default: baseline)
    };
    
    console.log('%c\n═══════════════════════════════════════════════════', 'color: #0078D4; font-weight: bold');
    console.log('%c⚙️  FINAL CONFIGURATION (with defaults applied)', 'color: #0078D4; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════', 'color: #0078D4; font-weight: bold');
    console.group('Workload Parameters');
    console.log('Expected Concurrent Users:', config.expectedConcurrentUsers);
    console.log('Requests per User per Sec:', config.requestsPerUser);
    console.log('Avg Request Size (KB):', config.avgRequestSize);
    console.log('Avg Response Size (KB):', config.avgResponseSize);
    console.groupEnd();
    
    console.group('Network Parameters');
    console.log('Protocol Overhead (%):', config.protocolOverhead);
    console.log('MTU Payload (bytes):', config.mtuPayload);
    console.groupEnd();
    
    console.group('CPU Parameters');
    console.log('Packet Processing Cost (cores/1000pps):', config.packetProcCost);
    console.log('CPU Performance Multiplier:', config.cpuPerfMultiplier, `(${config.cpuPerfMultiplier === 1.00 ? 'Baseline' : config.cpuPerfMultiplier > 1.00 ? 'Faster than baseline' : 'Slower than baseline'})`);
    console.log('NIC Offload Reduction:', '30% (assumed enabled)');
    console.groupEnd();
    
    console.group('Calculation Models');
    console.log('CPU Model:', CPU_MODEL);
    console.log('Memory Model:', MEMORY_MODEL);
    console.groupEnd();
    
    // Calculate base metrics for the requested workload
    const bandwidth = calculateBandwidthRequirements(config);
    const packets = calculatePacketRate(config, bandwidth.bandwidthGbps);
    const cpu = calculateCPURequirements(config, bandwidth, packets);
    const memory = calculateMemoryRequirements(config);
    
    console.log('%c\n═══════════════════════════════════════════════════', 'color: #107C10; font-weight: bold');
    console.log('%c📊 CALCULATED RESULTS (for requested workload)', 'color: #107C10; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════', 'color: #107C10; font-weight: bold');
    
    console.group('🌐 Bandwidth Calculations');
    console.log('Total Bandwidth Required:', bandwidth.bandwidthGbps.toFixed(3), 'Gbps');
    console.log('  ├─ In MB/s:', bandwidth.totalDataMBps.toFixed(2), 'MB/s');
    console.log('  ├─ In KB/s:', bandwidth.totalDataKBps.toFixed(2), 'KB/s');
    console.log('  └─ Per User:', bandwidth.dataPerUserKBps.toFixed(2), 'KB/s/user');
    console.groupEnd();
    
    console.group('📦 Packet Calculations');
    console.log('Total Packets per Second:', packets.packetsPerSec.toLocaleString(), 'pps');
    console.log('  ├─ Total Requests/sec:', packets.totalRequestsPerSec.toLocaleString(), 'req/s');
    console.log('  └─ Packets per Request:', packets.packetsPerRequest);
    console.groupEnd();
    
    console.group('⚡ CPU Requirements');
    console.log('Baseline Cores Required:', cpu.baselineCoresRequired.toFixed(2), 'cores', '(for 1.00x multiplier CPU)');
    console.log('  ├─ Base CPU (connection mgmt):', cpu.baseCpuCores.toFixed(2), 'cores');
    console.log('  ├─ Packet Processing:', cpu.packetProcessingCores.toFixed(2), 'cores', `(raw: ${cpu.packetProcessingCoresRaw.toFixed(2)}, -30% offload)`);
    console.log('  └─ Throughput Processing:', cpu.throughputCores.toFixed(2), 'cores');
    console.log('');
    console.log('Actual Cores Required:', cpu.actualCoresRequired.toFixed(2), 'cores', `(for ${cpu.cpuPerfMultiplier}x multiplier CPU)`);
    console.log('  └─ Adjustment:', `${cpu.baselineCoresRequired.toFixed(2)} ÷ ${cpu.cpuPerfMultiplier} = ${cpu.actualCoresRequired.toFixed(2)} cores`);
    console.groupEnd();
    
    console.group('💾 Memory Requirements');
    console.log('Total Memory Required:', memory.totalMemoryGB.toFixed(2), 'GB', `(${memory.totalMemoryMB.toFixed(0)} MB)`);
    console.log('  ├─ Base Memory:', memory.baseMemoryMB, 'MB');
    console.log('  ├─ Connection Buffers:', memory.connectionBufferMemoryMB.toFixed(2), 'MB', `(${memory.activeConnections.toLocaleString()} connections)`);
    console.log('  └─ Session State:', memory.sessionStateMemoryMB.toFixed(2), 'MB');
    console.groupEnd();
    
    // Calculate infrastructure requirements at different utilization targets
    // This shows how much capacity to provision for different headroom levels
    const scenarios = {
        conservative: calculateUtilizationScenario({
            users: config.expectedConcurrentUsers,
            bandwidth: bandwidth,
            packets: packets,
            cpu: cpu,
            memory: memory
        }, 60),  // 60% util = 40% headroom (most conservative)
        balanced: calculateUtilizationScenario({
            users: config.expectedConcurrentUsers,
            bandwidth: bandwidth,
            packets: packets,
            cpu: cpu,
            memory: memory
        }, 70),  // 70% util = 30% headroom (balanced)
        efficient: calculateUtilizationScenario({
            users: config.expectedConcurrentUsers,
            bandwidth: bandwidth,
            packets: packets,
            cpu: cpu,
            memory: memory
        }, 80),  // 80% util = 20% headroom (most efficient)
    };
    
    console.log('%c\n═══════════════════════════════════════════════════', 'color: #FFB900; font-weight: bold');
    console.log('%c📈 UTILIZATION SCENARIOS (infrastructure capacity planning)', 'color: #FFB900; font-weight: bold');
    console.log('%c═══════════════════════════════════════════════════', 'color: #FFB900; font-weight: bold');
    console.group('60% Utilization Target (Conservative - 40% headroom)');
    console.log('Required Bandwidth Capacity:', scenarios.conservative.bandwidthGbps.toFixed(3), 'Gbps');
    console.log('  └─ Workload:', scenarios.conservative.workloadBandwidth.toFixed(3), 'Gbps at 60% util');
    console.log('Required CPU Cores (Baseline):', scenarios.conservative.baselineCoresRequired, 'cores (1.00x)');
    console.log('Required CPU Cores (Actual):', scenarios.conservative.actualCoresRequired, `cores (${scenarios.conservative.cpuPerfMultiplier}x)`);
    console.log('Required Memory:', scenarios.conservative.memoryGB, 'GB');
    console.groupEnd();
    
    console.group('70% Utilization Target (Balanced - 30% headroom)');
    console.log('Required Bandwidth Capacity:', scenarios.balanced.bandwidthGbps.toFixed(3), 'Gbps');
    console.log('  └─ Workload:', scenarios.balanced.workloadBandwidth.toFixed(3), 'Gbps at 70% util');
    console.log('Required CPU Cores (Baseline):', scenarios.balanced.baselineCoresRequired, 'cores (1.00x)');
    console.log('Required CPU Cores (Actual):', scenarios.balanced.actualCoresRequired, `cores (${scenarios.balanced.cpuPerfMultiplier}x)`);
    console.log('Required Memory:', scenarios.balanced.memoryGB, 'GB');
    console.groupEnd();
    
    console.group('80% Utilization Target (Efficient - 20% headroom)');
    console.log('Required Bandwidth Capacity:', scenarios.efficient.bandwidthGbps.toFixed(3), 'Gbps');
    console.log('  └─ Workload:', scenarios.efficient.workloadBandwidth.toFixed(3), 'Gbps at 80% util');
    console.log('Required CPU Cores (Baseline):', scenarios.efficient.baselineCoresRequired, 'cores (1.00x)');
    console.log('Required CPU Cores (Actual):', scenarios.efficient.actualCoresRequired, `cores (${scenarios.efficient.cpuPerfMultiplier}x)`);
    console.log('Required Memory:', scenarios.efficient.memoryGB, 'GB');
    console.groupEnd();
    
    console.log('%c\n✅ Calculation Complete!', 'color: #107C10; font-weight: bold; font-size: 14px');
    console.groupEnd();
    
    // Return comprehensive results
    return {
        // Input configuration
        inputs: config,
        
        // Base workload calculations
        requestedWorkload: {
            users: config.expectedConcurrentUsers,
            bandwidth: bandwidth,
            packets: packets,
            cpu: cpu,
            memory: memory,
        },
        
        // Three utilization scenarios
        scenarios: scenarios,
        
        // Configuration model info
        models: {
            cpu: CPU_MODEL,
            memory: MEMORY_MODEL,
        },
    };
}

// ============================================
// Server Count Calculation
// ============================================

/**
 * Calculate server count from network sizing results + hardware configuration
 *
 * Determines how many servers are needed across three constraints:
 *   CPU:     ceil(effectiveCoresRequired / coresPerServer)
 *   Memory:  ceil(effectiveMemoryGB / memoryGB)
 *   Network: ceil(bandwidthGbps / nicEffectiveGbps per server)
 * serversRequired = max of the three (most constraining wins)
 *
 * @param {Object} networkResults - Output from calculateNetworkCapacity()
 * @param {Object} inputs - Hardware configuration
 * @param {number} inputs.coresPerServer - Physical CPU cores per server
 * @param {number} inputs.memoryGB - RAM per server in GB
 * @param {number} inputs.nicLinkSpeed - NIC speed in Mbps (1024 = ~1 Gbps)
 * @param {number} inputs.targetNicUtil - Target NIC utilization % (e.g. 80)
 * @param {number} [inputs.virtCpuOverhead=0] - Hypervisor CPU overhead %
 * @param {number} [inputs.virtMemoryOverhead=0] - Hypervisor memory overhead %
 * @param {number} [inputs.virtNetworkOverhead=0] - Virtual NIC overhead %
 * @returns {Object} Server count per scenario: conservative, balanced, efficient
 */
function calculateServerCount(networkResults, inputs) {
    const {
        coresPerServer = 64,
        memoryGB = 16,
        nicLinkSpeed = 1024,        // Mbps
        targetNicUtil = 80,         // %
        virtCpuOverhead = 0,        // %
        virtMemoryOverhead = 0,     // %
        virtNetworkOverhead = 0,    // %
    } = inputs;

    // Effective NIC throughput per server in Gbps
    // (reduced by target utilization headroom + virtual NIC overhead)
    const nicSpeedGbps = nicLinkSpeed / 1000;
    const nicEffectiveGbps = nicSpeedGbps
        * (targetNicUtil / 100)
        * (1 - virtNetworkOverhead / 100);

    // Virtualization overhead inflates resource requirements
    const virtCpuFactor = 1 + virtCpuOverhead / 100;
    const virtMemFactor = 1 + virtMemoryOverhead / 100;

    const result = {};

    for (const [scenarioName, scenario] of Object.entries(networkResults.scenarios)) {
        const effectiveCores = scenario.actualCoresRequired * virtCpuFactor;
        const effectiveMemory = scenario.memoryGB * virtMemFactor;

        // Cap usable cores per connector at the product maximum.
        // A GSA connector can use at most MAX_CORES_PER_CONNECTOR cores regardless of
        // how many physical/virtual cores the host has. Dividing by a value larger than
        // the cap would under-count the number of connectors required.
        const effectiveCoresPerConnector = Math.min(coresPerServer, CPU_MODEL.MAX_CORES_PER_CONNECTOR);
        const serversForCPU = Math.ceil(effectiveCores / effectiveCoresPerConnector);
        const serversForMemory = Math.ceil(effectiveMemory / memoryGB);
        const serversForNetwork = nicEffectiveGbps > 0
            ? Math.ceil(scenario.bandwidthGbps / nicEffectiveGbps)
            : 999;

        const serversRequired = Math.max(serversForCPU, serversForMemory, serversForNetwork);

        // Determine the limiting factor with priority: CPU > Memory > Network.
        // CPU and Memory are checked first so that Network is only reported when
        // it strictly dominates.  This avoids showing "Network" when all three
        // constraints are tied or when the NIC speed has been raised enough to
        // match the other two.
        const limitingFactor =
            serversForCPU >= serversForMemory && serversForCPU >= serversForNetwork ? 'CPU' :
            serversForMemory >= serversForNetwork ? 'Memory' : 'Network';

        result[scenarioName] = {
            serversForCPU,
            serversForMemory,
            serversForNetwork,
            serversRequired,
            limitingFactor,
        };
    }

    return result;
}

// ============================================
// Universal Export (Browser + Node.js)
// ============================================

if (typeof window !== 'undefined') {
    // Browser: attach to window
    window.calculateNetworkCapacity = calculateNetworkCapacity;
    window.calculateServerCount = calculateServerCount;
    window.CPU_MODEL = CPU_MODEL;
    window.MEMORY_MODEL = MEMORY_MODEL;
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js: use CommonJS exports
    module.exports = { 
        calculateNetworkCapacity,
        calculateServerCount,
        CPU_MODEL,
        MEMORY_MODEL,
    };
}
