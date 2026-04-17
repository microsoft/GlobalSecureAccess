/**
 * GSA Private Access Sizing Planner - PDF Export
 * 
 * Generates professional PDF reports for Single-Site and Multi-Site sizing plans.
 * Uses jsPDF for client-side PDF generation.
 */

// ============================================
// Constants and Configuration
// ============================================

const PDF_COLORS = {
    primary: '#0078D4',
    primaryRGB: [0, 120, 212],
    cpuBlue: '#0068B5',
    cpuBlueRGB: [0, 104, 181],
    memoryOrange: '#FFB900',
    memoryOrangeRGB: [255, 185, 0],
    networkGreen: '#84B135',
    networkGreenRGB: [132, 177, 53],
    lightGray: '#F3F3F3',
    lightGrayRGB: [243, 243, 243],
    darkGray: '#666666',
    darkGrayRGB: [102, 102, 102],
    text: '#333333',
    textRGB: [51, 51, 51],
    white: '#FFFFFF',
    whiteRGB: [255, 255, 255]
};

const PDF_FONTS = {
    title: 20,
    heading: 16,
    subheading: 12,
    body: 10,
    small: 8
};

// ============================================
// Helper Functions
// ============================================

/**
 * Format large numbers with commas
 */
function formatNumber(num) {
    if (num === undefined || num === null) return 'N/A';
    return Math.round(num).toLocaleString();
}

/**
 * Get limiting factor color
 */
function getLimitingFactorColor(factor) {
    switch (factor) {
        case 'CPU': return PDF_COLORS.cpuBlueRGB;
        case 'Memory': return PDF_COLORS.memoryOrangeRGB;
        case 'Network': return PDF_COLORS.networkGreenRGB;
        default: return PDF_COLORS.textRGB;
    }
}

/**
 * Format NIC speed for display
 * Looks up the speed against known NIC presets to return clean display names
 * (e.g. "5 Gbps" instead of "4.8828125 Gbps"). Falls back to nearest-match
 * to handle saved configurations that used binary Mbps (e.g. 25600 for 25 Gbps).
 */
function formatNicSpeed(mbps) {
    if (typeof getNICSpeeds === 'function') {
        const speeds = getNICSpeeds();
        // Exact match first
        const exact = speeds.find(nic => nic.speedMbps === mbps);
        if (exact) return exact.name;
        // Nearest match within 5% tolerance (handles binary vs decimal Mbps mismatch)
        const nearest = speeds.reduce((best, nic) => {
            return Math.abs(nic.speedMbps - mbps) < Math.abs(best.speedMbps - mbps) ? nic : best;
        });
        if (Math.abs(nearest.speedMbps - mbps) / nearest.speedMbps <= 0.05) {
            return nearest.name;
        }
    }
    // Fallback for truly unknown speeds
    if (mbps >= 1000) {
        return `${(mbps / 1000).toFixed(1).replace(/\.0$/, '')} Gbps`;
    }
    return `${mbps} Mbps`;
}

/**
 * Get deployment type label from type ID or derive from overhead values
 * @param {string|undefined} type - Deployment type ID
 * @param {Object} inputs - Inputs object with overhead values
 * @returns {string} Human-readable deployment type label
 */
function getDeploymentTypeLabel(type, inputs) {
    // If type is provided directly, use the labels map
    if (type) {
        const labels = {
            'bare-metal': 'Bare Metal',
            'on-prem-vm': 'On-Premises VM',
            'cloud': 'Cloud VM (Azure, AWS, GCP)',
            // Legacy IDs from saved configurations
            'cloud-optimized': 'Cloud VM (Azure, AWS, GCP)',
            'cloud-general': 'Cloud VM (Azure, AWS, GCP)',
            'dev-test': 'Cloud VM (Azure, AWS, GCP)'
        };
        return labels[type] || type;
    }
    
    // Otherwise, derive from overhead values
    if (inputs) {
        const cpuOverhead = inputs.virtCpuOverhead || 0;
        const memOverhead = inputs.virtMemoryOverhead || 0;
        const netOverhead = inputs.virtNetworkOverhead || 0;
        
        if (cpuOverhead === 0 && memOverhead === 0 && netOverhead === 0) {
            return 'Bare Metal';
        }
        if (cpuOverhead <= 10 && memOverhead <= 5 && netOverhead <= 15) {
            return 'On-Premises VM';
        }
        return 'Cloud VM (Azure, AWS, GCP)';
    }
    
    return 'Unknown';
}

// ============================================
// Single-Site PDF Export
// ============================================

/**
 * Export Single-Site capacity plan to PDF
 * @param {Object} inputs - Current input values
 * @param {Object} networkResults - Output from calculateNetworkCapacity()
 * @param {Object} serverCounts - Output from calculateServerCount()
 */
function exportSingleSitePDF(inputs, networkResults, serverCounts) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = 20;

    // Helper: Check for new page
    const checkNewPage = (requiredSpace = 20) => {
        if (yPos + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPos = 20;
            return true;
        }
        return false;
    };

    // ===== Header =====
    doc.setFillColor(...PDF_COLORS.primaryRGB);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(...PDF_COLORS.whiteRGB);
    doc.setFontSize(PDF_FONTS.title);
    doc.setFont('helvetica', 'bold');
    doc.text('GSA Private Access Sizing Report', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(PDF_FONTS.subheading);
    doc.setFont('helvetica', 'normal');
    doc.text('Single-Site Sizing Plan', pageWidth / 2, 25, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' });

    yPos = 50;
    doc.setTextColor(...PDF_COLORS.textRGB);

    // ===== Actual Workload Demand =====
    doc.setFontSize(PDF_FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Actual Workload Demand', margin, yPos);
    yPos += 5;

    doc.setFontSize(PDF_FONTS.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.darkGrayRGB);
    doc.text(`Generated by ${formatNumber(inputs.expectedConcurrentUsers)} concurrent users`, margin, yPos);
    doc.setTextColor(...PDF_COLORS.textRGB);
    yPos += 5;

    const wl = networkResults.requestedWorkload;
    const demandMetrics = [
        { label: 'Bandwidth',  value: wl.bandwidth.bandwidthGbps.toFixed(2), unit: 'Gbps'   },
        { label: 'CPU Cores',  value: Math.ceil(wl.cpu.actualCoresRequired).toString(),         unit: 'cores'  },
        { label: 'Memory',     value: Math.ceil(wl.memory.totalMemoryGB).toString(),            unit: 'GB RAM' }
    ];

    const metricW = contentWidth / 3;
    doc.setFillColor(...PDF_COLORS.lightGrayRGB);
    doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, 'F');

    demandMetrics.forEach((metric, i) => {
        const xCenter = margin + i * metricW + metricW / 2;
        doc.setFontSize(PDF_FONTS.small);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...PDF_COLORS.darkGrayRGB);
        doc.text(metric.label, xCenter, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PDF_COLORS.primaryRGB);
        doc.text(`${metric.value} ${metric.unit}`, xCenter, yPos + 17, { align: 'center' });
        doc.setTextColor(...PDF_COLORS.textRGB);
    });

    yPos += 30;

    // ===== Provisioning Scenarios Table =====
    checkNewPage(55);
    doc.setFontSize(PDF_FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textRGB);
    doc.text('Provisioning Scenarios', margin, yPos);
    yPos += 8;

    // Column layout (total = contentWidth = 170mm)
    const cols = {
        scenario: { x: margin,       w: 38 },
        util:     { x: margin + 38,  w: 14 },
        headroom: { x: margin + 52,  w: 18 },
        bw:       { x: margin + 70,  w: 22 },
        cores:    { x: margin + 92,  w: 20 },
        mem:      { x: margin + 112, w: 20 },
        servers:  { x: margin + 132, w: 16 },
        limiting: { x: margin + 148, w: 22 }
    };

    const rowH = 9;

    // Header row
    doc.setFillColor(...PDF_COLORS.primaryRGB);
    doc.rect(margin, yPos, contentWidth, rowH, 'F');
    doc.setFontSize(PDF_FONTS.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.whiteRGB);
    [
        [cols.scenario, 'Scenario'],
        [cols.util,     'Util %'],
        [cols.headroom, 'Headroom'],
        [cols.bw,       'BW (Gbps)'],
        [cols.cores,    'CPU Cores'],
        [cols.mem,      'Mem (GB)'],
        [cols.servers,  'Servers'],
        [cols.limiting, 'Limiting']
    ].forEach(([col, label]) => {
        doc.text(label, col.x + 2, yPos + 6);
    });
    yPos += rowH;

    const scenarioRows = [
        { key: 'conservative', label: 'Conservative (60%)', bgColor: [232, 244, 232], accentRGB: [16, 124, 16]  },
        { key: 'balanced',     label: 'Balanced (70%)',     bgColor: [230, 242, 252], accentRGB: [0, 120, 212]  },
        { key: 'efficient',    label: 'Efficient (80%)',    bgColor: [225, 235, 248], accentRGB: [0,  90, 158]  }
    ];

    scenarioRows.forEach(({ key, label, bgColor, accentRGB }) => {
        const sc  = networkResults.scenarios[key];
        const srv = serverCounts[key];

        doc.setFillColor(...bgColor);
        doc.rect(margin, yPos, contentWidth, rowH, 'F');

        doc.setFontSize(PDF_FONTS.small);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accentRGB);
        doc.text(label, cols.scenario.x + 2, yPos + 6);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...PDF_COLORS.textRGB);
        doc.text(`${sc.targetUtilization}%`,                    cols.util.x     + 2, yPos + 6);
        doc.text(`${100 - sc.targetUtilization}%`,              cols.headroom.x + 2, yPos + 6);
        doc.text(sc.bandwidthGbps.toFixed(2),                   cols.bw.x       + 2, yPos + 6);
        doc.text(Math.ceil(sc.actualCoresRequired).toString(),  cols.cores.x    + 2, yPos + 6);
        doc.text(Math.ceil(sc.memoryGB).toString(),             cols.mem.x      + 2, yPos + 6);

        doc.setFont('helvetica', 'bold');
        doc.text(srv.serversRequired.toString(),                cols.servers.x  + 2, yPos + 6);

        doc.setTextColor(...getLimitingFactorColor(srv.limitingFactor));
        doc.text(srv.limitingFactor,                            cols.limiting.x + 2, yPos + 6);

        doc.setTextColor(...PDF_COLORS.textRGB);
        doc.setFont('helvetica', 'normal');
        yPos += rowH;

        // light row separator
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin, yPos, margin + contentWidth, yPos);
    });

    yPos += 12;

    // ===== Server Configuration =====
    checkNewPage(50);
    doc.setFontSize(PDF_FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.textRGB);
    doc.text('Server Configuration', margin, yPos);
    yPos += 8;

    doc.setFontSize(PDF_FONTS.body);
    const serverConfig = [
        ['Deployment Type',            getDeploymentTypeLabel(inputs.deploymentType, inputs)],
        ['Cores per Server',           (inputs.coresPerServer || 64).toString()],
        ['CPU Performance Multiplier', (inputs.cpuPerfMultiplier || 1.0).toFixed(2) + 'x'],
        ['Memory per Server',          `${inputs.memoryGB || 16} GB`],
        ['NIC Speed',                  formatNicSpeed(inputs.nicLinkSpeed || 1024)],
        ['NIC Offloads',               inputs.nicOffloads !== false ? 'Enabled' : 'Disabled']
    ];

    serverConfig.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label + ':', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 65, yPos);
        yPos += 6;
    });

    yPos += 8;

    // ===== Workload Configuration =====
    checkNewPage(40);
    doc.setFontSize(PDF_FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Workload Configuration', margin, yPos);
    yPos += 8;

    doc.setFontSize(PDF_FONTS.body);
    const workloadConfig = [
        ['Expected Concurrent Users', formatNumber(inputs.expectedConcurrentUsers || 50000)],
        ['Requests per User/sec',     (inputs.requestsPerUser || 2).toString()],
        ['Annual Growth Rate',        `${inputs.growthRate || 10}%`]
    ];

    workloadConfig.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label + ':', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 65, yPos);
        yPos += 6;
    });

    // ===== Footer =====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(PDF_FONTS.small);
        doc.setTextColor(...PDF_COLORS.darkGrayRGB);
        doc.text(
            'Microsoft Entra Private Access - Capacity Planning Report',
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: 'right' }
        );
    }

    const filename = `gsa-capacity-single-site-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}

// ============================================
// Multi-Site PDF Export
// ============================================

/**
 * Export Multi-Site capacity plan to PDF
 * @param {Object} multiSiteData - Configuration data (deploymentName, etc.)
 * @param {Array} connectorGroups - Array of connector group objects
 * @param {Object} summary - Aggregated summary statistics
 */
function exportMultiSitePDF(multiSiteData, connectorGroups, summary) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = 20;

    // Helper: Draw horizontal line
    const drawLine = (y, color = PDF_COLORS.lightGrayRGB) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
    };

    // Helper: Check for new page
    const checkNewPage = (requiredSpace = 20) => {
        if (yPos + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPos = 20;
            return true;
        }
        return false;
    };

    // ===== Page 1: Title and Executive Summary =====
    doc.setFillColor(...PDF_COLORS.primaryRGB);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(...PDF_COLORS.whiteRGB);
    doc.setFontSize(PDF_FONTS.title);
    doc.setFont('helvetica', 'bold');
    doc.text('Multi-Site Capacity Planning Report', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(PDF_FONTS.subheading);
    doc.setFont('helvetica', 'normal');
    doc.text(multiSiteData.configName || 'Global Deployment', pageWidth / 2, 25, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' });

    yPos = 50;
    doc.setTextColor(...PDF_COLORS.textRGB);

    // ===== Executive Summary =====
    doc.setFontSize(PDF_FONTS.heading);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, yPos);
    yPos += 10;

    // Summary stats grid
    doc.setFillColor(...PDF_COLORS.lightGrayRGB);
    doc.roundedRect(margin, yPos, contentWidth, 35, 2, 2, 'F');

    const statsData = [
        { label: 'Total Groups', value: summary.totalGroups.toString(), x: margin + 10 },
        { label: 'Total Servers', value: summary.totalServers.toString(), x: margin + 60 },
        { label: 'Total Users', value: formatNumber(summary.totalUsers), x: margin + 110 }
    ];

    doc.setFontSize(PDF_FONTS.small);
    statsData.forEach(stat => {
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, stat.x, yPos + 8);
        doc.setFontSize(PDF_FONTS.heading);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, stat.x, yPos + 20);
        doc.setFontSize(PDF_FONTS.small);
    });

    // Total apps
    doc.setFont('helvetica', 'normal');
    doc.text('Total Applications', margin + 10, yPos + 28);
    doc.setFont('helvetica', 'bold');
    doc.text(summary.totalApps.toString(), margin + 50, yPos + 28);

    yPos += 45;

    // ===== Limiting Factor Breakdown =====
    doc.setFontSize(PDF_FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Connector Groups by Limiting Factor', margin, yPos);
    yPos += 8;

    doc.setFontSize(PDF_FONTS.body);
    doc.setFont('helvetica', 'normal');

    // Count limiting factors
    const limitingCounts = { CPU: 0, Memory: 0, Network: 0 };
    connectorGroups.forEach(group => {
        if (group.results && group.results.limitingFactor) {
            limitingCounts[group.results.limitingFactor]++;
        }
    });

    const limitingFactors = [
        { label: 'CPU Limited', count: limitingCounts.CPU, color: PDF_COLORS.cpuBlueRGB },
        { label: 'Memory Limited', count: limitingCounts.Memory, color: PDF_COLORS.memoryOrangeRGB },
        { label: 'Network Limited', count: limitingCounts.Network, color: PDF_COLORS.networkGreenRGB }
    ];

    limitingFactors.forEach(({ label, count, color }) => {
        doc.setFillColor(...color);
        doc.circle(margin + 3, yPos, 2, 'F');
        doc.text(`${label}: ${count} group${count !== 1 ? 's' : ''}`, margin + 8, yPos + 1);
        yPos += 7;
    });

    yPos += 10;

    // ===== Connector Group Summary Table =====
    checkNewPage(60);
    doc.setFontSize(PDF_FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Connector Group Overview', margin, yPos);
    yPos += 10;

    // Table header
    doc.setFillColor(...PDF_COLORS.lightGrayRGB);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setFontSize(PDF_FONTS.small);
    doc.setFont('helvetica', 'bold');

    const colWidths = [50, 30, 25, 30, 25];
    const headers = ['Group Name', 'Region', 'Users', 'Servers', 'Limiting'];
    let xPos = margin + 2;

    headers.forEach((header, i) => {
        doc.text(header, xPos, yPos + 5);
        xPos += colWidths[i];
    });

    yPos += 10;
    drawLine(yPos);
    yPos += 2;

    // Table rows
    doc.setFont('helvetica', 'normal');
    connectorGroups.forEach(group => {
        checkNewPage(10);
        
        xPos = margin + 2;
        
        // Truncate long names
        const name = group.name.length > 20 ? group.name.substring(0, 18) + '...' : group.name;
        doc.text(name, xPos, yPos + 4);
        xPos += colWidths[0];

        doc.text(group.region || '-', xPos, yPos + 4);
        xPos += colWidths[1];

        doc.text(formatNumber(group.totalUsers || 0), xPos, yPos + 4);
        xPos += colWidths[2];

        const servers = group.results ? group.results.serversRequired : '-';
        doc.text(servers.toString(), xPos, yPos + 4);
        xPos += colWidths[3];

        const limitingFactor = group.results ? group.results.limitingFactor : '-';
        if (limitingFactor !== '-') {
            doc.setTextColor(...getLimitingFactorColor(limitingFactor));
        }
        doc.text(limitingFactor, xPos, yPos + 4);
        doc.setTextColor(...PDF_COLORS.textRGB);

        yPos += 8;
        drawLine(yPos, PDF_COLORS.lightGrayRGB);
        yPos += 2;
    });

    // ===== Page 2+: Connector Group Details =====
    connectorGroups.forEach((group, index) => {
        doc.addPage();
        yPos = 20;

        // Group header
        doc.setFillColor(...PDF_COLORS.primaryRGB);
        doc.rect(0, 0, pageWidth, 30, 'F');

        doc.setTextColor(...PDF_COLORS.whiteRGB);
        doc.setFontSize(PDF_FONTS.heading);
        doc.setFont('helvetica', 'bold');
        doc.text(group.name, margin, 12);

        doc.setFontSize(PDF_FONTS.body);
        doc.setFont('helvetica', 'normal');
        const location = group.location || 'Location not specified';
        doc.text(location, margin, 20);
        doc.text(`Group ${index + 1} of ${connectorGroups.length}`, pageWidth - margin, 20, { align: 'right' });

        yPos = 40;
        doc.setTextColor(...PDF_COLORS.textRGB);

        // Key Metrics Box
        doc.setFillColor(...PDF_COLORS.lightGrayRGB);
        doc.roundedRect(margin, yPos, contentWidth, 30, 2, 2, 'F');

        const serversRequired = group.results ? group.results.serversRequired : 0;
        const coresPerServer = group.serverConfig ? group.serverConfig.coresPerServer : 64;

        doc.setFontSize(PDF_FONTS.small);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Users', margin + 10, yPos + 8);
        doc.setFontSize(PDF_FONTS.subheading);
        doc.setFont('helvetica', 'bold');
        doc.text(formatNumber(group.totalUsers || 0), margin + 10, yPos + 18);

        doc.setFontSize(PDF_FONTS.small);
        doc.setFont('helvetica', 'normal');
        doc.text('Servers Required', margin + 60, yPos + 8);
        doc.setFontSize(PDF_FONTS.subheading);
        doc.setFont('helvetica', 'bold');
        doc.text(serversRequired.toString(), margin + 60, yPos + 18);

        doc.setFontSize(PDF_FONTS.small);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Cores', margin + 110, yPos + 8);
        doc.setFontSize(PDF_FONTS.subheading);
        doc.setFont('helvetica', 'bold');
        doc.text((serversRequired * coresPerServer).toString(), margin + 110, yPos + 18);

        // Limiting Factor
        doc.setFontSize(PDF_FONTS.small);
        doc.setFont('helvetica', 'normal');
        doc.text('Limiting Factor:', margin + 10, yPos + 27);

        const limitingFactor = group.results ? group.results.limitingFactor : 'N/A';
        doc.setTextColor(...getLimitingFactorColor(limitingFactor));
        doc.setFont('helvetica', 'bold');
        doc.text(limitingFactor, margin + 40, yPos + 27);
        doc.setTextColor(...PDF_COLORS.textRGB);

        yPos += 40;

        // Group Details
        doc.setFontSize(PDF_FONTS.subheading);
        doc.setFont('helvetica', 'bold');
        doc.text('Connector Group Details', margin, yPos);
        yPos += 8;

        doc.setFontSize(PDF_FONTS.body);
        doc.setFont('helvetica', 'normal');

        const groupDetails = [
            ['Region', group.region || 'N/A'],
            ['Location', group.location || 'N/A'],
            ['Number of Applications', (group.numberOfApps || 0).toString()],
            ['Network I/O', group.results && group.results.networkResults ? group.results.networkResults.requestedWorkload.bandwidth.bandwidthGbps.toFixed(2) + ' Gbps' : 'N/A'],
            ['Requests per User/sec', (group.requestsPerUser || 2).toString()]
        ];

        groupDetails.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label + ':', margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(value, margin + 55, yPos);
            yPos += 6;
        });

        yPos += 10;

        // Server Configuration
        doc.setFontSize(PDF_FONTS.subheading);
        doc.setFont('helvetica', 'bold');
        doc.text('Server Configuration', margin, yPos);
        yPos += 8;

        doc.setFontSize(PDF_FONTS.body);
        doc.setFont('helvetica', 'normal');

        const serverConfig = group.serverConfig || {};
        const serverDetails = [
            ['CPU Model', serverConfig.cpuModel || 'Default'],
            ['Cores per Server', (serverConfig.coresPerServer || 64).toString()],
            ['Memory', `${serverConfig.memoryGB || 16} GB`],
            ['NIC Speed', formatNicSpeed(serverConfig.nicLinkSpeed || 1024)],
            ['Deployment Type', getDeploymentTypeLabel(serverConfig.deploymentType || 'bare-metal')]
        ];

        serverDetails.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label + ':', margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(value, margin + 55, yPos);
            yPos += 6;
        });

        yPos += 10;

        // Capacity Analysis
        if (group.results) {
            doc.setFontSize(PDF_FONTS.subheading);
            doc.setFont('helvetica', 'bold');
            doc.text('Capacity Analysis', margin, yPos);
            yPos += 8;

            doc.setFontSize(PDF_FONTS.body);
            doc.setFont('helvetica', 'normal');

            const balanced = group.results.scenarios ? group.results.scenarios.balanced : null;
            const capacityData = balanced ? [
                ['Servers for CPU', balanced.serversForCPU.toString(), PDF_COLORS.cpuBlueRGB],
                ['Servers for Memory', balanced.serversForMemory.toString(), PDF_COLORS.memoryOrangeRGB],
                ['Servers for Network', balanced.serversForNetwork.toString(), PDF_COLORS.networkGreenRGB]
            ] : [];

            capacityData.forEach(([label, value, color]) => {
                doc.setFillColor(...color);
                doc.circle(margin + 3, yPos - 1, 2, 'F');
                doc.setFont('helvetica', 'bold');
                doc.text(label + ':', margin + 8, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(value, margin + 55, yPos);
                yPos += 7;
            });
        }
    });

    // ===== Footer on all pages =====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(PDF_FONTS.small);
        doc.setTextColor(...PDF_COLORS.darkGrayRGB);
        doc.text(
            'Microsoft Entra Private Access - Capacity Planning Report',
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: 'right' }
        );
    }

    // Save PDF
    const configName = (multiSiteData.configName || 'multi-site').replace(/\s+/g, '-').toLowerCase();
    const filename = `gsa-capacity-${configName}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}

// ============================================
// Exports (for use in other modules)
// ============================================

// Make functions available globally
window.pdfExport = {
    exportSingleSitePDF,
    exportMultiSitePDF
};
