// Data processing and NAVR thresholding functionality

// Data processing variables
let currentData = {};
let originalData = {};
let navrData = {};
let isThresholded = false;
let navrDataLoaded = false;

// CSV data processing
function processCsvData(data) {
    console.log('Processing CSV data:', data);
    currentData = {};
    originalData = {};

    data.forEach(row => {
        if (row.Structure && row.hasOwnProperty('Cohen_d')) {
            let structure = row.Structure.trim();
            const cohen_d = row.Cohen_d;

            // Normalize structure names to match atlas definitions
            // Convert L_ to lh_ and R_ to rh_ for cortical structures
            if (structure.startsWith('L_')) {
                structure = structure.replace('L_', 'lh_');
            } else if (structure.startsWith('R_')) {
                structure = structure.replace('R_', 'rh_');
            }

            let hemisphere = 'unknown';
            let type = 'cortical';

            if (structure.startsWith('lh_') || structure.includes('Left-') || structure.startsWith('L_')) {
                hemisphere = 'left';
            } else if (structure.startsWith('rh_') || structure.includes('Right-') || structure.startsWith('R_')) {
                hemisphere = 'right';
            }

            if (structure.includes('Hippocampus') || structure.includes('Amygdala') ||
                structure.includes('Thalamus') || structure.includes('Caudate') ||
                structure.includes('Putamen') || structure.includes('Pallidum')) {
                type = 'subcortical';
            }

            const structureData = {
                cohen_d: cohen_d,
                hemisphere: hemisphere,
                type: type
            };

            currentData[structure] = structureData;
            originalData[structure] = { ...structureData };
        }
    });

    // Reset thresholding state when new data is loaded
    isThresholded = false;
    navrDataLoaded = false;
    navrData = {};
    document.getElementById('toggleThresholdBtn').disabled = true;
    document.getElementById('toggleThresholdBtn').textContent = 'Apply Threshold';
    document.getElementById('toggleThresholdBtn').style.background = 'linear-gradient(45deg, #4fc3f7, #29b6f6)';
    document.getElementById('thresholdStatus').textContent = 'No NAVR data loaded';

    updateStatistics();
    autoRange();
    loadBrainMeshes();
}

// File upload handler
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('loading').style.display = 'block';

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            processCsvData(results.data);
            document.getElementById('loading').style.display = 'none';
        },
        error: function (error) {
            console.error('CSV parsing error:', error);
            alert('Error parsing CSV file. Please check the format.');
            document.getElementById('loading').style.display = 'none';
        }
    });
}

// NAVR data loading and processing
async function loadNavrData() {
    if (Object.keys(currentData).length === 0) {
        alert('Please upload CSV data first before loading NAVR data.');
        return;
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').textContent = 'Loading NAVR data...';

    const corticalMetric = document.getElementById('corticalMetricSelect').value;
    const subcorticalMetric = document.getElementById('subcorticalMetricSelect').value;

    const navrFiles = {
        cortical: `data/${currentAtlas}/navr_cortical_${corticalMetric}.csv`,
        subcortical: `data/${currentAtlas}/navr_subcortical_${subcorticalMetric}.csv`
    };

    console.log('Attempting to load NAVR files:', navrFiles);

    let loadedFiles = 0;
    let corticalLoaded = false;
    let subcorticalLoaded = false;

    // Load cortical NAVR data
    try {
        const corticalResponse = await fetch(navrFiles.cortical);
        if (corticalResponse.ok) {
            const corticalText = await corticalResponse.text();
            processCorticalNavrData(corticalText);
            corticalLoaded = true;
            loadedFiles++;
            console.log('Cortical NAVR data loaded successfully');
        } else {
            console.warn(`Cortical NAVR file not found: ${navrFiles.cortical}`);
        }
    } catch (error) {
        console.warn('Error loading cortical NAVR data:', error);
    }

    // Load subcortical NAVR data
    try {
        const subcorticalResponse = await fetch(navrFiles.subcortical);
        if (subcorticalResponse.ok) {
            const subcorticalText = await subcorticalResponse.text();
            processSubcorticalNavrData(subcorticalText);
            subcorticalLoaded = true;
            loadedFiles++;
            console.log('Subcortical NAVR data loaded successfully');
        } else {
            console.warn(`Subcortical NAVR file not found: ${navrFiles.subcortical}`);
        }
    } catch (error) {
        console.warn('Error loading subcortical NAVR data:', error);
    }

    document.getElementById('loading').style.display = 'none';

    if (loadedFiles > 0) {
        navrDataLoaded = true;
        document.getElementById('toggleThresholdBtn').disabled = false;

        const statusText = [];
        if (corticalLoaded) statusText.push('cortical');
        if (subcorticalLoaded) statusText.push('subcortical');

        document.getElementById('thresholdStatus').textContent =
            `NAVR data loaded for: ${statusText.join(', ')} (${Object.keys(navrData).length} structures)`;

        if (Object.keys(originalData).length === 0) {
            console.warn('Original data not found, storing current data as original');
            Object.keys(currentData).forEach(structure => {
                originalData[structure] = { ...currentData[structure] };
            });
        }

        console.log(`NAVR data loaded for ${Object.keys(navrData).length} structures`);
    } else {
        alert(`Could not load NAVR data files. Expected files:\n${navrFiles.cortical}\n${navrFiles.subcortical}\n\nPlease ensure these files exist in your project directory.`);
    }
}

function processCorticalNavrData(csvText) {
    Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            results.data.forEach(row => {
                if (row.region && row.hemisphere && row.hasOwnProperty('NAVR_corrected')) {
                    const structure = `${row.hemisphere}_${row.region}`;
                    navrData[structure] = {
                        navr: parseFloat(row.NAVR) || 0,
                        navr_corrected: parseFloat(row.NAVR_corrected) || 0,
                        correction: parseFloat(row.correction) || 0,
                        population_size: parseInt(row.population_size) || 0
                    };
                }
            });
            console.log('Processed cortical NAVR data:', Object.keys(navrData).length, 'entries');
        },
        error: function (error) {
            console.error('Error parsing cortical NAVR CSV:', error);
        }
    });
}

function processSubcorticalNavrData(csvText) {
    Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            results.data.forEach(row => {
                if (row.region && row.hasOwnProperty('NAVR_corrected')) {
                    const structure = row.region;
                    navrData[structure] = {
                        navr: parseFloat(row.NAVR) || 0,
                        navr_corrected: parseFloat(row.NAVR_corrected) || 0,
                        correction: parseFloat(row.correction) || 0,
                        population_size: parseInt(row.population_size) || 0
                    };
                }
            });
            console.log('Processed subcortical NAVR data:', Object.keys(navrData).length, 'total entries');
        },
        error: function (error) {
            console.error('Error parsing subcortical NAVR CSV:', error);
        }
    });
}

// Thresholding functionality
function toggleThresholding() {
    if (!navrDataLoaded) {
        alert('Please load NAVR data first.');
        return;
    }

    const toggleBtn = document.getElementById('toggleThresholdBtn');

    if (!isThresholded) {
        // Apply thresholding
        let thresholdedCount = 0;

        Object.keys(currentData).forEach(structure => {
            const cohenD = currentData[structure].cohen_d;
            const navrInfo = navrData[structure];

            if (navrInfo && !isNaN(cohenD)) {
                const threshold = Math.abs(navrInfo.navr_corrected);
                if (Math.abs(cohenD) < threshold) {
                    currentData[structure].cohen_d = NaN;
                    thresholdedCount++;
                }
            }
        });

        isThresholded = true;
        toggleBtn.textContent = 'Remove Threshold';
        toggleBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ff8e53)';

        document.getElementById('thresholdStatus').textContent =
            `Thresholding applied: ${thresholdedCount} values below NAVR threshold`;

        console.log(`Applied NAVR thresholding: ${thresholdedCount} values thresholded`);

    } else {
        // Remove thresholding - restore original data
        Object.keys(originalData).forEach(structure => {
            if (currentData[structure] && originalData[structure]) {
                currentData[structure].cohen_d = originalData[structure].cohen_d;
            }
        });

        isThresholded = false;
        toggleBtn.textContent = 'Apply Threshold';
        toggleBtn.style.background = 'linear-gradient(45deg, #4fc3f7, #29b6f6)';

        document.getElementById('thresholdStatus').textContent =
            `NAVR data loaded (${Object.keys(navrData).length} structures) - thresholding removed`;

        console.log('NAVR thresholding removed - original data restored');
    }

    // Update mesh userData to reflect the new Cohen's d values
    updateMeshUserData();

    // Update visualization and statistics
    updateStatistics();
    updateBrainVisualization();
    autoRange();
}

// Update mesh userData when currentData changes
function updateMeshUserData() {
    brainMeshes.forEach(mesh => {
        const userData = mesh.userData;
        if (userData && userData.structure && currentData[userData.structure]) {
            userData.cohen_d = currentData[userData.structure].cohen_d;
        }
    });
    console.log('Updated mesh userData with current Cohen\'s d values');
}