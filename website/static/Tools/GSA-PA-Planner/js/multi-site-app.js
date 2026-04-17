/**
 * GSA Private Access Sizing Planner - Multi-Site UI Application
 * 
 * Handles UI interactions for the multi-site sizing planner
 */

// ============================================
// DOM Elements
// ============================================

let advancedMode = false;
let groupToDelete = null;
let isInitializing = false; // Flag to prevent event handlers during init

// Sorting state
let currentSortColumn = 'region'; // Default sort on Geo Region
let currentSortDirection = 'asc'; // 'asc' or 'desc'

// Modal form instance (from schema-form-component.js)
let modalFormInstance = null;

// Current modal inputs (for live server count calculation)
let currentModalInputs = null;

// Selected provisioning scenario in modal ('conservative' | 'balanced' | 'efficient')
let currentModalScenario = 'conservative';

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded event fired - initializing multi-site app');
    
    // Protocol presets are now embedded in preset-loader.js (no async loading needed)
    // Protocol blending logic moved to protocol-blending.js
    console.log('Using embedded presets from preset-loader.js');
    
    console.log('Initializing UI...');
    initializeUI();
    console.log('Binding event listeners...');
    bindEventListeners();
    console.log('Rendering all...');
    renderAll();
    initializeDisclaimerBanner();
    console.log('Multi-site app initialization complete');
});

function initializeUI() {
    isInitializing = true; // Prevent event handlers from triggering
    
    // Set config name
    document.getElementById('configName').value = connectorGroupManager.configName;
    
    // Set global config values
    const gc = connectorGroupManager.globalConfig;
    document.getElementById('globalDeploymentType').value = gc.deploymentType;
    document.getElementById('globalCpuPreset').value = gc.cpuPreset;
    document.getElementById('globalMemoryGB').value = gc.memoryGB;
    document.getElementById('globalNicSpeed').value = gc.nicSpeed || '1g'; // Use preset ID
    
    isInitializing = false; // Re-enable event handlers
}

function bindEventListeners() {
    // Modal Advanced Mode Toggle
    document.getElementById('modalAdvancedModeToggle').addEventListener('change', (e) => {
        advancedMode = e.target.checked;
        const modal = document.getElementById('groupModal');
        modal.classList.toggle('advanced-mode', advancedMode);
    });

    // Scenario selector buttons in modal
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentModalScenario = btn.dataset.scenario;
            document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateModalServerCount();
        });
    });

    // Config Name
    document.getElementById('configName').addEventListener('change', (e) => {
        connectorGroupManager.setConfigName(e.target.value);
    });

    // Global Config Changes
    document.getElementById('globalDeploymentType').addEventListener('change', updateGlobalConfig);
    document.getElementById('globalCpuPreset').addEventListener('change', updateGlobalConfig);
    document.getElementById('globalMemoryGB').addEventListener('change', updateGlobalConfig);
    document.getElementById('globalNicSpeed').addEventListener('change', updateGlobalConfig);

    // Add Connector Group Button
    const addGroupBtn = document.getElementById('addGroupBtn');
    if (addGroupBtn) {
        console.log('Add Group button found, attaching event listener');
        addGroupBtn.addEventListener('click', () => {
            console.log('Add Group button clicked!');
            openGroupModal();
        });
    } else {
        console.error('Add Group button not found!');
    }

    // Modal Close Buttons
    document.getElementById('closeModal').addEventListener('click', closeGroupModal);
    document.getElementById('cancelBtn').addEventListener('click', closeGroupModal);
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);

    // Save Connector Group
    document.getElementById('saveGroupBtn').addEventListener('click', saveConnectorGroup);

    // Confirm Delete
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Start New
    document.getElementById('startNewBtn').addEventListener('click', handleStartNew);

    // Groups Table Expander
    document.getElementById('groupsExpander').addEventListener('click', toggleGroupsTable);

    // Import/Export
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', handleImport);
    document.getElementById('exportBtn').addEventListener('click', handleExport);
    document.getElementById('exportPdfBtn').addEventListener('click', handleExportPDF);

    // Close modals on overlay click
    document.getElementById('groupModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('groupModal')) {
            closeGroupModal();
        }
    });

    document.getElementById('deleteModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('deleteModal')) {
            closeDeleteModal();
        }
    });
}

// ============================================
// Global Config
// ============================================

function updateGlobalConfig() {
    // Skip if we're in the middle of initializing UI
    if (isInitializing) return;
    
    const config = {
        deploymentType: document.getElementById('globalDeploymentType').value,
        cpuPreset: document.getElementById('globalCpuPreset').value,
        memoryGB: parseInt(document.getElementById('globalMemoryGB').value) || 16,
        nicSpeed: document.getElementById('globalNicSpeed').value // Store preset ID, not speedMbps
    };
    
    connectorGroupManager.setGlobalConfig(config);
    renderAll();
}

// ============================================
// Connector Group Modal
// ============================================

function openGroupModal(groupId = null) {
    console.log('openGroupModal called with groupId:', groupId);
    
    const modal = document.getElementById('groupModal');
    const form = document.getElementById('groupForm');
    const title = document.getElementById('modalTitle');
    const advancedToggle = document.getElementById('modalAdvancedModeToggle');
    const modalFormContainer = document.getElementById('modalFormContainer');
    
    if (!modal || !form || !title || !modalFormContainer) {
        console.error('Modal elements not found:', { modal: !!modal, form: !!form, title: !!title, container: !!modalFormContainer });
        return;
    }

    // Reset scenario selector to Conservative on every open
    currentModalScenario = 'conservative';
    document.querySelectorAll('.scenario-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.scenario === 'conservative');
    });
    
    // Reset group info fields
    document.getElementById('groupId').value = '';
    document.getElementById('groupName').value = '';
    document.getElementById('groupRegion').value = '';
    document.getElementById('groupLocation').value = '';
    
    // Get initial values - start with defaults from global config
    let initialValues = schemaLoader.getDefaultInputs();
    
    // Pre-fill server config from global settings
    const gc = connectorGroupManager.globalConfig;
    
    // Set preset selections (these use _presets object)
    initialValues._presets = {
        deploymentTypes: gc.deploymentType || 'bare-metal',
        cpuModels: gc.cpuPreset || 'xeon-gold-6548y',
        nicSpeeds: gc.nicSpeed || '1g'
    };
    
    // Set attribute values
    initialValues.memoryGB = gc.memoryGB || 16;
    
    // Default: reset advanced mode for new groups
    let shouldEnableAdvanced = false;
    
    if (groupId) {
        // Edit mode - load existing group values
        const group = connectorGroupManager.getConnectorGroup(groupId);
        if (!group) return;
        
        title.textContent = 'Edit Connector Group';
        document.getElementById('groupId').value = group.id;
        document.getElementById('groupName').value = group.name;
        document.getElementById('groupRegion').value = group.region;
        document.getElementById('groupLocation').value = group.location;

        // Resolve the workload profile preset that matches this group's totalUsers
        const workloadProfileId = (() => {
            const profiles = schemaLoader.getPresetOptionsById('workloadProfiles');
            if (group.totalUsers) {
                const match = profiles.find(p => p.totalUsers === group.totalUsers);
                if (match) return match.id;
            }
            // Fallback: match by concurrent users
            const concurrent = group.expectedConcurrentUsers || 50000;
            const fallback = profiles.find(p => Math.round(p.totalUsers * p.concurrentUserRatio) === concurrent);
            return fallback ? fallback.id : 'medium';
        })();
        
        // Map group data to schema input format
        initialValues = {
            // Workload
            expectedConcurrentUsers: group.expectedConcurrentUsers || 50000,
            requestsPerUser: group.requestsPerUser || 2,
            growthRate: group.growthRate || 10,
            numberOfApps: group.numberOfApps || 10,
            
            // CPU/Server config
            deploymentType: group.serverConfig?.deploymentType || gc.deploymentType || 'physical',
            cpuModel: group.serverConfig?.cpuPreset || gc.cpuPreset || 'Xeon Gold 6500',
            coresPerServer: group.serverConfig?.coresPerServer || 64,
            cpuCapacityPerCore: group.serverConfig?.cpuCapacityPerCore || 85,
            cpuCostPer1000: group.cpuCostPer1000 || 44.5,
            
            // Memory
            memoryGB: group.serverConfig?.memoryGB || gc.memoryGB || 16,
            memoryCostPer1000: group.memoryCostPer1000 || 512,
            baseIdleMemory: group.serverConfig?.baseIdleMemory || 512,
            
            // Network
            nicLinkSpeed: group.serverConfig?.nicLinkSpeed || gc.nicLinkSpeed || 1024,
            targetNicUtil: group.targetNicUtil || 80,
            mtuPayload: group.mtuPayload || 1460,
            nicOffloads: group.nicOffloads ?? true,
            nicCpuReduction: group.nicCpuReduction || 30,
            
            // Protocol
            avgRequestSize: group.avgRequestSizeKB || 2,
            avgResponseSize: group.avgResponseSizeKB || 16,
            protocolOverhead: group.protocolOverhead || 6,
            packetProcCost: group.packetProcCost || 0.02,
            appRequestMultiplier: group.appRequestMultiplier || 0.02,
            
            // Virtualization overhead
            virtCpuOverhead: group.serverConfig?.virtCpuOverhead || 0,
            virtMemoryOverhead: group.serverConfig?.virtMemoryOverhead || 0,
            virtNetworkOverhead: group.serverConfig?.virtNetworkOverhead || 0
        };

        // Restore preset selections for edit mode
        // NIC speed preset: use saved preset ID, or reverse-lookup from nicLinkSpeed
        const nicSpeedPresetId = (() => {
            if (group.nicSpeedPreset) return group.nicSpeedPreset;
            const nicMbps = group.serverConfig?.nicLinkSpeed;
            if (nicMbps) {
                const nicPresets = schemaLoader.getPresetOptionsById('nicSpeeds');
                const match = nicPresets.find(p => p.speedMbps === nicMbps);
                if (match) return match.id;
            }
            return gc.nicSpeed || '1g';
        })();

        initialValues._presets = {
            deploymentTypes: group.serverConfig?.deploymentType || gc.deploymentType || 'bare-metal',
            cpuModels: group.serverConfig?.cpuPreset || gc.cpuPreset || 'xeon-gold-6548y',
            nicSpeeds: nicSpeedPresetId,
            workloadProfiles: workloadProfileId,
            protocols: group.protocolPreset || undefined
        };
        
        shouldEnableAdvanced = group.protocolMix && (group.protocolMix.mode === 'blend' || group.protocolMix.mode === 'custom');
    } else {
        // Add mode
        console.log('Add mode: setting default values from global config');
        title.textContent = 'Add Connector Group';
    }
    
    // Store current modal inputs for live calculation
    currentModalInputs = initialValues;
    
    // Render the form using shared component (or update if already rendered)
    if (modalFormInstance) {
        modalFormInstance.setValues(initialValues);
    } else {
        modalFormInstance = schemaFormComponent.render(modalFormContainer, {
            idPrefix: 'modal_',
            includeProtocolBlending: true,
            initialValues: initialValues,
            onInputChange: (attrId, value, attr) => {
                // Update current modal inputs
                if (currentModalInputs) {
                    currentModalInputs[attrId] = value;
                    updateModalServerCount();
                }
            },
            onPresetChange: (presetId, optionId) => {
                // Apply preset values to form inputs and update current inputs
                const mappings = schemaFormComponent.applyPresetToInputs(presetId, optionId, 'modal_');
                if (currentModalInputs) {
                    Object.assign(currentModalInputs, mappings);
                    updateModalServerCount();
                }
            },
            onBlendingChange: (blendedValues) => {
                // Update protocol values from blending
                if (blendedValues && currentModalInputs) {
                    currentModalInputs.avgRequestSize = blendedValues.avgRequestSizeKB;
                    currentModalInputs.avgResponseSize = blendedValues.avgResponseSizeKB;
                    currentModalInputs.requestsPerUser = blendedValues.requestsPerUserPerSec;
                    updateModalServerCount();
                }
            }
        });
    }
    
    // Set advanced mode toggle state
    if (advancedToggle) {
        advancedToggle.checked = shouldEnableAdvanced;
        advancedMode = shouldEnableAdvanced;
        modal.classList.toggle('advanced-mode', shouldEnableAdvanced);
    }
    
    // Initial server count calculation
    updateModalServerCount();
    
    console.log('Showing modal...');
    modal.style.display = 'flex';
    console.log('Modal should now be visible');
}

// Helper functions to safely set field values
function setFieldValue(id, value, defaultValue) {
    const el = document.getElementById(id);
    if (el) el.value = value !== undefined && value !== null ? value : defaultValue;
}

function setCheckboxValue(id, value, defaultValue) {
    const el = document.getElementById(id);
    if (el) el.checked = value !== undefined && value !== null ? value : defaultValue;
}

function closeGroupModal() {
    document.getElementById('groupModal').style.display = 'none';
    currentModalInputs = null; // Clear modal inputs when closing
}

// ============================================
// Modal Server Count Update
// ============================================

function updateModalServerCount() {
    const badge = document.getElementById('modalServersCount');
    if (!badge || !currentModalInputs) return;

    try {
        const networkResults = calculateNetworkCapacity(currentModalInputs);
        const serverCounts = calculateServerCount(networkResults, currentModalInputs);
        const scenario = serverCounts[currentModalScenario] || serverCounts.conservative;
        const serversRequired = scenario.serversRequired;

        // Update server count badge
        const serverText = serversRequired === 1 ? 'server' : 'servers';
        badge.textContent = `${serversRequired} ${serverText} \u2014 ${currentModalScenario}`;
        badge.className = 'modal-servers-badge ' + (serversRequired === 1 ? 'single' : 'multiple');

        // Show/hide fault tolerance badge
        const faultToleranceBadge = document.getElementById('modalFaultToleranceBadge');
        if (faultToleranceBadge) {
            faultToleranceBadge.style.display = serversRequired < 2 ? 'flex' : 'none';
        }

        // Update actual demand metrics
        const wl = networkResults.requestedWorkload;
        const bwEl = document.getElementById('modalDemandBwVal');
        const coresEl = document.getElementById('modalDemandCoresVal');
        const memEl = document.getElementById('modalDemandMemoryVal');
        if (bwEl) bwEl.textContent = wl.bandwidth.bandwidthGbps.toFixed(2);
        if (coresEl) coresEl.textContent = Math.ceil(wl.cpu.actualCoresRequired);
        if (memEl) memEl.textContent = Math.ceil(wl.memory.totalMemoryGB);

    } catch (error) {
        console.error('Error calculating server count for modal:', error);
        badge.textContent = '1 server';
        badge.className = 'modal-servers-badge single';
    }
}

function saveConnectorGroup() {
    const form = document.getElementById('groupForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Validate group name and location are filled
    const groupName = document.getElementById('groupName').value.trim();
    const groupRegion = document.getElementById('groupRegion').value.trim();
    const groupLocation = document.getElementById('groupLocation').value.trim();
    
    if (!groupName || !groupRegion || !groupLocation) {
        alert('Please fill in Group Name, Region, and Location.');
        return;
    }
    
    const groupId = document.getElementById('groupId').value;
    
    // Get all sizing values from the shared form component
    const formValues = modalFormInstance ? modalFormInstance.getValues() : {};
    const protocolBlending = modalFormInstance ? modalFormInstance.getProtocolBlendingState() : null;
    
    // Map form values to group data structure
    const groupData = {
        // Group identification
        name: groupName,
        region: groupRegion,
        location: groupLocation,
        
        // Workload settings
        numberOfApps: parseInt(formValues.numberOfApps) || 10,
        expectedConcurrentUsers: parseInt(formValues.expectedConcurrentUsers) || 50000,
        totalUsers: (() => {
            const profileId = formValues._presets && formValues._presets.workloadProfiles;
            if (profileId) {
                const profile = schemaLoader.getPresetOptionsById('workloadProfiles').find(p => p.id === profileId);
                if (profile && profile.totalUsers) return profile.totalUsers;
            }
            // Fallback: reverse-calculate from concurrent users (ratio 0.3)
            return Math.round((parseInt(formValues.expectedConcurrentUsers) || 50000) / 0.3);
        })(),
        requestsPerUser: parseFloat(formValues.requestsPerUser) || 2,
        growthRate: parseFloat(formValues.growthRate) || 10,
        cpuCostPer1000: parseFloat(formValues.cpuCostPer1000) || 44.5,
        memoryCostPer1000: parseFloat(formValues.memoryCostPer1000) || 512,
        
        // Protocol settings
        avgRequestSizeKB: parseFloat(formValues.avgRequestSize) || 2,
        avgResponseSizeKB: parseFloat(formValues.avgResponseSize) || 16,
        packetProcCost: parseFloat(formValues.packetProcCost) || 0.02,
        protocolOverhead: parseFloat(formValues.protocolOverhead) || 6,
        appRequestMultiplier: parseFloat(formValues.appRequestMultiplier) || 0.02,
        
        // Network settings
        targetNicUtil: parseFloat(formValues.targetNicUtil) || 80,
        mtuPayload: parseInt(formValues.mtuPayload) || 1460,
        nicOffloads: formValues.nicOffloads ?? true,
        nicCpuReduction: parseFloat(formValues.nicCpuReduction) || 30,
        
        // All groups now store their full server config (no longer just "override")
        overrideServerConfig: true,
        serverConfig: {
            deploymentType: formValues.deploymentType || 'physical',
            cpuPreset: formValues.cpuModel || 'Xeon Gold 6500',
            memoryGB: parseInt(formValues.memoryGB) || 16,
            nicLinkSpeed: parseInt(formValues.nicLinkSpeed) || 1024,
            coresPerServer: parseInt(formValues.coresPerServer) || 64,
            cpuPerfMultiplier: (() => {
                const cpuPresetId = formValues._presets && formValues._presets.cpuModels;
                if (cpuPresetId) {
                    const cpuPresets = schemaLoader.getPresetOptionsById('cpuModels');
                    const match = cpuPresets.find(p => p.id === cpuPresetId);
                    if (match && match.cpuPerfMultiplier) return match.cpuPerfMultiplier;
                }
                return parseFloat(formValues.cpuPerfMultiplier) || 1.59;
            })(),
            cpuCapacityPerCore: parseFloat(formValues.cpuCapacityPerCore) || 85,
            baseIdleMemory: parseInt(formValues.baseIdleMemory) || 512,
            virtCpuOverhead: parseFloat(formValues.virtCpuOverhead) || 0,
            virtMemoryOverhead: parseFloat(formValues.virtMemoryOverhead) || 0,
            virtNetworkOverhead: parseFloat(formValues.virtNetworkOverhead) || 0
        },
        
        // Preset IDs for restoring dropdown selections on re-edit
        nicSpeedPreset: formValues._presets ? formValues._presets.nicSpeeds : undefined,
        protocolPreset: formValues._presets ? formValues._presets.protocols : undefined,

        // Protocol blending state
        protocolMix: protocolBlending ? JSON.parse(JSON.stringify(protocolBlending)) : {
            mode: 'single',
            protocols: [{ id: 'generic', weight: 100 }],
            computed: {
                avgRequestSizeKB: parseFloat(formValues.avgRequestSize) || 2,
                avgResponseSizeKB: parseFloat(formValues.avgResponseSize) || 16,
                requestsPerUserPerSec: parseFloat(formValues.requestsPerUser) || 1
            }
        }
    };
    
    try {
        if (groupId) {
            connectorGroupManager.updateConnectorGroup(groupId, groupData);
        } else {
            connectorGroupManager.addConnectorGroup(groupData);
        }
        
        closeGroupModal();
        renderAll();
    } catch (e) {
        alert(e.message);
    }
}

// ============================================
// Delete Modal
// ============================================

function openDeleteModal(groupId) {
    const group = connectorGroupManager.getConnectorGroup(groupId);
    if (!group) return;
    
    groupToDelete = groupId;
    document.getElementById('deleteGroupName').textContent = group.name;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    groupToDelete = null;
}

function confirmDelete() {
    if (groupToDelete) {
        connectorGroupManager.deleteConnectorGroup(groupToDelete);
        closeDeleteModal();
        renderAll();
    }
}

// ============================================
// Import/Export
// ============================================

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset file input immediately to prevent issues
    const fileInput = e.target;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        // Use setTimeout to break out of the event loop and prevent browser hangs
        setTimeout(() => {
            try {
                const result = connectorGroupManager.importFromJSON(event.target.result);
                // Update the Configuration Name input field
                const configNameInput = document.getElementById('configName');
                if (configNameInput && connectorGroupManager.configName) {
                    configNameInput.value = connectorGroupManager.configName;
                }
                alert(`Successfully imported ${result.count} connector groups.`);
                initializeUI();
                renderAll();
            } catch (error) {
                alert('Import failed: ' + error.message);
            }
        }, 10);
    };
    
    reader.onerror = () => {
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
    
    // Reset file input after a short delay
    setTimeout(() => {
        fileInput.value = '';
    }, 100);
}

function handleExport() {
    if (connectorGroupManager.connectorGroups.length === 0) {
        alert('No connector groups to export. Please add at least one connector group.');
        return;
    }
    connectorGroupManager.downloadJSON();
}

function handleExportPDF() {
    // Check if jsPDF is available
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF export library is not loaded. Please check your internet connection or try again.');
        return;
    }
    
    if (connectorGroupManager.connectorGroups.length === 0) {
        alert('No connector groups to export. Please add at least one connector group.');
        return;
    }
    
    // Gather multi-site data
    const multiSiteData = {
        configName: connectorGroupManager.configName,
        globalConfig: connectorGroupManager.globalConfig
    };
    
    // Get all connector groups with their results
    const groups = connectorGroupManager.getAllConnectorGroups();
    
    // Calculate summary
    const summary = {
        totalGroups: groups.length,
        totalServers: groups.reduce((sum, g) => sum + (g.results ? g.results.serversRequired : 0), 0),
        totalUsers: groups.reduce((sum, g) => sum + (g.totalUsers || 0), 0),
        totalApps: groups.reduce((sum, g) => sum + (g.numberOfApps || 0), 0)
    };
    
    // Export the PDF
    if (window.pdfExport && window.pdfExport.exportMultiSitePDF) {
        window.pdfExport.exportMultiSitePDF(multiSiteData, groups, summary);
    } else {
        alert('PDF export module is not available. Please refresh the page and try again.');
    }
}

function handleStartNew() {
    if (connectorGroupManager.connectorGroups.length === 0) {
        alert('No connector groups to clear. The configuration is already empty.');
        return;
    }
    
    const confirmed = confirm(
        `Are you sure you want to start a new configuration?\n\n` +
        `This will permanently remove all ${connectorGroupManager.connectorGroups.length} connector group(s) from the current configuration.\n\n` +
        `This action cannot be undone.`
    );
    
    if (confirmed) {
        connectorGroupManager.clearStorage();
        initializeUI();
        renderAll();
    }
}

// ============================================
// Rendering
// ============================================

/**
 * Sort groups by column
 */
function sortGroups(groups, column, direction) {
    const sorted = [...groups];
    
    sorted.sort((a, b) => {
        let aVal, bVal;
        
        switch(column) {
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
            case 'region':
                aVal = a.region.toLowerCase();
                bVal = b.region.toLowerCase();
                break;
            case 'location':
                aVal = a.location.toLowerCase();
                bVal = b.location.toLowerCase();
                break;
            case 'networkio':
                aVal = a.results && a.results.networkResults
                    ? a.results.networkResults.requestedWorkload.bandwidth.bandwidthGbps
                    : -1;
                bVal = b.results && b.results.networkResults
                    ? b.results.networkResults.requestedWorkload.bandwidth.bandwidthGbps
                    : -1;
                break;
            case 'users':
                aVal = a.totalUsers || 0;
                bVal = b.totalUsers || 0;
                break;
            case 'servers':
                aVal = a.results ? a.results.serversRequired : 0;
                bVal = b.results ? b.results.serversRequired : 0;
                break;
            case 'limiting':
                aVal = a.results ? a.results.limitingFactor.toLowerCase() : '';
                bVal = b.results ? b.results.limitingFactor.toLowerCase() : '';
                break;
            default:
                return 0;
        }
        
        // Handle numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // Handle string comparison
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    return sorted;
}

/**
 * Handle sort column click
 */
function handleSortClick(column) {
    if (currentSortColumn === column) {
        // Toggle direction
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default to ascending
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    renderGroupsTable();
}

function renderAll() {
    renderGroupsTable();
    renderSummary();
    renderResults();
}

function renderGroupsTable() {
    const tbody = document.getElementById('groupsTableBody');
    const emptyState = document.getElementById('emptyState');
    let groups = connectorGroupManager.getAllConnectorGroups();
    
    if (groups.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort groups
    groups = sortGroups(groups, currentSortColumn, currentSortDirection);
    
    // Update table headers with sort indicators
    updateTableHeaders();
    
    // Sort groups
    groups = sortGroups(groups, currentSortColumn, currentSortDirection);
    
    // Update table headers with sort indicators
    updateTableHeaders();
    
    tbody.innerHTML = groups.map(group => {
        const networkIO = group.results && group.results.networkResults
            ? group.results.networkResults.requestedWorkload.bandwidth.bandwidthGbps.toFixed(2) + ' Gbps'
            : '-';
        const limitingClass = group.results ? group.results.limitingFactor.toLowerCase() : '';
        
        const serversDisplay = group.results && group.results.serversRequired < 2 
            ? `${group.results.serversRequired} <span class="ha-note">(+1 for HA)</span>` 
            : (group.results ? group.results.serversRequired : '-');
        
        return `
            <tr>
                <td><strong>${escapeHtml(group.name)}</strong></td>
                <td>${escapeHtml(group.region)}</td>
                <td>${escapeHtml(group.location)}</td>
                <td>${networkIO}</td>
                <td>${formatNumber(group.totalUsers || 0)}</td>
                <td class="result-col"><strong>${serversDisplay}</strong></td>
                <td class="result-col">
                    ${group.results 
                        ? `<span class="limiting-factor ${limitingClass}">${group.results.limitingFactor}</span>` 
                        : '-'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit" onclick="openGroupModal('${group.id}')" title="Edit">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="btn-icon delete" onclick="openDeleteModal('${group.id}')" title="Delete">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update table headers with sort indicators
 */
function updateTableHeaders() {
    const headers = document.querySelectorAll('#groupsTable th[data-sort]');
    headers.forEach(th => {
        const column = th.dataset.sort;
        const arrow = th.querySelector('.sort-arrow');
        
        if (column === currentSortColumn) {
            th.classList.add('sorted');
            arrow.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
            arrow.style.opacity = '1';
        } else {
            th.classList.remove('sorted');
            arrow.textContent = '▲';
            arrow.style.opacity = '0.3';
        }
    });
}

function renderSummary() {
    const summaryPanel = document.getElementById('summaryPanel');
    const groups = connectorGroupManager.getAllConnectorGroups();
    
    if (groups.length === 0) {
        summaryPanel.style.display = 'none';
        return;
    }
    
    summaryPanel.style.display = 'block';
    const summary = connectorGroupManager.getSummary();
    
    document.getElementById('totalGroups').textContent = summary.totalGroups;
    document.getElementById('totalUsers').textContent = formatNumber(summary.totalUsers);
    document.getElementById('totalServers').textContent = summary.totalServers;
    document.getElementById('totalRegions').textContent = summary.totalRegions;
}

function renderResults() {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const groups = connectorGroupManager.getAllConnectorGroups();
    
    if (groups.length === 0) {
        resultsSection.style.display = 'none';
        return;
    }
    
    resultsSection.style.display = 'block';
    const summary = connectorGroupManager.getSummary();
    
    resultsContainer.innerHTML = Object.entries(summary.byRegion).map(([region, data], index) => {
        const regionId = 'region-' + index;
        return `
            <div class="region-group">
                <div class="region-header" onclick="toggleRegion('${regionId}')">
                    <div class="region-header-left">
                        <span class="region-expander" id="${regionId}-expander">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M7 10l5 5 5-5z"/>
                            </svg>
                        </span>
                        <span>${escapeHtml(region)}</span>
                    </div>
                    <div class="region-stats">
                        <span>📍 ${data.groups.length} group${data.groups.length > 1 ? 's' : ''}</span>
                        <span>👥 ${formatNumber(data.totalUsers)} users</span>
                        <span>🖥️ ${data.totalServers} server${data.totalServers > 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="region-content" id="${regionId}-content">
                    <div class="site-cards">
                        ${data.groups.map(group => renderSiteCard(group)).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSiteCard(group) {
    const limitingClass = group.results ? group.results.limitingFactor.toLowerCase() : '';
    const cpuPreset = group.overrideServerConfig && group.serverConfig?.cpuPreset 
        ? group.serverConfig.cpuPreset.split('(')[0].trim()
        : connectorGroupManager.globalConfig.cpuPreset.split('(')[0].trim();
    
    return `
        <div class="site-card">
            <div class="site-card-header">
                <div>
                    <div class="site-card-title">${escapeHtml(group.name)}</div>
                    <div class="site-card-location">${escapeHtml(group.location)}</div>
                </div>
                <div class="site-card-servers">
                    <div class="server-count">${group.results ? group.results.serversRequired : '-'}</div>
                    <div class="server-label">Servers</div>
                    ${group.results && group.results.serversRequired < 2 ? '<div class="ha-badge">⚠️ +1 for HA</div>' : ''}
                </div>
            </div>
            <div class="site-card-details">
                <div class="detail-item">
                    <span class="detail-label">Users</span>
                    <span class="detail-value">${formatNumber(group.totalUsers || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Network I/O</span>
                    <span class="detail-value">${group.results && group.results.networkResults ? group.results.networkResults.requestedWorkload.bandwidth.bandwidthGbps.toFixed(2) + ' Gbps' : '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Cores Required</span>
                    <span class="detail-value">${group.results && group.results.networkResults ? Math.ceil(group.results.networkResults.scenarios.balanced.actualCoresRequired) : '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Limiting Factor</span>
                    <span class="detail-value">
                        <span class="limiting-factor ${limitingClass}">
                            ${group.results ? group.results.limitingFactor : '-'}
                        </span>
                    </span>
                </div>
                <div class="detail-item" style="grid-column: span 2;">
                    <span class="detail-label">CPU</span>
                    <span class="detail-value">${cpuPreset}</span>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// Expander/Collapse Functions
// ============================================

function toggleGroupsTable() {
    const expander = document.getElementById('groupsExpander');
    const tableContainer = document.querySelector('.table-container');
    
    expander.classList.toggle('collapsed');
    tableContainer.classList.toggle('collapsed');
}

function toggleRegion(regionId) {
    const expander = document.getElementById(regionId + '-expander');
    const content = document.getElementById(regionId + '-content');
    
    if (expander && content) {
        expander.classList.toggle('collapsed');
        content.classList.toggle('collapsed');
    }
}

// ============================================
// Utility Functions
// ============================================

function formatNumber(num) {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'k';
    }
    return num.toString();
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
// Expose functions to global scope (for inline onclick handlers)
// ============================================

window.openGroupModal = openGroupModal;
window.openDeleteModal = openDeleteModal;
window.handleSortClick = handleSortClick;

