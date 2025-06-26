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