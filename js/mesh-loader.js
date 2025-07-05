// Mesh loading and management functionality
let brainMeshes = [];
let meshLoadingPromises = new Map();

// Main mesh loading function
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

    // Only count structures that we actually have data for
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
    } else {
        updateBrainVisualization();
        console.log(`Successfully loaded ${brainMeshes.length} brain structures (${errorCount} failed)`);
    }
}

// Load a single mesh file
async function loadSingleMesh(structure, type) {
    if (type === 'cortical') {
        possiblePaths = [
            `meshes/${type}/${currentAtlas}/${structure}`,
        ];
    } else if (type === 'subcortical') {
        possiblePaths = [
            `meshes/${type}/${structure}`,
        ];
    } else {
        throw new Error(`Unknown type "${type}" for structure "${structure}"`);
    }

    // if structure contains Thalamus, add possible Thalamus paths
    if (structure.includes('Thalamus')) {
        possiblePaths.push(
            `meshes/${type}/${structure}-Proper`,
        );
    }

    const possibleFormats = ['obj', 'ply'];

    for (const format of possibleFormats) {
        if (format === 'ply' && typeof THREE.PLYLoader === 'undefined') {
            console.warn('PLYLoader not available, skipping PLY files');
            continue;
        }

        for (const basePath of possiblePaths) {
            const path = `${basePath}.${format}`;
            try {
                // check if the file exists
                const response = await fetch(path, { method: 'HEAD' });
                if (!response.ok) {
                    console.warn(`File not found: ${path}`);
                    continue;
                }
                const object = await loadMeshFile(path, format);
                if (object) {
                    setupMeshProperties(object, structure, type);
                    scene.add(object);
                    console.log(`Successfully loaded ${structure} from ${path}`);
                    return object;
                }
            } catch (error) {
                console.warn(`Error loading mesh for ${structure} from ${path}:`, error);
                continue;
            }
        }
    }
    throw new Error(`Could not load mesh for ${structure} - no valid files found`);
}

// Load mesh file with appropriate loader
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

// Setup mesh properties and materials
function setupMeshProperties(object, structure, type) {
    object.traverse((child) => {
        if (child.isMesh) {
            // Better error handling for geometry smoothing
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

            // Better material setup
            try {
                const color = getColorFromCohenD(child.userData.cohen_d);

                // Create a new material instead of modifying existing one
                child.material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(color.r, color.g, color.b),
                    transparent: false,
                    opacity: 1,
                    side: THREE.FrontSide,
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



// Position structures in 3D space for simple visualization
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

// Create brain outline for simple visualization
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

// Utility functions
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