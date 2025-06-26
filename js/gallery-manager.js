// Gallery variables
let galleryData = {};
let availablePapers = [];
let currentPaper = null;
let currentDatasets = [];
let selectedDataset = null;

// Gallery cascading dropdown functions
function onPaperChange() {
    const paperSelect = document.getElementById('paperSelect');
    const selectedPaper = paperSelect.value;

    // Reset all dependent dropdowns
    resetDropdowns(['disease', 'metric', 'subgroup']);
    hideElements(['paperInfo', 'loadDatasetBtn']);

    if (!selectedPaper) {
        document.getElementById('diseaseSelect').style.display = 'none';
        return;
    }

    currentPaper = selectedPaper;
    currentDatasets = galleryData[selectedPaper] || [];

    if (currentDatasets.length === 0) {
        document.getElementById('galleryStatus').textContent = 'No datasets found for this paper';
        return;
    }

    // Load paper description
    loadPaperDescription(selectedPaper);

    // Populate disease dropdown with unique diseases
    const diseases = [...new Set(currentDatasets.map(d => d.disease))].sort();
    populateDropdown('diseaseSelect', diseases);

    document.getElementById('diseaseSelect').style.display = 'block';
    document.getElementById('galleryStatus').textContent = `Paper selected: ${selectedPaper} (${currentDatasets.length} datasets)`;
}

function onDiseaseChange() {
    const diseaseSelect = document.getElementById('diseaseSelect');
    const selectedDisease = diseaseSelect.value;

    // Reset dependent dropdowns
    resetDropdowns(['metric', 'subgroup']);
    hideElements(['loadDatasetBtn']);

    if (!selectedDisease) {
        document.getElementById('metricSelect').style.display = 'none';
        return;
    }

    // Filter datasets by selected disease
    const filteredDatasets = currentDatasets.filter(d => d.disease === selectedDisease);

    // Populate metric dropdown
    const metrics = [...new Set(filteredDatasets.map(d => d.metric))].sort();
    populateDropdown('metricSelect', metrics);

    document.getElementById('metricSelect').style.display = 'block';
    document.getElementById('galleryStatus').textContent = `Disease selected: ${selectedDisease} (${filteredDatasets.length} datasets)`;
}

function onMetricChange() {
    const diseaseSelect = document.getElementById('diseaseSelect');
    const metricSelect = document.getElementById('metricSelect');
    const selectedDisease = diseaseSelect.value;
    const selectedMetric = metricSelect.value;

    // Reset dependent dropdowns
    resetDropdowns(['subgroup']);
    hideElements(['loadDatasetBtn']);

    if (!selectedMetric) {
        document.getElementById('subgroupSelect').style.display = 'none';
        return;
    }

    // Filter datasets by selected disease and metric
    const filteredDatasets = currentDatasets.filter(d =>
        d.disease === selectedDisease && d.metric === selectedMetric
    );

    // Populate subgroup dropdown
    const subgroups = [...new Set(filteredDatasets.map(d => d.subgroup))].sort();
    populateDropdown('subgroupSelect', subgroups);

    document.getElementById('subgroupSelect').style.display = 'block';
    document.getElementById('galleryStatus').textContent = `Metric selected: ${selectedMetric} (${filteredDatasets.length} datasets)`;
}

function onSubgroupChange() {
    const diseaseSelect = document.getElementById('diseaseSelect');
    const metricSelect = document.getElementById('metricSelect');
    const subgroupSelect = document.getElementById('subgroupSelect');

    const selectedDisease = diseaseSelect.value;
    const selectedMetric = metricSelect.value;
    const selectedSubgroup = subgroupSelect.value;

    if (!selectedSubgroup) {
        hideElements(['loadDatasetBtn']);
        return;
    }

    // Find the specific dataset
    selectedDataset = currentDatasets.find(d =>
        d.disease === selectedDisease &&
        d.metric === selectedMetric &&
        d.subgroup === selectedSubgroup
    );

    if (selectedDataset) {
        document.getElementById('loadDatasetBtn').style.display = 'block';
        document.getElementById('galleryStatus').textContent =
            `Dataset selected: ${selectedDisease} - ${selectedMetric} - ${selectedSubgroup}`;
    } else {
        document.getElementById('galleryStatus').textContent = 'Dataset not found';
    }
}

// Helper function to populate dropdowns
function populateDropdown(elementId, options) {
    const select = document.getElementById(elementId);
    const defaultText = elementId.replace('Select', '').replace(/([A-Z])/g, ' $1').toLowerCase();
    select.innerHTML = `<option value="">Select ${defaultText}...</option>`;

    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

// Helper function to reset dropdowns
function resetDropdowns(dropdownNames) {
    dropdownNames.forEach(name => {
        const elementId = name + 'Select';
        const element = document.getElementById(elementId);
        if (element) {
            const defaultText = name;
            element.innerHTML = `<option value="">Select ${defaultText}...</option>`;
        }
    });
}

// Helper function to hide elements
function hideElements(elementIds) {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Gallery Functions
async function loadGallery() {
    document.getElementById('galleryStatus').textContent = 'Loading gallery...';

    try {
        const galleryFiles = await loadGalleryIndex();

        if (galleryFiles.length === 0) {
            document.getElementById('galleryStatus').textContent = 'No files found in gallery index.';
            return;
        }

        // Process the gallery files to extract papers and datasets
        processGalleryFiles(galleryFiles);

        if (availablePapers.length === 0) {
            document.getElementById('galleryStatus').textContent = 'No papers found in gallery files.';
            return;
        }

        populatePaperSelect();

        document.getElementById('galleryContainer').style.display = 'block';
        document.getElementById('loadGalleryBtn').style.display = 'none';
        document.getElementById('refreshGalleryBtn').style.display = 'inline-block';
        document.getElementById('galleryStatus').textContent = `Found ${availablePapers.length} papers with ${galleryFiles.length} datasets`;

    } catch (error) {
        console.error('Error loading gallery:', error);
        document.getElementById('galleryStatus').textContent = 'Error loading gallery. Check console for details.';
    }
}

async function loadGalleryIndex() {
    try {
        const indexResponse = await fetch('gallery/index.json');
        if (indexResponse.ok) {
            const indexData = await indexResponse.json();
            return indexData;
        } else {
            throw new Error('Gallery index not found');
        }
    } catch (error) {
        console.error('Error loading gallery index:', error);
        throw error;
    }
}

function processGalleryFiles(galleryFiles) {
    // Reset gallery data
    galleryData = {};
    availablePapers = [];

    // Group files by paper
    const paperGroups = {};

    galleryFiles.forEach(fileInfo => {
        // Extract paper name from file path (e.g., "Hettwer_2022/csv/..." -> "Hettwer_2022")
        const paperName = fileInfo.paper

        if (!paperGroups[paperName]) {
            paperGroups[paperName] = [];
        }

        // Add full file info with computed path
        paperGroups[paperName].push({
            ...fileInfo,
            csvPath: `gallery/${fileInfo.file}`,
            filename: fileInfo.file.split('/').pop()
        });
    });

    // Store processed data
    galleryData = paperGroups;
    availablePapers = Object.keys(paperGroups);

    console.log('Processed gallery data:', {
        papers: availablePapers,
        totalDatasets: galleryFiles.length,
        paperGroups: Object.keys(paperGroups).map(paper => ({
            paper,
            datasets: paperGroups[paper].length
        }))
    });
}

async function loadPaperDescription(paperName) {
    // Try to find a description file for this paper
    // Look for common disease description files
    const commonDiseases = ['adhd', 'asd', 'bd', 'mdd', 'ocd', 'scz', '22q', 'bipolar', 'depression', 'epilepsy', 'schizophrenia'];

    let descriptionFound = false;

    for (const disease of commonDiseases) {
        try {
            const descPath = `gallery/${paperName}/desc/${disease}.json`;
            const descResponse = await fetch(descPath);
            if (descResponse.ok) {
                const paperDesc = await descResponse.json();
                displayPaperInfo(paperDesc);
                descriptionFound = true;
                break;
            }
        } catch (error) {
            continue;
        }
    }

    if (!descriptionFound) {
        displayBasicPaperInfo(paperName);
    }
}

function displayPaperInfo(paperDesc) {
    document.getElementById('paperTitle').textContent = paperDesc.title || 'Unknown Title';
    document.getElementById('paperDetails').innerHTML = `
        <p><strong>Disease:</strong> ${paperDesc.disease || 'Unknown'}</p>
        <p><strong>Subgroup:</strong> ${paperDesc.subgroup || 'Unknown'}</p>
        <p><strong>Case-Control:</strong> ${paperDesc['Case-control'] || 'Unknown'}</p>
        <p><strong>Metric:</strong> ${paperDesc.Metric || 'Unknown'}</p>
        <p><strong>Value:</strong> ${paperDesc.Value || 'Unknown'}</p>
    `;

    const urlElement = document.getElementById('paperUrl');
    if (paperDesc.url) {
        urlElement.href = paperDesc.url;
        urlElement.style.display = 'inline';
    } else {
        urlElement.style.display = 'none';
    }

    document.getElementById('paperInfo').style.display = 'block';
}

function displayBasicPaperInfo(paperName) {
    document.getElementById('paperTitle').textContent = paperName;
    document.getElementById('paperDetails').innerHTML = `
        <p><em>Paper information not available</em></p>
        <p>Available datasets: ${currentDatasets.length}</p>
        <p>Diseases: ${[...new Set(currentDatasets.map(d => d.disease))].join(', ')}</p>
        <p>Metrics: ${[...new Set(currentDatasets.map(d => d.metric))].join(', ')}</p>
    `;
    document.getElementById('paperUrl').style.display = 'none';
    document.getElementById('paperInfo').style.display = 'block';
}

function populatePaperSelect() {
    const paperSelect = document.getElementById('paperSelect');
    paperSelect.innerHTML = '<option value="">Select a paper...</option>';

    availablePapers.forEach(paper => {
        const option = document.createElement('option');
        option.value = paper;
        option.textContent = paper;
        paperSelect.appendChild(option);
    });
}

async function loadSelectedDataset() {
    if (!selectedDataset) {
        alert('No dataset selected');
        return;
    }

    document.getElementById('galleryStatus').textContent = 'Loading dataset...';
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').textContent = 'Loading gallery dataset...';

    try {
        const response = await fetch(selectedDataset.csvPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch dataset: ${response.status}`);
        }

        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function (results) {
                processCsvData(results.data);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('galleryStatus').textContent =
                    `Loaded: ${selectedDataset.disease} - ${selectedDataset.metric} - ${selectedDataset.subgroup}`;

                // Update file input to show loaded dataset
                const fileInput = document.getElementById('csvFile');
                fileInput.setAttribute('data-filename', selectedDataset.filename);
            },
            error: function (error) {
                console.error('CSV parsing error:', error);
                alert('Error parsing CSV file from gallery.');
                document.getElementById('loading').style.display = 'none';
                document.getElementById('galleryStatus').textContent = 'Error loading dataset';
            }
        });

    } catch (error) {
        console.error('Error loading dataset:', error);
        alert(`Error loading dataset: ${error.message}`);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('galleryStatus').textContent = 'Error loading dataset';
    }
}

function refreshGallery() {
    // Reset gallery state
    availablePapers = [];
    currentPaper = null;
    currentDatasets = [];
    galleryData = {};
    selectedDataset = null;

    // Hide gallery container and reset UI
    document.getElementById('galleryContainer').style.display = 'none';
    document.getElementById('loadGalleryBtn').style.display = 'inline-block';
    document.getElementById('refreshGalleryBtn').style.display = 'none';

    // Reset all dropdowns and info
    resetDropdowns(['disease', 'metric', 'subgroup']);
    hideElements(['paperInfo', 'loadDatasetBtn']);
    document.getElementById('diseaseSelect').style.display = 'none';
    document.getElementById('metricSelect').style.display = 'none';
    document.getElementById('subgroupSelect').style.display = 'none';

    // Reset paper select
    document.getElementById('paperSelect').innerHTML = '<option value="">Select a paper...</option>';

    document.getElementById('galleryStatus').textContent = 'Click "Browse Gallery" to explore available datasets';
}