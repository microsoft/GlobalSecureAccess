/**
 * GSA Private Access Sizing Planner - Preset Loader
 * 
 * This module contains all preset data embedded as JavaScript objects.
 * Built from ConfigPresets/*.json files to avoid CORS issues with file:// protocol.
 * 
 * NO DEPENDENCIES - Pure data module that works in browser and Node.js.
 */

// ============================================
// Protocol Presets
// ============================================

const PROTOCOLS = {
    "generic": {
        "id": "generic",
        "name": "Generic / Mixed",
        "description": "Default balanced profile for mixed workloads. Use when traffic patterns are unknown or varied.",
        "icon": "📊",
        "category": "general",
        "avgRequestSizeKB": 2,
        "avgResponseSizeKB": 16,
        "typicalRequestsPerSec": 2,
        "isDefault": true
    },
    "http": {
        "id": "http",
        "name": "HTTP/HTTPS (Web Browsing)",
        "description": "Standard web traffic including HTML, CSS, JavaScript, and mixed media content. Typical intranet portals and web applications.",
        "icon": "🌐",
        "category": "web",
        "avgRequestSizeKB": 2,
        "avgResponseSizeKB": 50,
        "typicalRequestsPerSec": 3
    },
    "rest-api": {
        "id": "rest-api",
        "name": "REST API / Microservices",
        "description": "JSON/XML payloads for application integrations, microservices, and backend API calls.",
        "icon": "🔌",
        "category": "web",
        "avgRequestSizeKB": 1,
        "avgResponseSizeKB": 8,
        "typicalRequestsPerSec": 6
    },
    "smb": {
        "id": "smb",
        "name": "SMB (File Shares)",
        "description": "Windows file share access, document reads/writes, typical enterprise NAS and file server operations.",
        "icon": "📁",
        "category": "file",
        "avgRequestSizeKB": 4,
        "avgResponseSizeKB": 64,
        "typicalRequestsPerSec": 1.5
    },
    "rdp": {
        "id": "rdp",
        "name": "RDP (Remote Desktop)",
        "description": "Remote desktop sessions with screen updates, mouse/keyboard input, and clipboard data.",
        "icon": "🖥️",
        "category": "remote",
        "avgRequestSizeKB": 0.5,
        "avgResponseSizeKB": 32,
        "typicalRequestsPerSec": 15
    },
    "ssh": {
        "id": "ssh",
        "name": "SSH (Secure Shell)",
        "description": "Terminal sessions, command-line access, low bandwidth interactive use for server administration.",
        "icon": "💻",
        "category": "remote",
        "avgRequestSizeKB": 0.2,
        "avgResponseSizeKB": 1,
        "typicalRequestsPerSec": 8
    },
    "sql": {
        "id": "sql",
        "name": "SQL / Database",
        "description": "Database queries and result sets for SQL Server, MySQL, PostgreSQL, and other RDBMS systems.",
        "icon": "🗄️",
        "category": "database",
        "avgRequestSizeKB": 2,
        "avgResponseSizeKB": 32,
        "typicalRequestsPerSec": 4
    },
    "ad-admin": {
        "id": "ad-admin",
        "name": "AD Admin Traffic",
        "description": "Active Directory administrative operations: RDP sessions to domain controllers, LDAP queries, Kerberos ticket management, DNS administration, and Group Policy management.",
        "icon": "🛡️",
        "category": "directory",
        "avgRequestSizeKB": 1,
        "avgResponseSizeKB": 16,
        "typicalRequestsPerSec": 8
    },
    "ad-user": {
        "id": "ad-user",
        "name": "AD User Traffic",
        "description": "Active Directory end-user operations: Kerberos authentication and service ticket renewal, Group Policy processing (GPO), LDAP user/group lookups, and logon script execution.",
        "icon": "👤",
        "category": "directory",
        "avgRequestSizeKB": 0.5,
        "avgResponseSizeKB": 4,
        "typicalRequestsPerSec": 3
    }
};

const PROTOCOL_CATEGORIES = {
    "general": { "name": "General", "order": 1 },
    "web": { "name": "Web & API", "order": 2 },
    "file": { "name": "File Transfer", "order": 3 },
    "remote": { "name": "Remote Access", "order": 4 },
    "database": { "name": "Database", "order": 5 },
    "directory": { "name": "Active Directory", "order": 6 }
};

// ============================================
// CPU Presets
// ============================================

const CPU_PRESETS = [
    {
        "id": "xeon-e5-v3",
        "name": "Intel Xeon E5-v3 (2014 baseline)",
        "vendor": "Intel",
        "generation": "3rd Gen",
        "year": 2014,
        "coresPerServer": 24,
        "cpuPerfMultiplier": 1.00
    },
    {
        "id": "epyc-rome",
        "name": "AMD EPYC Rome (2nd Gen, 2019)",
        "vendor": "AMD",
        "generation": "2nd Gen",
        "year": 2019,
        "coresPerServer": 64,
        "cpuPerfMultiplier": 1.00
    },
    {
        "id": "epyc-milan",
        "name": "AMD EPYC Milan (3rd Gen, 2021)",
        "vendor": "AMD",
        "generation": "3rd Gen",
        "year": 2021,
        "coresPerServer": 64,
        "cpuPerfMultiplier": 1.22
    },
    {
        "id": "xeon-platinum-8380",
        "name": "Intel Xeon Platinum 8380 (Ice Lake, 3rd Gen, 2021)",
        "vendor": "Intel",
        "generation": "3rd Gen",
        "year": 2021,
        "coresPerServer": 80,
        "cpuPerfMultiplier": 1.54
    },
    {
        "id": "xeon-sapphire-rapids",
        "name": "Intel Xeon Sapphire Rapids (4th Gen, 2023)",
        "vendor": "Intel",
        "generation": "4th Gen",
        "year": 2023,
        "coresPerServer": 112,
        "cpuPerfMultiplier": 1.54
    },
    {
        "id": "xeon-gold-6548y",
        "name": "Intel Xeon Gold 6548Y+ (Emerald Rapids, 5th Gen, 2024)",
        "vendor": "Intel",
        "generation": "5th Gen",
        "year": 2024,
        "coresPerServer": 64,
        "cpuPerfMultiplier": 1.59,
        "isDefault": true
    },
    {
        "id": "epyc-genoa",
        "name": "AMD EPYC Genoa (4th Gen, 2022)",
        "vendor": "AMD",
        "generation": "4th Gen",
        "year": 2022,
        "coresPerServer": 96,
        "cpuPerfMultiplier": 1.85
    },
    {
        "id": "xeon-granite-rapids",
        "name": "Intel Xeon 6 (Granite Rapids, 6th Gen, 2024)",
        "vendor": "Intel",
        "generation": "6th Gen",
        "year": 2024,
        "coresPerServer": 128,
        "cpuPerfMultiplier": 1.75
    },
    {
        "id": "epyc-genoa-x",
        "name": "AMD EPYC Genoa-X (4th Gen w/ 3D V-Cache, 2023)",
        "vendor": "AMD",
        "generation": "4th Gen",
        "year": 2023,
        "coresPerServer": 96,
        "cpuPerfMultiplier": 2.00
    }
];

// ============================================
// Deployment Type Presets
// ============================================

const DEPLOYMENT_TYPES = [
    {
        "id": "bare-metal",
        "name": "Bare Metal (Physical Server)",
        "description": "Direct hardware deployment with no virtualization overhead",
        "icon": "🖥️",
        "virtCpuOverhead": 0,
        "virtMemoryOverhead": 0,
        "virtNetworkOverhead": 0,
        "isDefault": true
    },
    {
        "id": "on-prem-vm",
        "name": "On-Premises VM (Hyper-V, VMware, KVM)",
        "description": "Traditional on-premises virtualization with moderate overhead",
        "icon": "🏢",
        "virtCpuOverhead": 8,
        "virtMemoryOverhead": 4,
        "virtNetworkOverhead": 15
    },
    {
        "id": "cloud",
        "name": "Cloud VM (Azure, AWS, GCP)",
        "description": "Cloud-hosted virtual machines with typical virtualization overhead",
        "icon": "☁️",
        "virtCpuOverhead": 6,
        "virtMemoryOverhead": 4,
        "virtNetworkOverhead": 10
    }
];

// ============================================
// NIC Speed Presets
// ============================================

const NIC_SPEEDS = [
    {
        "id": "1g",
        "name": "1 Gbps",
        "speedMbps": 1024,
        "icon": "🔵",
        "isDefault": true
    },
    {
        "id": "2.5g",
        "name": "2.5 Gbps",
        "speedMbps": 2560,
        "icon": "🔵"
    },
    {
        "id": "5g",
        "name": "5 Gbps",
        "speedMbps": 5000,
        "icon": "🔵"
    },
    {
        "id": "10g",
        "name": "10 Gbps",
        "speedMbps": 10000,
        "icon": "🟢"
    },
    {
        "id": "25g",
        "name": "25 Gbps",
        "speedMbps": 25000,
        "icon": "🟢"
    },
    {
        "id": "40g",
        "name": "40 Gbps",
        "speedMbps": 40000,
        "icon": "🟡"
    },
    {
        "id": "100g",
        "name": "100 Gbps",
        "speedMbps": 100000,
        "icon": "🟠"
    }
];

// ============================================
// Workload Profile Presets
// ============================================

const WORKLOAD_PROFILES = [
    {
        "id": "very-light",
        "name": "Very Light",
        "description": "Very low traffic workload for pilot programs or minimal deployments",
        "totalUsers": 5000,
        "concurrentUserRatio": 0.3,
        "icon": "⚪"
    },
    {
        "id": "light",
        "name": "Light",
        "description": "Low traffic workload suitable for small deployments or pilot programs",
        "totalUsers": 10000,
        "concurrentUserRatio": 0.3,
        "icon": "🟢"
    },
    {
        "id": "medium",
        "name": "Medium",
        "description": "Moderate traffic workload for typical enterprise deployments",
        "totalUsers": 50000,
        "concurrentUserRatio": 0.3,
        "icon": "🟡",
        "isDefault": true
    },
    {
        "id": "heavy",
        "name": "Heavy",
        "description": "High traffic workload for large-scale enterprise environments",
        "totalUsers": 100000,
        "concurrentUserRatio": 0.3,
        "icon": "🟠"
    },
    {
        "id": "very-heavy",
        "name": "Very Heavy",
        "description": "Maximum traffic workload for high-demand enterprise scenarios",
        "totalUsers": 200000,
        "concurrentUserRatio": 0.3,
        "icon": "🔴"
    }
];

// ============================================
// Public API - Getter Functions
// ============================================

/**
 * Get all protocol presets
 * @returns {Object} Protocol presets object (keyed by protocol ID)
 */
function getProtocols() {
    return PROTOCOLS;
}

/**
 * Get a specific protocol by ID
 * @param {string} id - Protocol ID
 * @returns {Object|null} Protocol object or null if not found
 */
function getProtocol(id) {
    return PROTOCOLS[id] || null;
}

/**
 * Get default protocol
 * @returns {Object} Default protocol object
 */
function getDefaultProtocol() {
    return PROTOCOLS['generic'];
}

/**
 * Get protocol categories
 * @returns {Object} Protocol categories object
 */
function getProtocolCategories() {
    return PROTOCOL_CATEGORIES;
}

/**
 * Get all CPU presets
 * @returns {Array} Array of CPU preset objects
 */
function getCPUPresets() {
    return CPU_PRESETS;
}

/**
 * Get a specific CPU preset by ID
 * @param {string} id - CPU preset ID
 * @returns {Object|null} CPU preset object or null if not found
 */
function getCPUPreset(id) {
    return CPU_PRESETS.find(cpu => cpu.id === id) || null;
}

/**
 * Get default CPU preset
 * @returns {Object} Default CPU preset object
 */
function getDefaultCPUPreset() {
    return CPU_PRESETS.find(cpu => cpu.isDefault) || CPU_PRESETS[0];
}

/**
 * Get all deployment type presets
 * @returns {Array} Array of deployment type objects
 */
function getDeploymentTypes() {
    return DEPLOYMENT_TYPES;
}

/**
 * Get a specific deployment type by ID
 * @param {string} id - Deployment type ID
 * @returns {Object|null} Deployment type object or null if not found
 */
function getDeploymentType(id) {
    return DEPLOYMENT_TYPES.find(dt => dt.id === id) || null;
}

/**
 * Get default deployment type
 * @returns {Object} Default deployment type object
 */
function getDefaultDeploymentType() {
    return DEPLOYMENT_TYPES.find(dt => dt.isDefault) || DEPLOYMENT_TYPES[0];
}

/**
 * Get all NIC speed presets
 * @returns {Array} Array of NIC speed objects
 */
function getNICSpeeds() {
    return NIC_SPEEDS;
}

/**
 * Get a specific NIC speed by ID
 * @param {string} id - NIC speed ID
 * @returns {Object|null} NIC speed object or null if not found
 */
function getNICSpeed(id) {
    return NIC_SPEEDS.find(nic => nic.id === id) || null;
}

/**
 * Get default NIC speed
 * @returns {Object} Default NIC speed object
 */
function getDefaultNICSpeed() {
    return NIC_SPEEDS.find(nic => nic.isDefault) || NIC_SPEEDS[0];
}

/**
 * Get all workload profile presets
 * @returns {Array} Array of workload profile objects
 */
function getWorkloadProfiles() {
    return WORKLOAD_PROFILES;
}

/**
 * Get a specific workload profile by ID
 * @param {string} id - Workload profile ID
 * @returns {Object|null} Workload profile object or null if not found
 */
function getWorkloadProfile(id) {
    return WORKLOAD_PROFILES.find(wp => wp.id === id) || null;
}

/**
 * Get default workload profile
 * @returns {Object} Default workload profile object
 */
function getDefaultWorkloadProfile() {
    return WORKLOAD_PROFILES.find(wp => wp.isDefault) || WORKLOAD_PROFILES[0];
}

/**
 * Get all presets (convenience function)
 * @returns {Object} Object containing all preset categories
 */
function getAllPresets() {
    return {
        protocols: PROTOCOLS,
        protocolCategories: PROTOCOL_CATEGORIES,
        cpuPresets: CPU_PRESETS,
        deploymentTypes: DEPLOYMENT_TYPES,
        nicSpeeds: NIC_SPEEDS,
        workloadProfiles: WORKLOAD_PROFILES
    };
}

// ============================================
// Universal Export (Browser + Node.js)
// ============================================

if (typeof window !== 'undefined') {
    // Browser: attach to window
    window.presetLoader = {
        getProtocols,
        getProtocol,
        getDefaultProtocol,
        getProtocolCategories,
        getCPUPresets,
        getCPUPreset,
        getDefaultCPUPreset,
        getDeploymentTypes,
        getDeploymentType,
        getDefaultDeploymentType,
        getNICSpeeds,
        getNICSpeed,
        getDefaultNICSpeed,
        getWorkloadProfiles,
        getWorkloadProfile,
        getDefaultWorkloadProfile,
        getAllPresets
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js: use CommonJS exports
    module.exports = {
        getProtocols,
        getProtocol,
        getDefaultProtocol,
        getProtocolCategories,
        getCPUPresets,
        getCPUPreset,
        getDefaultCPUPreset,
        getDeploymentTypes,
        getDeploymentType,
        getDefaultDeploymentType,
        getNICSpeeds,
        getNICSpeed,
        getDefaultNICSpeed,
        getWorkloadProfiles,
        getWorkloadProfile,
        getDefaultWorkloadProfile,
        getAllPresets
    };
}
