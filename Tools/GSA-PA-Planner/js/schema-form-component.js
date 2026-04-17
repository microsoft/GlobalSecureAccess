/**
 * Schema Form Component Module
 * 
 * A reusable form component that renders sizing planner inputs from schema.
 * Used by both single-site page and multi-site modal to ensure consistent UI.
 * 
 * Features:
 * - ID prefixing for multiple instances on same page
 * - Get/set form values programmatically
 * - Pre-fill with default or existing values
 * - Protocol blending support per instance
 */

(function(global) {
    'use strict';

    // Store for multiple form instances (keyed by idPrefix)
    const formInstances = {};

    /**
     * Render the sizing input form into a container
     * @param {HTMLElement} container - The container element to render into
     * @param {Object} options - Configuration options
     *   - idPrefix: string - Prefix for all element IDs (e.g., 'modal_')
     *   - includeProtocolBlending: boolean - Include protocol blending UI
     *   - onInputChange: function(attrId, value, attr) - Callback when input changes
     *   - onPresetChange: function(presetId, optionId) - Callback when preset changes
     *   - initialValues: Object - Initial values to populate (defaults to schema defaults)
     * @returns {Object} Form instance with methods to interact with the form
     */
    function render(container, options = {}) {
        const idPrefix = options.idPrefix || '';
        const includeProtocolBlending = options.includeProtocolBlending !== false;
        const onInputChange = options.onInputChange || (() => {});
        const onPresetChange = options.onPresetChange || (() => {});
        const initialValues = options.initialValues || schemaLoader.getDefaultInputs();

        // Store the instance
        const instance = {
            idPrefix,
            container,
            protocolBlendingState: {
                mode: 'single',
                protocols: [],
                computed: {
                    avgRequestSizeKB: 2,
                    avgResponseSizeKB: 16,
                    requestsPerUserPerSec: 1
                }
            },
            onBlendingChange: options.onBlendingChange || null
        };
        formInstances[idPrefix] = instance;

        // Generate the form HTML
        generateFormHTML(container, idPrefix, includeProtocolBlending);

        // Apply initial values
        setValues(initialValues, idPrefix);

        // Setup event listeners
        setupFormEventListeners(idPrefix, onInputChange, onPresetChange);

        // Setup protocol blending if enabled
        if (includeProtocolBlending) {
            setupProtocolBlendingForInstance(idPrefix);
        }

        // Setup deployment type handling (hide CPU model for VMs)
        setupDeploymentTypeForInstance(idPrefix);

        return {
            getValues: () => getValues(idPrefix),
            setValues: (values) => setValues(values, idPrefix),
            getProtocolBlendingState: () => instance.protocolBlendingState,
            setProtocolBlendingState: (state) => setProtocolBlendingState(state, idPrefix),
            destroy: () => destroy(idPrefix)
        };
    }

    /**
     * Generate form HTML with prefixed IDs
     */
    function generateFormHTML(container, idPrefix, includeProtocolBlending) {
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
                    section.appendChild(createPresetSelector(presetDef, presets[presetDef.id], idPrefix));

                    // Add protocol blending UI after the protocols preset (advanced mode only)
                    if (presetDef.id === 'protocols' && includeProtocolBlending) {
                        section.appendChild(createProtocolBlendingUI(idPrefix));
                    }
                }

                // Get attributes for this sub-category
                const attributes = schemaLoader.getAttributesFor(category.id, subCat.id);

                for (const attr of attributes) {
                    section.appendChild(createAttributeField(attr, idPrefix));
                }
            }

            container.appendChild(section);
        }
    }

    /**
     * Create a preset selector dropdown with prefixed ID
     */
    function createPresetSelector(presetDef, presetData, idPrefix) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.id = `${idPrefix}preset_${presetDef.id}_wrapper`;

        const label = document.createElement('label');
        label.htmlFor = `${idPrefix}preset_${presetDef.id}`;
        label.textContent = presetDef.name;

        const select = document.createElement('select');
        select.id = `${idPrefix}preset_${presetDef.id}`;
        select.dataset.presetId = presetDef.id;
        select.dataset.idPrefix = idPrefix;

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
                option.textContent = text;
                if (opt.isDefault) option.selected = true;
                select.appendChild(option);
            }
        }

        div.appendChild(label);
        div.appendChild(select);
        return div;
    }

    /**
     * Create an attribute input field with prefixed ID
     */
    function createAttributeField(attr, idPrefix) {
        const div = document.createElement('div');
        div.className = 'form-group';
        if (attr.advanced) {
            div.classList.add('advanced-only');
        }

        const label = document.createElement('label');
        label.htmlFor = `${idPrefix}attr_${attr.id}`;
        label.textContent = attr.unit ? `${attr.name} (${attr.unit})` : attr.name;
        if (attr.description) {
            label.title = attr.description;
        }

        let input;
        if (attr.type === 'boolean') {
            const checkLabel = document.createElement('label');
            checkLabel.className = 'checkbox-label';

            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = attr.default;
            input.id = `${idPrefix}attr_${attr.id}`;
            input.dataset.attrId = attr.id;
            input.dataset.idPrefix = idPrefix;

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
            // Set step - if not defined, use 'any' to allow decimals
            if (attr.step !== undefined) {
                input.step = attr.step;
            } else {
                input.step = 'any'; // Allow any decimal value
            }
        }

        input.id = `${idPrefix}attr_${attr.id}`;
        input.dataset.attrId = attr.id;
        input.dataset.idPrefix = idPrefix;

        div.appendChild(label);
        div.appendChild(input);

        return div;
    }

    /**
     * Create protocol blending UI with prefixed IDs
     */
    function createProtocolBlendingUI(idPrefix) {
        const container = document.createElement('div');
        container.className = 'protocol-blending-container advanced-only';
        container.innerHTML = `
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="${idPrefix}enableProtocolBlending">
                    Enable Protocol Blending
                </label>
                <small class="field-hint">Combine multiple protocols with weighted percentages</small>
            </div>
            
            <div id="${idPrefix}protocolBlendingPanel" class="protocol-blending-panel" style="display: none;">
                <div id="${idPrefix}protocolMixList" class="protocol-mix-list">
                </div>
                <button type="button" id="${idPrefix}addProtocolBtn" class="btn btn-small btn-outline">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add Protocol
                </button>
                <div id="${idPrefix}protocolWeightTotal" class="protocol-weight-total">
                    Total Weight: <span id="${idPrefix}totalWeightValue">0</span>% 
                    <span id="${idPrefix}weightStatus" class="weight-status"></span>
                </div>
            </div>
            
            <div id="${idPrefix}effectiveProtocolValues" class="effective-values" style="display: none;">
                <div class="effective-values-header">Effective Blended Values:</div>
                <div class="effective-values-grid">
                    <div class="effective-value">
                        <span class="effective-label">Request Size:</span>
                        <span id="${idPrefix}effectiveRequestSize" class="effective-number">2 KB</span>
                    </div>
                    <div class="effective-value">
                        <span class="effective-label">Response Size:</span>
                        <span id="${idPrefix}effectiveResponseSize" class="effective-number">16 KB</span>
                    </div>
                    <div class="effective-value">
                        <span class="effective-label">Requests/Sec:</span>
                        <span id="${idPrefix}effectiveReqPerSec" class="effective-number">2</span>
                    </div>
                </div>
            </div>
        `;
        return container;
    }

    /**
     * Setup event listeners for form elements
     */
    function setupFormEventListeners(idPrefix, onInputChange, onPresetChange) {
        const container = formInstances[idPrefix]?.container;
        if (!container) return;

        // Attribute inputs
        container.querySelectorAll(`[data-attr-id][data-id-prefix="${idPrefix}"]`).forEach(input => {
            input.addEventListener('input', (e) => {
                const attrId = e.target.dataset.attrId;
                const attr = schemaLoader.getAttribute(attrId);
                let value;

                if (attr && attr.type === 'boolean') {
                    value = e.target.checked;
                } else {
                    value = parseFloat(e.target.value) || 0;
                }

                onInputChange(attrId, value, attr);
            });

            // Also handle change event for checkboxes
            if (input.type === 'checkbox') {
                input.addEventListener('change', (e) => {
                    const attrId = e.target.dataset.attrId;
                    const attr = schemaLoader.getAttribute(attrId);
                    onInputChange(attrId, e.target.checked, attr);
                });
            }
        });

        // Preset selectors
        container.querySelectorAll(`[data-preset-id][data-id-prefix="${idPrefix}"]`).forEach(select => {
            select.addEventListener('change', (e) => {
                onPresetChange(e.target.dataset.presetId, e.target.value);
            });
        });
    }

    /**
     * Setup protocol blending for a specific instance
     */
    function setupProtocolBlendingForInstance(idPrefix) {
        const instance = formInstances[idPrefix];
        if (!instance) return;

        const enableBlending = document.getElementById(`${idPrefix}enableProtocolBlending`);
        const addProtocolBtn = document.getElementById(`${idPrefix}addProtocolBtn`);

        if (enableBlending) {
            enableBlending.addEventListener('change', () => handleProtocolBlendingToggle(idPrefix));
        }

        if (addProtocolBtn) {
            addProtocolBtn.addEventListener('click', () => handleAddProtocol(idPrefix));
        }
    }

    /**
     * Handle protocol blending toggle
     */
    function handleProtocolBlendingToggle(idPrefix) {
        const instance = formInstances[idPrefix];
        if (!instance) return;

        const enabled = document.getElementById(`${idPrefix}enableProtocolBlending`)?.checked;
        const panel = document.getElementById(`${idPrefix}protocolBlendingPanel`);
        const effectiveValues = document.getElementById(`${idPrefix}effectiveProtocolValues`);
        const protocolSelect = document.getElementById(`${idPrefix}preset_protocols`);

        if (panel) panel.style.display = enabled ? 'block' : 'none';
        if (effectiveValues) effectiveValues.style.display = enabled ? 'block' : 'none';
        if (protocolSelect) protocolSelect.disabled = enabled;

        if (enabled) {
            instance.protocolBlendingState.mode = 'blended';
            if (instance.protocolBlendingState.protocols.length === 0) {
                const currentPreset = protocolSelect ? protocolSelect.value : 'generic';
                instance.protocolBlendingState.protocols = [{ id: currentPreset, weight: 50 }];
            }
            renderProtocolMixList(idPrefix);
        } else {
            instance.protocolBlendingState.mode = 'single';
        }

        updateEffectiveValues(idPrefix);

        if (instance.onBlendingChange) {
            instance.onBlendingChange(instance.protocolBlendingState.computed);
        }
    }

    /**
     * Handle adding a protocol to the mix
     */
    function handleAddProtocol(idPrefix) {
        const instance = formInstances[idPrefix];
        if (!instance) return;

        const protocolOptions = schemaLoader.getPresetOptionsById('protocols');
        const usedIds = instance.protocolBlendingState.protocols.map(p => p.id);
        const available = protocolOptions.find(p => !usedIds.includes(p.id));

        if (available) {
            instance.protocolBlendingState.protocols.push({ id: available.id, weight: 0 });
            renderProtocolMixList(idPrefix);
        } else {
            alert('All protocols have been added to the mix.');
        }
    }

    /**
     * Render protocol mix list
     */
    function renderProtocolMixList(idPrefix) {
        const instance = formInstances[idPrefix];
        if (!instance) return;

        const list = document.getElementById(`${idPrefix}protocolMixList`);
        if (!list) return;

        const protocolOptions = schemaLoader.getPresetOptionsById('protocols');

        list.innerHTML = instance.protocolBlendingState.protocols.map((item, index) => {
            return `
                <div class="protocol-mix-item" data-index="${index}" data-id-prefix="${idPrefix}">
                    <select class="protocol-mix-select" data-index="${index}" data-id-prefix="${idPrefix}">
                        ${protocolOptions.map(p =>
                            `<option value="${p.id}" ${p.id === item.id ? 'selected' : ''}>${p.icon} ${p.name}</option>`
                        ).join('')}
                    </select>
                    <div class="weight-input-group">
                        <input type="number" class="protocol-mix-weight" value="${item.weight}" min="0" max="100" data-index="${index}" data-id-prefix="${idPrefix}">
                        <span class="weight-suffix">%</span>
                    </div>
                    <button type="button" class="btn-remove" data-index="${index}" data-id-prefix="${idPrefix}" title="Remove protocol">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        // Attach event listeners
        list.querySelectorAll(`.protocol-mix-select[data-id-prefix="${idPrefix}"]`).forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                instance.protocolBlendingState.protocols[index].id = e.target.value;
                recalculateBlendedValues(idPrefix);
            });
        });

        list.querySelectorAll(`.protocol-mix-weight[data-id-prefix="${idPrefix}"]`).forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                instance.protocolBlendingState.protocols[index].weight = parseInt(e.target.value) || 0;
                updateWeightTotal(idPrefix);
                recalculateBlendedValues(idPrefix);
            });
        });

        list.querySelectorAll(`.btn-remove[data-id-prefix="${idPrefix}"]`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.btn-remove').dataset.index);
                instance.protocolBlendingState.protocols.splice(index, 1);
                renderProtocolMixList(idPrefix);
                recalculateBlendedValues(idPrefix);
            });
        });

        updateWeightTotal(idPrefix);
    }

    /**
     * Update weight total display
     */
    function updateWeightTotal(idPrefix) {
        const instance = formInstances[idPrefix];
        if (!instance) return;

        const total = instance.protocolBlendingState.protocols.reduce((sum, p) => sum + p.weight, 0);
        const totalEl = document.getElementById(`${idPrefix}totalWeightValue`);
        const statusEl = document.getElementById(`${idPrefix}weightStatus`);

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

    /**
     * Recalculate blended protocol values
     */
    function recalculateBlendedValues(idPrefix) {
        const instance = formInstances[idPrefix];
        if (!instance) return;

        const protocolOptions = schemaLoader.getPresetOptionsById('protocols');
        const totalWeight = instance.protocolBlendingState.protocols.reduce((sum, p) => sum + p.weight, 0);

        if (totalWeight === 0) {
            instance.protocolBlendingState.computed = {
                avgRequestSizeKB: 2,
                avgResponseSizeKB: 16,
                requestsPerUserPerSec: 1
            };
        } else {
            let weightedReqSize = 0;
            let weightedRespSize = 0;
            let weightedReqPerSec = 0;

            for (const item of instance.protocolBlendingState.protocols) {
                const protocol = protocolOptions.find(p => p.id === item.id);
                if (protocol && item.weight > 0) {
                    const normalizedWeight = item.weight / totalWeight;
                    weightedReqSize += protocol.avgRequestSizeKB * normalizedWeight;
                    weightedRespSize += protocol.avgResponseSizeKB * normalizedWeight;
                    weightedReqPerSec += protocol.typicalRequestsPerSec * normalizedWeight;
                }
            }

            instance.protocolBlendingState.computed = {
                avgRequestSizeKB: Math.round(weightedReqSize * 100) / 100,
                avgResponseSizeKB: Math.round(weightedRespSize * 100) / 100,
                requestsPerUserPerSec: Math.round(weightedReqPerSec * 100) / 100
            };
        }

        updateEffectiveValues(idPrefix);

        if (instance.onBlendingChange) {
            instance.onBlendingChange(instance.protocolBlendingState.computed);
        }
    }

    /**
     * Update effective values display
     */
    function updateEffectiveValues(idPrefix) {
        const instance = formInstances[idPrefix];
        if (!instance) return;

        const effectiveReqSize = document.getElementById(`${idPrefix}effectiveRequestSize`);
        const effectiveRespSize = document.getElementById(`${idPrefix}effectiveResponseSize`);
        const effectiveReqPerSec = document.getElementById(`${idPrefix}effectiveReqPerSec`);

        if (effectiveReqSize) effectiveReqSize.textContent = `${instance.protocolBlendingState.computed.avgRequestSizeKB} KB`;
        if (effectiveRespSize) effectiveRespSize.textContent = `${instance.protocolBlendingState.computed.avgResponseSizeKB} KB`;
        if (effectiveReqPerSec) effectiveReqPerSec.textContent = instance.protocolBlendingState.computed.requestsPerUserPerSec;
    }

    /**
     * Setup deployment type handling for instance
     */
    function setupDeploymentTypeForInstance(idPrefix) {
        const deploymentSelect = document.getElementById(`${idPrefix}preset_deploymentTypes`);
        const cpuModelWrapper = document.getElementById(`${idPrefix}preset_cpuModels_wrapper`);

        if (!deploymentSelect || !cpuModelWrapper) return;

        function updateCpuModelVisibility(deploymentTypeId) {
            const isBareMetalOrCustom = deploymentTypeId === 'bare-metal';
            cpuModelWrapper.style.display = isBareMetalOrCustom ? '' : 'none';
        }

        // Initial state
        updateCpuModelVisibility(deploymentSelect.value);

        // Listen for changes
        deploymentSelect.addEventListener('change', (e) => {
            updateCpuModelVisibility(e.target.value);
        });
    }

    /**
     * Get all current form values
     * @param {string} idPrefix - The ID prefix for this form instance
     * @returns {Object} All input values
     */
    function getValues(idPrefix = '') {
        const values = {};
        const schema = schemaLoader.getSchema();

        // Get all attribute values
        for (const attr of schema.attributes) {
            const input = document.getElementById(`${idPrefix}attr_${attr.id}`);
            if (input) {
                if (attr.type === 'boolean') {
                    values[attr.id] = input.checked;
                } else {
                    values[attr.id] = parseFloat(input.value) || attr.default;
                }
            }
        }

        // Get preset selections
        values._presets = {};
        for (const preset of schema.presets) {
            const select = document.getElementById(`${idPrefix}preset_${preset.id}`);
            if (select) {
                values._presets[preset.id] = select.value;
            }
        }

        // Get protocol blending state if enabled
        const instance = formInstances[idPrefix];
        if (instance) {
            values._protocolBlending = { ...instance.protocolBlendingState };
        }

        return values;
    }

    /**
     * Set form values
     * @param {Object} values - Values to set
     * @param {string} idPrefix - The ID prefix for this form instance
     */
    function setValues(values, idPrefix = '') {
        const schema = schemaLoader.getSchema();
        const presets = schemaLoader.getPresets();

        // Set attribute values
        for (const attr of schema.attributes) {
            if (values[attr.id] !== undefined) {
                const input = document.getElementById(`${idPrefix}attr_${attr.id}`);
                if (input) {
                    if (attr.type === 'boolean') {
                        input.checked = values[attr.id];
                    } else {
                        input.value = values[attr.id];
                    }
                }
            }
        }

        // Set preset selections if provided
        if (values._presets) {
            for (const [presetId, optionId] of Object.entries(values._presets)) {
                const select = document.getElementById(`${idPrefix}preset_${presetId}`);
                if (select) {
                    select.value = optionId;
                    // Trigger deployment type visibility update
                    if (presetId === 'deploymentTypes') {
                        select.dispatchEvent(new Event('change'));
                    }
                }
            }
        }

        // Set protocol blending state if provided
        if (values._protocolBlending) {
            setProtocolBlendingState(values._protocolBlending, idPrefix);
        }
    }

    /**
     * Set protocol blending state for an instance
     */
    function setProtocolBlendingState(state, idPrefix) {
        const instance = formInstances[idPrefix];
        if (!instance) return;

        instance.protocolBlendingState = { ...state };

        const enableBlending = document.getElementById(`${idPrefix}enableProtocolBlending`);
        if (enableBlending) {
            enableBlending.checked = state.mode === 'blended';
            handleProtocolBlendingToggle(idPrefix);
        }
    }

    /**
     * Check if protocol blending is enabled for an instance
     */
    function isProtocolBlendingEnabled(idPrefix = '') {
        const checkbox = document.getElementById(`${idPrefix}enableProtocolBlending`);
        return checkbox ? checkbox.checked : false;
    }

    /**
     * Apply preset values to inputs
     */
    function applyPresetToInputs(presetId, optionId, idPrefix = '') {
        const presetData = schemaLoader.getPreset(presetId);
        if (!presetData) return {};

        const options = schemaLoader.getPresetOptions(presetData);
        const selected = options.find(o => o.id === optionId);
        if (!selected) return {};

        const mappings = schemaLoader.mapPresetToInputs(presetId, selected);
        const skipProtocolValues = isProtocolBlendingEnabled(idPrefix);

        // Skip protocol values if blending is enabled
        if (skipProtocolValues) {
            delete mappings['avgRequestSize'];
            delete mappings['avgResponseSize'];
            delete mappings['requestsPerUser'];
        }

        // Apply mappings to DOM
        for (const [attrId, value] of Object.entries(mappings)) {
            if (value !== undefined) {
                const input = document.getElementById(`${idPrefix}attr_${attrId}`);
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
     * Destroy a form instance and cleanup
     */
    function destroy(idPrefix = '') {
        delete formInstances[idPrefix];
    }

    /**
     * Get a form instance
     */
    function getInstance(idPrefix = '') {
        return formInstances[idPrefix];
    }

    // Export to global scope
    global.schemaFormComponent = {
        render,
        getValues,
        setValues,
        applyPresetToInputs,
        isProtocolBlendingEnabled,
        getInstance,
        destroy
    };

})(typeof window !== 'undefined' ? window : this);
