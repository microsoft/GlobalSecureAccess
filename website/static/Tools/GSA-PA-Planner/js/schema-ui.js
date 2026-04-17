/**
 * Schema UI Module
 * Reusable UI components for schema-driven forms
 * Used by both single-site and multi-site test pages
 */

(function(global) {
    'use strict';

    // ============================================
    // Protocol Blending State (shared)
    // ============================================
    
    let protocolBlendingState = {
        mode: 'single',  // 'single' or 'blended'
        protocols: [],   // Array of { id, weight }
        computed: {      // Weighted average values
            avgRequestSizeKB: 2,
            avgResponseSizeKB: 16,
            requestsPerUserPerSec: 1
        }
    };

    // Callback for when blending values change
    let onBlendingChange = null;

    // ============================================
    // Form Generation Functions
    // ============================================

    /**
     * Generate a complete form from schema
     * @param {HTMLElement} container - The container element
     * @param {Object} options - Options { onInputChange, onPresetChange, includeProtocolBlending }
     * @returns {Object} Object with references to created elements
     */
    function generateForm(container, options = {}) {
        const schema = schemaLoader.getSchema();
        const presets = schemaLoader.getPresets();
        
        container.innerHTML = '';
        
        // Sort categories by order
        const sortedCategories = [...schema.categories].sort((a, b) => a.order - b.order);

        for (const category of sortedCategories) {
            const section = document.createElement('div');
            section.className = 'section';
            section.innerHTML = `<h3>${category.name}</h3>`;

            // Sort sub-categories by order
            const sortedSubCategories = [...category.subCategories].sort((a, b) => a.order - b.order);

            for (const subCat of sortedSubCategories) {
                // Check if there's a preset for this sub-category
                const presetDef = schemaLoader.getPresetFor(category.id, subCat.id);

                if (presetDef) {
                    section.appendChild(createPresetSelector(presetDef, presets[presetDef.id], options.onPresetChange));
                    
                    // Add protocol blending UI after the protocols preset (advanced mode only)
                    if (presetDef.id === 'protocols' && options.includeProtocolBlending !== false) {
                        section.appendChild(createProtocolBlendingUI());
                    }
                }

                // Get attributes for this sub-category
                const attributes = schemaLoader.getAttributesFor(category.id, subCat.id);

                for (const attr of attributes) {
                    section.appendChild(createAttributeField(attr, options.onInputChange));
                }
            }

            container.appendChild(section);
        }
        
        return { container };
    }

    /**
     * Create a preset selector dropdown
     * @param {Object} presetDef - The preset definition from schema
     * @param {Object} presetData - The preset data
     * @param {Function} onChange - Callback when preset changes
     * @returns {HTMLElement}
     */
    function createPresetSelector(presetDef, presetData, onChange) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.id = `preset_${presetDef.id}_wrapper`; // Add wrapper ID for show/hide control

        const label = document.createElement('label');
        label.htmlFor = `preset_${presetDef.id}`;
        label.textContent = presetDef.name;

        const select = document.createElement('select');
        select.id = `preset_${presetDef.id}`;
        select.dataset.presetId = presetDef.id;

        if (presetData) {
            const options = schemaLoader.getPresetOptions(presetData);

            for (const opt of options) {
                const option = document.createElement('option');
                option.value = opt.id;
                
                // Build option text with details
                let text = opt.icon ? `${opt.icon} ` : '';
                text += opt.name;
                if (opt.coresPerServer) text += ` - ${opt.coresPerServer} cores`;
                if (opt.totalUsers) text += ` (${opt.totalUsers.toLocaleString()} users)`;
                // Note: Removed speedMbps display for NIC - name already includes speed (e.g., "10 Gbps")
                option.textContent = text;
                if (opt.isDefault) option.selected = true;
                select.appendChild(option);
            }
        }

        if (onChange) {
            select.addEventListener('change', (e) => {
                onChange(presetDef.id, e.target.value);
            });
        }

        div.appendChild(label);
        div.appendChild(select);
        return div;
    }

    /**
     * Create an attribute input field
     * @param {Object} attr - The attribute definition
     * @param {Function} onChange - Callback when value changes
     * @returns {HTMLElement}
     */
    function createAttributeField(attr, onChange) {
        const div = document.createElement('div');
        div.className = 'form-group';
        if (attr.advanced) {
            div.classList.add('advanced-only');
        }

        const label = document.createElement('label');
        label.htmlFor = `attr_${attr.id}`;
        label.textContent = attr.unit ? `${attr.name} (${attr.unit})` : attr.name;
        if (attr.description) {
            label.title = attr.description;
        }

        let input;
        if (attr.type === 'boolean') {
            // Create checkbox with label wrapper
            const checkLabel = document.createElement('label');
            checkLabel.className = 'checkbox-label';
            
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = attr.default;
            input.id = `attr_${attr.id}`;
            input.dataset.attrId = attr.id;
            
            if (onChange) {
                input.addEventListener('change', (e) => {
                    onChange(attr.id, e.target.checked, attr);
                });
            }
            
            checkLabel.appendChild(input);
            checkLabel.appendChild(document.createTextNode(` ${attr.name}`));
            
            div.appendChild(checkLabel);
            return div;
        } else {
            input = document.createElement('input');
            input.type = 'number';
            input.value = attr.default;
            if (attr.min !== undefined) input.min = attr.min;
            if (attr.max !== undefined) input.max = attr.max;
            if (attr.step !== undefined) input.step = attr.step;
        }

        input.id = `attr_${attr.id}`;
        input.dataset.attrId = attr.id;

        if (onChange) {
            input.addEventListener('input', (e) => {
                onChange(attr.id, parseFloat(e.target.value) || 0, attr);
            });
        }

        div.appendChild(label);
        div.appendChild(input);

        return div;
    }

    // ============================================
    // Protocol Blending UI
    // ============================================

    /**
     * Create protocol blending UI container
     * @returns {HTMLElement}
     */
    function createProtocolBlendingUI() {
        const container = document.createElement('div');
        container.className = 'protocol-blending-container advanced-only';
        container.innerHTML = `
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="enableProtocolBlending">
                    Enable Protocol Blending
                </label>
                <small class="field-hint">Combine multiple protocols with weighted percentages</small>
            </div>
            
            <div id="protocolBlendingPanel" class="protocol-blending-panel" style="display: none;">
                <div id="protocolMixList" class="protocol-mix-list">
                </div>
                <button type="button" id="addProtocolBtn" class="btn btn-small btn-outline">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add Protocol
                </button>
                <div id="protocolWeightTotal" class="protocol-weight-total">
                    Total Weight: <span id="totalWeightValue">0</span>% 
                    <span id="weightStatus" class="weight-status"></span>
                </div>
            </div>
            
            <div id="effectiveProtocolValues" class="effective-values" style="display: none;">
                <div class="effective-values-header">Effective Blended Values:</div>
                <div class="effective-values-grid">
                    <div class="effective-value">
                        <span class="effective-label">Request Size:</span>
                        <span id="effectiveRequestSize" class="effective-number">2 KB</span>
                    </div>
                    <div class="effective-value">
                        <span class="effective-label">Response Size:</span>
                        <span id="effectiveResponseSize" class="effective-number">16 KB</span>
                    </div>
                    <div class="effective-value">
                        <span class="effective-label">Requests/Sec:</span>
                        <span id="effectiveReqPerSec" class="effective-number">2</span>
                    </div>
                </div>
            </div>
        `;
        return container;
    }

    /**
     * Setup protocol blending event listeners
     * @param {Function} callback - Called when blending values change with { avgRequestSize, avgResponseSize, requestsPerUser }
     */
    function setupProtocolBlending(callback) {
        onBlendingChange = callback;
        
        const enableBlending = document.getElementById('enableProtocolBlending');
        const addProtocolBtn = document.getElementById('addProtocolBtn');
        
        if (enableBlending) {
            enableBlending.addEventListener('change', handleProtocolBlendingToggle);
        }
        
        if (addProtocolBtn) {
            addProtocolBtn.addEventListener('click', handleAddProtocol);
        }
    }

    /**
     * Check if protocol blending is enabled
     * @returns {boolean}
     */
    function isProtocolBlendingEnabled() {
        const checkbox = document.getElementById('enableProtocolBlending');
        return checkbox ? checkbox.checked : false;
    }

    /**
     * Get current protocol blending state
     * @returns {Object}
     */
    function getProtocolBlendingState() {
        return { ...protocolBlendingState };
    }

    /**
     * Reset protocol blending state
     */
    function resetProtocolBlending() {
        protocolBlendingState = {
            mode: 'single',
            protocols: [],
            computed: {
                avgRequestSizeKB: 2,
                avgResponseSizeKB: 16,
                requestsPerUserPerSec: 1
            }
        };
    }

    // Internal functions for protocol blending
    function handleProtocolBlendingToggle() {
        const enabled = document.getElementById('enableProtocolBlending').checked;
        const panel = document.getElementById('protocolBlendingPanel');
        const effectiveValues = document.getElementById('effectiveProtocolValues');
        const protocolSelect = document.getElementById('preset_protocols');
        
        if (panel) panel.style.display = enabled ? 'block' : 'none';
        if (effectiveValues) effectiveValues.style.display = enabled ? 'block' : 'none';
        if (protocolSelect) protocolSelect.disabled = enabled;
        
        if (enabled) {
            protocolBlendingState.mode = 'blended';
            if (protocolBlendingState.protocols.length === 0) {
                const currentPreset = protocolSelect ? protocolSelect.value : 'generic';
                protocolBlendingState.protocols = [{ id: currentPreset, weight: 50 }];
            }
            renderProtocolMixList();
        } else {
            protocolBlendingState.mode = 'single';
        }
        
        updateEffectiveValues();
        
        if (onBlendingChange) {
            onBlendingChange(protocolBlendingState.computed);
        }
    }

    function handleAddProtocol() {
        const protocolOptions = schemaLoader.getPresetOptionsById('protocols');
        const usedIds = protocolBlendingState.protocols.map(p => p.id);
        const available = protocolOptions.find(p => !usedIds.includes(p.id));
        
        if (available) {
            protocolBlendingState.protocols.push({ id: available.id, weight: 0 });
            renderProtocolMixList();
        } else {
            alert('All protocols have been added to the mix.');
        }
    }

    function renderProtocolMixList() {
        const list = document.getElementById('protocolMixList');
        if (!list) return;
        
        const protocolOptions = schemaLoader.getPresetOptionsById('protocols');
        
        list.innerHTML = protocolBlendingState.protocols.map((item, index) => {
            const protocol = protocolOptions.find(p => p.id === item.id);
            
            return `
                <div class="protocol-mix-item" data-index="${index}">
                    <select class="protocol-mix-select" data-index="${index}">
                        ${protocolOptions.map(p => 
                            `<option value="${p.id}" ${p.id === item.id ? 'selected' : ''}>${p.icon} ${p.name}</option>`
                        ).join('')}
                    </select>
                    <div class="weight-input-group">
                        <input type="number" class="protocol-mix-weight" value="${item.weight}" min="0" max="100" data-index="${index}">
                        <span class="weight-suffix">%</span>
                    </div>
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
        protocolBlendingState.protocols[index].id = event.target.value;
        recalculateBlendedValues();
    }

    function handleProtocolMixWeightChange(event) {
        const index = parseInt(event.target.dataset.index);
        protocolBlendingState.protocols[index].weight = parseInt(event.target.value) || 0;
        updateWeightTotal();
        recalculateBlendedValues();
    }

    function handleProtocolMixRemove(event) {
        const index = parseInt(event.target.closest('.btn-remove').dataset.index);
        protocolBlendingState.protocols.splice(index, 1);
        renderProtocolMixList();
        recalculateBlendedValues();
    }

    function updateWeightTotal() {
        const total = protocolBlendingState.protocols.reduce((sum, p) => sum + p.weight, 0);
        const totalEl = document.getElementById('totalWeightValue');
        const statusEl = document.getElementById('weightStatus');
        
        if (totalEl) totalEl.textContent = total;
        if (statusEl) {
            if (total === 100) {
                statusEl.textContent = '✓';
                statusEl.className = 'weight-status valid';
            } else if (total < 100) {
                statusEl.textContent = `(${100 - total}% remaining)`;
                statusEl.className = 'weight-status warning';
            } else {
                statusEl.textContent = `(${total - 100}% over)`;
                statusEl.className = 'weight-status error';
            }
        }
    }

    function recalculateBlendedValues() {
        const protocolOptions = schemaLoader.getPresetOptionsById('protocols');
        const totalWeight = protocolBlendingState.protocols.reduce((sum, p) => sum + p.weight, 0);
        
        if (totalWeight === 0) {
            protocolBlendingState.computed = {
                avgRequestSizeKB: 2,
                avgResponseSizeKB: 16,
                requestsPerUserPerSec: 1
            };
        } else {
            let weightedReqSize = 0;
            let weightedRespSize = 0;
            let weightedReqPerSec = 0;
            
            for (const item of protocolBlendingState.protocols) {
                const protocol = protocolOptions.find(p => p.id === item.id);
                if (protocol && item.weight > 0) {
                    const normalizedWeight = item.weight / totalWeight;
                    weightedReqSize += protocol.avgRequestSizeKB * normalizedWeight;
                    weightedRespSize += protocol.avgResponseSizeKB * normalizedWeight;
                    weightedReqPerSec += protocol.typicalRequestsPerSec * normalizedWeight;
                }
            }
            
            protocolBlendingState.computed = {
                avgRequestSizeKB: Math.round(weightedReqSize * 100) / 100,
                avgResponseSizeKB: Math.round(weightedRespSize * 100) / 100,
                requestsPerUserPerSec: Math.round(weightedReqPerSec * 100) / 100
            };
        }
        
        updateEffectiveValues();
        
        if (onBlendingChange) {
            onBlendingChange(protocolBlendingState.computed);
        }
    }

    function updateEffectiveValues() {
        const effectiveReqSize = document.getElementById('effectiveRequestSize');
        const effectiveRespSize = document.getElementById('effectiveResponseSize');
        const effectiveReqPerSec = document.getElementById('effectiveReqPerSec');
        
        if (effectiveReqSize) effectiveReqSize.textContent = `${protocolBlendingState.computed.avgRequestSizeKB} KB`;
        if (effectiveRespSize) effectiveRespSize.textContent = `${protocolBlendingState.computed.avgResponseSizeKB} KB`;
        if (effectiveReqPerSec) effectiveReqPerSec.textContent = protocolBlendingState.computed.requestsPerUserPerSec;
    }

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Apply a preset's values to input fields
     * @param {string} presetId - The preset ID
     * @param {string} optionId - The selected option ID
     * @param {Object} currentInputs - The current inputs object to update
     * @param {boolean} skipProtocolValues - Skip protocol values if blending is enabled
     * @returns {Object} The mappings that were applied
     */
    function applyPresetToInputs(presetId, optionId, currentInputs, skipProtocolValues = false) {
        const presetData = schemaLoader.getPreset(presetId);
        if (!presetData) return {};

        const options = schemaLoader.getPresetOptions(presetData);
        const selected = options.find(o => o.id === optionId);
        if (!selected) return {};

        let mappings = schemaLoader.mapPresetToInputs(presetId, selected);
        
        // Skip protocol values if blending is enabled
        if (skipProtocolValues) {
            delete mappings['avgRequestSize'];
            delete mappings['avgResponseSize'];
            delete mappings['requestsPerUser'];
        }

        // Apply mappings to currentInputs and update DOM
        for (const [attrId, value] of Object.entries(mappings)) {
            if (value !== undefined) {
                currentInputs[attrId] = value;
                const input = document.getElementById(`attr_${attrId}`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = value;
                    } else {
                        input.value = value;
                    }
                }
            }
        }

        return mappings;
    }

    /**
     * Apply initial presets (default selections)
     * @param {Object} currentInputs - The inputs object to update
     * @param {Function} onPresetApplied - Callback after each preset is applied
     */
    function applyInitialPresets(currentInputs, onPresetApplied) {
        document.querySelectorAll('[data-preset-id]').forEach(select => {
            if (select.value) {
                applyPresetToInputs(select.dataset.presetId, select.value, currentInputs, isProtocolBlendingEnabled());
                if (onPresetApplied) {
                    onPresetApplied(select.dataset.presetId, select.value);
                }
            }
        });
    }

    /**
     * Setup deployment type handling to show/hide CPU model preset
     * For VM-based deployments, the CPU model is determined by the cloud/VM provider
     * @param {Function} onDeploymentChange - Optional callback when deployment type changes
     */
    function setupDeploymentTypeHandling(onDeploymentChange) {
        const deploymentSelect = document.getElementById('preset_deploymentTypes');
        const cpuModelWrapper = document.getElementById('preset_cpuModels_wrapper');
        
        if (!deploymentSelect || !cpuModelWrapper) {
            console.warn('Deployment type or CPU model elements not found');
            return;
        }
        
        // Function to update CPU model visibility
        function updateCpuModelVisibility(deploymentTypeId) {
            const isBareMetalOrCustom = deploymentTypeId === 'bare-metal';
            
            if (isBareMetalOrCustom) {
                cpuModelWrapper.style.display = '';
                cpuModelWrapper.classList.remove('hidden');
            } else {
                cpuModelWrapper.style.display = 'none';
                cpuModelWrapper.classList.add('hidden');
            }
            
            if (onDeploymentChange) {
                onDeploymentChange(deploymentTypeId, isBareMetalOrCustom);
            }
        }
        
        // Initial state
        updateCpuModelVisibility(deploymentSelect.value);
        
        // Listen for changes
        deploymentSelect.addEventListener('change', (e) => {
            updateCpuModelVisibility(e.target.value);
        });
    }

    /**
     * Check if the current deployment type is bare metal
     * @returns {boolean}
     */
    function isBareMetalDeployment() {
        const deploymentSelect = document.getElementById('preset_deploymentTypes');
        return deploymentSelect ? deploymentSelect.value === 'bare-metal' : true;
    }

    // Export to global scope
    global.schemaUI = {
        generateForm,
        createPresetSelector,
        createAttributeField,
        createProtocolBlendingUI,
        setupProtocolBlending,
        isProtocolBlendingEnabled,
        getProtocolBlendingState,
        resetProtocolBlending,
        applyPresetToInputs,
        applyInitialPresets,
        setupDeploymentTypeHandling,
        isBareMetalDeployment
    };

})(typeof window !== 'undefined' ? window : this);
