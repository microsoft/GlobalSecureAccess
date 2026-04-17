/**
 * GSA Private Access Sizing Planner - Protocol Blending
 * 
 * This module contains protocol blending calculation logic and helper functions.
 * Moved from calculations.js to separate UI concerns from pure calculation engine.
 * 
 * Dependencies: preset-loader.js
 */

/**
 * Calculate blended protocol values from a mix of protocols
 * 
 * IMPORTANT: This function uses a "segment-based" bandwidth calculation approach.
 * 
 * Why not blend requestsPerUserPerSec?
 * ------------------------------------
 * When blending 50% Generic (2 req/sec) + 50% RDP (15 req/sec), a naive weighted
 * average gives 8.5 req/sec applied to ALL users. This produces incorrect results:
 *   - Naive: 50,000 users × 8.5 req/sec × 25KB = huge bandwidth
 *   - Correct: (25,000 × Generic bandwidth) + (25,000 × RDP bandwidth)
 * 
 * The segment approach recognizes that 50% of users use Generic apps (at 2 req/sec)
 * and 50% use RDP (at 15 req/sec), rather than all users making 8.5 req/sec.
 * 
 * @param {Array} protocolMix - Array of {id: string, weight: number} objects
 * @returns {Object} Blended values including effectiveBandwidthKBPerSec for accurate network calculation
 */
function calculateBlendedProtocol(protocolMix) {
    // Get protocols from preset loader
    const presets = window.presetLoader ? window.presetLoader.getProtocols() : {};
    
    // Handle empty or invalid input
    if (!protocolMix || protocolMix.length === 0) {
        const defaultProtocol = presets['generic'] || {
            avgRequestSizeKB: 2,
            avgResponseSizeKB: 16,
            typicalRequestsPerSec: 2
        };
        const bw = (defaultProtocol.avgRequestSizeKB + defaultProtocol.avgResponseSizeKB) 
                   * defaultProtocol.typicalRequestsPerSec;
        return {
            avgRequestSizeKB: defaultProtocol.avgRequestSizeKB,
            avgResponseSizeKB: defaultProtocol.avgResponseSizeKB,
            requestsPerUserPerSec: defaultProtocol.typicalRequestsPerSec,
            effectiveBandwidthKBPerSec: bw,
            useSegmentBandwidth: false
        };
    }
    
    // Calculate total weight (cap at 100%)
    let totalWeight = protocolMix.reduce((sum, p) => sum + (p.weight || 0), 0);
    totalWeight = Math.min(totalWeight, 100);
    
    // If total weight is 0, return defaults
    if (totalWeight === 0) {
        const defaultProtocol = presets['generic'];
        const bw = (defaultProtocol.avgRequestSizeKB + defaultProtocol.avgResponseSizeKB) 
                   * defaultProtocol.typicalRequestsPerSec;
        return {
            avgRequestSizeKB: defaultProtocol.avgRequestSizeKB,
            avgResponseSizeKB: defaultProtocol.avgResponseSizeKB,
            requestsPerUserPerSec: defaultProtocol.typicalRequestsPerSec,
            effectiveBandwidthKBPerSec: bw,
            useSegmentBandwidth: false
        };
    }
    
    // Calculate weighted averages for packet sizes (these blend correctly)
    let blendedRequest = 0;
    let blendedResponse = 0;
    
    // Calculate segment-based bandwidth: sum of each protocol's weighted bandwidth contribution
    // This is the KEY FIX: instead of blending req/sec and multiplying by all users,
    // we calculate bandwidth per protocol segment and sum them.
    let segmentBandwidth = 0;
    
    for (const item of protocolMix) {
        const protocol = presets[item.id];
        if (protocol && item.weight > 0) {
            // Normalize weight if total < 100%
            const normalizedWeight = item.weight / totalWeight;
            
            // Blend packet sizes (weighted average is appropriate here)
            blendedRequest += protocol.avgRequestSizeKB * normalizedWeight;
            blendedResponse += protocol.avgResponseSizeKB * normalizedWeight;
            
            // Segment bandwidth: this protocol's share of users × its bandwidth characteristics
            // Bandwidth = weight × (reqSize + respSize) × reqPerSec
            const protocolBandwidth = (protocol.avgRequestSizeKB + protocol.avgResponseSizeKB) 
                                      * protocol.typicalRequestsPerSec;
            segmentBandwidth += protocolBandwidth * normalizedWeight;
        }
    }
    
    // Calculate an "effective" request rate that would produce the same bandwidth
    // with the blended packet sizes. This allows existing calculations to work correctly.
    // effectiveReqPerSec = segmentBandwidth / (blendedReqSize + blendedRespSize)
    const blendedTotalSize = blendedRequest + blendedResponse;
    const effectiveReqPerSec = blendedTotalSize > 0 
        ? segmentBandwidth / blendedTotalSize 
        : 2;
    
    return {
        avgRequestSizeKB: Math.round(blendedRequest * 100) / 100,
        avgResponseSizeKB: Math.round(blendedResponse * 100) / 100,
        requestsPerUserPerSec: Math.round(effectiveReqPerSec * 100) / 100,
        effectiveBandwidthKBPerSec: Math.round(segmentBandwidth * 100) / 100,
        useSegmentBandwidth: protocolMix.length > 1  // Flag for multi-protocol blends
    };
}

/**
 * Create a protocol mix configuration object
 * @param {string} mode - 'single', 'blended', or 'custom'
 * @param {Array} protocols - Array of {id, weight} objects
 * @param {Object} customValues - Custom values when mode is 'custom'
 * @returns {Object} Protocol mix configuration
 */
function createProtocolMix(mode, protocols = [], customValues = null) {
    const mix = {
        mode: mode,
        protocols: protocols
    };
    
    if (mode === 'custom' && customValues) {
        mix.computed = {
            avgRequestSizeKB: customValues.avgRequestSizeKB || 2,
            avgResponseSizeKB: customValues.avgResponseSizeKB || 16,
            requestsPerUserPerSec: customValues.requestsPerUserPerSec || 1
        };
    } else if (mode === 'single' && protocols.length > 0) {
        // Single protocol at 100%
        const blended = calculateBlendedProtocol([{ id: protocols[0].id, weight: 100 }]);
        mix.computed = blended;
    } else if (mode === 'blended' && protocols.length > 0) {
        // Multiple protocols with weights
        mix.computed = calculateBlendedProtocol(protocols);
    }
    
    return mix;
}

/**
 * Validate protocol mix (total weight should not exceed 100%)
 * @param {Array} protocolMix - Array of {id, weight} objects
 * @returns {Object} Validation result {valid: boolean, totalWeight: number, message: string}
 */
function validateProtocolMix(protocolMix) {
    if (!protocolMix || protocolMix.length === 0) {
        return {
            valid: true,
            totalWeight: 0,
            message: 'Empty protocol mix (will use defaults)'
        };
    }
    
    let totalWeight = 0;
    for (const item of protocolMix) {
        if (!item.id) {
            return {
                valid: false,
                totalWeight: 0,
                message: 'Protocol ID is required'
            };
        }
        if (typeof item.weight !== 'number' || item.weight < 0) {
            return {
                valid: false,
                totalWeight: 0,
                message: `Invalid weight for protocol ${item.id}`
            };
        }
        totalWeight += item.weight;
    }
    
    if (totalWeight > 100) {
        return {
            valid: false,
            totalWeight: totalWeight,
            message: `Total weight (${totalWeight}%) exceeds 100%`
        };
    }
    
    return {
        valid: true,
        totalWeight: totalWeight,
        message: totalWeight < 100 ? `Total weight: ${totalWeight}% (remaining ${100 - totalWeight}% will use defaults)` : 'Valid'
    };
}

/**
 * Add or update a protocol in the mix
 * @param {Array} protocolMix - Existing protocol mix
 * @param {string} protocolId - Protocol ID to add/update
 * @param {number} weight - Weight percentage (0-100)
 * @returns {Array} Updated protocol mix
 */
function updateProtocolInMix(protocolMix, protocolId, weight) {
    const mix = protocolMix ? [...protocolMix] : [];
    const existingIndex = mix.findIndex(p => p.id === protocolId);
    
    if (weight <= 0) {
        // Remove protocol if weight is 0 or negative
        if (existingIndex >= 0) {
            mix.splice(existingIndex, 1);
        }
    } else {
        // Add or update protocol
        if (existingIndex >= 0) {
            mix[existingIndex].weight = weight;
        } else {
            mix.push({ id: protocolId, weight: weight });
        }
    }
    
    return mix;
}

/**
 * Remove a protocol from the mix
 * @param {Array} protocolMix - Existing protocol mix
 * @param {string} protocolId - Protocol ID to remove
 * @returns {Array} Updated protocol mix
 */
function removeProtocolFromMix(protocolMix, protocolId) {
    if (!protocolMix) return [];
    return protocolMix.filter(p => p.id !== protocolId);
}

/**
 * Get total weight of protocol mix
 * @param {Array} protocolMix - Protocol mix
 * @returns {number} Total weight percentage
 */
function getTotalWeight(protocolMix) {
    if (!protocolMix || protocolMix.length === 0) return 0;
    return protocolMix.reduce((sum, p) => sum + (p.weight || 0), 0);
}

// ============================================
// Universal Export (Browser + Node.js)
// ============================================

if (typeof window !== 'undefined') {
    // Browser: attach to window
    window.protocolBlending = {
        calculateBlendedProtocol,
        createProtocolMix,
        validateProtocolMix,
        updateProtocolInMix,
        removeProtocolFromMix,
        getTotalWeight
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js: use CommonJS exports
    module.exports = {
        calculateBlendedProtocol,
        createProtocolMix,
        validateProtocolMix,
        updateProtocolInMix,
        removeProtocolFromMix,
        getTotalWeight
    };
}
