// Main application initialization and coordination

// Initialize the application
function init() {
    setupScene();
    window.cameraControls = setupControls();
    setupEventListeners();

    // Set initial state after a small delay to ensure DOM is ready
    setTimeout(() => {
        setupInitialState();
    }, 100);

    showInitialMessage();
    animate();
}

function setupInitialState() {
    // Initially disable file upload until metric is selected
    const csvFile = document.getElementById('csvFile');
    const metricSelectUpload = document.getElementById('metricSelectUpload');
    const uploadWarning = document.getElementById('uploadWarning');

    console.log('setupInitialState called');

    if (csvFile) {
        csvFile.disabled = true;
        console.log('Initial state: csvFile.disabled set to true');
    }

    if (uploadWarning) {
        uploadWarning.style.display = 'block';
        console.log('Upload warning shown initially');
    }

    // Trigger onMetricUploadChange to set up initial state if function exists
    if (typeof onMetricUploadChange === 'function') {
        onMetricUploadChange();
    } else {
        console.log('onMetricUploadChange not available yet');
    }
}

// Debug function for testing
window.testMetricChange = function () {
    console.log('Manual test of metric change functionality');
    const metricSelect = document.getElementById('metricSelect');
    const csvFile = document.getElementById('csvFile');

    console.log('Current metricSelect value:', metricSelect ? metricSelect.value : 'element not found');
    console.log('Current csvFile.disabled:', csvFile ? csvFile.disabled : 'element not found');

    handleMetricChange();
};

// Direct enable function for testing
window.forceEnableUpload = function () {
    console.log('Force enabling upload...');
    const csvFile = document.getElementById('csvFile');
    const uploadWarning = document.getElementById('uploadWarning');

    if (csvFile) {
        csvFile.disabled = false;
        csvFile.removeAttribute('disabled');
        console.log('csvFile force enabled');
    }
    if (uploadWarning) {
        uploadWarning.style.display = 'none';
        console.log('Warning hidden');
    }
};

// JavaScript to make sidebar sections collapsible with visible toggle indicators


document.querySelectorAll('.section').forEach(section => {
    const header = section.querySelector('h3');
    const wrapper = document.createElement('div');
    wrapper.classList.add('section-content');

    // Move all nodes except the header into the wrapper
    Array.from(section.childNodes).forEach(node => {
        if (node !== header) wrapper.appendChild(node);
    });

    // Clear section and re-append header + content wrapper
    section.innerHTML = '';
    section.appendChild(header);
    section.appendChild(wrapper);

    // Create and append toggle indicator
    const indicator = document.createElement('span');
    indicator.classList.add('toggle-indicator');
    indicator.textContent = '▼';
    header.appendChild(indicator);

    // Add click handler to toggle collapsed state
    header.addEventListener('click', () => {
        section.classList.toggle('collapsed');
        const isCollapsed = section.classList.contains('collapsed');
        indicator.textContent = isCollapsed ? '▲' : '▼';
    });
});


function showInitialMessage() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    loading.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #4fc3f7; margin-bottom: 15px;">Brain Visualizer Ready</h3>
            <p style="margin-bottom: 10px;"><strong>Browse the gallery for sample datasets</strong></p>
            <p style="margin-bottom: 10px;">or</p>
            <p style="margin-bottom: 10px;"><strong>Upload a CSV file with "Structure", "Cohen_d" and "population_size" columns</strong></p>
            <p style="font-size: 12px; opacity: 0.8;">Click anywhere to dismiss this message</p>
        </div>
    `;

    const hideMessage = () => {
        loading.style.display = 'none';
        document.removeEventListener('click', hideMessage);
    };

    setTimeout(() => {
        document.addEventListener('click', hideMessage);
    }, 100);
}

function setupEventListeners() {
    console.log('setupEventListeners called');

    // Helper function to safely add event listeners
    function addEventListenerSafe(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
            console.log(`✅ Event listener added to ${elementId}`);
        } else {
            console.warn(`⚠️ Element not found: ${elementId}`);
        }
    }

    // File upload handler
    const csvFile = document.getElementById('csvFile');
    if (csvFile) {
        csvFile.addEventListener('change', handleFileUpload);
        console.log('✅ File upload handler added');
    } else {
        console.warn('⚠️ csvFile element not found');
    }

    // View buttons
    addEventListenerSafe('corticalBtn', 'click', () => setView('cortical'));
    addEventListenerSafe('subcorticalBtn', 'click', () => setView('subcortical'));

    // Atlas selector
    addEventListenerSafe('atlasSelect', 'change', handleAtlasChange);

    // Metric selectors (both gallery and upload)
    addEventListenerSafe('metricSelect', 'change', onMetricChange);
    addEventListenerSafe('metricSelectUpload', 'change', onMetricUploadChange);

    // Color range controls
    addEventListenerSafe('minRange', 'change', updateColorMapping);
    addEventListenerSafe('maxRange', 'change', updateColorMapping);

    // Global window resize handler
    window.addEventListener('resize', handleResize);
    console.log('✅ Window resize handler added');
}

function handleAtlasChange() {
    const newAtlas = document.getElementById('atlasSelect').value;
    if (newAtlas !== currentAtlas) {
        currentAtlas = newAtlas;
        window.currentAtlas = currentAtlas;
        console.log('Atlas changed to:', currentAtlas);

        // Reset NAVR data when atlas changes
        navrData = {};
        navrDataLoaded = false;
        isThresholded = false;
        document.getElementById('toggleThresholdBtn').disabled = true;
        document.getElementById('toggleThresholdBtn').textContent = 'Apply Threshold';
        document.getElementById('toggleThresholdBtn').style.background = 'linear-gradient(45deg, #4fc3f7, #29b6f6)';
        document.getElementById('thresholdStatus').textContent = 'No NAVR data loaded';

        // Restore original data if thresholding was applied
        if (Object.keys(originalData).length > 0) {
            currentData = {};
            Object.keys(originalData).forEach(structure => {
                currentData[structure] = { ...originalData[structure] };
            });
            updateMeshUserData();
            updateStatistics();
            updateBrainVisualization();
        }

        if (Object.keys(currentData).length > 0) {
            loadBrainMeshes();
        }
    }
}

// This function is now handled by gallery-manager.js
// Keeping a stub here for backward compatibility
function handleMetricChange() {
    console.log('handleMetricChange called - delegating to onMetricUploadChange');
    if (typeof onMetricUploadChange === 'function') {
        onMetricUploadChange();
    } else {
        console.warn('onMetricUploadChange function not available');
    }
}

async function showGithubInstructions() {
    try {
        const response = await fetch('instructions.txt');
        const text = await response.text();
        alert(text);
    } catch (error) {
        alert('Could not load instructions. Please check the console for details.');
        console.error('Error loading instructions:', error);
    }
}

// Initialize colorbar on load - safely
function initializeColorbar() {
    if (typeof updateColorbar === 'function') {
        updateColorbar();
    } else {
        console.log('updateColorbar function not available yet');
    }
}

// Start the application only after DOM is fully loaded
function startApplication() {
    if (document.readyState === 'loading') {
        console.log('DOM still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded fired, initializing app...');
            initializeColorbar();
            init();
        });
    } else {
        console.log('DOM already loaded, initializing app immediately...');
        initializeColorbar();
        init();
    }
}

// Start the application
startApplication();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.cameraControls) {
        window.cameraControls.dispose();
    }
});