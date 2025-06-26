// Global 3D rendering variables
let scene, camera, renderer, raycaster, mouse;
let colorMapping = { min: -2.0, max: 2.0 };
let isWireframe = false;
let currentView = 'cortical';
let currentAtlas = 'desikan';

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

    // Better lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4080ff, 0.5);
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
    const cohenD = userData.cohen_d;
    const isValid = !isNaN(cohenD) && cohenD !== null;

    structureInfo.innerHTML = `
        <div style="padding: 10px; background: rgba(0,0,0,0.1); border-radius: 5px; margin-top: 10px;">
            <h4 style="margin: 0 0 8px 0; color: #4fc3f7;">${userData.structure}</h4>
            <p style="margin: 2px 0;"><strong>Type:</strong> ${userData.type}</p>
            <p style="margin: 2px 0;"><strong>Hemisphere:</strong> ${userData.hemisphere}</p>
            <p style="margin: 2px 0;"><strong>Cohen's d:</strong> 
                ${isValid ? cohenD.toFixed(3) : 
                  (isThresholded ? 'Below NAVR threshold' : 'No data')}
            </p>
            ${isValid ? `<p style="margin: 2px 0;"><strong>Effect size:</strong> ${getEffectSizeLabel(Math.abs(cohenD))}</p>` : ''}
        </div>
    `;
}

function getEffectSizeLabel(absCohenD) {
    if (absCohenD < 0.2) return 'Negligible';
    if (absCohenD < 0.5) return 'Small';
    if (absCohenD < 0.8) return 'Medium';
    return 'Large';
}

// Color mapping and visualization
function getColorFromCohenD(cohenD) {
    if (isNaN(cohenD) || cohenD === null) {
        return { r: 0.5, g: 0.5, b: 0.5 };
    }

    const { min, max } = colorMapping;
    const normalizedValue = Math.max(0, Math.min(1, (cohenD - min) / (max - min)));
    
    let r, g, b;
    if (normalizedValue < 0.5) {
        const t = normalizedValue * 2;
        r = 0.2 + (0.8 * (1 - t));
        g = 0.2 + (0.8 * t);
        b = 1.0;
    } else {
        const t = (normalizedValue - 0.5) * 2;
        r = 1.0;
        g = 0.2 + (0.8 * (1 - t));
        b = 0.2 + (0.8 * (1 - t));
    }

    return { r, g, b };
}

function updateBrainVisualization() {
    if (!brainMeshes) return;

    brainMeshes.forEach(mesh => {
        const userData = mesh.userData;
        if (!userData || !userData.structure) return;

        const structureData = currentData[userData.structure];
        if (!structureData) return;

        const cohenD = structureData.cohen_d;
        const colorRGB = getColorFromCohenD(cohenD);

        if (mesh.material) {
            mesh.material.color.setRGB(colorRGB.r, colorRGB.g, colorRGB.b);
            
            if (isNaN(cohenD) || cohenD === null) {
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
    const infoPanel = document.getElementById('info-panel');
    infoPanel.style.display = infoPanel.style.display === 'none' ? 'block' : 'none';
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
        rgb(51, 204, 255) 25%, 
        rgb(255, 255, 255) 50%, 
        rgb(255, 204, 51) 75%, 
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