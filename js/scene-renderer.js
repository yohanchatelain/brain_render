// Global 3D rendering variables
let scene, camera, renderer, raycaster, mouse;
let ambientLight, directionalLight, fillLight, hemisphereLight;
let colorMapping = { min: -2.0, max: 2.0 };
let isWireframe = false;
let currentView = 'cortical';
let currentAtlas = 'desikan';
let showThresholdedRegions = false;
let thresholdedColor = { r: 0.2, g: 0.2, b: 0.2 }; // Default dark gray
let sceneBackgroundColor = 0x1a1a2e; // Default dark blue

// Theme-specific scene settings - optimized for diffused lighting
const sceneThemes = {
    dark: {
        background: 0x1a1a2e,
        backgroundHex: '#1a1a2e',
        ambientLight: 0x404040,
        ambientIntensity: 1.0,  // Increased for more diffusion
        directionalLight: 0xffffff,
        directionalIntensity: 0.5,  // Reduced to soften shadows
        fillLight: 0x4080ff,
        fillIntensity: 0.3,  // Slightly reduced
        hemisphereLight: 0x87ceeb,  // Sky blue
        hemisphereGroundColor: 0x2f2f2f,  // Dark ground
        hemisphereIntensity: 0.4
    },
    light: {
        background: 0xf5f5f5,
        backgroundHex: '#f5f5f5',
        ambientLight: 0xa0a0a0,
        ambientIntensity: 0.8,  // Increased for more diffusion
        directionalLight: 0xffffff,
        directionalIntensity: 0.4,  // Reduced to soften shadows
        fillLight: 0x6090ff,
        fillIntensity: 0.2,  // Slightly reduced
        hemisphereLight: 0x87ceeb,  // Sky blue
        hemisphereGroundColor: 0xcccccc,  // Light ground
        hemisphereIntensity: 0.3
    }
};

// Animation and rendering
function animate() {
    requestAnimationFrame(animate);

    if (window.cameraControls) {
        window.cameraControls.update();
    }

    renderer.render(scene, camera);
}

// Scene setup
function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneBackgroundColor);

    camera = new THREE.PerspectiveCamera(75,
        (window.innerWidth - 320) / window.innerHeight, 0.1, 1000);
    camera.position.set(100, 50, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth - 320, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Better lighting setup with theme support and diffused lighting
    const currentTheme = sceneThemes.dark; // Start with dark theme

    // Enhanced ambient light for more diffusion
    ambientLight = new THREE.AmbientLight(currentTheme.ambientLight, currentTheme.ambientIntensity);
    scene.add(ambientLight);

    // Hemisphere light for natural diffusion
    hemisphereLight = new THREE.HemisphereLight(
        currentTheme.hemisphereLight,
        currentTheme.hemisphereGroundColor,
        currentTheme.hemisphereIntensity
    );
    scene.add(hemisphereLight);

    // Softer directional light with improved shadow settings
    directionalLight = new THREE.DirectionalLight(currentTheme.directionalLight, currentTheme.directionalIntensity);
    directionalLight.position.set(80, 120, 60);  // Adjusted positioning for softer angles
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.radius = 8;  // Softer shadow edges
    directionalLight.shadow.blurSamples = 16;  // Smoother shadow sampling
    scene.add(directionalLight);

    // Adjusted fill light for better diffusion
    fillLight = new THREE.DirectionalLight(currentTheme.fillLight, currentTheme.fillIntensity);
    fillLight.position.set(-40, -30, -40);  // Adjusted positioning
    scene.add(fillLight);

    // Softer point light for accent illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.4, 150);  // Reduced intensity and range
    pointLight.position.set(0, 40, 40);
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

// Mouse interaction handling
function handleMouseClick(event) {
    if (!brainMeshes || brainMeshes.length === 0) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(brainMeshes);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const userData = intersectedObject.userData;

        if (userData && userData.structure) {
            showStructureInfo(userData);
        }
    }
}

function showStructureInfo(userData) {
    const structureInfo = document.getElementById('structure-info');
    const currentCohenD = userData.cohen_d;
    const isCurrentValid = !isNaN(currentCohenD) && currentCohenD !== null;

    // Check if this was thresholded by looking at original data
    const originalValue = originalData[userData.structure]?.cohen_d;
    const wasThresholded = !isCurrentValid && !isNaN(originalValue) && originalValue !== null;

    let cohenDDisplay;
    if (isCurrentValid) {
        cohenDDisplay = currentCohenD.toFixed(3);
    } else if (wasThresholded) {
        cohenDDisplay = `<span style="color: #ff4444; font-weight: bold;">${originalValue.toFixed(3)}</span>`;
    } else {
        cohenDDisplay = '<span style="color: #888;">No data</span>';
    }

    structureInfo.innerHTML = `
        <div style="padding: 10px; background: rgba(0,0,0,0.1); border-radius: 5px;">
            <h4 style="margin: 0 0 8px 0; color: #4fc3f7;">${userData.structure}</h4>
            <p style="margin: 2px 0;"><strong>Type:</strong> ${userData.type}</p>
            <p style="margin: 2px 0;"><strong>Hemisphere:</strong> ${userData.hemisphere}</p>
            <p style="margin: 2px 0;"><strong>Cohen's d:</strong> ${cohenDDisplay}</p>
            ${isCurrentValid ? `<p style="margin: 2px 0;"><strong>Effect size:</strong> ${getEffectSizeLabel(Math.abs(currentCohenD))}</p>` : ''}
        </div>
    `;
}

function getEffectSizeLabel(absCohenD) {
    if (absCohenD < 0.2) return 'Negligible';
    if (absCohenD < 0.5) return 'Small';
    if (absCohenD < 0.8) return 'Medium';
    return 'Large';
}

// Fixed function for color mapping from Cohen's d value
function getColorFromCohenD(cohenD) {
    if (isNaN(cohenD) || cohenD === null) {
        return { r: 0.5, g: 0.5, b: 0.5 }; // Gray for undefined values
    }

    const { min, max } = colorMapping;
    const normalizedValue = Math.max(0, Math.min(1, (cohenD - min) / (max - min)));

    let r, g, b;
    if (normalizedValue < 0.5) {
        // Transition from Blue to White
        const t = normalizedValue * 2;
        r = t;
        g = t;
        b = 1.0;
    } else {
        // Transition from White to Red
        const t = (normalizedValue - 0.5) * 2;
        r = 1.0;
        g = 1.0 - t;
        b = 1.0 - t;
    }

    return { r, g, b };
}

function toggleShowThresholded() {
    showThresholdedRegions = document.getElementById('showThresholdedCheck').checked;
    console.log('Show thresholded regions:', showThresholdedRegions);
    updateBrainVisualization();
}

// Helper function to convert hex color to RGB object
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
}

// Helper function to convert hex color to THREE.js color value
function hexToThreeColor(hex) {
    return parseInt(hex.slice(1), 16);
}

// Update thresholded regions color
function updateThresholdedColor() {
    const colorPicker = document.getElementById('thresholdedColorPicker');
    thresholdedColor = hexToRgb(colorPicker.value);
    console.log('Thresholded color updated:', thresholdedColor);
    updateBrainVisualization();
}

// Update scene background color
function updateBackgroundColor() {
    const colorPicker = document.getElementById('backgroundColorPicker');
    sceneBackgroundColor = hexToThreeColor(colorPicker.value);
    if (scene) {
        scene.background = new THREE.Color(sceneBackgroundColor);
    }
    console.log('Background color updated:', colorPicker.value);
}

// Reset colors to default based on current theme
function resetSceneColors() {
    // Reset thresholded color
    document.getElementById('thresholdedColorPicker').value = '#333333';
    thresholdedColor = { r: 0.2, g: 0.2, b: 0.2 };

    // Reset background color based on current theme
    const currentTheme = isDarkTheme ? 'dark' : 'light';
    const themeSettings = sceneThemes[currentTheme];

    document.getElementById('backgroundColorPicker').value = themeSettings.backgroundHex;
    sceneBackgroundColor = themeSettings.background;
    if (scene) {
        scene.background = new THREE.Color(sceneBackgroundColor);
    }

    updateBrainVisualization();
    console.log('Scene colors reset to default for', currentTheme, 'theme');
}

// Update scene lighting and background for theme
function updateSceneTheme(theme) {
    if (!scene || !ambientLight || !directionalLight || !fillLight || !hemisphereLight) return;

    const themeSettings = sceneThemes[theme];

    // Update background
    scene.background = new THREE.Color(themeSettings.background);
    sceneBackgroundColor = themeSettings.background;

    // Update background color picker to reflect theme change
    document.getElementById('backgroundColorPicker').value = themeSettings.backgroundHex;

    // Update ambient lighting for diffusion
    ambientLight.color.setHex(themeSettings.ambientLight);
    ambientLight.intensity = themeSettings.ambientIntensity;

    // Update hemisphere light for natural diffusion
    hemisphereLight.color.setHex(themeSettings.hemisphereLight);
    hemisphereLight.groundColor.setHex(themeSettings.hemisphereGroundColor);
    hemisphereLight.intensity = themeSettings.hemisphereIntensity;

    // Update directional light with softer settings
    directionalLight.color.setHex(themeSettings.directionalLight);
    directionalLight.intensity = themeSettings.directionalIntensity;

    // Update fill light
    fillLight.color.setHex(themeSettings.fillLight);
    fillLight.intensity = themeSettings.fillIntensity;

    console.log(`Scene updated for ${theme} theme with diffused lighting`);
}

// Theme switching functionality
let isDarkTheme = true;

function toggleTheme() {
    const body = document.body;
    const themeButton = document.getElementById('themeToggle');

    if (isDarkTheme) {
        // Switch to light theme
        body.classList.add('light-theme');
        themeButton.textContent = '☀️';
        isDarkTheme = false;
        updateSceneTheme('light');
        console.log('Switched to light theme');
    } else {
        // Switch to dark theme
        body.classList.remove('light-theme');
        themeButton.textContent = '🌙';
        isDarkTheme = true;
        updateSceneTheme('dark');
        console.log('Switched to dark theme');
    }
}

function updateBrainVisualization() {
    if (!brainMeshes) return;

    brainMeshes.forEach(mesh => {
        const userData = mesh.userData;
        if (!userData || !userData.structure) return;

        const structureData = currentData[userData.structure];
        if (!structureData) return;

        const cohenD = structureData.cohen_d;
        let colorRGB;

        // Check if this is a thresholded region (NaN Cohen's d) and if we should show it
        const isThresholded = isNaN(cohenD) || cohenD === null;

        if (isThresholded && showThresholdedRegions) {
            // Show thresholded regions in custom color
            colorRGB = thresholdedColor;
        } else if (isThresholded && !showThresholdedRegions) {
            // Hide thresholded regions (default behavior)
            colorRGB = { r: 0.5, g: 0.5, b: 0.5 };
        } else {
            // Normal color mapping for valid Cohen's d values
            colorRGB = getColorFromCohenD(cohenD);
        }

        if (mesh.material) {
            mesh.material.color.setRGB(colorRGB.r, colorRGB.g, colorRGB.b);

            if (isThresholded && !showThresholdedRegions) {
                mesh.material.opacity = 0.3;
                mesh.material.transparent = true;
            } else {
                mesh.material.opacity = 0.9;
                mesh.material.transparent = false;
            }
        }

        mesh.userData.cohen_d = cohenD;
    });

    console.log('Updated brain visualization colors');
}

// View and display controls
function setView(view) {
    currentView = view;

    // Update button states
    document.querySelectorAll('#corticalBtn, #subcorticalBtn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(view + 'Btn').classList.add('active');

    // Reload meshes with new view
    if (Object.keys(currentData).length > 0) {
        loadBrainMeshes();
    }
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    brainMeshes.forEach(mesh => {
        if (mesh.material && !mesh.userData.isBrainOutline) {
            mesh.material.wireframe = isWireframe;
        }
    });
}

function resetView() {
    if (window.cameraControls) {
        window.cameraControls.reset();
    }
}

function toggleInfo() {
    console.log('Toggling info panels visibility');
    const interactionPanel = document.getElementById('interaction-panel');
    const regionInfoPanel = document.getElementById('region-info-panel');
    const button = document.querySelector('button[onclick="toggleInfo()"]');

    const isVisible = interactionPanel.style.display !== 'none';

    if (isVisible) {
        interactionPanel.style.display = 'none';
        regionInfoPanel.style.display = 'none';
        if (button) button.textContent = 'Show Info';
    } else {
        interactionPanel.style.display = 'block';
        regionInfoPanel.style.display = 'block';
        if (button) button.textContent = 'Hide Info';
    }
}

function debugMeshes() {
    console.log('=== MESH DEBUG INFO ===');
    console.log(`Total meshes in scene: ${brainMeshes.length}`);
    console.log(`Current data entries: ${Object.keys(currentData).length}`);
    console.log(`Current view: ${currentView}`);
    console.log(`Current atlas: ${currentAtlas}`);

    brainMeshes.forEach((mesh, index) => {
        const userData = mesh.userData;
        const structure = userData.structure;
        const cohenD = userData.cohen_d;
        console.log(`${index + 1}. ${structure}: Cohen's d = ${cohenD}, Type = ${userData.type}`);
    });
}

// Statistics and color mapping
function updateStatistics() {
    if (Object.keys(currentData).length === 0) {
        document.getElementById('validCount').textContent = '0';
        document.getElementById('nanCount').textContent = '0';
        document.getElementById('totalCount').textContent = '0';
        document.getElementById('meanCohen').textContent = '0.00';
        return;
    }

    const cohenDValues = Object.values(currentData).map(d => d.cohen_d);
    const validValues = cohenDValues.filter(d => !isNaN(d) && d !== null);
    const nanCount = cohenDValues.length - validValues.length;

    const mean = validValues.length > 0 ?
        validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;

    document.getElementById('validCount').textContent = validValues.length.toString();
    document.getElementById('nanCount').textContent = nanCount.toString();
    document.getElementById('totalCount').textContent = cohenDValues.length.toString();
    document.getElementById('meanCohen').textContent = mean.toFixed(3);
}

function updateColorMapping() {
    const minVal = parseFloat(document.getElementById('minRange').value);
    const maxVal = parseFloat(document.getElementById('maxRange').value);

    if (minVal >= maxVal) {
        alert('Minimum value must be less than maximum value');
        return;
    }

    colorMapping.min = minVal;
    colorMapping.max = maxVal;

    document.getElementById('minLabel').textContent = minVal.toFixed(1);
    document.getElementById('maxLabel').textContent = maxVal.toFixed(1);

    updateBrainVisualization();
    updateColorbar();
}

function autoRange() {
    if (Object.keys(currentData).length === 0) return;

    const cohenDValues = Object.values(currentData)
        .map(d => d.cohen_d)
        .filter(d => !isNaN(d) && d !== null);

    if (cohenDValues.length === 0) return;

    const min = Math.min(...cohenDValues);
    const max = Math.max(...cohenDValues);
    const padding = (max - min) * 0.1;

    colorMapping.min = min - padding;
    colorMapping.max = max + padding;

    document.getElementById('minRange').value = colorMapping.min.toFixed(1);
    document.getElementById('maxRange').value = colorMapping.max.toFixed(1);
    document.getElementById('minLabel').textContent = colorMapping.min.toFixed(1);
    document.getElementById('maxLabel').textContent = colorMapping.max.toFixed(1);

    updateBrainVisualization();
    updateColorbar();
}

function updateColorbar() {
    const colorbar = document.getElementById('colorbar');
    const gradient = `linear-gradient(to right, 
    rgb(51, 51, 255) 0%,
    rgb(255, 255, 255) 50%, 
    rgb(255, 51, 51) 100%)`;
    colorbar.style.background = gradient;
}

// Event handlers
function handleAtlasChange() {
    currentAtlas = document.getElementById('atlasSelect').value;
    if (Object.keys(currentData).length > 0) {
        loadBrainMeshes();
    }
}

function handleMetricChange() {
    // This would trigger reloading of NAVR data if it was loaded
    if (navrDataLoaded) {
        console.log('Metric changed - you may need to reload NAVR data');
    }
}

function handleResize() {
    camera.aspect = (window.innerWidth - 320) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 320, window.innerHeight);
}

// Error handling
function showError(message) {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    loading.innerHTML = `
        <div style="text-align: center; color: #ff6b6b;">
            <h3 style="color: #ff6b6b;">⚠️ Error</h3>
            <p>${message}</p>
            <button onclick="document.getElementById('loading').style.display='none'" 
                    style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                Close
            </button>
        </div>
    `;
}