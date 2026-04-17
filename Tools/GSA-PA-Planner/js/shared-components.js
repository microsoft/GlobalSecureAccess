/**
 * GSA Private Access Sizing Planner - Shared UI Components
 * 
 * Provides reusable header, navigation, and footer components
 * to eliminate code duplication across pages.
 * 
 * Usage:
 * 1. Add data-shared-components-auto-init attribute to body
 * 2. Add data-active-page attribute with page id ('home', 'single-site', 'multi-site')
 * 3. Include empty containers: #app-header, #app-navigation, #app-footer
 */

const SharedComponents = (() => {
    
    // ============================================
    // Configuration
    // ============================================
    
    const VERSION = 'v1.9.2';
    const EDITION = 'Offline Edition';
    
    // ============================================
    // Header Component
    // ============================================
    
    function renderHeader(containerId = 'app-header') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Header container #${containerId} not found`);
            return;
        }
        
        container.innerHTML = `
            <div class="header-content">
                <div class="logo-section">
                    <svg class="microsoft-logo" viewBox="0 0 23 23" width="24" height="24" aria-hidden="true" focusable="false">
                        <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                        <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
                        <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
                        <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
                    </svg>
                    <h1>GSA Private Access Sizing Planner</h1>
                </div>
                <div class="header-right">
                    <span class="version-badge-header" title="Version ${VERSION}">${VERSION}</span>
                    <a href="https://github.com/tdetzner/GSA-PrivateAccess-Connector-Planner" 
                       target="_blank" rel="noopener noreferrer" 
                       class="github-link" title="View on GitHub" aria-label="View on GitHub">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                        </svg>
                    </a>
                    <button id="darkModeToggle" class="dark-mode-toggle" aria-label="Toggle dark mode" aria-pressed="false">
                        <svg class="sun-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
                            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                        </svg>
                        <svg class="moon-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false">
                            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Initialize dark mode toggle
        initializeDarkModeToggle();
    }
    
    // ============================================
    // Navigation Component
    // ============================================
    
    function renderNavigation(containerId = 'app-navigation', activePage = 'home') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Navigation container #${containerId} not found`);
            return;
        }
        
        const tabs = [
            { 
                id: 'home', 
                label: 'Home', 
                href: 'index.html', 
                icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' 
            },
            { 
                id: 'single-site', 
                label: 'Single Site', 
                href: 'single-site.html', 
                icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' 
            },
            { 
                id: 'multi-site', 
                label: 'Multi-Site', 
                href: 'multi-site.html', 
                icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' 
            }
        ];
        
        const tabsHtml = tabs.map(tab => {
            const isActive = tab.id === activePage;
            // Don't add href for the active tab — avoids file:// self-reference warning in Chrome
            const hrefAttr = isActive ? '' : `href="${tab.href}"`;
            return `
            <a ${hrefAttr} class="nav-tab ${isActive ? 'active' : ''}">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${tab.icon}"/></svg>
                ${tab.label}
            </a>
        `;
        }).join('');
        
        container.innerHTML = `
            <div class="nav-tabs-inner">
                ${tabsHtml}
            </div>
        `;
    }
    
    // ============================================
    // Footer Component
    // ============================================
    
    function renderFooter(containerId = 'app-footer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Footer container #${containerId} not found`);
            return;
        }
        
        const currentYear = new Date().getFullYear();
        
        container.innerHTML = `
            <p>GSA Private Access Sizing Planner - ${EDITION} | &copy; ${currentYear} Microsoft</p>
        `;
    }
    
    // ============================================
    // Dark Mode Handler
    // ============================================
    
    function initializeDarkModeToggle() {
        const toggle = document.getElementById('darkModeToggle');
        if (!toggle) return;
        
        // Check localStorage for saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        toggle.setAttribute('aria-pressed', savedTheme === 'dark' ? 'true' : 'false');
        
        toggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            
            localStorage.setItem('theme', newTheme);
            toggle.setAttribute('aria-pressed', newTheme === 'dark' ? 'true' : 'false');
        });
    }
    
    // ============================================
    // Initialize All Components
    // ============================================
    
    function initializeAll(options = {}) {
        const {
            activePage = 'home',
            headerContainerId = 'app-header',
            navContainerId = 'app-navigation',
            footerContainerId = 'app-footer'
        } = options;
        
        renderHeader(headerContainerId);
        renderNavigation(navContainerId, activePage);
        renderFooter(footerContainerId);
        
        console.log('✓ Shared components initialized');
    }
    
    // ============================================
    // Public API
    // ============================================
    
    return {
        renderHeader,
        renderNavigation,
        renderFooter,
        initializeAll,
        initializeDarkModeToggle,
        VERSION,
        EDITION
    };
    
})();

// ============================================
// Version Update Checker Integration
// ============================================

async function checkAndShowVersionUpdate() {
    // Only check if VersionChecker is available
    if (typeof VersionChecker === 'undefined') {
        return;
    }
    
    const currentVersion = SharedComponents.VERSION.replace(/^v/, '');
    const updateInfo = await VersionChecker.checkForUpdate(currentVersion);
    
    if (updateInfo && updateInfo.hasUpdate) {
        showUpdateIndicator(updateInfo);
    }
}

function showUpdateIndicator(updateInfo) {
    const versionBadge = document.querySelector('.version-badge-header');
    if (!versionBadge) return;
    
    // Add visual indicator
    versionBadge.style.background = 'rgba(132, 177, 53, 0.25)';
    versionBadge.style.borderColor = '#84B135';
    versionBadge.style.animation = 'pulse 2s infinite';
    versionBadge.style.cursor = 'pointer';
    versionBadge.title = `Update available: v${updateInfo.latestVersion} (click for details)`;
    
    // Add green dot
    const dot = document.createElement('span');
    dot.className = 'update-dot';
    versionBadge.appendChild(dot);
    
    // Add "New version available" text below the badge
    const updateText = document.createElement('div');
    updateText.className = 'update-text';
    updateText.textContent = 'New version available';
    updateText.style.cursor = 'pointer';
    updateText.addEventListener('click', () => showUpdateModal(updateInfo));
    
    // Insert the text after the version badge
    const headerRight = versionBadge.parentElement;
    if (headerRight) {
        // Wrap badge and text together
        const wrapper = document.createElement('div');
        wrapper.className = 'version-badge-wrapper';
        versionBadge.parentNode.insertBefore(wrapper, versionBadge);
        wrapper.appendChild(versionBadge);
        wrapper.appendChild(updateText);
    }
    
    // Click handler to show details
    versionBadge.addEventListener('click', () => showUpdateModal(updateInfo));
}

function showUpdateModal(updateInfo) {
    // Remove existing modal if any
    const existing = document.querySelector('.update-modal-overlay');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.className = 'update-modal-overlay';
    modal.innerHTML = `
        <div class="update-modal">
            <div class="update-modal-header">
                <h2>🎉 Update Available</h2>
                <button class="update-modal-close" onclick="this.closest('.update-modal-overlay').remove()">×</button>
            </div>
            <div class="update-modal-body">
                <div class="version-comparison">
                    <div class="version-box">
                        <span class="version-label">Current</span>
                        <span class="version-number">v${updateInfo.currentVersion}</span>
                    </div>
                    <svg viewBox="0 0 24 24" width="32" fill="#0078d4">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                    <div class="version-box version-box-new">
                        <span class="version-label">Latest</span>
                        <span class="version-number">v${updateInfo.latestVersion}</span>
                    </div>
                </div>
                <div class="update-message">
                    <p>${updateInfo.message}</p>
                    ${updateInfo.releaseDate ? `<p class="release-date">Released: ${new Date(updateInfo.releaseDate).toLocaleDateString()}</p>` : ''}
                </div>
                ${updateInfo.downloadUrl ? `
                    <div class="update-actions">
                        <a href="${updateInfo.downloadUrl}" class="btn-update" target="_blank">Download Update</a>
                    </div>
                ` : `
                    <div class="update-note">
                        <p>Contact your administrator for the latest version.</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ============================================
// Auto-Initialize on DOM Ready
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-shared-components-auto-init]');
    if (autoInit) {
        const activePage = autoInit.getAttribute('data-active-page') || 'home';
        SharedComponents.initializeAll({ activePage });
        
        // Check for updates after 2 seconds (don't block page load)
        setTimeout(checkAndShowVersionUpdate, 2000);
    }
});
