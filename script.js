// Try to load OBJLoader from multiple CDNs
function loadScript(src, callback, fallback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = fallback || function () {
        console.warn('Failed to load script:', src);
    };
    document.head.appendChild(script);
}

// Load OBJLoader with fallback
loadScript(
    'https://unpkg.com/three@0.128.0/examples/js/loaders/OBJLoader.js',
    function () { console.log('OBJLoader loaded successfully'); },
    function () {
        loadScript(
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js',
            function () { console.log('OBJLoader loaded from fallback CDN'); },
            function () { console.warn('Could not load OBJLoader from any CDN'); }
        );
    }
);

// Load PLYLoader with fallback (optional)
loadScript(
    'https://unpkg.com/three@0.128.0/examples/js/loaders/PLYLoader.js',
    function () { console.log('PLYLoader loaded successfully'); },
    function () {
        loadScript(
            'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/PLYLoader.js',
            function () { console.log('PLYLoader loaded from fallback CDN'); },
            function () { console.warn('PLYLoader not available - will use OBJ files only'); }
        );
    }
);

// Global variables
let scene, camera, renderer, raycaster, mouse;
let brainMeshes = [];
let currentData = {};
let originalData = {}; // Store original unthresholded data
let navrData = {}; // Store NAVR thresholding data
let colorMapping = { min: -2.0, max: 2.0 };
let isWireframe = false;
let currentView = 'cortical';
let currentAtlas = 'desikan';
let meshLoadingPromises = new Map();
let isThresholded = false;
let navrDataLoaded = false;

// Gallery variables
let galleryData = {};
let availablePapers = [];
let currentPaper = null;
let currentDatasets = [];
let selectedDataset = null;

// Brain structure definitions for different atlases
const brainAtlases = {
    desikan: {
        cortical: [
            'lh_bankssts', 'rh_bankssts', 'lh_caudalanteriorcingulate', 'rh_caudalanteriorcingulate',
            'lh_caudalmiddlefrontal', 'rh_caudalmiddlefrontal', 'lh_cuneus', 'rh_cuneus',
            'lh_entorhinal', 'rh_entorhinal', 'lh_fusiform', 'rh_fusiform',
            'lh_inferiorparietal', 'rh_inferiorparietal', 'lh_inferiortemporal', 'rh_inferiortemporal',
            'lh_isthmuscingulate', 'rh_isthmuscingulate', 'lh_lateraloccipital', 'rh_lateraloccipital',
            'lh_lateralorbitofrontal', 'rh_lateralorbitofrontal', 'lh_lingual', 'rh_lingual',
            'lh_medialorbitofrontal', 'rh_medialorbitofrontal', 'lh_middletemporal', 'rh_middletemporal',
            'lh_parahippocampal', 'rh_parahippocampal', 'lh_paracentral', 'rh_paracentral',
            'lh_parsopercularis', 'rh_parsopercularis', 'lh_parsorbitalis', 'rh_parsorbitalis',
            'lh_parstriangularis', 'rh_parstriangularis', 'lh_pericalcarine', 'rh_pericalcarine',
            'lh_postcentral', 'rh_postcentral', 'lh_posteriorcingulate', 'rh_posteriorcingulate',
            'lh_precentral', 'rh_precentral', 'lh_precuneus', 'rh_precuneus',
            'lh_rostralanteriorcingulate', 'rh_rostralanteriorcingulate',
            'lh_rostralmiddlefrontal', 'rh_rostralmiddlefrontal', 'lh_superiorfrontal', 'rh_superiorfrontal',
            'lh_superiorparietal', 'rh_superiorparietal', 'lh_superiortemporal', 'rh_superiortemporal',
            'lh_supramarginal', 'rh_supramarginal', 'lh_frontalpole', 'rh_frontalpole',
            'lh_temporalpole', 'rh_temporalpole', 'lh_transversetemporal', 'rh_transversetemporal',
            'lh_insula', 'rh_insula'
        ],
        subcortical: [
            'Left-Lateral-Ventricle', 'Right-Lateral-Ventricle', 'Left-Inf-Lat-Vent', 'Right-Inf-Lat-Vent',
            'Left-Cerebellum-White-Matter', 'Right-Cerebellum-White-Matter', 'Left-Cerebellum-Cortex', 'Right-Cerebellum-Cortex',
            'Left-Thalamus', 'Right-Thalamus', 'Left-Caudate', 'Right-Caudate',
            'Left-Putamen', 'Right-Putamen', 'Left-Pallidum', 'Right-Pallidum',
            'Left-Hippocampus', 'Right-Hippocampus', 'Left-Amygdala', 'Right-Amygdala',
            'Left-Accumbens-area', 'Right-Accumbens-area', 'Left-VentralDC', 'Right-VentralDC'
        ]
    },
    destrieux: {
        cortical: [
            'lh_G_and_S_frontomargin', 'rh_G_and_S_frontomargin', 'lh_G_and_S_occipital_inf', 'rh_G_and_S_occipital_inf',
            'lh_G_and_S_paracentral', 'rh_G_and_S_paracentral', 'lh_G_and_S_subcentral', 'rh_G_and_S_subcentral',
            'lh_G_and_S_transv_frontopol', 'rh_G_and_S_transv_frontopol', 'lh_G_and_S_cingul-Ant', 'rh_G_and_S_cingul-Ant',
            'lh_G_and_S_cingul-Mid-Ant', 'rh_G_and_S_cingul-Mid-Ant', 'lh_G_and_S_cingul-Mid-Post', 'rh_G_and_S_cingul-Mid-Post'
        ],
        subcortical: [
            'Left-Thalamus', 'Right-Thalamus', 'Left-Caudate', 'Right-Caudate',
            'Left-Putamen', 'Right-Putamen', 'Left-Pallidum', 'Right-Pallidum',
            'Left-Hippocampus', 'Right-Hippocampus', 'Left-Amygdala', 'Right-Amygdala'
        ]
    },
    dkt: {
        cortical: [
            'lh_caudalanteriorcingulate', 'rh_caudalanteriorcingulate', 'lh_caudalmiddlefrontal', 'rh_caudalmiddlefrontal',
            'lh_cuneus', 'rh_cuneus', 'lh_entorhinal', 'rh_entorhinal', 'lh_fusiform', 'rh_fusiform',
            'lh_inferiorparietal', 'rh_inferiorparietal', 'lh_inferiortemporal', 'rh_inferiortemporal',
            'lh_isthmuscingulate', 'rh_isthmuscingulate', 'lh_lateraloccipital', 'rh_lateraloccipital'
        ],
        subcortical: [
            'Left-Thalamus', 'Right-Thalamus', 'Left-Caudate', 'Right-Caudate',
            'Left-Putamen', 'Right-Putamen', 'Left-Hippocampus', 'Right-Hippocampus',
            'Left-Amygdala', 'Right-Amygdala'
        ]
    }
};

// MISSING FUNCTION IMPLEMENTATIONS

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

class CameraControlManager {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.controls = {};
        this.currentMode = 'orbit';
        this.clock = new THREE.Clock();

        this.initializeControls();
        this.setupEventListeners();
        this.setControlMode('orbit');
    }

    initializeControls() {
        try {
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls.orbit = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.configureOrbitControls();
            }

            if (typeof THREE.TrackballControls !== 'undefined') {
                this.controls.trackball = new THREE.TrackballControls(this.camera, this.renderer.domElement);
                this.configureTrackballControls();
            }

            if (typeof THREE.FlyControls !== 'undefined') {
                this.controls.fly = new THREE.FlyControls(this.camera, this.renderer.domElement);
                this.configureFlyControls();
            }

            if (typeof THREE.MapControls !== 'undefined') {
                this.controls.map = new THREE.MapControls(this.camera, this.renderer.domElement);
                this.configureMapControls();
            }

            console.log('Available controls:', Object.keys(this.controls));
        } catch (error) {
            console.warn('Error initializing controls:', error);
        }
    }

    configureOrbitControls() {
        const controls = this.controls.orbit;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 50;
        controls.maxDistance = 300;
        controls.maxPolarAngle = Math.PI / 2;
        controls.autoRotate = false;
        controls.autoRotateSpeed = 2.0;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.enableRotate = true;
    }

    configureTrackballControls() {
        const controls = this.controls.trackball;
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [65, 83, 68];
        controls.minDistance = 50;
        controls.maxDistance = 300;
    }

    configureFlyControls() {
        const controls = this.controls.fly;
        controls.movementSpeed = 100;
        controls.domElement = this.renderer.domElement;
        controls.rollSpeed = Math.PI / 24;
        controls.autoForward = false;
        controls.dragToLook = true;
    }

    configureMapControls() {
        const controls = this.controls.map;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 50;
        controls.maxDistance = 300;
        controls.maxPolarAngle = Math.PI / 2;
    }

    setControlMode(mode) {
        Object.keys(this.controls).forEach(key => {
            if (this.controls[key]) {
                this.controls[key].enabled = false;
            }
        });

        if (this.controls[mode]) {
            this.controls[mode].enabled = true;
            this.currentMode = mode;
            this.updateUI();
            this.updateControlInfo();
            console.log(`Switched to ${mode} controls`);
        } else {
            console.warn(`Control mode '${mode}' not available`);
        }
    }

    updateUI() {
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.getElementById(this.currentMode + 'Btn');
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    updateControlInfo() {
        const infoElement = document.querySelector('.control-description');
        if (!infoElement) return;

        const descriptions = {
            orbit: `<strong>Orbit Controls:</strong><br>
                   • Mouse drag: Rotate around center<br>
                   • Scroll: Zoom in/out<br>
                   • Right-click drag: Pan`,

            trackball: `<strong>Trackball Controls:</strong><br>
                       • Mouse drag: Free rotation<br>
                       • Scroll: Zoom in/out<br>
                       • Shift+drag: Pan<br>
                       • Keys: A/S/D for movement`,

            fly: `<strong>Fly Controls:</strong><br>
                 • Mouse drag: Look around<br>
                 • W/A/S/D: Move forward/left/back/right<br>
                 • R/F: Move up/down<br>
                 • Q/E: Roll left/right`,

            map: `<strong>Map Controls:</strong><br>
                 • Mouse drag: Rotate around center<br>
                 • Scroll: Zoom in/out<br>
                 • Right-click drag: Pan<br>
                 • Constrained to horizontal plane`
        };

        infoElement.innerHTML = descriptions[this.currentMode] || 'Unknown control mode';
    }

    setupEventListeners() {
        const modes = ['orbit', 'trackball', 'fly', 'map'];
        modes.forEach(mode => {
            const btn = document.getElementById(mode + 'Btn');
            if (btn) {
                btn.addEventListener('click', () => this.setControlMode(mode));
            }
        });

        const dampingCheck = document.getElementById('dampingCheck');
        if (dampingCheck) {
            dampingCheck.addEventListener('change', (e) => {
                this.setDamping(e.target.checked);
            });
        }

        const autoRotateCheck = document.getElementById('autoRotateCheck');
        if (autoRotateCheck) {
            autoRotateCheck.addEventListener('change', (e) => {
                this.setAutoRotate(e.target.checked);
            });
        }

        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                speedValue.textContent = speed.toFixed(1);
                this.setSpeed(speed);
            });
        }
    }

    setDamping(enabled) {
        if (this.controls.orbit) {
            this.controls.orbit.enableDamping = enabled;
        }
        if (this.controls.map) {
            this.controls.map.enableDamping = enabled;
        }
        if (this.controls.trackball) {
            this.controls.trackball.staticMoving = !enabled;
        }
    }

    setAutoRotate(enabled) {
        if (this.controls.orbit) {
            this.controls.orbit.autoRotate = enabled;
        }
    }

    setSpeed(speed) {
        if (this.controls.orbit) {
            this.controls.orbit.autoRotateSpeed = speed * 2;
        }
        if (this.controls.trackball) {
            this.controls.trackball.rotateSpeed = speed;
            this.controls.trackball.zoomSpeed = speed * 1.2;
            this.controls.trackball.panSpeed = speed * 0.8;
        }
        if (this.controls.fly) {
            this.controls.fly.movementSpeed = speed * 100;
            this.controls.fly.rollSpeed = (Math.PI / 24) * speed;
        }
    }

    update() {
        if (this.controls[this.currentMode]) {
            if (this.currentMode === 'fly') {
                this.controls.fly.update(this.clock.getDelta());
            } else {
                this.controls[this.currentMode].update();
            }
        }
    }

    reset() {
        this.camera.position.set(100, 50, 100);
        this.camera.lookAt(0, 0, 0);

        if (this.controls.orbit) {
            this.controls.orbit.target.set(0, 0, 0);
            this.controls.orbit.update();
        }
        if (this.controls.map) {
            this.controls.map.target.set(0, 0, 0);
            this.controls.map.update();
        }
        if (this.controls.trackball) {
            this.controls.trackball.target.set(0, 0, 0);
            this.controls.trackball.update();
        }
    }

    dispose() {
        Object.values(this.controls).forEach(control => {
            if (control && control.dispose) {
                control.dispose();
            }
        });
    }
}

// IMPLEMENTED: Load NAVR data function
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

        // Only store original data if it hasn't been stored yet (should already be set when CSV was loaded)
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

// IMPLEMENTED: Toggle thresholding function
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
                    currentData[structure].cohen_d = NaN; // Set to NaN if below threshold
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

    // CRITICAL FIX: Update mesh userData to reflect the new Cohen's d values
    updateMeshUserData();

    // Update visualization and statistics
    updateStatistics();
    updateBrainVisualization();
    autoRange(); // Adjust color range after thresholding changes
}

// NEW FUNCTION: Update mesh userData when currentData changes
function updateMeshUserData() {
    brainMeshes.forEach(mesh => {
        const userData = mesh.userData;
        if (userData && userData.structure && currentData[userData.structure]) {
            // Update the mesh's userData with the current Cohen's d value
            userData.cohen_d = currentData[userData.structure].cohen_d;
        }
    });
    console.log('Updated mesh userData with current Cohen\'s d values');
}

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

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    camera = new THREE.PerspectiveCamera(75,
        (window.innerWidth - 320) / window.innerHeight, 0.1, 1000);
    camera.position.set(100, 50, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth - 320, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // IMPROVED: Better lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Increased ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4080ff, 0.5); // Increased fill light
    fillLight.position.set(-50, -50, -50);
    scene.add(fillLight);

    // Add point light for better illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.8, 200);
    pointLight.position.set(0, 50, 50);
    scene.add(pointLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

function setupControls() {
    const controlManager = new CameraControlManager(camera, renderer);

    renderer.domElement.addEventListener('click', handleMouseClick);
    renderer.domElement.addEventListener('mousemove', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    });

    return controlManager;
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

function processCsvData(data) {
    console.log('Processing CSV data:', data);
    currentData = {};
    originalData = {}; // Reset original data

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
            originalData[structure] = { ...structureData }; // Store original data immediately
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
    loadBrainMeshes(); // FIXED: Automatically load meshes after data is processed
}

async function loadBrainMeshes() {
    if (Object.keys(currentData).length === 0) {
        showError('No data loaded. Please upload a CSV file first.');
        return;
    }

    const objAvailable = typeof THREE.OBJLoader !== 'undefined';
    const plyAvailable = typeof THREE.PLYLoader !== 'undefined';

    if (!objAvailable && !plyAvailable) {
        showError('No mesh loaders are available. Please refresh the page and ensure internet connection for CDN access.');
        return;
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').textContent = 'Loading brain meshes...';

    clearBrainMeshes();

    const atlas = brainAtlases[currentAtlas];
    if (!atlas) {
        showError(`Atlas "${currentAtlas}" not found.`);
        return;
    }

    let loadedCount = 0;
    let totalCount = 0;
    let errorCount = 0;

    // FIXED: Only count structures that we actually have data for
    const structuresToLoad = [];
    if (currentView === 'cortical') {
        atlas.cortical.forEach(structure => {
            if (currentData[structure]) structuresToLoad.push(structure);
        });
    }
    if (currentView === 'subcortical') {
        atlas.subcortical.forEach(structure => {
            if (currentData[structure]) structuresToLoad.push(structure);
        });
    }

    totalCount = structuresToLoad.length;
    console.log(`Attempting to load ${totalCount} structures that have data`);

    for (const structure of structuresToLoad) {
        try {
            const type = currentData[structure].type;
            await loadSingleMesh(structure, type);
            loadedCount++;
            updateLoadingProgress(loadedCount, totalCount);
        } catch (error) {
            console.warn(`Could not load structure ${structure}:`, error);
            errorCount++;
        }
    }

    document.getElementById('loading').style.display = 'none';

    if (brainMeshes.length === 0) {
        console.warn(`No mesh files found. Creating simple visualization from CSV data.`);
        createSimpleVisualization();
    } else {
        updateBrainVisualization();
        console.log(`Successfully loaded ${brainMeshes.length} brain structures (${errorCount} failed)`);
    }
}

function createSimpleVisualization() {
    clearBrainMeshes();

    const createdStructures = new Set();

    Object.entries(currentData).forEach(([structure, data], index) => {
        if (createdStructures.has(structure)) return;

        try {
            let position = getStructurePosition(structure, data.type, data.hemisphere, index);
            let size = data.type === 'cortical' ? 8 : 5;

            let geometry;
            if (data.type === 'cortical') {
                geometry = new THREE.SphereGeometry(size, 12, 12);
                geometry.scale(1, 0.7, 1.3);
            } else {
                geometry = new THREE.SphereGeometry(size, 10, 10);
            }

            const colorRGB = getColorFromCohenD(data.cohen_d);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(colorRGB.r, colorRGB.g, colorRGB.b),
                transparent: true,
                opacity: 0.8,
                shininess: 30
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(position.x, position.y, position.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            mesh.userData = {
                structure: structure,
                cohen_d: data.cohen_d,
                type: data.type,
                hemisphere: data.hemisphere
            };

            scene.add(mesh);
            brainMeshes.push(mesh);
            createdStructures.add(structure);

        } catch (error) {
            console.warn(`Error creating simple visualization for ${structure}:`, error);
        }
    });

    if (brainMeshes.length > 0) {
        createBrainOutline();
    }

    updateBrainVisualization();
    console.log(`Created simple visualization for ${brainMeshes.length} structures`);

    // Show info about simple mode
    setTimeout(() => {
        const loading = document.getElementById('loading');
        loading.style.display = 'block';
        loading.innerHTML = `
            <div style="text-align: center; color: #ffc107;">
                <h3 style="color: #ffc107; margin-bottom: 15px;">ℹ️ Simple Visualization Mode</h3>
                <div style="margin-bottom: 15px;">
                    Showing basic shapes for ${brainMeshes.length} CSV data structures.<br>
                    For detailed brain visualization, upload mesh files.
                </div>
                <button onclick="document.getElementById('loading').style.display='none'" 
                        style="background: #ffc107; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Continue with Simple View
                </button>
            </div>
        `;
    }, 1000);
}

function getStructurePosition(structure, type, hemisphere, index) {
    const leftOffset = hemisphere === 'left' ? -1 : 1;
    const baseDistance = 25;

    let yPos = 0;
    if (structure.includes('frontal') || structure.includes('Frontal')) yPos = 15;
    else if (structure.includes('temporal') || structure.includes('Temporal')) yPos = -10;
    else if (structure.includes('parietal') || structure.includes('Parietal')) yPos = 10;
    else if (structure.includes('occipital') || structure.includes('Occipital')) yPos = 5;
    else if (structure.includes('cingulate') || structure.includes('Cingulate')) yPos = 8;

    let zPos = 0;
    if (structure.includes('anterior') || structure.includes('frontal')) zPos = 20;
    else if (structure.includes('posterior') || structure.includes('occipital')) zPos = -15;
    else if (structure.includes('middle') || structure.includes('central')) zPos = 0;

    if (type === 'subcortical') {
        if (structure.includes('Hippocampus')) return { x: leftOffset * 15, y: -8, z: -5 };
        if (structure.includes('Amygdala')) return { x: leftOffset * 12, y: -5, z: -8 };
        if (structure.includes('Thalamus')) return { x: leftOffset * 8, y: 0, z: 0 };
        if (structure.includes('Caudate')) return { x: leftOffset * 10, y: 8, z: 5 };
        if (structure.includes('Putamen')) return { x: leftOffset * 12, y: 3, z: 2 };
        if (structure.includes('Pallidum')) return { x: leftOffset * 9, y: 1, z: 3 };

        return {
            x: leftOffset * (8 + (index % 3) * 3),
            y: -2 + (index % 3) * 4,
            z: (index % 3) * 3
        };
    }

    return {
        x: leftOffset * (baseDistance + (index % 5) * 3),
        y: yPos + (index % 3) * 5,
        z: zPos + (index % 4) * 4
    };
}

function createBrainOutline() {
    try {
        const leftHemisphere = new THREE.SphereGeometry(35, 16, 16, 0, Math.PI, 0, Math.PI);
        const rightHemisphere = new THREE.SphereGeometry(35, 16, 16, Math.PI, Math.PI, 0, Math.PI);

        const outlineMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.1,
            wireframe: false
        });

        const leftMesh = new THREE.Mesh(leftHemisphere, outlineMaterial.clone());
        const rightMesh = new THREE.Mesh(rightHemisphere, outlineMaterial.clone());

        leftMesh.position.set(-5, 0, 0);
        rightMesh.position.set(5, 0, 0);
        leftMesh.userData = { isBrainOutline: true };
        rightMesh.userData = { isBrainOutline: true };

        scene.add(leftMesh);
        scene.add(rightMesh);

    } catch (error) {
        console.warn('Error creating brain outline:', error);
    }
}

async function loadSingleMesh(structure, type) {
    const possiblePaths = [
        `meshes/${type}/${currentAtlas}/${structure}`,
        `meshes/${type}/${structure}`,
        `meshes/${currentAtlas}/${structure}`,
        `meshes/${structure}`,
        `${structure}`
    ];

    const possibleFormats = ['obj', 'ply'];

    for (const format of possibleFormats) {
        if (format === 'ply' && typeof THREE.PLYLoader === 'undefined') {
            console.warn('PLYLoader not available, skipping PLY files');
            continue;
        }

        for (const basePath of possiblePaths) {
            const path = `${basePath}.${format}`;
            try {
                const object = await loadMeshFile(path, format);
                if (object) {
                    setupMeshProperties(object, structure, type);
                    scene.add(object);
                    console.log(`Successfully loaded ${structure} from ${path}`);
                    return object;
                }
            } catch (error) {
                continue;
            }
        }
    }
    throw new Error(`Could not load mesh for ${structure} - no valid files found`);
}

function loadMeshFile(path, format) {
    return new Promise((resolve, reject) => {
        let loader;

        if (format === 'obj') {
            if (typeof THREE.OBJLoader === 'undefined') {
                reject(new Error('OBJLoader not available'));
                return;
            }
            loader = new THREE.OBJLoader();
        } else if (format === 'ply') {
            if (typeof THREE.PLYLoader === 'undefined') {
                reject(new Error('PLYLoader not available - falling back to OBJ'));
                return;
            }
            loader = new THREE.PLYLoader();
        } else {
            reject(new Error('Unsupported format'));
            return;
        }

        const onLoad = (result) => {
            if (format === 'ply') {
                const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
                const mesh = new THREE.Mesh(result, material);
                const group = new THREE.Group();
                group.add(mesh);
                resolve(group);
            } else {
                resolve(result);
            }
        };

        const onProgress = (progress) => {
            // Optional: handle loading progress
        };

        const onError = (error) => {
            reject(error);
        };

        loader.load(path, onLoad, onProgress, onError);
    });
}

function setupMeshProperties(object, structure, type) {
    object.traverse((child) => {
        if (child.isMesh) {
            // IMPROVED: Better error handling for geometry smoothing
            try {
                if (child.geometry) {
                    if (typeof THREE.BufferGeometryUtils !== 'undefined') {
                        child.geometry.deleteAttribute("normal");
                        child.geometry = THREE.BufferGeometryUtils.mergeVertices(child.geometry);
                        child.geometry.computeVertexNormals();
                    } else {
                        console.warn('BufferGeometryUtils not available, using basic smoothing');
                        child.geometry.computeVertexNormals();
                    }
                }
            } catch (smoothingError) {
                console.warn(`Error smoothing geometry for ${structure}:`, smoothingError);
                try {
                    if (child.geometry && child.geometry.computeVertexNormals) {
                        child.geometry.computeVertexNormals();
                    }
                } catch (fallbackError) {
                    console.warn(`Fallback smoothing also failed for ${structure}:`, fallbackError);
                }
            }

            child.userData = {
                structure: structure,
                type: type,
                cohen_d: currentData[structure]?.cohen_d || NaN,
                hemisphere: getHemisphere(structure)
            };

            // IMPROVED: Better material setup
            try {
                const color = getColorFromCohenD(child.userData.cohen_d);

                // Create a new material instead of modifying existing one
                child.material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(color.r, color.g, color.b),
                    transparent: false,
                    opacity: 1,
                    side: THREE.FrontSide, // FIXED: Use FrontSide instead of DoubleSide for better performance
                    flatShading: false,
                    shininess: 30
                });

                child.castShadow = true;
                child.receiveShadow = true;

                brainMeshes.push(child);
                console.log(`Successfully set up mesh for ${structure} with color:`, color);
            } catch (error) {
                console.warn(`Error setting up mesh properties for ${structure}:`, error);
                child.material = new THREE.MeshPhongMaterial({
                    color: 0x888888,
                    transparent: true,
                    opacity: 1,
                    flatShading: false
                });
                brainMeshes.push(child);
            }
        }
    });
}

function getHemisphere(structure) {
    if (structure.startsWith('lh_') || structure.includes('Left-') || structure.startsWith('L_')) {
        return 'left';
    } else if (structure.startsWith('rh_') || structure.includes('Right-') || structure.startsWith('R_')) {
        return 'right';
    }
    return 'unknown';
}

function updateLoadingProgress(loaded, total) {
    const percentage = Math.round((loaded / total) * 100);
    document.getElementById('loading').textContent = `Loading brain meshes... ${percentage}% (${loaded}/${total})`;
}

function clearBrainMeshes() {
    brainMeshes.forEach(mesh => {
        if (mesh.parent) {
            mesh.parent.remove(mesh);
        }
    });
    brainMeshes = [];

    const objectsToRemove = [];
    scene.traverse((object) => {
        if (object.userData && (object.userData.structure || object.userData.isBrainMesh || object.userData.isBrainOutline)) {
            objectsToRemove.push(object);
        }
    });
    objectsToRemove.forEach(obj => scene.remove(obj));
}

function getColorFromCohenD(cohen_d) {
    if (cohen_d === undefined || cohen_d === null || isNaN(cohen_d)) {
        return { r: 0.4, g: 0.4, b: 0.4 };
    }

    const value = parseFloat(cohen_d);
    if (!isFinite(value)) {
        return { r: 0.4, g: 0.4, b: 0.4 };
    }

    const minVal = isFinite(colorMapping.min) ? colorMapping.min : -0.5;
    const maxVal = isFinite(colorMapping.max) ? colorMapping.max : 0.5;

    const range = maxVal - minVal;
    if (range === 0) {
        return { r: 0.25, g: 0.25, b: 0.25 };
    }

    const normalized = (value - minVal) / range;
    const clamped = Math.max(0, Math.min(1, normalized));

    let r, g, b;
    if (clamped < 0.5) {
        const t = clamped * 2;
        r = t;
        g = t;
        b = 1;
    } else {
        const t = (clamped - 0.5) * 2;
        r = 1;
        g = 1 - t;
        b = 1 - t;
    }

    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b = Math.max(0, Math.min(1, b));

    return { r, g, b };
}

function updateColorMapping() {
    colorMapping.min = parseFloat(document.getElementById('minRange').value);
    colorMapping.max = parseFloat(document.getElementById('maxRange').value);

    document.getElementById('minLabel').textContent = colorMapping.min.toFixed(1);
    document.getElementById('maxLabel').textContent = colorMapping.max.toFixed(1);

    updateColorbar();
    updateBrainVisualization();
}

function updateColorbar() {
    try {
        const colorbar = document.getElementById('colorbar');
        if (!colorbar) return;

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        const gradient = ctx.createLinearGradient(0, 0, 256, 0);
        gradient.addColorStop(0, '#0066cc');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#cc0000');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 30);

        colorbar.style.backgroundImage = `url(${canvas.toDataURL()})`;
    } catch (error) {
        console.warn('Error updating colorbar:', error);
    }
}

function autoRange() {
    const validValues = Object.values(currentData)
        .map(d => d.cohen_d)
        .filter(v => !isNaN(v));

    if (validValues.length === 0) return;

    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const range = max - min;
    const padding = range * 0.1;

    colorMapping.min = min - padding;
    colorMapping.max = max + padding;

    document.getElementById('minRange').value = colorMapping.min.toFixed(1);
    document.getElementById('maxRange').value = colorMapping.max.toFixed(1);

    updateColorMapping();
}

function updateStatistics() {
    const values = Object.values(currentData).map(d => d.cohen_d);
    const validValues = values.filter(v => !isNaN(v));
    const nanCount = values.filter(v => isNaN(v)).length;
    const meanCohen = validValues.length > 0 ?
        validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;

    document.getElementById('validCount').textContent = validValues.length;
    document.getElementById('nanCount').textContent = nanCount;
    document.getElementById('totalCount').textContent = values.length;
    document.getElementById('meanCohen').textContent = meanCohen.toFixed(2);

    // Update threshold status if thresholding is applied
    if (isThresholded && navrDataLoaded) {
        const originalValues = Object.values(originalData).map(d => d.cohen_d);
        const originalValidCount = originalValues.filter(v => !isNaN(v)).length;
        const thresholdedCount = originalValidCount - validValues.length;

        document.getElementById('thresholdStatus').textContent =
            `Thresholded: ${thresholdedCount}/${originalValidCount} values below NAVR threshold`;
    }
}

function setView(view) {
    currentView = view;

    // Update button states
    document.querySelectorAll('#sidebar button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(view + 'Btn').classList.add('active');

    // Reload meshes for new view if we have data
    if (Object.keys(currentData).length > 0) {
        loadBrainMeshes();
    }
}

// IMPROVED: Better visualization update with detailed logging
function updateBrainVisualization() {
    console.log('Updating brain visualization for view:', currentView);
    console.log('Total brain meshes:', brainMeshes.length);

    let visibleCount = 0;
    brainMeshes.forEach((mesh, index) => {
        try {
            const userData = mesh.userData;
            if (!userData) {
                console.warn(`Mesh ${index} has no userData`);
                return;
            }

            let visible = false;

            if (currentView === 'cortical' && userData.type === 'cortical') {
                visible = true;
            } else if (currentView === 'subcortical' && userData.type === 'subcortical') {
                visible = true;
            }

            mesh.visible = visible;

            if (visible) {
                visibleCount++;
                if (mesh.material) {
                    const colorRGB = getColorFromCohenD(userData.cohen_d);
                    if (mesh.material.color && typeof mesh.material.color.setRGB === 'function') {
                        mesh.material.color.setRGB(colorRGB.r, colorRGB.g, colorRGB.b);
                    }
                    if (mesh.material.hasOwnProperty('wireframe')) {
                        mesh.material.wireframe = isWireframe;
                    }
                    mesh.material.needsUpdate = true;
                }
            }
        } catch (error) {
            console.warn('Error updating mesh visualization:', error);
            mesh.visible = false;
        }
    });

    console.log(`${visibleCount} meshes are now visible`);
}

function handleMouseClick() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(brainMeshes);

    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        const userData = mesh.userData;

        const infoPanel = document.getElementById('info-panel');
        const structureInfo = document.getElementById('structure-info');

        let navrInfo = '';
        if (navrDataLoaded && navrData[userData.structure]) {
            const navr = navrData[userData.structure];
            navrInfo = `
                <p><strong>NAVR Corrected:</strong> ${navr.navr_corrected.toFixed(3)}</p>                        
            `;
        }

        // Check if value was thresholded
        let thresholdInfo = '';
        if (isThresholded && originalData[userData.structure]) {
            const originalValue = originalData[userData.structure].cohen_d;
            if (!isNaN(originalValue) && isNaN(userData.cohen_d)) {
                thresholdInfo = `<p style="color: #ff6b6b;"><strong>Original Cohen's d:</strong> ${originalValue.toFixed(3)} (thresholded)</p>`;
            }
        }

        structureInfo.innerHTML = `
            <h5>Structure Details</h5>
            <p><strong>Name:</strong> ${userData.structure}</p>
            <p><strong>Cohen's d:</strong> ${isNaN(userData.cohen_d) ? 'NaN' : userData.cohen_d.toFixed(3)}</p>
            <p><strong>Type:</strong> ${userData.type}</p>
            ${thresholdInfo}
            ${navrInfo}
        `;

        infoPanel.classList.add('visible');
    }
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    updateBrainVisualization();
}

function resetView() {
    if (window.cameraControls) {
        window.cameraControls.reset();
    }
}

function toggleInfo() {
    const infoPanel = document.getElementById('info-panel');
    infoPanel.classList.toggle('visible');
}

// NEW: Debug function to help troubleshoot rendering issues
function debugMeshes() {
    console.log('=== MESH DEBUG INFO ===');
    console.log('Total brain meshes:', brainMeshes.length);
    console.log('Current view:', currentView);
    console.log('Scene children count:', scene.children.length);
    console.log('NAVR data loaded:', navrDataLoaded);
    console.log('Is thresholded:', isThresholded);
    console.log('NAVR entries:', Object.keys(navrData).length);

    brainMeshes.forEach((mesh, index) => {
        const userData = mesh.userData;
        const hasNavr = navrData[userData?.structure];
        const originalValue = originalData[userData?.structure]?.cohen_d;

        console.log(`Mesh ${index}:`, {
            structure: userData?.structure,
            type: userData?.type,
            visible: mesh.visible,
            hasGeometry: !!mesh.geometry,
            hasMaterial: !!mesh.material,
            position: mesh.position,
            inScene: scene.children.includes(mesh),
            cohenD: userData?.cohen_d,
            originalCohenD: originalValue,
            hasNavrData: !!hasNavr,
            navrThreshold: hasNavr ? navrData[userData.structure].navr_corrected : null,
            wasThresholded: !isNaN(originalValue) && isNaN(userData?.cohen_d)
        });
    });

    console.log('Camera position:', camera.position);
    console.log('Camera target:', window.cameraControls?.controls?.orbit?.target);

    // Summary of thresholding
    if (isThresholded && navrDataLoaded) {
        const originalValidCount = Object.values(originalData).filter(d => !isNaN(d.cohen_d)).length;
        const currentValidCount = Object.values(currentData).filter(d => !isNaN(d.cohen_d)).length;
        const thresholdedCount = originalValidCount - currentValidCount;
        console.log(`Thresholding summary: ${thresholdedCount}/${originalValidCount} values thresholded`);
    }

    console.log('======================');
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
            updateMeshUserData(); // Update mesh userData with restored values
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

function handleResize() {
    camera.aspect = (window.innerWidth - 320) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 320, window.innerHeight);
}

function showError(message) {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    loading.innerHTML = `
        <div style="text-align: center; color: #ff6b6b;">
            <h3 style="color: #ff6b6b; margin-bottom: 15px;">⚠️ Error</h3>
            <div style="white-space: pre-line; margin-bottom: 15px;">${message}</div>
            <button onclick="document.getElementById('loading').style.display='none'" 
                    style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                Close
            </button>
        </div>
    `;
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

function animate() {
    requestAnimationFrame(animate);
    if (window.cameraControls) {
        window.cameraControls.update();
    }
    renderer.render(scene, camera);
}

// Initialize colorbar
updateColorbar();

// Start the application
init();

window.addEventListener('beforeunload', () => {
    if (window.cameraControls) {
        window.cameraControls.dispose();
    }
});