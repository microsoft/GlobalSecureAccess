/**
 * Schema Loader Module
 * Provides schema and preset data for the GSA Private Access Sizing Planner
 * Single source of truth for all schema-driven UI components
 */

(function(global) {
    'use strict';

    // ============================================
    // Embedded Schema (from ConfigPresets/schema.json)
    // ============================================
    const schema = {
        "version": "1.0.0",
        "description": "Calculation attributes schema for GSA Private Access Sizing Planner",
        "categories": [
            {
                "id": "workload",
                "name": "Workload Profile",
                "order": 1,
                "subCategories": [
                    { "id": "userload", "name": "User Load", "order": 1 },
                    { "id": "protocol", "name": "Protocol", "order": 2 }
                ]
            },
            {
                "id": "server",
                "name": "Server Configuration",
                "order": 2,
                "subCategories": [
                    { "id": "deployment", "name": "Deployment Type", "order": 1 },
                    { "id": "cpu", "name": "CPU", "order": 2 },
                    { "id": "memory", "name": "Memory", "order": 3 },
                    { "id": "nic", "name": "NIC", "order": 4 }
                ]
            }
        ],
        "presets": [
            { "id": "workloadProfiles", "name": "Company Size (Users)", "file": "workloadProfiles.json", "category": "workload", "subCategory": "userload" },
            { "id": "protocols", "name": "Protocol Profiles", "file": "protocols.json", "category": "workload", "subCategory": "protocol" },
            { "id": "deploymentTypes", "name": "Deployment Types", "file": "deploymentTypes.json", "category": "server", "subCategory": "deployment" },
            { "id": "cpuModels", "name": "CPU Models", "file": "cpu.json", "category": "server", "subCategory": "cpu" },
            { "id": "nicSpeeds", "name": "NIC Speeds", "file": "nic.json", "category": "server", "subCategory": "nic" }
        ],
        "attributes": [
            { "id": "coresPerServer", "name": "Cores per Server", "category": "server", "subCategory": "cpu", "type": "number", "default": 64, "min": 1, "max": 256, "unit": "cores", "advanced": true, "description": "Physical CPU cores per server" },
            { "id": "cpuPerfMultiplier", "name": "CPU Performance Multiplier", "category": "server", "subCategory": "cpu", "type": "number", "default": 1.59, "min": 0.5, "max": 3.0, "step": 0.01, "unit": "x", "advanced": true, "description": "Performance factor vs baseline (1.0 = Intel Xeon E5-v3 2014)" },
            { "id": "memoryGB", "name": "Memory", "category": "server", "subCategory": "memory", "type": "number", "default": 16, "min": 1, "max": 1024, "unit": "GB", "advanced": false, "description": "RAM per server in gigabytes" },
            { "id": "cpuCapacityPerCore", "name": "CPU Capacity per Core", "category": "server", "subCategory": "cpu", "type": "number", "default": 85, "min": 1, "max": 100, "unit": "%", "advanced": true, "description": "Usable capacity per core - accounts for OS overhead" },
            { "id": "expectedConcurrentUsers", "name": "Expected Concurrent Users", "category": "workload", "subCategory": "userload", "type": "number", "default": 50000, "min": 100, "unit": "users", "advanced": true, "description": "Number of users active simultaneously at peak" },
            { "id": "growthRate", "name": "Annual Growth Rate", "category": "workload", "subCategory": "userload", "type": "number", "default": 10, "min": 0, "max": 100, "unit": "%", "advanced": true, "description": "Annual growth rate for 5-year projection" },
            { "id": "cpuCostPer1000", "name": "CPU Cost per 1000 Users", "category": "workload", "subCategory": "userload", "type": "number", "default": 5, "min": 1, "max": 50, "unit": "%", "advanced": true, "description": "CPU cost per 1000 concurrent users" },
            { "id": "memoryCostPer1000", "name": "Memory per 1000 Users", "category": "workload", "subCategory": "userload", "type": "number", "default": 1024, "min": 100, "max": 10000, "unit": "MB", "advanced": true, "description": "Memory consumption per 1000 users" },
            { "id": "baseIdleMemory", "name": "Base Idle Memory", "category": "server", "subCategory": "memory", "type": "number", "default": 512, "min": 0, "max": 4096, "unit": "MB", "advanced": true, "description": "Baseline memory for OS and connector service" },
            { "id": "requestsPerUser", "name": "Requests per User/sec", "category": "workload", "subCategory": "protocol", "type": "number", "default": 2, "min": 0.1, "max": 100, "step": 0.1, "unit": "req/s", "advanced": true, "description": "Average requests per user per second" },
            { "id": "avgRequestSize", "name": "Avg Request Size", "category": "workload", "subCategory": "protocol", "type": "number", "default": 2, "min": 0.1, "max": 1000, "step": 0.1, "unit": "KB", "advanced": true, "description": "Average request payload size" },
            { "id": "avgResponseSize", "name": "Avg Response Size", "category": "workload", "subCategory": "protocol", "type": "number", "default": 16, "min": 0.1, "max": 10000, "step": 0.1, "unit": "KB", "advanced": true, "description": "Average response payload size" },
            { "id": "targetNicUtil", "name": "Target NIC Utilization", "category": "server", "subCategory": "nic", "type": "number", "default": 80, "min": 1, "max": 100, "unit": "%", "advanced": true, "description": "Target NIC utilization - headroom for bursts" },
            { "id": "nicLinkSpeed", "name": "NIC Speed", "category": "server", "subCategory": "nic", "type": "number", "default": 1024, "unit": "Mbps", "advanced": true, "description": "NIC speed in Mbps (1024=1Gbps, 10240=10Gbps)" },
            { "id": "nicOffloads", "name": "NIC Offloads Enabled", "category": "server", "subCategory": "nic", "type": "boolean", "default": true, "advanced": true, "description": "Enable NIC offload features (RSS, TSO, LRO)" },
            { "id": "nicCpuReduction", "name": "NIC CPU Reduction", "category": "server", "subCategory": "nic", "type": "number", "default": 30, "min": 0, "max": 100, "unit": "%", "advanced": true, "description": "CPU reduction when NIC offloads enabled" },
            { "id": "mtuPayload", "name": "MTU Payload", "category": "server", "subCategory": "nic", "type": "number", "default": 1460, "min": 500, "max": 9000, "unit": "bytes", "advanced": true, "description": "MTU payload bytes (1500 MTU - 40 bytes headers)" },
            { "id": "packetProcCost", "name": "Packet Proc Cost", "category": "workload", "subCategory": "protocol", "type": "number", "default": 0.02, "min": 0.001, "max": 0.1, "step": 0.001, "unit": "cores/1k pps", "advanced": true, "description": "CPU cores per 1000 packets per second" },
            { "id": "protocolOverhead", "name": "Protocol Overhead", "category": "workload", "subCategory": "protocol", "type": "number", "default": 6, "min": 0, "max": 50, "unit": "%", "advanced": true, "description": "Additional overhead from encryption/framing" },
            { "id": "virtCpuOverhead", "name": "Virtualization CPU Overhead", "category": "server", "subCategory": "deployment", "type": "number", "default": 0, "min": 0, "max": 50, "unit": "%", "advanced": true, "description": "Hypervisor CPU overhead - reduces effective cores" },
            { "id": "virtMemoryOverhead", "name": "Virtualization Memory Overhead", "category": "server", "subCategory": "deployment", "type": "number", "default": 0, "min": 0, "max": 50, "unit": "%", "advanced": true, "description": "Hypervisor memory reservation" },
            { "id": "virtNetworkOverhead", "name": "Virtualization Network Overhead", "category": "server", "subCategory": "deployment", "type": "number", "default": 0, "min": 0, "max": 50, "unit": "%", "advanced": true, "description": "Virtual NIC overhead - reduces effective bandwidth" },
            { "id": "numberOfApps", "name": "Number of Apps", "category": "workload", "subCategory": "userload", "type": "number", "default": 1, "min": 1, "max": 100, "unit": "apps", "advanced": true, "description": "Number of private apps accessed" },
            { "id": "appRequestMultiplier", "name": "App Request Multiplier", "category": "workload", "subCategory": "protocol", "type": "number", "default": 0.02, "min": 0, "max": 0.1, "step": 0.01, "advanced": true, "description": "Request rate increase per additional app" }
        ]
    };

    // ============================================
    // Embedded Presets (from ConfigPresets/*.json files)
    // ============================================
    const presets = {
        "workloadProfiles": {
            "version": "1.0.0",
            "profiles": [
                { "id": "very-light", "name": "Very Light", "description": "Very low traffic workload", "totalUsers": 5000, "concurrentUserRatio": 0.3, "icon": "⚪" },
                { "id": "light", "name": "Light", "description": "Low traffic workload", "totalUsers": 10000, "concurrentUserRatio": 0.3, "icon": "🟢" },
                { "id": "medium", "name": "Medium", "description": "Moderate traffic workload", "totalUsers": 50000, "concurrentUserRatio": 0.3, "icon": "🟡", "isDefault": true },
                { "id": "heavy", "name": "Heavy", "description": "High traffic workload", "totalUsers": 100000, "concurrentUserRatio": 0.3, "icon": "🟠" },
                { "id": "very-heavy", "name": "Very Heavy", "description": "Maximum traffic workload", "totalUsers": 200000, "concurrentUserRatio": 0.3, "icon": "🔴" }
            ]
        },
        "protocols": {
            "version": "1.0.0",
            "protocols": {
                "generic": { "id": "generic", "name": "Generic / Mixed", "icon": "📊", "avgRequestSizeKB": 2, "avgResponseSizeKB": 16, "typicalRequestsPerSec": 2, "isDefault": true },
                "http": { "id": "http", "name": "HTTP/HTTPS (Web Browsing)", "icon": "🌐", "avgRequestSizeKB": 2, "avgResponseSizeKB": 50, "typicalRequestsPerSec": 3 },
                "rest-api": { "id": "rest-api", "name": "REST API / Microservices", "icon": "🔌", "avgRequestSizeKB": 1, "avgResponseSizeKB": 8, "typicalRequestsPerSec": 6 },
                "smb": { "id": "smb", "name": "SMB (File Shares)", "icon": "📁", "avgRequestSizeKB": 4, "avgResponseSizeKB": 64, "typicalRequestsPerSec": 1.5 },
                "rdp": { "id": "rdp", "name": "RDP (Remote Desktop)", "icon": "🖥️", "avgRequestSizeKB": 0.5, "avgResponseSizeKB": 32, "typicalRequestsPerSec": 15 },
                "ssh": { "id": "ssh", "name": "SSH (Secure Shell)", "icon": "💻", "avgRequestSizeKB": 0.2, "avgResponseSizeKB": 1, "typicalRequestsPerSec": 8 },
                "sql": { "id": "sql", "name": "SQL / Database", "icon": "🗄️", "avgRequestSizeKB": 2, "avgResponseSizeKB": 32, "typicalRequestsPerSec": 4 },
                "ad-admin": { "id": "ad-admin", "name": "AD Admin Traffic", "icon": "🛡️", "avgRequestSizeKB": 1, "avgResponseSizeKB": 16, "typicalRequestsPerSec": 8 },
                "ad-user": { "id": "ad-user", "name": "AD User Traffic", "icon": "👤", "avgRequestSizeKB": 0.5, "avgResponseSizeKB": 4, "typicalRequestsPerSec": 3 }
            }
        },
        "deploymentTypes": {
            "version": "1.0.0",
            "deploymentTypes": [
                { "id": "bare-metal", "name": "Bare Metal (Physical Server)", "icon": "🖥️", "virtCpuOverhead": 0, "virtMemoryOverhead": 0, "virtNetworkOverhead": 0, "isDefault": true },
                { "id": "on-prem-vm", "name": "On-Premises VM (Hyper-V, VMware, KVM)", "icon": "🏢", "virtCpuOverhead": 8, "virtMemoryOverhead": 4, "virtNetworkOverhead": 15 },
                { "id": "cloud", "name": "Cloud VM (Azure, AWS, GCP)", "icon": "☁️", "virtCpuOverhead": 6, "virtMemoryOverhead": 4, "virtNetworkOverhead": 10 }
            ]
        },
        "cpuModels": {
            "version": "1.0.0",
            "cpuPresets": [
                { "id": "xeon-e5-v3", "name": "Intel Xeon E5-v3 (2014, Legacy Baseline)", "coresPerServer": 24, "cpuPerfMultiplier": 1.00 },
                { "id": "epyc-rome", "name": "AMD EPYC Rome (2nd Gen, 2019)", "coresPerServer": 64, "cpuPerfMultiplier": 1.00 },
                { "id": "epyc-milan", "name": "AMD EPYC Milan (3rd Gen, 2021)", "coresPerServer": 64, "cpuPerfMultiplier": 1.22 },
                { "id": "xeon-platinum-8380", "name": "Intel Xeon Platinum 8380 (Ice Lake, 3rd Gen, 2021)", "coresPerServer": 80, "cpuPerfMultiplier": 1.54 },
                { "id": "xeon-sapphire-rapids", "name": "Intel Xeon Sapphire Rapids (4th Gen, 2023)", "coresPerServer": 112, "cpuPerfMultiplier": 1.54 },
                { "id": "xeon-gold-6548y", "name": "Intel Xeon Gold 6548Y+ (Emerald Rapids, 5th Gen, 2024)", "coresPerServer": 64, "cpuPerfMultiplier": 1.59, "isDefault": true },
                { "id": "epyc-genoa", "name": "AMD EPYC Genoa (4th Gen, 2022)", "coresPerServer": 96, "cpuPerfMultiplier": 1.85 },
                { "id": "xeon-granite-rapids", "name": "Intel Xeon 6 (Granite Rapids, 6th Gen, 2024)", "coresPerServer": 128, "cpuPerfMultiplier": 1.75 },
                { "id": "epyc-genoa-x", "name": "AMD EPYC Genoa-X (4th Gen w/ 3D V-Cache, 2023)", "coresPerServer": 96, "cpuPerfMultiplier": 2.00 },
                { "id": "epyc-turin", "name": "AMD EPYC Turin (5th Gen, 2024)", "coresPerServer": 192, "cpuPerfMultiplier": 2.15 },
                { "id": "ampere-altra-max", "name": "Ampere Altra Max (ARM, 2022)", "coresPerServer": 192, "cpuPerfMultiplier": 1.80 },
                { "id": "ampere-ampereone", "name": "Ampere AmpereOne (ARM, 2023)", "coresPerServer": 192, "cpuPerfMultiplier": 1.95 }
            ]
        },
        "nicSpeeds": {
            "version": "1.0.0",
            "nicSpeeds": [
                { "id": "1g", "name": "1 Gbps", "speedMbps": 1024, "icon": "🔵", "isDefault": true },
                { "id": "2.5g", "name": "2.5 Gbps", "speedMbps": 2560, "icon": "🔵" },
                { "id": "5g", "name": "5 Gbps", "speedMbps": 5000, "icon": "🔵" },
                { "id": "10g", "name": "10 Gbps", "speedMbps": 10000, "icon": "🟢" },
                { "id": "25g", "name": "25 Gbps", "speedMbps": 25000, "icon": "🟢" },
                { "id": "40g", "name": "40 Gbps", "speedMbps": 40000, "icon": "🟡" },
                { "id": "100g", "name": "100 Gbps", "speedMbps": 100000, "icon": "🟠" }
            ]
        }
    };

    // ============================================
    // Public API
    // ============================================

    /**
     * Get the schema definition
     * @returns {Object} The schema object
     */
    function getSchema() {
        return schema;
    }

    /**
     * Get all presets
     * @returns {Object} All preset data
     */
    function getPresets() {
        return presets;
    }

    /**
     * Get a specific preset by ID
     * @param {string} presetId - The preset ID (e.g., 'workloadProfiles', 'protocols')
     * @returns {Object|null} The preset data or null if not found
     */
    function getPreset(presetId) {
        return presets[presetId] || null;
    }

    /**
     * Get options array from preset data (handles different preset structures)
     * @param {Object} presetData - The preset data object
     * @returns {Array} Array of options
     */
    function getPresetOptions(presetData) {
        if (!presetData) return [];
        if (presetData.profiles) return presetData.profiles;
        if (presetData.cpuPresets) return presetData.cpuPresets;
        if (presetData.deploymentTypes) return presetData.deploymentTypes;
        if (presetData.nicSpeeds) return presetData.nicSpeeds;
        if (presetData.protocols) return Object.values(presetData.protocols);
        return [];
    }

    /**
     * Get options for a preset by ID
     * @param {string} presetId - The preset ID
     * @returns {Array} Array of options
     */
    function getPresetOptionsById(presetId) {
        const presetData = getPreset(presetId);
        return getPresetOptions(presetData);
    }

    /**
     * Get default values from schema attributes
     * @returns {Object} Object with attribute IDs as keys and default values
     */
    function getDefaultInputs() {
        const defaults = {};
        for (const attr of schema.attributes) {
            defaults[attr.id] = attr.default;
        }
        return defaults;
    }

    /**
     * Get an attribute definition by ID
     * @param {string} attrId - The attribute ID
     * @returns {Object|null} The attribute definition or null
     */
    function getAttribute(attrId) {
        return schema.attributes.find(a => a.id === attrId) || null;
    }

    /**
     * Get attributes for a specific category and subcategory
     * @param {string} categoryId - The category ID
     * @param {string} subCategoryId - The subcategory ID
     * @returns {Array} Array of attribute definitions
     */
    function getAttributesFor(categoryId, subCategoryId) {
        return schema.attributes.filter(a => 
            a.category === categoryId && a.subCategory === subCategoryId
        );
    }

    /**
     * Get preset definition for a category and subcategory
     * @param {string} categoryId - The category ID
     * @param {string} subCategoryId - The subcategory ID
     * @returns {Object|null} The preset definition or null
     */
    function getPresetFor(categoryId, subCategoryId) {
        return schema.presets.find(p => 
            p.category === categoryId && p.subCategory === subCategoryId
        ) || null;
    }

    /**
     * Map preset values to input field IDs
     * @param {string} presetId - The preset ID
     * @param {Object} selectedOption - The selected preset option
     * @returns {Object} Object mapping attribute IDs to values
     */
    function mapPresetToInputs(presetId, selectedOption) {
        const mappings = {};
        
        if (!selectedOption) return mappings;
        
        // Workload profiles - calculate concurrent users from total users × ratio
        if (selectedOption.totalUsers !== undefined && selectedOption.concurrentUserRatio !== undefined) {
            mappings['expectedConcurrentUsers'] = Math.round(
                selectedOption.totalUsers * selectedOption.concurrentUserRatio
            );
        }
        
        // CPU presets
        if (selectedOption.coresPerServer !== undefined) {
            mappings['coresPerServer'] = selectedOption.coresPerServer;
        }
        if (selectedOption.cpuPerfMultiplier !== undefined) {
            mappings['cpuPerfMultiplier'] = selectedOption.cpuPerfMultiplier;
        }
        
        // Deployment types
        if (selectedOption.virtCpuOverhead !== undefined) {
            mappings['virtCpuOverhead'] = selectedOption.virtCpuOverhead;
        }
        if (selectedOption.virtMemoryOverhead !== undefined) {
            mappings['virtMemoryOverhead'] = selectedOption.virtMemoryOverhead;
        }
        if (selectedOption.virtNetworkOverhead !== undefined) {
            mappings['virtNetworkOverhead'] = selectedOption.virtNetworkOverhead;
        }
        
        // NIC speeds
        if (selectedOption.speedMbps !== undefined) {
            mappings['nicLinkSpeed'] = selectedOption.speedMbps;
        }
        
        // Protocols
        if (selectedOption.avgRequestSizeKB !== undefined) {
            mappings['avgRequestSize'] = selectedOption.avgRequestSizeKB;
        }
        if (selectedOption.avgResponseSizeKB !== undefined) {
            mappings['avgResponseSize'] = selectedOption.avgResponseSizeKB;
        }
        if (selectedOption.typicalRequestsPerSec !== undefined) {
            mappings['requestsPerUser'] = selectedOption.typicalRequestsPerSec;
        }
        
        return mappings;
    }

    // Export to global scope
    global.schemaLoader = {
        getSchema,
        getPresets,
        getPreset,
        getPresetOptions,
        getPresetOptionsById,
        getDefaultInputs,
        getAttribute,
        getAttributesFor,
        getPresetFor,
        mapPresetToInputs
    };

})(typeof window !== 'undefined' ? window : this);
