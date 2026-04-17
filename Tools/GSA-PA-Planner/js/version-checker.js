/**
 * GSA Private Access Sizing Planner - Version Checker
 * 
 * Checks for new versions via GitHub Gist
 * Fails gracefully when offline
 */

const VersionChecker = (() => {
    
    // Configuration
    const GIST_URL = 'https://raw.githubusercontent.com/tdetzner/GSA-PrivateAccess-Connector-Planner/main/version.json';
    const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    const STORAGE_KEY_LAST_CHECK = 'lastVersionCheck';
    const STORAGE_KEY_LAST_REMOTE_VERSION = 'lastRemoteVersion';
    
    /**
     * Parse version string to comparable array
     */
    function parseVersion(version) {
        return version.replace(/^v/, '').split('.').map(Number);
    }
    
    /**
     * Compare two versions
     * Returns: true if remote is newer
     */
    function isNewer(remoteVersion, localVersion) {
        const remote = parseVersion(remoteVersion);
        const local = parseVersion(localVersion);
        
        for (let i = 0; i < 3; i++) {
            if (remote[i] > local[i]) return true;
            if (remote[i] < local[i]) return false;
        }
        return false;
    }
    
    /**
     * Check if we should skip version check (recently checked)
     */
    function shouldSkipCheck() {
        const lastCheck = localStorage.getItem(STORAGE_KEY_LAST_CHECK);
        if (!lastCheck) return false;
        
        const timeSinceCheck = Date.now() - parseInt(lastCheck);
        return timeSinceCheck < CHECK_INTERVAL;
    }
    
    /**
     * Check for updates from Gist
     * Returns update info or null
     */
    async function checkForUpdate(currentVersion) {
        try {
            // Fetch from Gist with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(GIST_URL, {
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn('Version check failed:', response.status);
                return null;
            }
            
            const data = await response.json();
            
            // Update last check time
            localStorage.setItem(STORAGE_KEY_LAST_CHECK, Date.now().toString());
            localStorage.setItem(STORAGE_KEY_LAST_REMOTE_VERSION, data.version);
            
            // Compare versions
            const hasUpdate = isNewer(data.version, currentVersion);
            
            if (hasUpdate) {
                console.info(`Update available: v${data.version} (current: v${currentVersion})`);
                return {
                    hasUpdate: true,
                    currentVersion: currentVersion,
                    latestVersion: data.version,
                    releaseDate: data.releaseDate,
                    message: data.message || 'A new version is available',
                    downloadUrl: data.downloadUrl || null,
                    cached: false
                };
            }
            
            console.info('Version is up to date:', currentVersion);
            return { hasUpdate: false };
            
        } catch (error) {
            // Fail gracefully - likely offline or network issue
            if (error.name === 'AbortError') {
                console.info('Version check timed out (possibly offline)');
            } else {
                console.info('Version check failed (offline or network error):', error.message);
            }
            return null;
        }
    }
    
    /**
     * Force check for updates (ignores cache)
     */
    async function forceCheck(currentVersion) {
        localStorage.removeItem(STORAGE_KEY_LAST_CHECK);
        return await checkForUpdate(currentVersion);
    }
    
    // Public API
    return {
        checkForUpdate,
        forceCheck,
        isNewer,
        parseVersion
    };
    
})();
