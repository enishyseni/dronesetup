class DroneModelRenderer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentModel = null;
        this.droneType = 'fpv'; // 'fpv' or 'fixedWing'
        this.propellers = []; // Store propellers for animation
        this.clock = new THREE.Clock(); // For animation timing
        
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.background = null; // Transparent background
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 5;
        
        // Create renderer with higher quality
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            precision: 'highp'
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Add OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight2.position.set(-1, 0.5, -1);
        this.scene.add(directionalLight2);
        
        // Add a subtle point light to enhance reflections
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(0, 2, 0);
        this.scene.add(pointLight);
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        
        // Start animation loop
        this.animate();
        
        // Initial model creation
        this.createModel();
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls
        this.controls.update();
        
        const delta = this.clock.getDelta();
        
        // Rotate model slightly
        if (this.currentModel) {
            this.currentModel.rotation.y += 0.005;
        }
        
        // Animate propellers with realistic speed based on motor KV
        this.propellers.forEach((prop, index) => {
            if (prop && prop.userData) {
                // Calculate realistic RPM based on motor specs
                const baseRPM = prop.userData.motorKv * 14.8; // Assume 4S voltage
                const normalizedRPM = baseRPM / 60; // Convert to RPS
                const rotationSpeed = normalizedRPM * delta * Math.PI * 2;
                
                // Clockwise/counterclockwise rotation for quad stability
                if (prop.userData.clockwise) {
                    prop.rotation.z += rotationSpeed;
                } else {
                    prop.rotation.z -= rotationSpeed;
                }
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    setDroneType(type) {
        if (this.droneType !== type) {
            this.droneType = type;
            this.createModel();
        }
    }
    
    updateModelBasedOnConfig(config) {
        // Remove current model
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
            this.currentModel = null;
        }
        
        this.propellers = [];
        
        // Create new model based on configuration
        this.createModel(config);
    }
    
    createModel(config = {}) {
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
            this.currentModel = null;
        }
        
        this.propellers = [];
        
        if (this.droneType === 'fpv') {
            this.currentModel = this.createFPVDroneModel(config);
        } else {
            this.currentModel = this.createFixedWingModel(config);
        }
        
        if (this.currentModel) {
            this.scene.add(this.currentModel);
        }
    }
    
    // Helper function to create a carbon fiber-like material
    createCarbonFiberMaterial() {
        const material = new THREE.MeshPhongMaterial({
            color: 0x222222,
            specular: 0x333333,
            shininess: 100,
            flatShading: false
        });
        return material;
    }
    
    // Helper function to create a metallic material
    createMetallicMaterial(color = 0x888888) {
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.7,
            roughness: 0.3,
            flatShading: false
        });
        return material;
    }
    
    createFPVDroneModel(config = {}) {
        // Default values if not provided
        const frameSize = config.frameSize || '5inch';
        const batteryType = config.batteryType || '4s';
        const camera = config.camera || 'analog';
        const sizeFactor = parseInt(frameSize.replace('inch', '')) / 5;
        
        // Create a group to hold all drone parts
        const droneGroup = new THREE.Group();
        
        // Create more detailed frame
        const frameGroup = new THREE.Group();
        
        // Main center plate (carbon fiber look)
        const centerPlateGeo = new THREE.BoxGeometry(0.9 * sizeFactor, 0.05, 0.9 * sizeFactor);
        const carbonFiberMaterial = this.createCarbonFiberMaterial();
        const centerPlate = new THREE.Mesh(centerPlateGeo, carbonFiberMaterial);
        frameGroup.add(centerPlate);
        
        // Top plate with slight offset
        const topPlateGeo = new THREE.BoxGeometry(0.8 * sizeFactor, 0.03, 0.75 * sizeFactor);
        const topPlate = new THREE.Mesh(topPlateGeo, carbonFiberMaterial);
        topPlate.position.y = 0.15;
        frameGroup.add(topPlate);
        
        // Create X-style arms
        const createArm = (angle, color) => {
            const armGroup = new THREE.Group();
            
            // Main arm tube
            const armGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.8 * sizeFactor, 8);
            const arm = new THREE.Mesh(armGeo, carbonFiberMaterial);
            arm.rotation.z = Math.PI/2;
            arm.position.x = 0.35 * sizeFactor;
            
            armGroup.add(arm);
            armGroup.rotation.z = angle;
            
            return armGroup;
        };
        
        // Add four arms in X configuration
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2 + Math.PI / 4;
            const arm = createArm(angle, this.colorPalette[i % 4]);
            frameGroup.add(arm);
        }
        
        droneGroup.add(frameGroup);
        
        // Create standoffs (metal pillars between plates)
        const standoffMaterial = this.createMetallicMaterial(0x999999);
        const standoffPositions = [
            { x: 0.3 * sizeFactor, z: 0.3 * sizeFactor },
            { x: -0.3 * sizeFactor, z: 0.3 * sizeFactor },
            { x: -0.3 * sizeFactor, z: -0.3 * sizeFactor },
            { x: 0.3 * sizeFactor, z: -0.3 * sizeFactor }
        ];
        
        standoffPositions.forEach(pos => {
            const standoffGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8);
            const standoff = new THREE.Mesh(standoffGeo, standoffMaterial);
            standoff.position.set(pos.x, 0.075, pos.z);
            standoff.rotation.x = Math.PI/2;
            droneGroup.add(standoff);
        });
        
        // Add motors with realistic bell shape
        const motorPositions = [
            { x: 0.7 * sizeFactor, z: 0.7 * sizeFactor, clockwise: true },
            { x: -0.7 * sizeFactor, z: 0.7 * sizeFactor, clockwise: false },
            { x: -0.7 * sizeFactor, z: -0.7 * sizeFactor, clockwise: true },
            { x: 0.7 * sizeFactor, z: -0.7 * sizeFactor, clockwise: false }
        ];
        
        const motorBellMaterial = this.createMetallicMaterial(0x222222);
        const motorWindingMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc4400,
            metalness: 0,
            roughness: 1
        });
        
        motorPositions.forEach((pos, index) => {
            const motorGroup = new THREE.Group();
            
            // Motor bell (main body)
            const motorBellGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.15, 16);
            const motorBell = new THREE.Mesh(motorBellGeo, motorBellMaterial);
            
            // Motor windings (copper coils)
            const windingGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 12);
            const winding1 = new THREE.Mesh(windingGeo, motorWindingMaterial);
            const winding2 = new THREE.Mesh(windingGeo, motorWindingMaterial);
            const winding3 = new THREE.Mesh(windingGeo, motorWindingMaterial);
            
            winding1.position.y = 0.04;
            winding2.position.y = 0;
            winding3.position.y = -0.04;
            
            // Motor shaft
            const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
            const shaftMaterial = this.createMetallicMaterial(0x444444);
            const shaft = new THREE.Mesh(shaftGeo, shaftMaterial);
            shaft.position.y = 0.125;
            
            // Propeller based on frame size
            const propRadius = parseInt(frameSize.replace('inch', '')) * 0.0254 / 2; // Convert inches to meters, then radius
            const propGeo = new THREE.BoxGeometry(propRadius * 2, 0.005, 0.02);
            const propMaterial = new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.1,
                roughness: 0.8
            });
            
            const prop = new THREE.Mesh(propGeo, propMaterial);
            prop.position.y = 0.25;
            
            // Store motor KV for animation
            prop.userData = {
                motorKv: parseInt(config.motorKv) || 2400,
                clockwise: pos.clockwise
            };
            
            motorGroup.add(motorBell, winding1, winding2, winding3, shaft, prop);
            motorGroup.position.set(pos.x, 0.1, pos.z);
            
            droneGroup.add(motorGroup);
            this.propellers.push(prop);
        });
        
        // Create flight stack (electronics)
        const createElectronicsStack = () => {
            const stackGroup = new THREE.Group();
            stackGroup.position.y = 0.1;
            
            // Flight controller
            const fcGeo = new THREE.BoxGeometry(0.3 * sizeFactor, 0.05, 0.3 * sizeFactor);
            const fcMaterial = new THREE.MeshStandardMaterial({
                color: 0x004400,
                metalness: 0.2,
                roughness: 0.8
            });
            const fc = new THREE.Mesh(fcGeo, fcMaterial);
            
            // ESC (Electronic Speed Controller)
            const escGeo = new THREE.BoxGeometry(0.3 * sizeFactor, 0.05, 0.3 * sizeFactor);
            const escMaterial = new THREE.MeshStandardMaterial({
                color: 0x000044,
                metalness: 0.2,
                roughness: 0.8
            });
            const esc = new THREE.Mesh(escGeo, escMaterial);
            esc.position.y = -0.05;
            
            // Components on FC
            const componentGeo = new THREE.BoxGeometry(0.08, 0.04, 0.1);
            const componentMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.5,
                roughness: 0.5
            });
            
            const gyro = new THREE.Mesh(componentGeo, componentMaterial);
            gyro.position.set(0.05, 0.03, 0);
            
            const rx = new THREE.Mesh(componentGeo, componentMaterial);
            rx.position.set(-0.07, 0.03, 0.05);
            rx.scale.set(0.8, 1, 0.6);
            
            stackGroup.add(fc, esc, gyro, rx);
            return stackGroup;
        };
        
        droneGroup.add(createElectronicsStack());
        
        // Add a more detailed camera
        const cameraSystem = new THREE.Group();
        cameraSystem.position.z = 0.4 * sizeFactor;
        cameraSystem.rotation.x = -Math.PI / 6; // Typical FPV camera tilt
        
        // Main camera body
        const camBodyMaterial = new THREE.MeshStandardMaterial({
            color: camera === 'digital' ? 0x333333 : 0x222222,
            metalness: 0.5,
            roughness: 0.5
        });
        
        const camBodyGeo = new THREE.BoxGeometry(
            camera === 'digital' ? 0.25 : 0.2, 
            camera === 'digital' ? 0.25 : 0.2, 
            0.15
        );
        const camBody = new THREE.Mesh(camBodyGeo, camBodyMaterial);
        
        // Camera lens
        const lensGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.1, 16);
        const lensMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            specular: 0x333333,
            shininess: 100
        });
        const lens = new THREE.Mesh(lensGeo, lensMaterial);
        lens.rotation.x = Math.PI/2;
        lens.position.z = 0.1;
        
        // Lens glass effect
        const lensGlassGeo = new THREE.CircleGeometry(0.05, 16);
        const lensGlassMaterial = new THREE.MeshPhongMaterial({
            color: 0x8888ff,
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0.7
        });
        const lensGlass = new THREE.Mesh(lensGlassGeo, lensGlassMaterial);
        lensGlass.position.z = 0.151;
        lensGlass.rotation.x = Math.PI/2;
        
        cameraSystem.add(camBody, lens, lensGlass);
        
        // Add camera mount/bracket
        const bracketGeo = new THREE.BoxGeometry(0.3, 0.05, 0.1);
        const bracket = new THREE.Mesh(bracketGeo, carbonFiberMaterial);
        bracket.position.y = -0.1;
        cameraSystem.add(bracket);
        
        droneGroup.add(cameraSystem);
        
        // Add a detailed battery with proper chemistry indication
        const batteryGroup = new THREE.Group();
        const batteryType = config.batteryType || '4s-lipo';
        const batteryCapacity = config.batteryCapacity || '1500';
        
        // Battery size based on capacity
        const capacityFactor = parseInt(batteryCapacity) / 1500;
        const batteryWidth = 0.35 * Math.sqrt(capacityFactor);
        const batteryHeight = 0.15 * capacityFactor;
        const batteryDepth = 0.08;
        
        // Battery color based on chemistry
        const batteryColor = batteryType.includes('lipo') ? 0x1a5490 : 0x2d5016; // Blue for LiPo, Green for Li-Ion
        
        const batteryGeo = new THREE.BoxGeometry(batteryWidth, batteryHeight, batteryDepth);
        const batteryMaterial = new THREE.MeshStandardMaterial({
            color: batteryColor,
            metalness: 0.3,
            roughness: 0.7
        });
        
        const battery = new THREE.Mesh(batteryGeo, batteryMaterial);
        battery.position.y = -0.05;
        
        // Battery label
        const labelGeo = new THREE.PlaneGeometry(batteryWidth * 0.8, 0.03);
        const labelMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const label = new THREE.Mesh(labelGeo, labelMaterial);
        label.position.set(0, 0, batteryDepth/2 + 0.001);
        
        batteryGroup.add(battery, label);
        batteryGroup.position.y = -0.1;
        droneGroup.add(batteryGroup);
        
        return droneGroup;
    }
    
    createFixedWingModel(config = {}) {
        const wingspan = parseInt(config.wingspan) || 1000;
        const wingType = config.wingType || 'conventional';
        const sizeFactor = wingspan / 1000;
        
        const planeGroup = new THREE.Group();
        
        // Wing based on type
        let wingGeo;
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.1,
            roughness: 0.8
        });
        
        switch(wingType) {
            case 'flying':
                // Flying wing - triangular
                wingGeo = new THREE.ConeGeometry(sizeFactor * 0.3, sizeFactor, 3);
                wingGeo.rotateX(Math.PI/2);
                break;
            case 'delta':
                // Delta wing
                wingGeo = new THREE.ConeGeometry(sizeFactor * 0.4, sizeFactor * 0.8, 3);
                wingGeo.rotateX(Math.PI/2);
                break;
            default:
                // Conventional wing
                wingGeo = new THREE.BoxGeometry(sizeFactor, 0.02, sizeFactor * 0.15);
        }
        
        const wing = new THREE.Mesh(wingGeo, wingMaterial);
        planeGroup.add(wing);
        
        // Fuselage
        const fuselageGeo = new THREE.CylinderGeometry(0.03 * sizeFactor, 0.05 * sizeFactor, sizeFactor * 0.8, 8);
        const fuselage = new THREE.Mesh(fuselageGeo, wingMaterial);
        fuselage.rotation.z = Math.PI/2;
        planeGroup.add(fuselage);
        
        // Motor and propeller
        const motorGroup = new THREE.Group();
        const motorGeo = new THREE.CylinderGeometry(0.04 * sizeFactor, 0.04 * sizeFactor, 0.08 * sizeFactor, 12);
        const motor = new THREE.Mesh(motorGeo, this.createMetallicMaterial(0x333333));
        
        // Propeller
        const propRadius = sizeFactor * 0.15;
        const propGeo = new THREE.BoxGeometry(propRadius * 2, 0.008, 0.03);
        const prop = new THREE.Mesh(propGeo, this.createMetallicMaterial(0x444444));
        prop.position.x = 0.05 * sizeFactor;
        
        prop.userData = {
            motorKv: parseInt(config.motorKv) || 1700,
            clockwise: true
        };
        
        motorGroup.add(motor, prop);
        motorGroup.position.x = sizeFactor * 0.4;
        motorGroup.rotation.z = Math.PI/2;
        
        planeGroup.add(motorGroup);
        this.propellers.push(prop);
        
        return planeGroup;
    }
}
