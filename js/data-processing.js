/**
 * Data Processing Module
 * 
 * Handles all data-related operations including:
 * - CSV data parsing and normalization
 * - Structure name mapping between different naming conventions
 * - NAVR data loading and thresholding
 * - Data export functionality (CSV/JSON)
 * - Statistical calculations
 * 
 * @author Brain Render Team
 * @version 1.0.0
 */

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/** @type {Object.<string, Object>} Current dataset with potentially thresholded values */
let currentData = {};

/** @type {Object.<string, Object>} Original dataset before any thresholding */
let originalData = {};

/** @type {Object.<string, Object>} NAVR threshold data */
let navrData = {};

/** @type {boolean} Whether NAVR thresholding is currently applied */
let isThresholded = false;

/** @type {boolean} Whether NAVR data has been loaded */
let navrDataLoaded = false;

// =============================================================================
// CONSTANTS
// =============================================================================

/** Data processing configuration */
const DATA_CONFIG = {
    COHEN_D_COLUMNS: ['Cohen_d', 'd_icv', 'Cohen_d_thresholded', 'd_icv_thresholded'],
    NAVR_AUTO_LOAD_DELAY: 500, // milliseconds
    EXPORT_TIMESTAMP_FORMAT: 'YYYY-MM-DD',

    SELECTORS: {
        METRIC_UPLOAD: 'metricSelectUpload',
        METRIC_GALLERY: 'metricSelect',
        TOGGLE_THRESHOLD_BTN: 'toggleThresholdBtn',
        EXPORT_DATA_BTN: 'exportDataBtn',
        THRESHOLD_STATUS: 'thresholdStatus',
        LOADING: 'loading'
    },

    STATISTICS: {
        VALID_COUNT: 'validCount',
        NAN_COUNT: 'nanCount',
        TOTAL_COUNT: 'totalCount',
        MEAN_COHEN: 'meanCohen'
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Logs debug messages with consistent formatting
 * @param {string} message - The debug message
 * @param {*} data - Optional data to log
 */
function logDebug(message, data = null) {
    if (data !== null) {
        console.debug(`[DATA] ${message}`, data);
    } else {
        console.debug(`[DATA] ${message}`);
    }
}

/**
 * Gets DOM element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} The element or null if not found
 */
function getDataElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`[DATA] Element not found: ${id}`);
    }
    return element;
}

/**
 * Updates text content of an element safely
 * @param {string} elementId - ID of the element to update
 * @param {string} text - Text content to set
 */
function updateElementText(elementId, text) {
    const element = getDataElement(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Validates that required data exists before operations
 * @param {string} operation - Name of the operation being performed
 * @returns {boolean} True if data exists, false otherwise
 */
function validateDataExists(operation) {
    if (Object.keys(currentData).length === 0) {
        logDebug(`${operation} failed: No data loaded`);
        return false;
    }
    return true;
}

// =============================================================================
// STRUCTURE NAME NORMALIZATION
// =============================================================================

/**
 * Normalizes brain structure names from various conventions to standardized format
 * Handles mappings between ENIGMA, FreeSurfer, and other naming conventions
 * 
 * @param {string} structure - Original structure name
 * @returns {string} Normalized structure name
 */
function normalizeStructureName(structure) {
    if (!structure || typeof structure !== 'string') {
        console.warn('[DATA] Invalid structure name provided:', structure);
        return structure;
    }

    // Comprehensive mapping from various naming conventions to standardized names
    const structureMapping = {
        // Cortical structures - L_ to lh_ and R_ to rh_ prefixes
        'L_bankssts': 'lh_bankssts',
        'R_bankssts': 'rh_bankssts',
        'L_caudalanteriorcingulate': 'lh_caudalanteriorcingulate',
        'R_caudalanteriorcingulate': 'rh_caudalanteriorcingulate',
        'L_caudalmiddlefrontal': 'lh_caudalmiddlefrontal',
        'R_caudalmiddlefrontal': 'rh_caudalmiddlefrontal',
        'L_cuneus': 'lh_cuneus',
        'R_cuneus': 'rh_cuneus',
        'L_entorhinal': 'lh_entorhinal',
        'R_entorhinal': 'rh_entorhinal',
        'L_fusiform': 'lh_fusiform',
        'R_fusiform': 'rh_fusiform',
        'L_inferiorparietal': 'lh_inferiorparietal',
        'R_inferiorparietal': 'rh_inferiorparietal',
        'L_inferiortemporal': 'lh_inferiortemporal',
        'R_inferiortemporal': 'rh_inferiortemporal',
        'L_isthmuscingulate': 'lh_isthmuscingulate',
        'R_isthmuscingulate': 'rh_isthmuscingulate',
        'L_lateraloccipital': 'lh_lateraloccipital',
        'R_lateraloccipital': 'rh_lateraloccipital',
        'L_lateralorbitofrontal': 'lh_lateralorbitofrontal',
        'R_lateralorbitofrontal': 'rh_lateralorbitofrontal',
        'L_lingual': 'lh_lingual',
        'R_lingual': 'rh_lingual',
        'L_medialorbitofrontal': 'lh_medialorbitofrontal',
        'R_medialorbitofrontal': 'rh_medialorbitofrontal',
        'L_middletemporal': 'lh_middletemporal',
        'R_middletemporal': 'rh_middletemporal',
        'L_parahippocampal': 'lh_parahippocampal',
        'R_parahippocampal': 'rh_parahippocampal',
        'L_paracentral': 'lh_paracentral',
        'R_paracentral': 'rh_paracentral',
        'L_parsopercularis': 'lh_parsopercularis',
        'R_parsopercularis': 'rh_parsopercularis',
        'L_parsorbitalis': 'lh_parsorbitalis',
        'R_parsorbitalis': 'rh_parsorbitalis',
        'L_parstriangularis': 'lh_parstriangularis',
        'R_parstriangularis': 'rh_parstriangularis',
        'L_pericalcarine': 'lh_pericalcarine',
        'R_pericalcarine': 'rh_pericalcarine',
        'L_postcentral': 'lh_postcentral',
        'R_postcentral': 'rh_postcentral',
        'L_posteriorcingulate': 'lh_posteriorcingulate',
        'R_posteriorcingulate': 'rh_posteriorcingulate',
        'L_precentral': 'lh_precentral',
        'R_precentral': 'rh_precentral',
        'L_precuneus': 'lh_precuneus',
        'R_precuneus': 'rh_precuneus',
        'L_rostralanteriorcingulate': 'lh_rostralanteriorcingulate',
        'R_rostralanteriorcingulate': 'rh_rostralanteriorcingulate',
        'L_rostralmiddlefrontal': 'lh_rostralmiddlefrontal',
        'R_rostralmiddlefrontal': 'rh_rostralmiddlefrontal',
        'L_superiorfrontal': 'lh_superiorfrontal',
        'R_superiorfrontal': 'rh_superiorfrontal',
        'L_superiorparietal': 'lh_superiorparietal',
        'R_superiorparietal': 'rh_superiorparietal',
        'L_superiortemporal': 'lh_superiortemporal',
        'R_superiortemporal': 'rh_superiortemporal',
        'L_supramarginal': 'lh_supramarginal',
        'R_supramarginal': 'rh_supramarginal',
        'L_frontalpole': 'lh_frontalpole',
        'R_frontalpole': 'rh_frontalpole',
        'L_temporalpole': 'lh_temporalpole',
        'R_temporalpole': 'rh_temporalpole',
        'L_transversetemporal': 'lh_transversetemporal',
        'R_transversetemporal': 'rh_transversetemporal',
        'L_insula': 'lh_insula',
        'R_insula': 'rh_insula',

        // Subcortical structures - ENIGMA format to FreeSurfer format
        'Laccumb': 'Left-Accumbens-area',
        'Raccumb': 'Right-Accumbens-area',
        'Lamyg': 'Left-Amygdala',
        'Ramyg': 'Right-Amygdala',
        'Lcaud': 'Left-Caudate',
        'Rcaud': 'Right-Caudate',
        'Lhippo': 'Left-Hippocampus',
        'Rhippo': 'Right-Hippocampus',
        'Lpal': 'Left-Pallidum',
        'Rpal': 'Right-Pallidum',
        'Lput': 'Left-Putamen',
        'Rput': 'Right-Putamen',
        'Lthal': 'Left-Thalamus',
        'Rthal': 'Right-Thalamus',
        'LLatVent': 'Left-Lateral-Ventricle',
        'RLatVent': 'Right-Lateral-Ventricle'
    };

    // Check direct mapping first
    if (structureMapping[structure]) {
        return structureMapping[structure];
    }

    // Apply general transformation rules
    if (structure.startsWith('L_')) {
        return structure.replace('L_', 'lh_');
    } else if (structure.startsWith('R_')) {
        return structure.replace('R_', 'rh_');
    }

    // Return original if no transformation needed
    return structure;
}

/**
 * Determines hemisphere from structure name
 * @param {string} structure - Structure name
 * @returns {string} 'left', 'right', or 'unknown'
 */
function getHemisphere(structure) {
    if (structure.startsWith('lh_') || structure.includes('Left-') || structure.startsWith('L_')) {
        return 'left';
    } else if (structure.startsWith('rh_') || structure.includes('Right-') || structure.startsWith('R_')) {
        return 'right';
    }
    return 'unknown';
}

/**
 * Determines structure type based on atlas definitions
 * @param {string} structure - Normalized structure name
 * @returns {string} 'cortical' or 'subcortical'
 */
function getStructureType(structure) {
    if (!window.brainAtlases || !currentAtlas) {
        logDebug('Atlas definitions not available, defaulting to cortical');
        return 'cortical';
    }

    const atlas = window.brainAtlases[currentAtlas];
    if (atlas && atlas.subcortical && atlas.subcortical.includes(structure)) {
        logDebug(`Structure ${structure} classified as subcortical`);
        return 'subcortical';
    }

    logDebug(`Structure ${structure} classified as cortical`);
    return 'cortical';
}

// =============================================================================
// CSV DATA PROCESSING
// =============================================================================

/**
 * Extracts Cohen's d value from a data row using various column name conventions
 * @param {Object} row - CSV data row
 * @returns {number|null} Cohen's d value or null if not found
 */
function extractCohenD(row) {
    for (const columnName of DATA_CONFIG.COHEN_D_COLUMNS) {
        if (row.hasOwnProperty(columnName)) {
            return row[columnName];
        }
    }
    return null;
}

/**
 * Processes CSV data and normalizes it for visualization
 * @param {Array<Object>} data - Parsed CSV data array
 */
function processCsvData(data) {
    logDebug('Processing CSV data', { rowCount: data.length });

    if (!Array.isArray(data) || data.length === 0) {
        console.error('[DATA] Invalid or empty CSV data provided');
        alert('No valid data found in CSV file');
        return;
    }

    // Reset data containers
    currentData = {};
    originalData = {};

    let processedCount = 0;
    let skippedCount = 0;

    data.forEach((row, index) => {
        try {
            // Validate required fields
            if (!row.Structure) {
                logDebug(`Row ${index + 1}: Missing Structure field`, row);
                skippedCount++;
                return;
            }

            const cohenD = extractCohenD(row);
            if (cohenD === null) {
                logDebug(`Row ${index + 1}: No Cohen's d column found`, row);
                skippedCount++;
                return;
            }

            // Normalize structure name
            const originalStructure = row.Structure.trim();
            const normalizedStructure = normalizeStructureName(originalStructure);

            if (!normalizedStructure) {
                console.warn(`[DATA] Could not normalize structure: ${originalStructure}`);
                skippedCount++;
                return;
            }

            // Create structure data object
            const structureData = {
                cohen_d: cohenD,
                hemisphere: getHemisphere(normalizedStructure),
                type: getStructureType(normalizedStructure),
                originalName: originalStructure,
                population_size: parseInt(row.population_size) || null,
                n_patients: parseInt(row.n_patients) || null,
                n_controls: parseInt(row.n_controls) || null
            };

            // Store in both current and original data
            currentData[normalizedStructure] = structureData;
            originalData[normalizedStructure] = { ...structureData };

            processedCount++;

        } catch (error) {
            console.error(`[DATA] Error processing row ${index + 1}:`, error, row);
            skippedCount++;
        }
    });

    logDebug(`CSV processing complete: ${processedCount} processed, ${skippedCount} skipped`);

    // Reset thresholding state
    resetThresholdingState();

    // Update UI and load meshes
    updateStatistics();

    if (typeof autoRange === 'function') {
        autoRange();
    }

    if (typeof loadBrainMeshes === 'function') {
        loadBrainMeshes();
    }

    // Enable export functionality
    enableDataExport();

    // Auto-load NAVR data if metric is selected
    scheduleNavrAutoLoad();
}

/**
 * Resets thresholding state when new data is loaded
 */
function resetThresholdingState() {
    isThresholded = false;
    navrDataLoaded = false;
    navrData = {};

    const toggleBtn = getDataElement(DATA_CONFIG.SELECTORS.TOGGLE_THRESHOLD_BTN);
    if (toggleBtn) {
        toggleBtn.disabled = true;
        toggleBtn.textContent = 'Apply Threshold';
        toggleBtn.style.background = 'linear-gradient(45deg, #4fc3f7, #29b6f6)';
    }

    updateElementText(DATA_CONFIG.SELECTORS.THRESHOLD_STATUS, 'No NAVR data loaded');
}

/**
 * Enables data export functionality
 */
function enableDataExport() {
    const exportBtn = getDataElement(DATA_CONFIG.SELECTORS.EXPORT_DATA_BTN);
    if (exportBtn) {
        exportBtn.disabled = false;
    }
}

/**
 * Schedules automatic NAVR data loading if conditions are met
 */
function scheduleNavrAutoLoad() {
    const metricSelect = getDataElement(DATA_CONFIG.SELECTORS.METRIC_UPLOAD);
    if (metricSelect && metricSelect.value) {
        logDebug('Scheduling auto-load of NAVR data');
        setTimeout(() => {
            if (typeof loadNavrData === 'function') {
                loadNavrData();
            }
        }, DATA_CONFIG.NAVR_AUTO_LOAD_DELAY);
    }
}

// =============================================================================
// FILE UPLOAD HANDLING
// =============================================================================

/**
 * Handles file upload events for CSV files
 * @param {Event} event - File input change event
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        logDebug('No file selected');
        return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
    }

    logDebug(`Processing uploaded file: ${file.name}`);

    const loadingElement = getDataElement(DATA_CONFIG.SELECTORS.LOADING);
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            try {
                processCsvData(results.data);
            } catch (error) {
                console.error('[DATA] Error processing CSV:', error);
                alert('Error processing CSV file. Please check the format.');
            } finally {
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
            }
        },
        error: function (error) {
            console.error('[DATA] CSV parsing error:', error);
            alert('Error parsing CSV file. Please check the format.');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    });
}

// =============================================================================
// NAVR DATA LOADING AND PROCESSING
// =============================================================================

/**
 * Loads NAVR threshold data for the current dataset
 */
async function loadNavrData() {
    if (!validateDataExists('NAVR loading')) {
        alert('Please upload CSV data first before loading NAVR data.');
        return;
    }

    const selectedMetric = getDataElement(DATA_CONFIG.SELECTORS.METRIC_UPLOAD)?.value;
    if (!selectedMetric) {
        alert('Please select a metric first.');
        return;
    }

    logDebug(`Loading NAVR data for metric: ${selectedMetric}`);

    const loadingElement = getDataElement(DATA_CONFIG.SELECTORS.LOADING);
    if (loadingElement) {
        loadingElement.style.display = 'block';
        loadingElement.textContent = 'Loading NAVR data...';
    }

    try {
        const navrFiles = buildNavrFilePaths(selectedMetric);
        const loadResults = await loadNavrFiles(navrFiles);

        if (loadResults.totalLoaded > 0) {
            handleSuccessfulNavrLoad(loadResults);
        } else {
            handleFailedNavrLoad(navrFiles);
        }

    } catch (error) {
        console.error('[DATA] Error in NAVR loading process:', error);
        alert(`Error loading NAVR data: ${error.message}`);
    } finally {
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

/**
 * Builds file paths for NAVR data based on selected metric
 * @param {string} selectedMetric - Selected metric (thickness, area, volume)
 * @returns {Object} Object with cortical and subcortical file paths
 */
function buildNavrFilePaths(selectedMetric) {
    const atlasToUse = window.currentAtlas || currentAtlas || 'desikan';
    const currentView = window.currentView || 'cortical';

    let corticalMetric, subcorticalMetric;

    if (selectedMetric === 'volume') {
        corticalMetric = 'volume';
        subcorticalMetric = 'volume';
    } else {
        // For thickness/area, these are cortical metrics
        corticalMetric = selectedMetric;
        subcorticalMetric = 'volume'; // Subcortical is always volume
    }

    return {
        cortical: `data/${atlasToUse}/navr_cortical_${corticalMetric}.csv`,
        subcortical: `data/${atlasToUse}/navr_subcortical_${subcorticalMetric}.csv`
    };
}

/**
 * Loads NAVR files and processes them
 * @param {Object} navrFiles - Object with cortical and subcortical file paths
 * @returns {Object} Load results with success flags and counts
 */
async function loadNavrFiles(navrFiles) {
    logDebug('Attempting to load NAVR files', navrFiles);

    const results = {
        corticalLoaded: false,
        subcorticalLoaded: false,
        totalLoaded: 0
    };

    // Load cortical NAVR data
    try {
        const corticalResponse = await fetch(navrFiles.cortical);
        if (corticalResponse.ok) {
            const corticalText = await corticalResponse.text();
            processCorticalNavrData(corticalText);
            results.corticalLoaded = true;
            results.totalLoaded++;
            logDebug('Cortical NAVR data loaded successfully');
        } else {
            console.warn(`[DATA] Cortical NAVR file not found: ${navrFiles.cortical}`);
        }
    } catch (error) {
        console.warn('[DATA] Error loading cortical NAVR data:', error);
    }

    // Load subcortical NAVR data
    try {
        const subcorticalResponse = await fetch(navrFiles.subcortical);
        if (subcorticalResponse.ok) {
            const subcorticalText = await subcorticalResponse.text();
            processSubcorticalNavrData(subcorticalText);
            results.subcorticalLoaded = true;
            results.totalLoaded++;
            logDebug('Subcortical NAVR data loaded successfully');
        } else {
            console.warn(`[DATA] Subcortical NAVR file not found: ${navrFiles.subcortical}`);
        }
    } catch (error) {
        console.warn('[DATA] Error loading subcortical NAVR data:', error);
    }

    return results;
}

/**
 * Handles successful NAVR data loading
 * @param {Object} loadResults - Results from NAVR file loading
 */
function handleSuccessfulNavrLoad(loadResults) {
    navrDataLoaded = true;

    const toggleBtn = getDataElement(DATA_CONFIG.SELECTORS.TOGGLE_THRESHOLD_BTN);
    const exportBtn = getDataElement(DATA_CONFIG.SELECTORS.EXPORT_DATA_BTN);

    if (toggleBtn) toggleBtn.disabled = false;
    if (exportBtn) exportBtn.disabled = false;

    const statusText = [];
    if (loadResults.corticalLoaded) statusText.push('cortical');
    if (loadResults.subcorticalLoaded) statusText.push('subcortical');

    updateElementText(
        DATA_CONFIG.SELECTORS.THRESHOLD_STATUS,
        `NAVR data loaded for: ${statusText.join(', ')} (${Object.keys(navrData).length} structures)`
    );

    // Ensure original data backup exists
    if (Object.keys(originalData).length === 0) {
        logDebug('Creating original data backup');
        Object.keys(currentData).forEach(structure => {
            originalData[structure] = { ...currentData[structure] };
        });
    }

    logDebug(`NAVR data loaded for ${Object.keys(navrData).length} structures`);
}

/**
 * Handles failed NAVR data loading
 * @param {Object} navrFiles - File paths that failed to load
 */
function handleFailedNavrLoad(navrFiles) {
    const fileList = Object.values(navrFiles).join('\\n');
    alert(`Could not load NAVR data files. Expected files:\\n${fileList}\\n\\nPlease ensure these files exist in your project directory.`);
}

/**
 * Processes cortical NAVR CSV data
 * @param {string} csvText - Raw CSV text content
 */
function processCorticalNavrData(csvText) {
    Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            let processedCount = 0;

            results.data.forEach(row => {
                if (row.region && row.hemisphere && row.hasOwnProperty('NAVR_corrected')) {
                    const structure = `${row.hemisphere}_${row.region}`;
                    navrData[structure] = {
                        navr: parseFloat(row.NAVR) || 0,
                        navr_corrected: parseFloat(row.NAVR_corrected) || 0,
                        correction: parseFloat(row.correction) || 0,
                        population_size: parseInt(row.population_size) || 0
                    };
                    processedCount++;
                }
            });

            logDebug(`Processed cortical NAVR data: ${processedCount} entries`);
        },
        error: function (error) {
            console.error('[DATA] Error parsing cortical NAVR CSV:', error);
        }
    });
}

/**
 * Processes subcortical NAVR CSV data
 * @param {string} csvText - Raw CSV text content
 */
function processSubcorticalNavrData(csvText) {
    Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            let processedCount = 0;

            results.data.forEach(row => {
                if (row.region && row.hasOwnProperty('NAVR_corrected')) {
                    const structure = row.region;
                    navrData[structure] = {
                        navr: parseFloat(row.NAVR) || 0,
                        navr_corrected: parseFloat(row.NAVR_corrected) || 0,
                        correction: parseFloat(row.correction) || 0,
                        population_size: parseInt(row.population_size) || 0
                    };
                    processedCount++;
                }
            });

            logDebug(`Processed subcortical NAVR data: ${processedCount} total entries`);
        },
        error: function (error) {
            console.error('[DATA] Error parsing subcortical NAVR CSV:', error);
        }
    });
}

// =============================================================================
// THRESHOLDING FUNCTIONALITY
// =============================================================================

/**
 * Toggles NAVR thresholding on/off
 */
function toggleThresholding() {
    if (!navrDataLoaded) {
        alert('Please load NAVR data first.');
        return;
    }

    const toggleBtn = getDataElement(DATA_CONFIG.SELECTORS.TOGGLE_THRESHOLD_BTN);

    if (!isThresholded) {
        applyThresholding(toggleBtn);
    } else {
        removeThresholding(toggleBtn);
    }

    // Update mesh userData and visualization
    if (typeof updateMeshUserData === 'function') {
        updateMeshUserData();
    }

    updateStatistics();

    if (typeof updateBrainVisualization === 'function') {
        updateBrainVisualization();
    }
}

/**
 * Applies NAVR thresholding to the current dataset
 * @param {HTMLElement} toggleBtn - The threshold toggle button
 */
function applyThresholding(toggleBtn) {
    logDebug('Applying NAVR thresholding');

    let thresholdedCount = 0;

    Object.keys(currentData).forEach(structure => {
        const cohenD = currentData[structure].cohen_d;
        const navrInfo = navrData[structure];

        if (navrInfo && !isNaN(cohenD)) {
            const threshold = Math.abs((2 / Math.sqrt(navrInfo.population_size)) * navrInfo.navr);
            if (Math.abs(cohenD) < threshold) {
                currentData[structure].cohen_d = NaN;
                thresholdedCount++;
            }
        }
    });

    isThresholded = true;

    if (toggleBtn) {
        toggleBtn.textContent = 'Remove Threshold';
        toggleBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ff8e53)';
    }

    updateElementText(
        DATA_CONFIG.SELECTORS.THRESHOLD_STATUS,
        `Thresholding applied: ${thresholdedCount} values below NAVR threshold`
    );

    logDebug(`Applied NAVR thresholding: ${thresholdedCount} values thresholded`);
}

/**
 * Removes NAVR thresholding and restores original data
 * @param {HTMLElement} toggleBtn - The threshold toggle button
 */
function removeThresholding(toggleBtn) {
    logDebug('Removing NAVR thresholding');

    // Restore original data
    Object.keys(originalData).forEach(structure => {
        if (currentData[structure] && originalData[structure]) {
            currentData[structure].cohen_d = originalData[structure].cohen_d;
        }
    });

    isThresholded = false;

    if (toggleBtn) {
        toggleBtn.textContent = 'Apply Threshold';
        toggleBtn.style.background = 'linear-gradient(45deg, #4fc3f7, #29b6f6)';
    }

    updateElementText(
        DATA_CONFIG.SELECTORS.THRESHOLD_STATUS,
        `NAVR data loaded (${Object.keys(navrData).length} structures) - thresholding removed`
    );

    logDebug('NAVR thresholding removed - original data restored');
}

/**
 * Updates mesh userData when currentData changes
 * This function is called from external modules
 */
function updateMeshUserData() {
    if (typeof window.brainMeshes === 'undefined' || !window.brainMeshes) {
        logDebug('No brain meshes available for userData update');
        return;
    }

    window.brainMeshes.forEach(mesh => {
        const userData = mesh.userData;
        if (userData && userData.structure && currentData[userData.structure]) {
            userData.cohen_d = currentData[userData.structure].cohen_d;
        }
    });

    logDebug('Updated mesh userData with current Cohen\'s d values');
}

// =============================================================================
// STATISTICS CALCULATION
// =============================================================================

/**
 * Updates statistical information displayed in the UI
 */
function updateStatistics() {
    if (!validateDataExists('Statistics update')) {
        resetStatisticsDisplay();
        return;
    }

    const cohenDValues = Object.values(currentData).map(d => d.cohen_d);
    const validValues = cohenDValues.filter(d => !isNaN(d) && d !== null);
    const nanCount = cohenDValues.length - validValues.length;

    const mean = validValues.length > 0 ?
        validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;

    // Update UI elements
    updateElementText(DATA_CONFIG.STATISTICS.VALID_COUNT, validValues.length.toString());
    updateElementText(DATA_CONFIG.STATISTICS.NAN_COUNT, nanCount.toString());
    updateElementText(DATA_CONFIG.STATISTICS.TOTAL_COUNT, cohenDValues.length.toString());
    updateElementText(DATA_CONFIG.STATISTICS.MEAN_COHEN, mean.toFixed(3));

    logDebug(`Statistics updated: ${validValues.length} valid, ${nanCount} thresholded, mean = ${mean.toFixed(3)}`);
}

/**
 * Resets statistics display when no data is available
 */
function resetStatisticsDisplay() {
    updateElementText(DATA_CONFIG.STATISTICS.VALID_COUNT, '0');
    updateElementText(DATA_CONFIG.STATISTICS.NAN_COUNT, '0');
    updateElementText(DATA_CONFIG.STATISTICS.TOTAL_COUNT, '0');
    updateElementText(DATA_CONFIG.STATISTICS.MEAN_COHEN, '0.00');
}

// =============================================================================
// DATA EXPORT FUNCTIONALITY
// =============================================================================

/**
 * Exports current dataset with thresholding information
 */
function exportThresholdedData() {
    if (!validateDataExists('Data export')) {
        alert('No data to export. Please load a dataset first.');
        return;
    }

    logDebug('Preparing data export');

    try {
        const exportData = prepareExportData();
        const format = promptForExportFormat();

        if (format === 'csv') {
            exportAsCSV(exportData);
        } else if (format === 'json') {
            exportAsJSON(exportData);
        }

    } catch (error) {
        console.error('[DATA] Export error:', error);
        alert(`Error exporting data: ${error.message}`);
    }
}

/**
 * Prepares data for export with comprehensive information
 * @returns {Array<Object>} Array of export data objects
 */
function prepareExportData() {
    const exportData = [];

    Object.keys(currentData).forEach(structure => {
        const current = currentData[structure];
        const original = originalData[structure];

        exportData.push({
            Structure: structure,
            Cohen_d_original: original ? original.cohen_d : null,
            Cohen_d_current: current.cohen_d,
            Hemisphere: current.hemisphere,
            Type: current.type,
            Is_thresholded: isNaN(current.cohen_d) && !isNaN(original?.cohen_d),
            NAVR_threshold: navrData[structure] ? Math.abs(navrData[structure].navr_corrected) : null,
            Original_name: current.originalName || structure
        });
    });

    logDebug(`Prepared ${exportData.length} structures for export`);
    return exportData;
}

/**
 * Prompts user for export format selection
 * @returns {string|null} Selected format ('csv', 'json') or null if cancelled
 */
function promptForExportFormat() {
    const format = prompt(
        'Choose export format:\\n1. CSV\\n2. JSON\\n\\nEnter "1" for CSV or "2" for JSON:',
        '1'
    );

    if (format === '1' || format === 'csv' || format === 'CSV') {
        return 'csv';
    } else if (format === '2' || format === 'json' || format === 'JSON') {
        return 'json';
    } else if (format !== null) {
        alert('Invalid format selected. Please choose 1 for CSV or 2 for JSON.');
    }

    return null;
}

/**
 * Exports data as CSV format
 * @param {Array<Object>} data - Data to export
 */
function exportAsCSV(data) {
    logDebug('Exporting data as CSV');

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            // Handle null/undefined values and escape quotes
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','))
    ].join('\\n');

    const filename = generateExportFilename('csv');
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');

    logDebug(`CSV export complete: ${filename}`);
}

/**
 * Exports data as JSON format with metadata
 * @param {Array<Object>} data - Data to export
 */
function exportAsJSON(data) {
    logDebug('Exporting data as JSON');

    const exportObject = {
        metadata: {
            export_date: new Date().toISOString(),
            is_thresholded: isThresholded,
            navr_data_loaded: navrDataLoaded,
            total_structures: data.length,
            thresholded_count: data.filter(d => d.Is_thresholded).length,
            atlas: window.currentAtlas || 'unknown',
            view: window.currentView || 'unknown',
            version: '1.0.0'
        },
        data: data
    };

    const jsonContent = JSON.stringify(exportObject, null, 2);
    const filename = generateExportFilename('json');
    downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');

    logDebug(`JSON export complete: ${filename}`);
}

/**
 * Generates a filename for export with timestamp and threshold status
 * @param {string} extension - File extension ('csv' or 'json')
 * @returns {string} Generated filename
 */
function generateExportFilename(extension) {
    const timestamp = new Date().toISOString().split('T')[0];
    const thresholdStatus = isThresholded ? 'thresholded' : 'original';
    return `brain_data_${thresholdStatus}_${timestamp}.${extension}`;
}

/**
 * Downloads a file with specified content and filename
 * @param {string} content - File content
 * @param {string} filename - Desired filename
 * @param {string} mimeType - MIME type for the file
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize data processing module
 */
function initializeDataProcessing() {
    logDebug('Data processing module initialized');

    // Set up file upload handler if element exists
    const csvFileInput = getDataElement('csvFile');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', handleFileUpload);
        logDebug('File upload handler attached');
    }
}

// Initialize when script loads
initializeDataProcessing();