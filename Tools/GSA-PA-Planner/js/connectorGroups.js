/**
 * GSA Private Access Sizing Planner - Connector Group Management
 * 
 * Handles CRUD operations for connector groups and data persistence
 */

// ============================================
// Data Structures and Storage
// ============================================

const STORAGE_KEY = 'gsa-capacity-planner-connector-groups';
const LEGACY_STORAGE_KEY = 'gsa-capacity-planner-segments'; // For migration
const CONFIG_STORAGE_KEY = 'gsa-capacity-planner-config';

// Traffic load to workload mapping
const trafficLoadMapping = {
    "Light": { expectedConcurrentUsers: 10000, requestsPerUser: 1 },
    "Medium": { expectedConcurrentUsers: 50000, requestsPerUser: 1 },
    "Heavy": { expectedConcurrentUsers: 100000, requestsPerUser: 1 },
    "Very Heavy": { expectedConcurrentUsers: 200000, requestsPerUser: 1 },
    "Custom": { expectedConcurrentUsers: null, requestsPerUser: null }
};

// CPU Presets (same as app.js)
const cpuPresetsMulti = {
    "Intel Xeon E5-v3 (2014 baseline)": { coresPerServer: 24, cpuPerfMultiplier: 1.00, memoryGB: 16 },
    "AMD EPYC Rome (2nd Gen, 2019)": { coresPerServer: 64, cpuPerfMultiplier: 1.00, memoryGB: 16 },
    "AMD EPYC Milan (3rd Gen, 2021)": { coresPerServer: 64, cpuPerfMultiplier: 1.22, memoryGB: 16 },
    "Intel Xeon Platinum 8380 (Ice Lake, 3rd Gen, 2021)": { coresPerServer: 80, cpuPerfMultiplier: 1.54, memoryGB: 16 },
    "Intel Xeon Sapphire Rapids (4th Gen, 2023)": { coresPerServer: 112, cpuPerfMultiplier: 1.54, memoryGB: 16 },
    "Intel Xeon Gold 6548Y+ (Emerald Rapids, 5th Gen, 2024)": { coresPerServer: 64, cpuPerfMultiplier: 1.59, memoryGB: 16 },
    "AMD EPYC Genoa (4th Gen, 2022)": { coresPerServer: 96, cpuPerfMultiplier: 1.85, memoryGB: 16 },
    "Intel Xeon 6 (Granite Rapids, 6th Gen, 2024)": { coresPerServer: 128, cpuPerfMultiplier: 1.75, memoryGB: 16 },
    "AMD EPYC Genoa-X (4th Gen w/ 3D V-Cache, 2023)": { coresPerServer: 96, cpuPerfMultiplier: 2.00, memoryGB: 16 }
};

// Deployment types (same as app.js)
const deploymentTypesMulti = {
    "bare-metal": { 
        label: "Bare Metal (Physical Server)", 
        virtCpuOverhead: 0, 
        virtMemoryOverhead: 0, 
        virtNetworkOverhead: 0 
    },
    "on-prem-vm": { 
        label: "On-Premises VM (Hyper-V, VMware, KVM)", 
        virtCpuOverhead: 8, 
        virtMemoryOverhead: 4, 
        virtNetworkOverhead: 15 
    },
    "cloud": { 
        label: "Cloud VM (Azure, AWS, GCP)", 
        virtCpuOverhead: 6, 
        virtMemoryOverhead: 4, 
        virtNetworkOverhead: 10 
    }
};

// ============================================
// ConnectorGroup Class
// ============================================

class ConnectorGroup {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.region = data.region || '';
        this.location = data.location || '';
        this.numberOfApps = data.numberOfApps || 10;
        this.trafficLoad = data.trafficLoad || 'Medium';
        this.expectedConcurrentUsers = data.expectedConcurrentUsers || 50000;
        this.totalUsers = data.totalUsers || Math.round((data.expectedConcurrentUsers || 50000) / 0.3);
        this.requestsPerUser = data.requestsPerUser || 2;
        this.overrideServerConfig = data.overrideServerConfig || false;
        this.serverConfig = data.serverConfig || null;
        this.results = data.results || null;
        // Per-group settings persisted for re-edit
        this.growthRate = data.growthRate || 10;
        this.cpuCostPer1000 = data.cpuCostPer1000 || 44.5;
        this.memoryCostPer1000 = data.memoryCostPer1000 || 512;
        this.avgRequestSizeKB = data.avgRequestSizeKB || 2;
        this.avgResponseSizeKB = data.avgResponseSizeKB || 16;
        this.packetProcCost = data.packetProcCost || 0.02;
        this.protocolOverhead = data.protocolOverhead || 6;
        this.appRequestMultiplier = data.appRequestMultiplier || 0.02;
        this.targetNicUtil = data.targetNicUtil || 80;
        this.mtuPayload = data.mtuPayload || 1460;
        this.nicOffloads = data.nicOffloads !== undefined ? data.nicOffloads : true;
        this.nicCpuReduction = data.nicCpuReduction || 30;
        // Preset IDs for restoring dropdown selections on re-edit
        this.nicSpeedPreset = data.nicSpeedPreset || null;
        this.protocolPreset = data.protocolPreset || null;
        // Protocol Mix support
        this.protocolMix = data.protocolMix || {
            mode: 'single',
            protocols: [{ id: 'generic', weight: 100 }],
            computed: {
                avgRequestSizeKB: 2,
                avgResponseSizeKB: 16,
                requestsPerUserPerSec: 1
            }
        };
    }

    generateId() {
        return 'cg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            region: this.region,
            location: this.location,
            numberOfApps: this.numberOfApps,
            trafficLoad: this.trafficLoad,
            expectedConcurrentUsers: this.expectedConcurrentUsers,
            totalUsers: this.totalUsers,
            requestsPerUser: this.requestsPerUser,
            overrideServerConfig: this.overrideServerConfig,
            serverConfig: this.serverConfig,
            growthRate: this.growthRate,
            cpuCostPer1000: this.cpuCostPer1000,
            memoryCostPer1000: this.memoryCostPer1000,
            avgRequestSizeKB: this.avgRequestSizeKB,
            avgResponseSizeKB: this.avgResponseSizeKB,
            packetProcCost: this.packetProcCost,
            protocolOverhead: this.protocolOverhead,
            appRequestMultiplier: this.appRequestMultiplier,
            targetNicUtil: this.targetNicUtil,
            mtuPayload: this.mtuPayload,
            nicOffloads: this.nicOffloads,
            nicCpuReduction: this.nicCpuReduction,
            nicSpeedPreset: this.nicSpeedPreset,
            protocolPreset: this.protocolPreset,
            protocolMix: this.protocolMix,
            results: this.results
        };
    }
}

// ============================================
// ConnectorGroupManager
// ============================================

class ConnectorGroupManager {
    constructor() {
        this.connectorGroups = [];
        this.globalConfig = this.getDefaultGlobalConfig();
        this.configName = 'My Multi-Site Configuration';
        this.migrateFromLegacyStorage();
        this.loadFromStorage();
    }

    getDefaultGlobalConfig() {
        // Get defaults from schema-loader for consistency
        const schemaDefaults = schemaLoader.getDefaultInputs();
        
        return {
            deploymentType: 'bare-metal',
            cpuPreset: 'xeon-gold-6548y', // Use preset ID, not name
            nicSpeed: '1g', // Use preset ID for NIC speed
            coresPerServer: schemaDefaults.coresPerServer || 64,
            cpuPerfMultiplier: schemaDefaults.cpuPerfMultiplier || 1.59,
            memoryGB: schemaDefaults.memoryGB || 16,
            nicLinkSpeed: schemaDefaults.nicLinkSpeed || 1024, // Keep for calculations
            // Advanced parameters from schema
            cpuCapacityPerCore: schemaDefaults.cpuCapacityPerCore || 85,
            cpuCostPer1000: schemaDefaults.cpuCostPer1000 || 44.5,
            memoryCostPer1000: schemaDefaults.memoryCostPer1000 || 1024,
            baseIdleMemory: schemaDefaults.baseIdleMemory || 512,
            targetNicUtil: schemaDefaults.targetNicUtil || 80,
            packetProcCost: schemaDefaults.packetProcCost || 0.02,
            protocolOverhead: schemaDefaults.protocolOverhead || 6,
            avgRequestSize: schemaDefaults.avgRequestSize || 2,
            avgResponseSize: schemaDefaults.avgResponseSize || 16,
            mtuPayload: schemaDefaults.mtuPayload || 1460,
            nicOffloads: schemaDefaults.nicOffloads !== undefined ? schemaDefaults.nicOffloads : true,
            nicCpuReduction: schemaDefaults.nicCpuReduction || 30,
            growthRate: schemaDefaults.growthRate || 10
        };
    }

    // Migration from legacy storage key
    migrateFromLegacyStorage() {
        try {
            const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacyData && !localStorage.getItem(STORAGE_KEY)) {
                // Migrate old data to new key
                localStorage.setItem(STORAGE_KEY, legacyData);
                localStorage.removeItem(LEGACY_STORAGE_KEY);
                console.log('Migrated connector groups data from legacy storage');
            }
        } catch (e) {
            console.warn('Failed to migrate legacy storage:', e);
        }
    }

    // CRUD Operations
    addConnectorGroup(groupData) {
        const group = new ConnectorGroup(groupData);
        
        // Check for duplicate name
        if (this.connectorGroups.some(g => g.name.toLowerCase() === group.name.toLowerCase())) {
            throw new Error(`A connector group with name "${group.name}" already exists.`);
        }
        
        this.connectorGroups.push(group);
        this.calculateGroupResults(group);
        this.saveToStorage();
        return group;
    }

    updateConnectorGroup(id, groupData) {
        const index = this.connectorGroups.findIndex(g => g.id === id);
        if (index === -1) {
            throw new Error('Connector group not found');
        }

        // Check for duplicate name (excluding current group)
        if (this.connectorGroups.some(g => g.id !== id && g.name.toLowerCase() === groupData.name.toLowerCase())) {
            throw new Error(`A connector group with name "${groupData.name}" already exists.`);
        }

        const group = new ConnectorGroup({ ...groupData, id });
        this.connectorGroups[index] = group;
        this.calculateGroupResults(group);
        this.saveToStorage();
        return group;
    }

    deleteConnectorGroup(id) {
        const index = this.connectorGroups.findIndex(g => g.id === id);
        if (index === -1) {
            throw new Error('Connector group not found');
        }
        this.connectorGroups.splice(index, 1);
        this.saveToStorage();
    }

    getConnectorGroup(id) {
        return this.connectorGroups.find(g => g.id === id);
    }

    getAllConnectorGroups() {
        return this.connectorGroups;
    }

    // Configuration
    setGlobalConfig(config) {
        this.globalConfig = { ...this.globalConfig, ...config };
        
        // Update CPU preset values if preset changed
        if (config.cpuPreset && cpuPresetsMulti[config.cpuPreset]) {
            const preset = cpuPresetsMulti[config.cpuPreset];
            this.globalConfig.coresPerServer = preset.coresPerServer;
            this.globalConfig.cpuPerfMultiplier = preset.cpuPerfMultiplier;
        }
        
        // Update deployment type overheads
        if (config.deploymentType && deploymentTypesMulti[config.deploymentType]) {
            const deployment = deploymentTypesMulti[config.deploymentType];
            this.globalConfig.virtCpuOverhead = deployment.virtCpuOverhead;
            this.globalConfig.virtMemoryOverhead = deployment.virtMemoryOverhead;
            this.globalConfig.virtNetworkOverhead = deployment.virtNetworkOverhead;
        }
        
        // Convert NIC speed preset ID to actual speed value
        if (config.nicSpeed && typeof presetLoader !== 'undefined') {
            const nicPreset = presetLoader.getNICSpeed(config.nicSpeed);
            if (nicPreset) {
                this.globalConfig.nicLinkSpeed = nicPreset.speedMbps;
            }
        }
        
        // Recalculate all connector groups
        this.recalculateAll();
        this.saveToStorage();
    }

    setConfigName(name) {
        this.configName = name;
        this.saveToStorage();
    }

    // Calculations
    calculateGroupResults(group) {
        // Determine which config to use
        let config;
        if (group.overrideServerConfig && group.serverConfig) {
            config = { ...this.globalConfig, ...group.serverConfig };
            
            // Update CPU preset values
            if (group.serverConfig.cpuPreset && cpuPresetsMulti[group.serverConfig.cpuPreset]) {
                const preset = cpuPresetsMulti[group.serverConfig.cpuPreset];
                config.coresPerServer = preset.coresPerServer;
                config.cpuPerfMultiplier = preset.cpuPerfMultiplier;
            }
            
            // Update deployment overheads
            if (group.serverConfig.deploymentType && deploymentTypesMulti[group.serverConfig.deploymentType]) {
                const deployment = deploymentTypesMulti[group.serverConfig.deploymentType];
                config.virtCpuOverhead = deployment.virtCpuOverhead;
                config.virtMemoryOverhead = deployment.virtMemoryOverhead;
                config.virtNetworkOverhead = deployment.virtNetworkOverhead;
            }
        } else {
            config = { ...this.globalConfig };
        }

        // Build inputs for calculation
        const inputs = {
            expectedConcurrentUsers: group.expectedConcurrentUsers,
            requestsPerUser: group.requestsPerUser,
            numberOfApps: group.numberOfApps || 1,
            coresPerServer: config.coresPerServer,
            cpuPerfMultiplier: config.cpuPerfMultiplier,
            memoryGB: config.memoryGB || this.globalConfig.memoryGB,
            nicLinkSpeed: config.nicLinkSpeed || this.globalConfig.nicLinkSpeed,
            cpuCapacityPerCore: config.cpuCapacityPerCore || this.globalConfig.cpuCapacityPerCore,
            cpuCostPer1000: config.cpuCostPer1000 || this.globalConfig.cpuCostPer1000,
            memoryCostPer1000: config.memoryCostPer1000 || this.globalConfig.memoryCostPer1000,
            baseIdleMemory: config.baseIdleMemory || this.globalConfig.baseIdleMemory,
            targetNicUtil: config.targetNicUtil || this.globalConfig.targetNicUtil,
            packetProcCost: config.packetProcCost || this.globalConfig.packetProcCost,
            protocolOverhead: config.protocolOverhead || this.globalConfig.protocolOverhead,
            mtuPayload: config.mtuPayload || this.globalConfig.mtuPayload,
            nicOffloads: config.nicOffloads !== undefined ? config.nicOffloads : this.globalConfig.nicOffloads,
            nicCpuReduction: config.nicCpuReduction || this.globalConfig.nicCpuReduction,
            virtCpuOverhead: config.virtCpuOverhead || 0,
            virtMemoryOverhead: config.virtMemoryOverhead || 0,
            virtNetworkOverhead: config.virtNetworkOverhead || 0
        };
        
        // Apply protocol mix values if available
        if (group.protocolMix && group.protocolMix.computed) {
            inputs.avgRequestSize = group.protocolMix.computed.avgRequestSizeKB || this.globalConfig.avgRequestSize;
            inputs.avgResponseSize = group.protocolMix.computed.avgResponseSizeKB || this.globalConfig.avgResponseSize;
            // Note: requestsPerUser comes from workload profile, but protocolMix can influence it
            if (group.protocolMix.mode !== 'custom' && group.trafficLoad !== 'Custom') {
                // In blended/single mode with non-custom workload, we can optionally blend req/sec
                // For now, keep workload preset req/sec unless custom workload
            }
        } else {
            inputs.avgRequestSize = config.avgRequestSize || this.globalConfig.avgRequestSize;
            inputs.avgResponseSize = config.avgResponseSize || this.globalConfig.avgResponseSize;
        }

        // Use the network-based calculation engine (same as single-site.html and the modal preview)
        if (typeof calculateNetworkCapacity === 'function' && typeof calculateServerCount === 'function') {
            const networkResults = calculateNetworkCapacity(inputs);
            const serverCounts = calculateServerCount(networkResults, inputs);

            // Use the balanced scenario (70% utilisation / 30% headroom) as the canonical result,
            // consistent with single-site.html. All three scenario counts are stored for PDF export
            // or future display use.
            const balanced = serverCounts.balanced;

            group.results = {
                serversRequired: balanced.serversRequired,
                limitingFactor: balanced.limitingFactor,
                // Per-scenario breakdown (conservative / balanced / efficient)
                scenarios: serverCounts,
                // Raw network results for downstream use (e.g. PDF export, VM recommendations)
                networkResults: networkResults,
            };
        }

        return group.results;
    }

    recalculateAll() {
        this.connectorGroups.forEach(group => {
            this.calculateGroupResults(group);
        });
    }

    // Summary
    getSummary() {
        const summary = {
            totalGroups: this.connectorGroups.length,
            totalUsers: 0,
            totalServers: 0,
            totalApps: 0,
            regions: new Set(),
            byRegion: {}
        };

        this.connectorGroups.forEach(group => {
            summary.totalUsers += group.totalUsers || 0;
            summary.totalApps += group.numberOfApps;
            summary.totalServers += group.results ? group.results.serversRequired : 0;
            summary.regions.add(group.region);

            if (!summary.byRegion[group.region]) {
                summary.byRegion[group.region] = {
                    groups: [],
                    totalUsers: 0,
                    totalServers: 0,
                    totalApps: 0
                };
            }

            summary.byRegion[group.region].groups.push(group);
            summary.byRegion[group.region].totalUsers += group.totalUsers || 0;
            summary.byRegion[group.region].totalApps += group.numberOfApps;
            summary.byRegion[group.region].totalServers += group.results ? group.results.serversRequired : 0;
        });

        summary.totalRegions = summary.regions.size;
        return summary;
    }

    // Storage
    saveToStorage() {
        try {
            const data = {
                configName: this.configName,
                globalConfig: this.globalConfig,
                connectorGroups: this.connectorGroups.map(g => g.toJSON())
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.configName = data.configName || 'My Multi-Site Configuration';
                this.globalConfig = { ...this.getDefaultGlobalConfig(), ...data.globalConfig };
                
                // Convert NIC speed preset ID to actual speed value if needed
                if (this.globalConfig.nicSpeed && typeof presetLoader !== 'undefined') {
                    const nicPreset = presetLoader.getNICSpeed(this.globalConfig.nicSpeed);
                    if (nicPreset) {
                        this.globalConfig.nicLinkSpeed = nicPreset.speedMbps;
                    }
                }
                
                // Support both old 'segments' key and new 'connectorGroups' key
                const groupsData = data.connectorGroups || data.segments || [];
                this.connectorGroups = groupsData.map(g => new ConnectorGroup(g));
                this.recalculateAll();
            }
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
    }

    clearStorage() {
        localStorage.removeItem(STORAGE_KEY);
        this.connectorGroups = [];
        this.globalConfig = this.getDefaultGlobalConfig();
        this.configName = 'My Multi-Site Configuration';
    }

    // Import/Export
    exportToJSON() {
        const summary = this.getSummary();
        
        const exportData = {
            name: this.configName,
            description: "Exported from GSA Sizing Planner Offline",
            exportDate: new Date().toISOString(),
            version: "1.0",
            globalConfig: {
                deploymentType: this.globalConfig.deploymentType,
                cpuPreset: this.globalConfig.cpuPreset,
                coresPerServer: this.globalConfig.coresPerServer,
                cpuPerfMultiplier: this.globalConfig.cpuPerfMultiplier,
                memoryGB: this.globalConfig.memoryGB,
                nicLinkSpeed: this.globalConfig.nicLinkSpeed
            },
            // Keep 'sites' key for React compatibility
            sites: this.connectorGroups.map(group => ({
                id: group.id,
                name: group.name,
                region: group.region,
                location: {
                    city: group.location.split(',')[0]?.trim() || group.location,
                    country: group.location.split(',')[1]?.trim() || ''
                },
                numberOfApps: group.numberOfApps,
                workloadConfig: {
                    expectedConcurrentUsers: group.expectedConcurrentUsers,
                    requestsPerUser: group.requestsPerUser,
                    trafficLoad: group.trafficLoad,
                    protocolMix: group.protocolMix || null
                },
                serverConfig: group.overrideServerConfig ? group.serverConfig : null,
                results: group.results
            })),
            summary: {
                totalSites: summary.totalGroups,
                totalUsers: summary.totalUsers,
                totalServers: summary.totalServers,
                totalApps: summary.totalApps,
                byRegion: Object.entries(summary.byRegion).reduce((acc, [region, data]) => {
                    acc[region] = {
                        sites: data.groups.length,
                        users: data.totalUsers,
                        servers: data.totalServers,
                        apps: data.totalApps
                    };
                    return acc;
                }, {})
            }
        };

        return JSON.stringify(exportData, null, 2);
    }

    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate structure
            if (!data.sites || !Array.isArray(data.sites)) {
                throw new Error('Invalid JSON format: missing sites array');
            }
            
            // Limit to prevent performance issues
            if (data.sites.length > 100) {
                throw new Error('Too many sites (max 100). Please reduce the number of sites.');
            }

            // Clear existing data
            this.connectorGroups = [];

            // Import config name (support both 'deploymentName' and 'name' for compatibility)
            this.configName = data.deploymentName || data.name || 'Imported Configuration';

            // Import global config (without triggering recalculation)
            if (data.globalConfig) {
                this.globalConfig = { ...this.globalConfig, ...data.globalConfig };
                
                // Update CPU preset values if preset changed
                if (data.globalConfig.cpuPreset && cpuPresetsMulti[data.globalConfig.cpuPreset]) {
                    const preset = cpuPresetsMulti[data.globalConfig.cpuPreset];
                    this.globalConfig.coresPerServer = preset.coresPerServer;
                    this.globalConfig.cpuPerfMultiplier = preset.cpuPerfMultiplier;
                }
                
                // Update deployment type overheads
                if (data.globalConfig.deploymentType && deploymentTypesMulti[data.globalConfig.deploymentType]) {
                    const deployment = deploymentTypesMulti[data.globalConfig.deploymentType];
                    this.globalConfig.virtCpuOverhead = deployment.virtCpuOverhead;
                    this.globalConfig.virtMemoryOverhead = deployment.virtMemoryOverhead;
                    this.globalConfig.virtNetworkOverhead = deployment.virtNetworkOverhead;
                }
            }

            // Import sites as connector groups
            const usedNames = new Set();
            data.sites.forEach((site, index) => {
                const location = site.location 
                    ? (typeof site.location === 'string' 
                        ? site.location 
                        : `${site.location.city || ''}${site.location.country ? ', ' + site.location.country : ''}`)
                    : '';

                // Ensure unique names
                let baseName = site.name || `Connector Group ${index + 1}`;
                let name = baseName;
                let counter = 1;
                while (usedNames.has(name.toLowerCase())) {
                    name = `${baseName} (${counter++})`;
                }
                usedNames.add(name.toLowerCase());

                const groupData = {
                    id: undefined, // Always generate new IDs to avoid conflicts
                    name: name,
                    region: site.region || 'Default',
                    location: location,
                    numberOfApps: parseInt(site.numberOfApps) || 10,
                    trafficLoad: site.workloadConfig?.trafficLoad || 'Medium',
                    expectedConcurrentUsers: parseInt(site.workloadConfig?.expectedConcurrentUsers) || 50000,
                    requestsPerUser: parseInt(site.workloadConfig?.requestsPerUser) || 2,
                    overrideServerConfig: !!site.serverConfig,
                    serverConfig: site.serverConfig,
                    // Import protocol mix if available
                    protocolMix: site.workloadConfig?.protocolMix || null
                };

                const group = new ConnectorGroup(groupData);
                this.connectorGroups.push(group);
            });

            // Recalculate all
            this.recalculateAll();
            this.saveToStorage();

            return { success: true, count: this.connectorGroups.length };
        } catch (e) {
            throw new Error(`Failed to import: ${e.message}`);
        }
    }

    downloadJSON() {
        const json = this.exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `gsa-capacity-${this.configName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create global instance
const connectorGroupManager = new ConnectorGroupManager();
