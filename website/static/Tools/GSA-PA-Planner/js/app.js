/**
 * GSA Private Access Sizing Planner - Main Application
 * 
 * Handles UI interactions, presets, and result rendering
 */

// ============================================
// Presets and Configuration Data
// ============================================

const cpuPresets = {
    "Intel Xeon E5-v3 (2014 baseline)": { coresPerServer: 24, cpuPerfMultiplier: 1.00, memoryGB: 16 },
    "AMD EPYC Rome (2nd Gen, 2019)": { coresPerServer: 64, cpuPerfMultiplier: 1.00, memoryGB: 16 },
    "AMD EPYC Milan (3rd Gen, 2021)": { coresPerServer: 64, cpuPerfMultiplier: 1.22, memoryGB: 16 },
    "Intel Xeon Platinum 8380 (Ice Lake, 3rd Gen, 2021)": { coresPerServer: 80, cpuPerfMultiplier: 1.54, memoryGB: 16 },
    "Intel Xeon Sapphire Rapids (4th Gen, 2023)": { coresPerServer: 112, cpuPerfMultiplier: 1.54, memoryGB: 16 },
    "Intel Xeon Gold 6548Y+ (Emerald Rapids, 5th Gen, 2024)": { coresPerServer: 64, cpuPerfMultiplier: 1.59, memoryGB: 16 },
    "AMD EPYC Genoa (4th Gen, 2022)": { coresPerServer: 96, cpuPerfMultiplier: 1.85, memoryGB: 16 },
    "Intel Xeon 6 (Granite Rapids, 6th Gen, 2024)": { coresPerServer: 128, cpuPerfMultiplier: 1.75, memoryGB: 16 },
    "AMD EPYC Genoa-X (4th Gen w/ 3D V-Cache, 2023)": { coresPerServer: 96, cpuPerfMultiplier: 2.00, memoryGB: 16 },
    "Custom": null
};

const deploymentTypes = {
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

const workloadProfiles = [
    { name: "Light", expectedConcurrentUsers: 10000, requestsPerUser: 1 },
    { name: "Medium", expectedConcurrentUsers: 50000, requestsPerUser: 1 },
    { name: "Heavy", expectedConcurrentUsers: 100000, requestsPerUser: 1 },
    { name: "Very Heavy", expectedConcurrentUsers: 200000, requestsPerUser: 1 }
];

// Protocol mix state
let currentProtocolMix = {
    mode: 'single',
    protocols: [{ id: 'generic', weight: 100 }],
    computed: {
        avgRequestSizeKB: 2,
        avgResponseSizeKB: 16,
        requestsPerUserPerSec: 1
    }
};

// Default inputs - loaded from schema-loader (single source of truth)
// Schema defaults are defined in ConfigPresets/schema.json and ConfigPresets/defaults.json
const defaultInputs = {
    ...schemaLoader.getDefaultInputs(),
    // Non-schema defaults
    deploymentType: "bare-metal"
};

// ============================================
// Application State
// ============================================

let currentInputs = { ...defaultInputs };
let advancedMode = false;

// ============================================
// DOM Elements
// ============================================

const elements = {
    // Toggle
    advancedModeToggle: document.getElementById('advancedModeToggle'),
    
    // Workload
    workloadPreset: document.getElementById('workloadPreset'),
    expectedConcurrentUsers: document.getElementById('expectedConcurrentUsers'),
    requestsPerUser: document.getElementById('requestsPerUser'),
    growthRate: document.getElementById('growthRate'),
    
    // Server
    deploymentType: document.getElementById('deploymentType'),
    cpuPreset: document.getElementById('cpuPreset'),
    coresPerServer: document.getElementById('coresPerServer'),
    cpuPerfMultiplier: document.getElementById('cpuPerfMultiplier'),
    memoryGB: document.getElementById('memoryGB'),
    
    // Network
    nicLinkSpeed: document.getElementById('nicLinkSpeed'),
    targetNicUtil: document.getElementById('targetNicUtil'),
    nicOffloads: document.getElementById('nicOffloads'),
    
    // Advanced Parameters
    cpuCapacityPerCore: document.getElementById('cpuCapacityPerCore'),
    cpuCostPer1000: document.getElementById('cpuCostPer1000'),
    memoryCostPer1000: document.getElementById('memoryCostPer1000'),
    baseIdleMemory: document.getElementById('baseIdleMemory'),
    avgRequestSize: document.getElementById('avgRequestSize'),
    avgResponseSize: document.getElementById('avgResponseSize'),
    mtuPayload: document.getElementById('mtuPayload'),
    packetProcCost: document.getElementById('packetProcCost'),
    protocolOverhead: document.getElementById('protocolOverhead'),
    nicCpuReduction: document.getElementById('nicCpuReduction'),
    
    // Virtualization
    virtCpuOverhead: document.getElementById('virtCpuOverhead'),
    virtMemoryOverhead: document.getElementById('virtMemoryOverhead'),
    virtNetworkOverhead: document.getElementById('virtNetworkOverhead'),
    
    // Protocol Profile
    protocolPreset: document.getElementById('protocolPreset'),
    protocolDescription: document.getElementById('protocolDescription'),
    enableProtocolBlending: document.getElementById('enableProtocolBlending'),
    protocolBlendingPanel: document.getElementById('protocolBlendingPanel'),
    protocolMixList: document.getElementById('protocolMixList'),
    addProtocolBtn: document.getElementById('addProtocolBtn'),
    totalWeightValue: document.getElementById('totalWeightValue'),
    weightStatus: document.getElementById('weightStatus'),
    effectiveRequestSize: document.getElementById('effectiveRequestSize'),
    effectiveResponseSize: document.getElementById('effectiveResponseSize'),
    effectiveReqPerSec: document.getElementById('effectiveReqPerSec'),
    
    // Results
    serversRequired: document.getElementById('serversRequired'),
    limitingFactorChip: document.getElementById('limitingFactorChip'),
    
    // Gauges
    cpuGaugeFill: document.getElementById('cpuGaugeFill'),
    cpuPercent: document.getElementById('cpuPercent'),
    cpuStats: document.getElementById('cpuStats'),
    cpuLimiting: document.getElementById('cpuLimiting'),
    
    memoryGaugeFill: document.getElementById('memoryGaugeFill'),
    memoryPercent: document.getElementById('memoryPercent'),
    memoryStats: document.getElementById('memoryStats'),
    memoryLimiting: document.getElementById('memoryLimiting'),
    
    networkGaugeFill: document.getElementById('networkGaugeFill'),
    networkPercent: document.getElementById('networkPercent'),
    networkStats: document.getElementById('networkStats'),
    networkLimiting: document.getElementById('networkLimiting'),
    
    // Detailed Metrics
    maxUsersCpu: document.getElementById('maxUsersCpu'),
    maxUsersMemory: document.getElementById('maxUsersMemory'),
    maxUsersNetwork: document.getElementById('maxUsersNetwork'),
    coresForUsers: document.getElementById('coresForUsers'),
    packetProcCores: document.getElementById('packetProcCores'),
    totalCoresReq: document.getElementById('totalCoresReq'),
    
    // Projections
    projectionsBody: document.getElementById('projectionsBody')
};

// ============================================
// Gauge Drawing Helper
// ============================================

function updateGauge(fillElement, percentage) {
    // SVG arc path calculation for a semi-circle gauge
    // Arc goes from 10,50 to 90,50 with radius 40
    // Total arc length is approximately 125.66 (π * 40)
    const arcLength = Math.PI * 40;
    const dashLength = (percentage / 100) * arcLength;
    fillElement.style.strokeDasharray = `${dashLength} ${arcLength}`;
}

// ============================================
// Result Update Functions
// ============================================

function updateResults() {
    // Calculate capacity
    const results = calculateCapacity(currentInputs);
    
    // Get current servers required (year 0)
    const serversRequired = results.growthProjections[0].serversRequired;
    elements.serversRequired.textContent = serversRequired;
    
    // Update limiting factor chip
    updateLimitingFactorChip(results.limitingFactor);
    
    // Update gauges
    updateResourceGauges(results, currentInputs.expectedConcurrentUsers);
    
    // Update detailed metrics
    updateDetailedMetrics(results);
    
    // Update growth projections
    updateGrowthProjections(results.growthProjections);
}

function updateLimitingFactorChip(limitingFactor) {
    const chip = elements.limitingFactorChip;
    chip.textContent = `${limitingFactor} Limited`;
    chip.className = 'limiting-chip';
    
    switch (limitingFactor) {
        case 'CPU':
            chip.classList.add('cpu-limited');
            break;
        case 'Memory':
            chip.classList.add('memory-limited');
            break;
        case 'Network':
            chip.classList.add('network-limited');
            break;
    }
}

function updateResourceGauges(results, expectedUsers) {
    const { maxUsersCpu, maxUsersMemory, maxUsersNetwork, limitingFactor } = results;
    
    // CPU Gauge
    const cpuPercent = Math.min(100, Math.round((expectedUsers / maxUsersCpu) * 100));
    updateGauge(elements.cpuGaugeFill, cpuPercent);
    elements.cpuPercent.textContent = `${cpuPercent}%`;
    elements.cpuStats.textContent = `${expectedUsers.toLocaleString()} / ${maxUsersCpu.toLocaleString()} users`;
    elements.cpuLimiting.textContent = limitingFactor === 'CPU' ? 'LIMITING' : '';
    
    // Memory Gauge
    const memoryPercent = Math.min(100, Math.round((expectedUsers / maxUsersMemory) * 100));
    updateGauge(elements.memoryGaugeFill, memoryPercent);
    elements.memoryPercent.textContent = `${memoryPercent}%`;
    elements.memoryStats.textContent = `${expectedUsers.toLocaleString()} / ${maxUsersMemory.toLocaleString()} users`;
    elements.memoryLimiting.textContent = limitingFactor === 'Memory' ? 'LIMITING' : '';
    
    // Network Gauge
    const networkPercent = Math.min(100, Math.round((expectedUsers / maxUsersNetwork) * 100));
    updateGauge(elements.networkGaugeFill, networkPercent);
    elements.networkPercent.textContent = `${networkPercent}%`;
    elements.networkStats.textContent = `${expectedUsers.toLocaleString()} / ${maxUsersNetwork.toLocaleString()} users`;
    elements.networkLimiting.textContent = limitingFactor === 'Network' ? 'LIMITING' : '';
}

function updateDetailedMetrics(results) {
    elements.maxUsersCpu.textContent = results.maxUsersCpu.toLocaleString();
    elements.maxUsersMemory.textContent = results.maxUsersMemory.toLocaleString();
    elements.maxUsersNetwork.textContent = results.maxUsersNetwork.toLocaleString();
    elements.coresForUsers.textContent = results.coresForUsersRaw;
    elements.packetProcCores.textContent = results.packetProcessingCores;
    elements.totalCoresReq.textContent = results.totalCoresRequired;
}

function updateGrowthProjections(projections) {
    elements.projectionsBody.innerHTML = projections.map(row => `
        <tr>
            <td>Year ${row.year}</td>
            <td>${row.expectedUsers.toLocaleString()}</td>
            <td>${row.serversRequired}</td>
        </tr>
    `).join('');
}

// ============================================
// Input Handlers
// ============================================

function handleWorkloadPresetChange() {
    const presetName = elements.workloadPreset.value;
    const profile = workloadProfiles.find(p => p.name === presetName);
    
    if (profile && profile.expectedConcurrentUsers !== null) {
        currentInputs.expectedConcurrentUsers = profile.expectedConcurrentUsers;
        currentInputs.requestsPerUser = profile.requestsPerUser;
        
        elements.expectedConcurrentUsers.value = profile.expectedConcurrentUsers;
        elements.requestsPerUser.value = profile.requestsPerUser;
    }
    
    updateResults();
}

function handleCpuPresetChange() {
    const presetKey = elements.cpuPreset.value;
    const preset = cpuPresets[presetKey];
    
    if (preset) {
        currentInputs.coresPerServer = preset.coresPerServer;
        currentInputs.cpuPerfMultiplier = preset.cpuPerfMultiplier;
        currentInputs.memoryGB = preset.memoryGB;
        
        elements.coresPerServer.value = preset.coresPerServer;
        elements.cpuPerfMultiplier.value = preset.cpuPerfMultiplier;
        elements.memoryGB.value = preset.memoryGB;
    }
    
    updateResults();
}

function handleDeploymentTypeChange() {
    const deploymentKey = elements.deploymentType.value;
    const deployment = deploymentTypes[deploymentKey];
    
    if (deployment) {
        currentInputs.deploymentType = deploymentKey;
        currentInputs.virtCpuOverhead = deployment.virtCpuOverhead;
        currentInputs.virtMemoryOverhead = deployment.virtMemoryOverhead;
        currentInputs.virtNetworkOverhead = deployment.virtNetworkOverhead;
        
        elements.virtCpuOverhead.value = deployment.virtCpuOverhead;
        elements.virtMemoryOverhead.value = deployment.virtMemoryOverhead;
        elements.virtNetworkOverhead.value = deployment.virtNetworkOverhead;
    }
    
    updateResults();
}

function handleInputChange(field, isCheckbox = false) {
    return function(event) {
        const value = isCheckbox ? event.target.checked : parseFloat(event.target.value) || 0;
        currentInputs[field] = value;
        updateResults();
    };
}

function handleAdvancedModeToggle() {
    advancedMode = elements.advancedModeToggle.checked;
    document.body.classList.toggle('advanced-mode', advancedMode);
}

// ============================================
// Protocol Handling Functions
// ============================================

function handleProtocolPresetChange() {
    const presetId = elements.protocolPreset.value;
    const presets = window.presetLoader.getProtocols();
    const protocol = presets[presetId];
    
    if (protocol) {
        // Update description
        if (elements.protocolDescription) {
            elements.protocolDescription.textContent = protocol.description || '';
        }
        
        // If not in blending mode, apply single protocol
        if (!elements.enableProtocolBlending.checked) {
            currentProtocolMix = {
                mode: presetId === 'custom' ? 'custom' : 'single',
                protocols: [{ id: presetId, weight: 100 }],
                computed: presetId === 'custom' ? {
                    avgRequestSizeKB: parseFloat(elements.avgRequestSize.value) || 2,
                    avgResponseSizeKB: parseFloat(elements.avgResponseSize.value) || 16,
                    requestsPerUserPerSec: parseFloat(elements.requestsPerUser.value) || 1
                } : {
                    avgRequestSizeKB: protocol.avgRequestSizeKB,
                    avgResponseSizeKB: protocol.avgResponseSizeKB,
                    requestsPerUserPerSec: protocol.typicalRequestsPerSec
                }
            };
            
            // Apply to inputs if not custom
            if (presetId !== 'custom') {
                applyProtocolValues(protocol);
            }
        }
    }
    
    updateEffectiveValues();
    updateResults();
}

function applyProtocolValues(protocol) {
    if (!protocol) return;
    
    // Update UI inputs
    elements.avgRequestSize.value = protocol.avgRequestSizeKB;
    elements.avgResponseSize.value = protocol.avgResponseSizeKB;
    elements.requestsPerUser.value = protocol.typicalRequestsPerSec;
    
    // Update current inputs
    currentInputs.avgRequestSize = protocol.avgRequestSizeKB;
    currentInputs.avgResponseSize = protocol.avgResponseSizeKB;
    currentInputs.requestsPerUser = protocol.typicalRequestsPerSec;
}

function handleProtocolBlendingToggle() {
    const enabled = elements.enableProtocolBlending.checked;
    elements.protocolBlendingPanel.style.display = enabled ? 'block' : 'none';
    
    if (enabled) {
        // Initialize blending with current protocol
        currentProtocolMix.mode = 'blended';
        if (currentProtocolMix.protocols.length === 0) {
            const currentPreset = elements.protocolPreset.value;
            currentProtocolMix.protocols = [{ id: currentPreset, weight: 50 }];
        }
        renderProtocolMixList();
    } else {
        // Switch back to single mode
        handleProtocolPresetChange();
    }
    
    updateEffectiveValues();
}

function renderProtocolMixList() {
    const list = elements.protocolMixList;
    if (!list) return;
    
    const presets = window.presetLoader.getProtocols();
    
    list.innerHTML = currentProtocolMix.protocols.map((item, index) => {
        const protocol = presets[item.id];
        const icon = protocol ? protocol.icon : '📊';
        const name = protocol ? protocol.name : item.id;
        
        return `
            <div class="protocol-mix-item" data-index="${index}">
                <select class="protocol-mix-select" data-index="${index}">
                    ${Object.entries(presets).filter(([id]) => id !== 'custom').map(([id, p]) => 
                        `<option value="${id}" ${id === item.id ? 'selected' : ''}>${p.icon} ${p.name}</option>`
                    ).join('')}
                </select>
                <input type="number" class="protocol-mix-weight" value="${item.weight}" min="0" max="100" data-index="${index}">
                <button type="button" class="btn-remove" data-index="${index}" title="Remove protocol">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
    
    // Attach event listeners
    list.querySelectorAll('.protocol-mix-select').forEach(select => {
        select.addEventListener('change', handleProtocolMixItemChange);
    });
    
    list.querySelectorAll('.protocol-mix-weight').forEach(input => {
        input.addEventListener('input', handleProtocolMixWeightChange);
    });
    
    list.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', handleProtocolMixRemove);
    });
    
    updateWeightTotal();
}

function handleProtocolMixItemChange(event) {
    const index = parseInt(event.target.dataset.index);
    currentProtocolMix.protocols[index].id = event.target.value;
    recalculateBlendedValues();
}

function handleProtocolMixWeightChange(event) {
    const index = parseInt(event.target.dataset.index);
    let weight = parseInt(event.target.value) || 0;
    weight = Math.max(0, Math.min(100, weight));
    currentProtocolMix.protocols[index].weight = weight;
    updateWeightTotal();
    recalculateBlendedValues();
}

function handleProtocolMixRemove(event) {
    const index = parseInt(event.target.closest('.btn-remove').dataset.index);
    currentProtocolMix.protocols.splice(index, 1);
    renderProtocolMixList();
    recalculateBlendedValues();
}

function handleAddProtocol() {
    const presets = window.presetLoader.getProtocols();
    // Find a protocol not already in the mix
    const usedIds = currentProtocolMix.protocols.map(p => p.id);
    const availableProtocols = Object.keys(presets).filter(id => id !== 'custom' && !usedIds.includes(id));
    
    const newId = availableProtocols.length > 0 ? availableProtocols[0] : 'generic';
    currentProtocolMix.protocols.push({ id: newId, weight: 0 });
    
    renderProtocolMixList();
}

function updateWeightTotal() {
    const total = currentProtocolMix.protocols.reduce((sum, p) => sum + (p.weight || 0), 0);
    
    if (elements.totalWeightValue) {
        elements.totalWeightValue.textContent = total;
    }
    
    if (elements.weightStatus) {
        if (total === 100) {
            elements.weightStatus.textContent = '✓ Perfect';
            elements.weightStatus.className = 'weight-status valid';
        } else if (total > 100) {
            elements.weightStatus.textContent = '⚠ Over 100% (will be capped)';
            elements.weightStatus.className = 'weight-status error';
        } else if (total > 0) {
            elements.weightStatus.textContent = '(will be normalized)';
            elements.weightStatus.className = 'weight-status warning';
        } else {
            elements.weightStatus.textContent = '⚠ Add weights';
            elements.weightStatus.className = 'weight-status warning';
        }
    }
}

function recalculateBlendedValues() {
    if (elements.enableProtocolBlending && elements.enableProtocolBlending.checked) {
        currentProtocolMix.computed = window.protocolBlending.calculateBlendedProtocol(currentProtocolMix.protocols);
    }
    
    updateEffectiveValues();
    
    // Apply computed values to inputs
    if (currentProtocolMix.mode !== 'custom') {
        currentInputs.avgRequestSize = currentProtocolMix.computed.avgRequestSizeKB;
        currentInputs.avgResponseSize = currentProtocolMix.computed.avgResponseSizeKB;
        currentInputs.requestsPerUser = currentProtocolMix.computed.requestsPerUserPerSec;
        
        elements.avgRequestSize.value = currentProtocolMix.computed.avgRequestSizeKB;
        elements.avgResponseSize.value = currentProtocolMix.computed.avgResponseSizeKB;
        elements.requestsPerUser.value = currentProtocolMix.computed.requestsPerUserPerSec;
    }
    
    updateResults();
}

function updateEffectiveValues() {
    if (elements.effectiveRequestSize) {
        elements.effectiveRequestSize.textContent = `${currentProtocolMix.computed.avgRequestSizeKB} KB`;
    }
    if (elements.effectiveResponseSize) {
        elements.effectiveResponseSize.textContent = `${currentProtocolMix.computed.avgResponseSizeKB} KB`;
    }
    if (elements.effectiveReqPerSec) {
        elements.effectiveReqPerSec.textContent = currentProtocolMix.computed.requestsPerUserPerSec;
    }
}


// ============================================
// Initialize Application
// ============================================

function initializeApp() {
    // Set initial values from defaults - use Medium preset by default
    elements.workloadPreset.value = "Medium";
    elements.expectedConcurrentUsers.value = defaultInputs.expectedConcurrentUsers;
    elements.requestsPerUser.value = defaultInputs.requestsPerUser;
    elements.growthRate.value = defaultInputs.growthRate;
    elements.coresPerServer.value = defaultInputs.coresPerServer;
    elements.cpuPerfMultiplier.value = defaultInputs.cpuPerfMultiplier;
    elements.memoryGB.value = defaultInputs.memoryGB;
    elements.nicLinkSpeed.value = defaultInputs.nicLinkSpeed;
    elements.targetNicUtil.value = defaultInputs.targetNicUtil;
    elements.nicOffloads.checked = defaultInputs.nicOffloads;
    elements.cpuCapacityPerCore.value = defaultInputs.cpuCapacityPerCore;
    elements.cpuCostPer1000.value = defaultInputs.cpuCostPer1000;
    elements.memoryCostPer1000.value = defaultInputs.memoryCostPer1000;
    elements.baseIdleMemory.value = defaultInputs.baseIdleMemory;
    elements.avgRequestSize.value = defaultInputs.avgRequestSize;
    elements.avgResponseSize.value = defaultInputs.avgResponseSize;
    elements.mtuPayload.value = defaultInputs.mtuPayload;
    elements.packetProcCost.value = defaultInputs.packetProcCost;
    elements.protocolOverhead.value = defaultInputs.protocolOverhead;
    elements.nicCpuReduction.value = defaultInputs.nicCpuReduction;
    elements.virtCpuOverhead.value = defaultInputs.virtCpuOverhead;
    elements.virtMemoryOverhead.value = defaultInputs.virtMemoryOverhead;
    elements.virtNetworkOverhead.value = defaultInputs.virtNetworkOverhead;
    
    // Attach event listeners
    elements.advancedModeToggle.addEventListener('change', handleAdvancedModeToggle);
    
    elements.workloadPreset.addEventListener('change', handleWorkloadPresetChange);
    elements.cpuPreset.addEventListener('change', handleCpuPresetChange);
    elements.deploymentType.addEventListener('change', handleDeploymentTypeChange);
    
    elements.expectedConcurrentUsers.addEventListener('input', handleInputChange('expectedConcurrentUsers'));
    elements.requestsPerUser.addEventListener('input', handleInputChange('requestsPerUser'));
    elements.growthRate.addEventListener('input', handleInputChange('growthRate'));
    elements.coresPerServer.addEventListener('input', handleInputChange('coresPerServer'));
    elements.cpuPerfMultiplier.addEventListener('input', handleInputChange('cpuPerfMultiplier'));
    elements.memoryGB.addEventListener('input', handleInputChange('memoryGB'));
    elements.nicLinkSpeed.addEventListener('change', handleInputChange('nicLinkSpeed'));
    elements.targetNicUtil.addEventListener('input', handleInputChange('targetNicUtil'));
    elements.nicOffloads.addEventListener('change', handleInputChange('nicOffloads', true));
    
    elements.cpuCapacityPerCore.addEventListener('input', handleInputChange('cpuCapacityPerCore'));
    elements.cpuCostPer1000.addEventListener('input', handleInputChange('cpuCostPer1000'));
    elements.memoryCostPer1000.addEventListener('input', handleInputChange('memoryCostPer1000'));
    elements.baseIdleMemory.addEventListener('input', handleInputChange('baseIdleMemory'));
    elements.avgRequestSize.addEventListener('input', handleInputChange('avgRequestSize'));
    elements.avgResponseSize.addEventListener('input', handleInputChange('avgResponseSize'));
    elements.mtuPayload.addEventListener('input', handleInputChange('mtuPayload'));
    elements.packetProcCost.addEventListener('input', handleInputChange('packetProcCost'));
    elements.protocolOverhead.addEventListener('input', handleInputChange('protocolOverhead'));
    elements.nicCpuReduction.addEventListener('input', handleInputChange('nicCpuReduction'));
    
    elements.virtCpuOverhead.addEventListener('input', handleInputChange('virtCpuOverhead'));
    elements.virtMemoryOverhead.addEventListener('input', handleInputChange('virtMemoryOverhead'));
    elements.virtNetworkOverhead.addEventListener('input', handleInputChange('virtNetworkOverhead'));
    
    // Protocol Profile event listeners
    if (elements.protocolPreset) {
        elements.protocolPreset.addEventListener('change', handleProtocolPresetChange);
    }
    if (elements.enableProtocolBlending) {
        elements.enableProtocolBlending.addEventListener('change', handleProtocolBlendingToggle);
    }
    if (elements.addProtocolBtn) {
        elements.addProtocolBtn.addEventListener('click', handleAddProtocol);
    }
    
    // PDF Export button
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', handleExportPDF);
    }
    
    // Initial calculation
    updateResults();
    
    // Initialize disclaimer banner
    initializeDisclaimerBanner();
}

// ============================================
// PDF Export Handler
// ============================================

function handleExportPDF() {
    // Check if jsPDF is available
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF export library is not loaded. Please check your internet connection or try again.');
        return;
    }
    
    // Get the latest calculation results
    const results = calculateCapacity(currentInputs);
    
    // Export the PDF
    if (window.pdfExport && window.pdfExport.exportSingleSitePDF) {
        window.pdfExport.exportSingleSitePDF(currentInputs, results);
    } else {
        alert('PDF export module is not available. Please refresh the page and try again.');
    }
}

// ============================================
// Disclaimer Banner
// ============================================

function initializeDisclaimerBanner() {
    const banner = document.getElementById('disclaimerBanner');
    const toggle = document.getElementById('disclaimerToggle');
    
    if (!banner || !toggle) return;
    
    // Check localStorage for collapsed state
    const isCollapsed = localStorage.getItem('disclaimerCollapsed') === 'true';
    if (isCollapsed) {
        banner.classList.add('collapsed');
    }
    
    toggle.addEventListener('click', () => {
        banner.classList.toggle('collapsed');
        localStorage.setItem('disclaimerCollapsed', banner.classList.contains('collapsed'));
    });
}

// ============================================
// Dark Mode
// ============================================

function initializeDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;
    
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    toggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        if (newTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        localStorage.setItem('theme', newTheme);
    });
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    initializeDarkMode();
    
    // Protocol presets are now embedded in preset-loader.js (no async loading needed)
    // Protocol blending logic moved to protocol-blending.js
    
    initializeApp();
    
    // Initialize effective values display
    updateEffectiveValues();
});
