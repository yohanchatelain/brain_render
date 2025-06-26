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
    const metricSelect = document.getElementById('metricSelect');

    console.log('setupInitialState called');
    console.log('csvFile in setupInitialState:', csvFile);
    console.log('metricSelect in setupInitialState:', metricSelect);

    if (csvFile && metricSelect) {
        csvFile.disabled = true;
        console.log('Initial state: csvFile.disabled set to true');
        // Trigger handleMetricChange to set up initial state
        handleMetricChange();
    } else {
        console.error('Elements not found in setupInitialState');
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
            <p style="margin-bottom: 10px;"><strong>Upload a CSV file with "Structure" and "Cohen_d" columns</strong></p>
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
    const csvFile = document.getElementById('csvFile');
    const metricSelect = document.getElementById('metricSelect');

    console.log('setupEventListeners called');
    console.log('csvFile element:', csvFile);
    console.log('metricSelect element:', metricSelect);

    if (csvFile) {
        csvFile.addEventListener('change', handleFileUpload);
    } else {
        console.error('csvFile element not found');
    }

    document.getElementById('corticalBtn').addEventListener('click', () => setView('cortical'));
    document.getElementById('subcorticalBtn').addEventListener('click', () => setView('subcortical'));
    document.getElementById('atlasSelect').addEventListener('change', handleAtlasChange);

    if (metricSelect) {
        metricSelect.addEventListener('change', handleMetricChange);
        console.log('metricSelect event listener added');
    } else {
        console.error('metricSelect element not found');
    }

    document.getElementById('minRange').addEventListener('change', updateColorMapping);
    document.getElementById('maxRange').addEventListener('change', updateColorMapping);

    window.addEventListener('resize', handleResize);
}

function handleAtlasChange() {
    const newAtlas = document.getElementById('atlasSelect').value;
    if (newAtlas !== currentAtlas) {
        currentAtlas = newAtlas;
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

function handleMetricChange() {
    console.log('=== handleMetricChange called ===');

    const metricSelect = document.getElementById('metricSelectUpload');
    const csvFile = document.getElementById('csvFile');
    const uploadWarning = document.getElementById('uploadWarning');

    if (!metricSelect || !csvFile || !uploadWarning) {
        console.error('Missing elements:', {
            metricSelect: !!metricSelect,
            csvFile: !!csvFile,
            uploadWarning: !!uploadWarning
        });
        return;
    }

    const selectedValue = metricSelect.value;
    console.log('Selected metric value:', selectedValue);

    // Enable/disable file upload based on metric selection
    if (selectedValue && selectedValue !== '') {
        console.log('✅ ENABLING file upload');
        csvFile.disabled = false;
        csvFile.removeAttribute('disabled'); // Make sure it's really enabled
        uploadWarning.style.display = 'none';
        console.log('File input enabled, warning hidden');
    } else {
        console.log('❌ DISABLING file upload');
        csvFile.disabled = true;
        csvFile.setAttribute('disabled', 'disabled');
        uploadWarning.style.display = 'block';
        console.log('File input disabled, warning shown');
    }

    // Reset NAVR data when metric changes
    navrData = {};
    navrDataLoaded = false;
    isThresholded = false;
    document.getElementById('toggleThresholdBtn').disabled = true;
    document.getElementById('toggleThresholdBtn').textContent = 'Apply Threshold';
    document.getElementById('toggleThresholdBtn').style.background = 'linear-gradient(45deg, #4fc3f7, #29b6f6)';
    document.getElementById('thresholdStatus').textContent = 'No NAVR data loaded - metric changed';

    // Restore original data if thresholding was applied
    if (Object.keys(originalData).length > 0) {
        currentData = {};
        Object.keys(originalData).forEach(structure => {
            currentData[structure] = { ...originalData[structure] };
        });
        updateStatistics();
        updateBrainVisualization();
    }

    console.log('Metric changed - NAVR data reset');
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

// Initialize colorbar on load
updateColorbar();

// Start the application
init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.cameraControls) {
        window.cameraControls.dispose();
    }
});