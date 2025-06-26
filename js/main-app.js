// Main application initialization and coordination

// Initialize the application
function init() {
    setupScene();
    window.cameraControls = setupControls();
    setupEventListeners();
    showInitialMessage();
    animate();
}

function showInitialMessage() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    loading.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #4fc3f7; margin-bottom: 15px;">Brain Visualizer Ready</h3>
            <p style="margin-bottom: 10px;">Please upload:</p>
            <ul style="text-align: left; margin: 10px 0;">
                <li>CSV file with "Structure" and "Cohen_d" columns</li>
                <li>Brain mesh files in /meshes/ folder (OBJ format recommended)</li>
            </ul>
            <p style="margin-bottom: 10px;"><strong>Or browse the gallery for sample datasets!</strong></p>
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
    document.getElementById('csvFile').addEventListener('change', handleFileUpload);
    document.getElementById('corticalBtn').addEventListener('click', () => setView('cortical'));
    document.getElementById('subcorticalBtn').addEventListener('click', () => setView('subcortical'));
    document.getElementById('atlasSelect').addEventListener('change', handleAtlasChange);
    document.getElementById('corticalMetricSelect').addEventListener('change', handleMetricChange);
    document.getElementById('subcorticalMetricSelect').addEventListener('change', handleMetricChange);
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