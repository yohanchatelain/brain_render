/**
 * Gallery Manager Module
 * 
 * Handles the browsing, selection, and loading of datasets from the gallery.
 * Provides functionality for:
 * - Loading gallery index and datasets
 * - Hierarchical dataset selection (paper -> disease -> metric -> subgroup)
 * - Random dataset selection
 * - Paper information display
 * 
 * @author Brain Render Team
 * @version 1.0.0
 */

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/** @type {Object.<string, Array>} Maps paper names to their datasets */
let galleryData = {};

/** @type {Array<string>} List of available papers */
let availablePapers = [];

/** @type {string|null} Currently selected paper name */
let currentPaper = null;

/** @type {Array<Object>} Datasets for the current paper */
let currentDatasets = [];

/** @type {Object|null} Currently selected dataset */
let selectedDataset = null;

// =============================================================================
// CONSTANTS
// =============================================================================

/** Gallery configuration */
const GALLERY_CONFIG = {
    INDEX_FILE: 'gallery/index.json',
    BASE_PATH: 'gallery/',
    SELECTORS: {
        PAPER: 'paperSelect',
        DISEASE: 'diseaseSelect', 
        METRIC: 'metricSelect',
        SUBGROUP: 'subgroupSelect',
        METRIC_UPLOAD: 'metricSelectUpload'
    },
    ELEMENTS: {
        CONTAINER: 'galleryContainer',
        STATUS: 'galleryStatus',
        PAPER_INFO: 'paperInfo',
        LOAD_BTN: 'loadDatasetBtn',
        RANDOM_BTN: 'randomExampleBtn',
        REFRESH_BTN: 'refreshGalleryBtn'
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
    if (data) {
        console.debug(`[GALLERY] ${message}`, data);
    } else {
        console.debug(`[GALLERY] ${message}`);
    }
}

/**
 * Gets DOM element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} The element or null if not found
 */
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`[GALLERY] Element not found: ${id}`);
    }
    return element;
}

/**
 * Updates gallery status message
 * @param {string} message - Status message to display
 */
function updateStatus(message) {
    const statusElement = getElement(GALLERY_CONFIG.ELEMENTS.STATUS);
    if (statusElement) {
        statusElement.textContent = message;
    }
    logDebug(`Status: ${message}`);
}

/**
 * Populates a dropdown with options
 * @param {string} selectId - ID of the select element
 * @param {Array<string>} items - Array of option values
 * @param {string} placeholder - Placeholder text for first option
 */
function populateDropdown(selectId, items, placeholder = null) {
    logDebug(`Populating ${selectId}`, items);
    
    const select = getElement(selectId);
    if (!select) return;
    
    const defaultText = placeholder || `Select ${selectId.replace('Select', '')}...`;
    select.innerHTML = `<option value="">${defaultText}</option>`;
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}

/**
 * Resets dropdown selections to default state
 * @param {Array<string>} dropdownNames - Names of dropdowns to reset
 */
function resetDropdowns(dropdownNames) {
    logDebug('Resetting dropdowns', dropdownNames);
    
    dropdownNames.forEach(name => {
        const select = getElement(`${name}Select`);
        if (select) {
            const defaultText = `Select ${name}...`;
            select.innerHTML = `<option value="">${defaultText}</option>`;
        }
    });
}

/**
 * Hides multiple DOM elements
 * @param {Array<string>} elementIds - Array of element IDs to hide
 */
function hideElements(elementIds) {
    logDebug('Hiding elements', elementIds);
    
    elementIds.forEach(id => {
        const element = getElement(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

/**
 * Shows multiple DOM elements
 * @param {Array<string>} elementIds - Array of element IDs to show
 */
function showElements(elementIds) {
    logDebug('Showing elements', elementIds);
    
    elementIds.forEach(id => {
        const element = getElement(id);
        if (element) {
            element.style.display = 'block';
        }
    });
}

// =============================================================================
// DROPDOWN EVENT HANDLERS
// =============================================================================

/**
 * Handles paper selection change
 * Populates disease dropdown based on selected paper
 */
async function onPaperChange() {
    logDebug('Paper selection changed');
    
    const paperSelect = getElement(GALLERY_CONFIG.SELECTORS.PAPER);
    const selectedPaper = paperSelect?.value;
    
    // Reset downstream UI
    resetDropdowns(['disease', 'metric', 'subgroup']);
    hideElements([
        GALLERY_CONFIG.SELECTORS.DISEASE, 
        GALLERY_CONFIG.SELECTORS.METRIC, 
        GALLERY_CONFIG.SELECTORS.SUBGROUP,
        GALLERY_CONFIG.ELEMENTS.PAPER_INFO, 
        GALLERY_CONFIG.ELEMENTS.LOAD_BTN
    ]);

    if (!selectedPaper) {
        updateStatus('Please select a paper.');
        return;
    }

    currentPaper = selectedPaper;
    currentDatasets = galleryData[selectedPaper] || [];
    logDebug(`Datasets for paper '${currentPaper}'`, currentDatasets);

    if (currentDatasets.length === 0) {
        updateStatus('No datasets for this paper.');
        return;
    }

    // Display paper info and populate disease dropdown
    await displayBasicPaperInfo(selectedPaper);
    showElements([GALLERY_CONFIG.ELEMENTS.PAPER_INFO]);

    const diseases = [...new Set(currentDatasets.map(d => d.disease))].sort();
    logDebug('Available diseases', diseases);
    
    populateDropdown(GALLERY_CONFIG.SELECTORS.DISEASE, diseases);
    showElements([GALLERY_CONFIG.SELECTORS.DISEASE]);

    updateStatus(`Paper "${selectedPaper}" selected (${currentDatasets.length} datasets)`);
}

/**
 * Handles disease selection change
 * Populates metric dropdown based on selected disease
 */
function onDiseaseChange() {
    logDebug('Disease selection changed');
    
    const diseaseSelect = getElement(GALLERY_CONFIG.SELECTORS.DISEASE);
    const disease = diseaseSelect?.value;

    resetDropdowns(['metric', 'subgroup']);
    hideElements([
        GALLERY_CONFIG.SELECTORS.METRIC, 
        GALLERY_CONFIG.SELECTORS.SUBGROUP, 
        GALLERY_CONFIG.ELEMENTS.LOAD_BTN
    ]);

    if (!disease) {
        logDebug('No disease selected');
        return;
    }

    const filtered = currentDatasets.filter(d => d.disease === disease);
    logDebug(`Datasets for disease '${disease}'`, filtered);

    const metrics = [...new Set(filtered.map(d => d.metric))].sort();
    logDebug('Available metrics', metrics);
    
    populateDropdown(GALLERY_CONFIG.SELECTORS.METRIC, metrics);
    showElements([GALLERY_CONFIG.SELECTORS.METRIC]);

    updateStatus(`Disease "${disease}" (${filtered.length} datasets)`);
}

/**
 * Handles upload metric selection change
 * Enables/disables file upload based on metric selection
 */
function onMetricUploadChange() {
    logDebug('Upload metric selection changed');
    
    const metricSelect = getElement(GALLERY_CONFIG.SELECTORS.METRIC_UPLOAD);
    const metric = metricSelect?.value;
    
    const csvFile = getElement('csvFile');
    const uploadWarning = getElement('uploadWarning');
    
    if (!metric) {
        logDebug('No metric selected, disabling file upload');
        if (csvFile) {
            csvFile.disabled = true;
            csvFile.setAttribute('disabled', 'disabled');
        }
        if (uploadWarning) uploadWarning.style.display = 'block';
    } else {
        logDebug('Metric selected, enabling file upload');
        if (csvFile) {
            csvFile.disabled = false;
            csvFile.removeAttribute('disabled');
        }
        if (uploadWarning) uploadWarning.style.display = 'none';
    }
}

/**
 * Handles metric selection change
 * Populates subgroup dropdown based on selected metric
 */
function onMetricChange() {
    logDebug('Metric selection changed');
    
    const diseaseSelect = getElement(GALLERY_CONFIG.SELECTORS.DISEASE);
    const metricSelect = getElement(GALLERY_CONFIG.SELECTORS.METRIC);
    
    const disease = diseaseSelect?.value;
    const metric = metricSelect?.value;

    resetDropdowns(['subgroup']);
    hideElements([GALLERY_CONFIG.SELECTORS.SUBGROUP, GALLERY_CONFIG.ELEMENTS.LOAD_BTN]);

    if (!metric) {
        logDebug('No metric selected');
        return;
    }

    const filtered = currentDatasets.filter(d => 
        d.disease === disease && d.metric === metric
    );
    logDebug(`Datasets for metric '${metric}'`, filtered);

    const subgroups = [...new Set(filtered.map(d => d.subgroup))].sort();
    logDebug('Available subgroups', subgroups);
    
    populateDropdown(GALLERY_CONFIG.SELECTORS.SUBGROUP, subgroups);
    showElements([GALLERY_CONFIG.SELECTORS.SUBGROUP]);

    updateStatus(`Metric "${metric}" (${filtered.length} datasets)`);
}

/**
 * Handles subgroup selection change
 * Enables dataset loading when all selections are made
 */
async function onSubgroupChange() {
    logDebug('Subgroup selection changed');
    
    const diseaseSelect = getElement(GALLERY_CONFIG.SELECTORS.DISEASE);
    const metricSelect = getElement(GALLERY_CONFIG.SELECTORS.METRIC);
    const subgroupSelect = getElement(GALLERY_CONFIG.SELECTORS.SUBGROUP);
    
    const disease = diseaseSelect?.value;
    const metric = metricSelect?.value;
    const subgroup = subgroupSelect?.value;

    hideElements([GALLERY_CONFIG.ELEMENTS.LOAD_BTN]);
    
    if (!subgroup) {
        logDebug('No subgroup selected');
        return;
    }

    selectedDataset = currentDatasets.find(d =>
        d.disease === disease && d.metric === metric && d.subgroup === subgroup
    );
    logDebug('Selected dataset', selectedDataset);

    if (selectedDataset) {
        showElements([GALLERY_CONFIG.ELEMENTS.LOAD_BTN]);
        updateStatus(`Dataset: ${disease} / ${metric} / ${subgroup}`);
        
        // Load detailed description if available
        await loadPaperDescription(currentPaper, selectedDataset.description);
    } else {
        console.error('[GALLERY] Dataset not found for selection');
        updateStatus('Dataset not found.');
    }
}

// =============================================================================
// GALLERY LOADING AND MANAGEMENT
// =============================================================================

/**
 * Loads the gallery index and initializes the gallery interface
 */
async function loadGallery() {
    logDebug('Loading gallery');
    updateStatus('Loading...');
    
    try {
        const response = await fetch(GALLERY_CONFIG.INDEX_FILE);
        logDebug('Gallery index response', response);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load gallery index`);
        }
        
        const files = await response.json();
        logDebug('Gallery index data', files);
        
        processGalleryFiles(files);
        populatePaperSelect();
        
        // Show gallery UI elements
        showElements([
            GALLERY_CONFIG.ELEMENTS.CONTAINER,
            GALLERY_CONFIG.ELEMENTS.RANDOM_BTN,
            GALLERY_CONFIG.ELEMENTS.REFRESH_BTN
        ]);
        
        updateStatus(`Loaded ${availablePapers.length} papers`);
        
    } catch (error) {
        console.error('[GALLERY] Error loading gallery:', error);
        updateStatus('Error loading gallery');
    }
}

/**
 * Processes gallery files from the index
 * @param {Array<Object>} files - Array of file objects from index
 */
function processGalleryFiles(files) {
    logDebug('Processing gallery files', files);
    
    galleryData = {};
    availablePapers = [];
    
    files.forEach(file => {
        const paper = file.paper;
        if (!galleryData[paper]) {
            galleryData[paper] = [];
        }
        
        galleryData[paper].push({
            ...file,
            csvPath: `${GALLERY_CONFIG.BASE_PATH}${file.file}`,
            description: file.description ? `${GALLERY_CONFIG.BASE_PATH}${file.description}` : null
        });
    });
    
    availablePapers = Object.keys(galleryData).sort();
    logDebug('Available papers', availablePapers);
}

/**
 * Populates the paper selection dropdown
 */
function populatePaperSelect() {
    logDebug('Populating paper select');
    populateDropdown(GALLERY_CONFIG.SELECTORS.PAPER, availablePapers, 'Select a paper...');
}

/**
 * Refreshes the gallery by resetting all state
 */
function refreshGallery() {
    logDebug('Refreshing gallery');
    
    // Reset state
    galleryData = {};
    availablePapers = [];
    currentDatasets = [];
    selectedDataset = null;
    currentPaper = null;
    
    // Reset UI
    hideElements([
        GALLERY_CONFIG.ELEMENTS.CONTAINER,
        GALLERY_CONFIG.ELEMENTS.RANDOM_BTN,
        GALLERY_CONFIG.ELEMENTS.REFRESH_BTN
    ]);
    
    showElements(['loadGalleryBtn']);
    
    resetDropdowns(['paper', 'disease', 'metric', 'subgroup']);
    hideElements([
        GALLERY_CONFIG.SELECTORS.DISEASE,
        GALLERY_CONFIG.SELECTORS.METRIC,
        GALLERY_CONFIG.SELECTORS.SUBGROUP,
        GALLERY_CONFIG.ELEMENTS.PAPER_INFO,
        GALLERY_CONFIG.ELEMENTS.LOAD_BTN
    ]);
    
    updateStatus('Click "Browse Gallery" to explore available datasets');
    logDebug('Gallery refresh complete');
}

// =============================================================================
// PAPER INFORMATION DISPLAY
// =============================================================================

/**
 * Loads and displays detailed paper description
 * @param {string} paper - Paper name
 * @param {string|null} descPath - Path to description JSON file
 */
async function loadPaperDescription(paper, descPath) {
    logDebug(`Loading paper description for: ${paper}`, descPath);
    
    try {
        if (!descPath) {
            throw new Error('No description path provided');
        }
        
        const response = await fetch(descPath);
        logDebug('Description fetch response', response);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Description not found`);
        }
        
        let data = await response.json();
        logDebug('Description data', data);
        
        // Handle both array and object formats
        if (Array.isArray(data)) {
            data = data[0];
        }
        
        displayPaperInfo(data);
        
    } catch (error) {
        console.warn('[GALLERY] Failed to load paper description:', error);
        await displayBasicPaperInfo(paper);
    }
}

/**
 * Displays detailed paper information
 * @param {Object} paperData - Paper information object
 */
function displayPaperInfo(paperData) {
    logDebug('Displaying paper info', paperData);
    
    const titleElement = getElement('paperTitle');
    const detailsElement = getElement('paperDetails');
    const urlElement = getElement('paperUrl');
    
    if (titleElement) {
        titleElement.textContent = paperData.title || '';
    }
    
    if (detailsElement) {
        const excludeFields = ['url', 'title', 'paper', 'file', 'description'];
        const details = Object.entries(paperData)
            .filter(([key]) => !excludeFields.includes(key))
            .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
            .join('');
        detailsElement.innerHTML = details;
    }
    
    if (urlElement) {
        if (paperData.url) {
            urlElement.href = paperData.url;
            urlElement.style.display = 'inline';
        } else {
            urlElement.style.display = 'none';
        }
    }
    
    showElements([GALLERY_CONFIG.ELEMENTS.PAPER_INFO]);
}

/**
 * Displays basic paper information when detailed info is unavailable
 * @param {string} paper - Paper name
 */
async function displayBasicPaperInfo(paper) {
    logDebug(`Displaying basic info for: ${paper}`);
    
    const titleElement = getElement('paperTitle');
    const detailsElement = getElement('paperDetails');
    const urlElement = getElement('paperUrl');
    
    if (titleElement) {
        titleElement.textContent = paper;
    }
    
    if (detailsElement) {
        detailsElement.innerHTML = '<p><em>No detailed information available</em></p>';
    }
    
    if (urlElement) {
        urlElement.style.display = 'none';
    }
    
    showElements([GALLERY_CONFIG.ELEMENTS.PAPER_INFO]);
}

// =============================================================================
// DATASET LOADING
// =============================================================================

/**
 * Loads the currently selected dataset
 */
async function loadSelectedDataset() {
    logDebug('Loading selected dataset');
    
    if (!selectedDataset) {
        console.error('[GALLERY] No dataset selected');
        alert('No dataset selected');
        return;
    }

    try {
        // Set view and metric before loading
        setViewAndMetricFromDataset(selectedDataset);

        logDebug('Fetching CSV', selectedDataset.csvPath);
        const response = await fetch(selectedDataset.csvPath);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load CSV`);
        }
        
        const text = await response.text();
        logDebug(`CSV loaded, length: ${text.length}`);
        
        // Parse CSV using Papa Parse
        Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                logDebug('CSV parsing complete', results.data);
                if (typeof processCsvData === 'function') {
                    processCsvData(results.data);
                } else {
                    console.error('[GALLERY] processCsvData function not available');
                }
            },
            error: (error) => {
                console.error('[GALLERY] CSV parsing error:', error);
                alert('Error parsing CSV data');
            }
        });
        
    } catch (error) {
        console.error('[GALLERY] Error loading dataset:', error);
        alert(`Failed to load dataset: ${error.message}`);
    }
}

/**
 * Sets the appropriate view and metric based on dataset properties
 * @param {Object} dataset - Dataset object with metric information
 */
function setViewAndMetricFromDataset(dataset) {
    logDebug('Setting view and metric from dataset', dataset);

    // Set brain view based on metric
    if (dataset.metric === 'subcortical_volume') {
        if (typeof setView === 'function') {
            setView('subcortical');
            logDebug('Switched to subcortical view');
        }
    } else if (dataset.metric === 'thickness' || dataset.metric === 'area') {
        if (typeof setView === 'function') {
            setView('cortical');
            logDebug('Switched to cortical view');
        }
    }

    // Set upload metric selector (used for NAVR loading)
    const metricSelectUpload = getElement(GALLERY_CONFIG.SELECTORS.METRIC_UPLOAD);
    if (metricSelectUpload) {
        let metricValue;
        
        switch (dataset.metric) {
            case 'thickness':
                metricValue = 'thickness';
                break;
            case 'area':
                metricValue = 'area';
                break;
            case 'subcortical_volume':
                metricValue = 'volume';
                break;
            default:
                console.warn(`[GALLERY] Unknown metric: ${dataset.metric}`);
                metricValue = dataset.metric;
        }
        
        metricSelectUpload.value = metricValue;
        metricSelectUpload.dispatchEvent(new Event('change'));
        logDebug(`Upload metric updated to: ${metricValue}`);
    }

    logDebug('View and metric settings applied');
}

// =============================================================================
// RANDOM DATASET SELECTION
// =============================================================================

/**
 * Loads a random dataset from the gallery
 */
async function loadRandomExample() {
    logDebug('Loading random example');
    
    if (!galleryData || Object.keys(galleryData).length === 0) {
        console.warn('[GALLERY] No gallery data available');
        alert('Please load the gallery first');
        return;
    }
    
    try {
        // Collect all available datasets
        const allDatasets = [];
        Object.keys(galleryData).forEach(paper => {
            galleryData[paper].forEach(dataset => {
                allDatasets.push({
                    paper: paper,
                    ...dataset
                });
            });
        });
        
        if (allDatasets.length === 0) {
            console.warn('[GALLERY] No datasets available');
            alert('No datasets available in gallery');
            return;
        }
        
        // Select random dataset
        const randomIndex = Math.floor(Math.random() * allDatasets.length);
        const randomDataset = allDatasets[randomIndex];
        logDebug('Selected random dataset', randomDataset);
        
        updateStatus(
            `Loading random example: ${randomDataset.paper} - ${randomDataset.disease} - ${randomDataset.metric}`
        );
        
        // Set state
        selectedDataset = randomDataset;
        currentPaper = randomDataset.paper;
        
        // Display paper info
        await loadPaperDescription(randomDataset.paper, randomDataset.description);
        
        // Load the dataset
        await loadSelectedDataset();
        
        updateStatus(
            `Random example loaded: ${randomDataset.paper} - ${randomDataset.disease} - ${randomDataset.metric}`
        );
        logDebug('Random example loaded successfully');
        
    } catch (error) {
        console.error('[GALLERY] Error loading random example:', error);
        updateStatus('Error loading random example');
        alert(`Failed to load random example: ${error.message}`);
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize gallery manager
 */
function initializeGalleryManager() {
    logDebug('Gallery manager initialized');
}

// Initialize when script loads
initializeGalleryManager();