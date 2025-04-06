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
            // Slower rotation for better viewing
            this.currentModel.rotation.y += 0.003;
        }
        
        // Animate propellers
        this.propellers.forEach(prop => {
            if (prop.userData.isClockwise) {
                prop.rotation.y += 10 * delta;
            } else {
                prop.rotation.y -= 10 * delta;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    setDroneType(type) {
        if (this.droneType !== type) {
            this.droneType = type;
            this.propellers = []; // Clear propellers before creating new model
            this.createModel();
        }
    }
    
    updateModelBasedOnConfig(config) {
        // Remove current model
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        this.propellers = []; // Clear propellers before creating new model
        
        // Create new model based on configuration
        this.createModel(config);
    }
    
    createModel(config = {}) {
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        this.propellers = []; // Clear propellers array
        
        if (this.droneType === 'fpv') {
            this.createFPVDroneModel(config);
        } else {
            this.createFixedWingModel(config);
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
            const armLength = 0.8 * sizeFactor;
            const armWidth = 0.12 * sizeFactor;
            const armHeight = 0.05;
            const armRadius = 0.01 * sizeFactor;
            
            const armShape = new THREE.Shape();
            armShape.moveTo(-armWidth/2, 0);
            armShape.lineTo(-armWidth/4, -armRadius);
            armShape.lineTo(armLength - armWidth/4, -armRadius);
            armShape.lineTo(armLength, 0);
            armShape.lineTo(armLength - armWidth/4, armRadius);
            armShape.lineTo(-armWidth/4, armRadius);
            armShape.lineTo(-armWidth/2, 0);
            
            const extrudeSettings = {
                steps: 1,
                depth: armHeight,
                bevelEnabled: false
            };
            
            const armGeo = new THREE.ExtrudeGeometry(armShape, extrudeSettings);
            const arm = new THREE.Mesh(armGeo, carbonFiberMaterial);
            arm.rotation.y = angle;
            arm.rotation.x = Math.PI/2;
            arm.position.y = 0.025;
            
            return arm;
        };
        
        // Add four arms in X configuration
        for (let i = 0; i < 4; i++) {
            const arm = createArm(Math.PI/4 + i * Math.PI/2);
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
        
        motorPositions.forEach(pos => {
            // Motor bell (outer part)
            const bellGeo = new THREE.CylinderGeometry(0.1 * sizeFactor, 0.12 * sizeFactor, 0.08, 16);
            const bell = new THREE.Mesh(bellGeo, motorBellMaterial);
            bell.position.set(pos.x, 0.08, pos.z);
            
            // Motor windings (visible at bottom)
            const windingGeo = new THREE.CylinderGeometry(0.08 * sizeFactor, 0.08 * sizeFactor, 0.02, 16);
            const winding = new THREE.Mesh(windingGeo, motorWindingMaterial);
            winding.position.set(pos.x, 0.04, pos.z);
            
            // Motor shaft
            const shaftGeo = new THREE.CylinderGeometry(0.01 * sizeFactor, 0.01 * sizeFactor, 0.06, 8);
            const shaft = new THREE.Mesh(shaftGeo, this.createMetallicMaterial(0xdddddd));
            shaft.position.set(pos.x, 0.13, pos.z);
            
            droneGroup.add(bell, winding, shaft);
            
            // Create propeller with hub and blades
            const propGroup = new THREE.Group();
            propGroup.position.set(pos.x, 0.16, pos.z);
            
            // Propeller hub
            const hubGeo = new THREE.CylinderGeometry(0.03 * sizeFactor, 0.03 * sizeFactor, 0.02, 16);
            const hub = new THREE.Mesh(hubGeo, this.createMetallicMaterial(0x333333));
            propGroup.add(hub);
            
            // Create propeller blades (two blades per prop)
            const bladeShape = new THREE.Shape();
            const bladeLength = 0.5 * sizeFactor;
            const bladeWidth = 0.1 * sizeFactor;
            
            bladeShape.moveTo(0, -0.01);
            bladeShape.lineTo(bladeLength, -bladeWidth/2);
            bladeShape.lineTo(bladeLength, bladeWidth/2);
            bladeShape.lineTo(0, 0.01);
            
            const bladeExtrudeSettings = {
                steps: 1,
                depth: 0.01,
                bevelEnabled: false
            };
            
            const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, bladeExtrudeSettings);
            const bladeMaterial = new THREE.MeshStandardMaterial({
                color: pos.clockwise ? 0x66ccff : 0xff6666,
                metalness: 0.1,
                roughness: 0.5,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            
            const blade1 = new THREE.Mesh(bladeGeo, bladeMaterial);
            blade1.rotation.x = Math.PI/2;
            
            const blade2 = new THREE.Mesh(bladeGeo, bladeMaterial);
            blade2.rotation.x = Math.PI/2;
            blade2.rotation.y = Math.PI;
            
            propGroup.add(blade1, blade2);
            propGroup.userData.isClockwise = pos.clockwise;
            this.propellers.push(propGroup);
            
            droneGroup.add(propGroup);
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
        
        // Add a detailed battery
        const batteryGroup = new THREE.Group();
        batteryGroup.position.y = -0.1;
        
        // Battery dimensions based on type and size
        const cellCount = parseInt(batteryType.replace('s', ''));
        const batteryLength = 0.6 * sizeFactor;
        const batteryWidth = 0.3 * sizeFactor;
        const batteryHeight = 0.05 * cellCount;
        
        const batteryGeo = new THREE.BoxGeometry(batteryLength, batteryHeight, batteryWidth);
        const batteryMaterial = new THREE.MeshPhongMaterial({
            color: 0x004400,
            specular: 0x333333,
            shininess: 30
        });
        const battery = new THREE.Mesh(batteryGeo, batteryMaterial);
        
        // Battery label/sticker
        const labelGeo = new THREE.PlaneGeometry(batteryLength * 0.8, batteryWidth * 0.6);
        const labelMaterial = new THREE.MeshBasicMaterial({
            color: 0xdddddd,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeo, labelMaterial);
        label.rotation.x = Math.PI/2;
        label.position.y = batteryHeight/2 + 0.001;
        label.position.z = 0;
        
        // Battery connector
        const connectorGeo = new THREE.BoxGeometry(0.1, 0.07, 0.1);
        const connectorMaterial = this.createMetallicMaterial(0x111111);
        const connector = new THREE.Mesh(connectorGeo, connectorMaterial);
        connector.position.x = batteryLength/2 + 0.05;
        connector.position.y = 0;
        
        // Battery strap
        const strapGeo = new THREE.BoxGeometry(batteryLength + 0.1, 0.02, batteryWidth + 0.1);
        const strapMaterial = new THREE.MeshBasicMaterial({color: 0x222222});
        const strap1 = new THREE.Mesh(strapGeo, strapMaterial);
        strap1.position.y = batteryHeight/2 + 0.01;
        
        const strap2 = new THREE.Mesh(strapGeo, strapMaterial);
        strap2.position.y = -batteryHeight/2 - 0.01;
        
        batteryGroup.add(battery, label, connector, strap1, strap2);
        droneGroup.add(batteryGroup);
        
        // Add antenna tubes
        const antennaGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8);
        const antennaMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
        const antennaCapMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
        
        const createAntenna = (x, z) => {
            const antenna = new THREE.Mesh(antennaGeo, antennaMaterial);
            antenna.position.set(x, 0.3, z);
            
            // Add colored cap to antenna
            const capGeo = new THREE.SphereGeometry(0.015, 8, 8);
            const cap = new THREE.Mesh(capGeo, antennaCapMaterial);
            cap.position.y = 0.2;
            antenna.add(cap);
            
            return antenna;
        };
        
        droneGroup.add(createAntenna(0.2 * sizeFactor, -0.2 * sizeFactor));
        droneGroup.add(createAntenna(-0.2 * sizeFactor, 0.2 * sizeFactor));
        
        // Set the completed model
        this.currentModel = droneGroup;
        this.scene.add(droneGroup);
        
        // Adjust camera position based on drone size
        this.camera.position.set(2 * sizeFactor, 1.5 * sizeFactor, 2 * sizeFactor);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    }
    
    createFixedWingModel(config = {}) {
        // Default values if not provided
        const wingspan = config.wingspan || '1000';
        const wingType = config.wingType || 'conventional';
        const batteryType = config.batteryType || '4s';
        const sizeFactor = parseInt(wingspan) / 1000;
        
        // Create a group to hold all aircraft parts
        const aircraftGroup = new THREE.Group();
        
        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.1,
            roughness: 0.8
        });
        
        const controlSurfaceMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.1,
            roughness: 0.8
        });
        
        if (wingType === 'conventional') {
            // Create a conventional fixed wing with fuselage and tail
            
            // Fuselage - more aerodynamic shape
            const fuselagePoints = [];
            const fuselageLength = 1.8 * sizeFactor;
            const fuselageRadius = 0.1 * sizeFactor;
            
            // Create nose-to-tail points for lathe geometry
            for (let i = 0; i <= 10; i++) {
                const z = (i / 10) * fuselageLength - fuselageLength/2;
                let r;
                
                if (i < 3) {
                    // Nose section - tapered
                    r = (i / 3) * fuselageRadius;
                } else if (i > 7) {
                    // Tail section - tapered
                    r = fuselageRadius * (1 - (i - 7) / 3);
                } else {
                    // Middle section - constant radius
                    r = fuselageRadius;
                }
                
                fuselagePoints.push(new THREE.Vector2(r, z));
            }
            
            const fuselageGeo = new THREE.LatheGeometry(fuselagePoints, 16);
            const fuselage = new THREE.Mesh(fuselageGeo, bodyMaterial);
            fuselage.rotation.x = Math.PI/2;
            aircraftGroup.add(fuselage);
            
            // Main wing - more detailed with airfoil shape
            const wingGroup = new THREE.Group();
            
            // Create airfoil shape
            const airfoilPoints = [];
            const chordLength = 0.4 * sizeFactor;
            const thickness = 0.05 * sizeFactor;
            
            // Top curve of airfoil
            for (let i = 0; i <= 5; i++) {
                const x = (i / 5) * chordLength;
                // Basic airfoil curve
                const y = thickness * (1 - (i / 5)) * Math.sin(Math.PI * (i / 5));
                airfoilPoints.push(new THREE.Vector2(x, y));
            }
            
            // Bottom curve of airfoil
            for (let i = 5; i >= 0; i--) {
                const x = (i / 5) * chordLength;
                // Bottom curve is flatter
                const y = -thickness * 0.7 * (1 - (i / 5)) * Math.sin(Math.PI * (i / 5));
                airfoilPoints.push(new THREE.Vector2(x, y));
            }
            
            // Create airfoil shape
            const airfoilShape = new THREE.Shape(airfoilPoints);
            
            // Extrude to create wing
            const wingLength = 2 * sizeFactor;
            const wingExtrudeSettings = {
                steps: 1,
                depth: wingLength,
                bevelEnabled: false
            };
            
            const wingGeo = new THREE.ExtrudeGeometry(airfoilShape, wingExtrudeSettings);
            const wing = new THREE.Mesh(wingGeo, bodyMaterial);
            wing.position.set(-chordLength/2, 0, -wingLength/2);
            wingGroup.add(wing);
            
            // Create ailerons (control surfaces)
            const aileronLength = wingLength * 0.4;
            const aileronWidth = chordLength * 0.2;
            const aileronGeo = new THREE.BoxGeometry(aileronWidth, 0.02 * sizeFactor, aileronLength);
            
            const leftAileron = new THREE.Mesh(aileronGeo, controlSurfaceMaterial);
            leftAileron.position.set(chordLength/2 - aileronWidth/2, 0, -wingLength/2 + aileronLength/2);
            leftAileron.rotation.y = 0.15; // Deflected slightly
            
            const rightAileron = new THREE.Mesh(aileronGeo, controlSurfaceMaterial);
            rightAileron.position.set(chordLength/2 - aileronWidth/2, 0, wingLength/2 - aileronLength/2);
            rightAileron.rotation.y = -0.15; // Deflected opposite direction
            
            wingGroup.add(leftAileron, rightAileron);
            wingGroup.position.y = 0.05 * sizeFactor;
            aircraftGroup.add(wingGroup);
            
            // Horizontal stabilizer (tail)
            const hStabGroup = new THREE.Group();
            const hStabGeo = new THREE.BoxGeometry(0.6 * sizeFactor, 0.02 * sizeFactor, 0.8 * sizeFactor);
            const hStab = new THREE.Mesh(hStabGeo, bodyMaterial);
            
            // Elevator (control surface)
            const elevatorGeo = new THREE.BoxGeometry(0.15 * sizeFactor, 0.02 * sizeFactor, 0.8 * sizeFactor);
            const elevator = new THREE.Mesh(elevatorGeo, controlSurfaceMaterial);
            elevator.position.x = 0.375 * sizeFactor;
            elevator.rotation.z = 0.1; // Slightly deflected
            
            hStabGroup.add(hStab, elevator);
            hStabGroup.position.set(-0.8 * sizeFactor, 0.1 * sizeFactor, 0);
            aircraftGroup.add(hStabGroup);
            
            // Vertical stabilizer with rudder
            const vStabGroup = new THREE.Group();
            
            // Create a triangular shape for vertical stabilizer
            const vStabShape = new THREE.Shape();
            vStabShape.moveTo(0, 0);
            vStabShape.lineTo(0.5 * sizeFactor, 0);
            vStabShape.lineTo(0, 0.4 * sizeFactor);
            vStabShape.lineTo(0, 0);
            
            const vStabExtrudeSettings = {
                steps: 1,
                depth: 0.03 * sizeFactor,
                bevelEnabled: false
            };
            
            const vStabGeo = new THREE.ExtrudeGeometry(vStabShape, vStabExtrudeSettings);
            const vStab = new THREE.Mesh(vStabGeo, bodyMaterial);
            vStab.rotation.y = Math.PI/2;
            vStab.position.z = -0.015 * sizeFactor;
            
            // Rudder (control surface)
            const rudderShape = new THREE.Shape();
            rudderShape.moveTo(0, 0);
            rudderShape.lineTo(0.15 * sizeFactor, 0);
            rudderShape.lineTo(0, 0.3 * sizeFactor);
            rudderShape.lineTo(0, 0);
            
            const rudderGeo = new THREE.ExtrudeGeometry(rudderShape, vStabExtrudeSettings);
            const rudder = new THREE.Mesh(rudderGeo, controlSurfaceMaterial);
            rudder.rotation.y = Math.PI/2;
            rudder.rotation.x = 0.1; // Slightly deflected
            rudder.position.x = 0.5 * sizeFactor;
            rudder.position.z = -0.015 * sizeFactor;
            
            vStabGroup.add(vStab, rudder);
            vStabGroup.position.set(-0.8 * sizeFactor, 0.1 * sizeFactor, 0);
            aircraftGroup.add(vStabGroup);
            
            // Motor and propeller
            const motorGroup = new THREE.Group();
            motorGroup.position.set(0.9 * sizeFactor, 0, 0);
            
            // Motor (more detailed cylindrical shape)
            const motorGeo = new THREE.CylinderGeometry(0.07 * sizeFactor, 0.07 * sizeFactor, 0.15 * sizeFactor, 16);
            const motorMaterial = this.createMetallicMaterial(0x444444);
            const motor = new THREE.Mesh(motorGeo, motorMaterial);
            motor.rotation.z = Math.PI/2;
            
            // Propeller with hub and blades
            const propGroup = new THREE.Group();
            propGroup.position.x = 0.1 * sizeFactor;
            
            // Propeller hub
            const hubGeo = new THREE.CylinderGeometry(0.03 * sizeFactor, 0.02 * sizeFactor, 0.05 * sizeFactor, 16);
            const hubMaterial = this.createMetallicMaterial(0x333333);
            const hub = new THREE.Mesh(hubGeo, hubMaterial);
            hub.rotation.z = Math.PI/2;
            propGroup.add(hub);
            
            // Create propeller blades
            const bladeMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.2,
                roughness: 0.7,
                side: THREE.DoubleSide
            });
            
            const createPropBlade = (rotation) => {
                // Create airfoil-like blade shape
                const bladeShape = new THREE.Shape();
                const bladeLength = 0.5 * sizeFactor;
                const maxWidth = 0.08 * sizeFactor;
                
                bladeShape.moveTo(0, 0);
                bladeShape.quadraticCurveTo(bladeLength * 0.5, maxWidth * 1.5, bladeLength, maxWidth);
                bladeShape.lineTo(bladeLength, -maxWidth);
                bladeShape.quadraticCurveTo(bladeLength * 0.5, -maxWidth * 1.5, 0, 0);
                
                const bladeExtrudeSettings = {
                    steps: 1,
                    depth: 0.02 * sizeFactor,
                    bevelEnabled: true,
                    bevelThickness: 0.01 * sizeFactor,
                    bevelSize: 0.01 * sizeFactor,
                    bevelSegments: 3
                };
                
                const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, bladeExtrudeSettings);
                const blade = new THREE.Mesh(bladeGeo, bladeMaterial);
                blade.rotation.set(0, 0, rotation);
                
                return blade;
            };
            
            // Create two blades for the propeller
            propGroup.add(createPropBlade(0));
            propGroup.add(createPropBlade(Math.PI));
            
            propGroup.userData.isClockwise = true;
            this.propellers.push(propGroup);
            
            motorGroup.add(motor, propGroup);
            aircraftGroup.add(motorGroup);
            
            // Landing gear
            const gearMaterial = this.createMetallicMaterial(0x222222);
            
            // Main landing gear
            const mainGearGroup = new THREE.Group();
            
            // Gear struts
            const strutGeo = new THREE.CylinderGeometry(0.02 * sizeFactor, 0.02 * sizeFactor, 0.2 * sizeFactor, 8);
            const leftStrut = new THREE.Mesh(strutGeo, gearMaterial);
            leftStrut.position.set(0, -0.1 * sizeFactor, -0.4 * sizeFactor);
            
            const rightStrut = new THREE.Mesh(strutGeo, gearMaterial);
            rightStrut.position.set(0, -0.1 * sizeFactor, 0.4 * sizeFactor);
            
            // Wheels
            const wheelGeo = new THREE.CylinderGeometry(0.06 * sizeFactor, 0.06 * sizeFactor, 0.04 * sizeFactor, 16);
            const wheelMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                roughness: 0.8
            });
            
            const leftWheel = new THREE.Mesh(wheelGeo, wheelMaterial);
            leftWheel.rotation.x = Math.PI/2;
            leftWheel.position.set(0, -0.2 * sizeFactor, -0.4 * sizeFactor);
            
            const rightWheel = new THREE.Mesh(wheelGeo, wheelMaterial);
            rightWheel.rotation.x = Math.PI/2;
            rightWheel.position.set(0, -0.2 * sizeFactor, 0.4 * sizeFactor);
            
            mainGearGroup.add(leftStrut, rightStrut, leftWheel, rightWheel);
            aircraftGroup.add(mainGearGroup);
            
            // Tail wheel
            const tailWheelGroup = new THREE.Group();
            
            const tailStrutGeo = new THREE.CylinderGeometry(0.01 * sizeFactor, 0.01 * sizeFactor, 0.1 * sizeFactor, 8);
            const tailStrut = new THREE.Mesh(tailStrutGeo, gearMaterial);
            tailStrut.position.set(-0.8 * sizeFactor, -0.05 * sizeFactor, 0);
            
            const tailWheelGeo = new THREE.CylinderGeometry(0.03 * sizeFactor, 0.03 * sizeFactor, 0.02 * sizeFactor, 16);
            const tailWheel = new THREE.Mesh(tailWheelGeo, wheelMaterial);
            tailWheel.rotation.x = Math.PI/2;
            tailWheel.position.set(-0.8 * sizeFactor, -0.1 * sizeFactor, 0);
            
            tailWheelGroup.add(tailStrut, tailWheel);
            aircraftGroup.add(tailWheelGroup);
            
            // Cockpit canopy
            const canopyShape = new THREE.Shape();
            const canopyLength = 0.4 * sizeFactor;
            const canopyHeight = 0.15 * sizeFactor;
            
            canopyShape.moveTo(0, 0);
            canopyShape.lineTo(canopyLength, 0);
            canopyShape.quadraticCurveTo(canopyLength, canopyHeight, canopyLength/2, canopyHeight);
            canopyShape.quadraticCurveTo(0, canopyHeight, 0, 0);
            
            const canopyExtrudeSettings = {
                steps: 1,
                depth: 0.2 * sizeFactor,
                bevelEnabled: true,
                bevelThickness: 0.01 * sizeFactor,
                bevelSize: 0.01 * sizeFactor,
                bevelSegments: 3
            };
            
            const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, canopyExtrudeSettings);
            const canopyMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x4477aa,
                metalness: 0.1,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            });
            
            const canopy = new THREE.Mesh(canopyGeo, canopyMaterial);
            canopy.position.set(0.1 * sizeFactor, 0.1 * sizeFactor, -0.1 * sizeFactor);
            aircraftGroup.add(canopy);
            
        } else if (wingType === 'flying') {
            // Create a flying wing
            
            // Wing body - more complex shape
            const wingGroup = new THREE.Group();
            
            // Create a more accurate swept wing shape
            const wingShape = new THREE.Shape();
            const wingSpan = 2 * sizeFactor;
            const rootChord = 0.8 * sizeFactor;
            const tipChord = 0.3 * sizeFactor;
            const sweepAngle = 0.4; // More sweep for flying wing
            
            // Wing outline
            wingShape.moveTo(-wingSpan/2, 0);
            wingShape.lineTo(-wingSpan/2 + (rootChord - tipChord) * sweepAngle, rootChord);
            wingShape.lineTo(wingSpan/2 - (rootChord - tipChord) * sweepAngle, rootChord);
            wingShape.lineTo(wingSpan/2, 0);
            wingShape.lineTo(-wingSpan/2, 0);
            
            // Extrude with airfoil profile
            const extrudeSettings = {
                steps: 1,
                depth: 0.08 * sizeFactor,
                bevelEnabled: true,
                bevelThickness: 0.02 * sizeFactor,
                bevelSize: 0.02 * sizeFactor,
                bevelSegments: 3
            };
            
            const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
            const wing = new THREE.Mesh(wingGeo, bodyMaterial);
            wingGroup.add(wing);
            
            // Elevons (control surfaces on trailing edge)
            const elevonGeo = new THREE.BoxGeometry(wingSpan * 0.4, 0.02 * sizeFactor, rootChord * 0.2);
            const leftElevon = new THREE.Mesh(elevonGeo, controlSurfaceMaterial);
            leftElevon.position.set(-wingSpan * 0.3, 0.04 * sizeFactor, rootChord * 0.9);
            leftElevon.rotation.x = 0.1; // Slightly deflected
            
            const rightElevon = new THREE.Mesh(elevonGeo, controlSurfaceMaterial);
            rightElevon.position.set(wingSpan * 0.3, 0.04 * sizeFactor, rootChord * 0.9);
            rightElevon.rotation.x = -0.1; // Deflected opposite direction
            
            wingGroup.add(leftElevon, rightElevon);
            
            // Winglets at tips
            const wingletShape = new THREE.Shape();
            wingletShape.moveTo(0, 0);
            wingletShape.lineTo(0.3 * sizeFactor, 0);
            wingletShape.lineTo(0, 0.2 * sizeFactor);
            wingletShape.lineTo(0, 0);
            
            const wingletExtrudeSettings = {
                steps: 1,
                depth: 0.03 * sizeFactor,
                bevelEnabled: true,
                bevelThickness: 0.01 * sizeFactor,
                bevelSize: 0.01 * sizeFactor,
                bevelSegments: 2
            };
            
            const wingletGeo = new THREE.ExtrudeGeometry(wingletShape, wingletExtrudeSettings);
            
            const leftWinglet = new THREE.Mesh(wingletGeo, bodyMaterial);
            leftWinglet.rotation.set(0, Math.PI/2, 0);
            leftWinglet.position.set(-wingSpan/2, 0, 0);
            
            const rightWinglet = new THREE.Mesh(wingletGeo, bodyMaterial);
            rightWinglet.rotation.set(0, -Math.PI/2, 0);
            rightWinglet.position.set(wingSpan/2, 0, 0);
            
            wingGroup.add(leftWinglet, rightWinglet);
            wingGroup.rotation.x = Math.PI/2;
            wingGroup.position.z = -rootChord/2;
            aircraftGroup.add(wingGroup);
            
            // Center body section with motor mount
            const bodyGeo = new THREE.BoxGeometry(0.2 * sizeFactor, 0.1 * sizeFactor, 0.4 * sizeFactor);
            const body = new THREE.Mesh(bodyGeo, bodyMaterial);
            body.position.set(0, 0, -0.1 * sizeFactor);
            aircraftGroup.add(body);
            
            // Motor and propeller
            const motorGroup = new THREE.Group();
            motorGroup.position.set(0, 0, -0.3 * sizeFactor);
            
            // Motor
            const motorGeo = new THREE.CylinderGeometry(0.06 * sizeFactor, 0.06 * sizeFactor, 0.12 * sizeFactor, 16);
            const motorMaterial = this.createMetallicMaterial(0x444444);
            const motor = new THREE.Mesh(motorGeo, motorMaterial);
            
            // Propeller with hub and blades
            const propGroup = new THREE.Group();
            propGroup.position.z = -0.1 * sizeFactor;
            
            // Propeller hub
            const hubGeo = new THREE.CylinderGeometry(0.02 * sizeFactor, 0.025 * sizeFactor, 0.04 * sizeFactor, 16);
            const hubMaterial = this.createMetallicMaterial(0x333333);
            const hub = new THREE.Mesh(hubGeo, hubMaterial);
            propGroup.add(hub);
            
            // Create propeller blades
            const bladeMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.2,
                roughness: 0.7,
                side: THREE.DoubleSide
            });
            
            const createPropBlade = (rotation) => {
                // Create airfoil-like blade shape
                const bladeShape = new THREE.Shape();
                const bladeLength = 0.4 * sizeFactor;
                const maxWidth = 0.06 * sizeFactor;
                
                bladeShape.moveTo(0, 0);
                bladeShape.quadraticCurveTo(bladeLength * 0.5, maxWidth * 1.5, bladeLength, maxWidth);
                bladeShape.lineTo(bladeLength, -maxWidth);
                bladeShape.quadraticCurveTo(bladeLength * 0.5, -maxWidth * 1.5, 0, 0);
                
                const bladeExtrudeSettings = {
                    steps: 1,
                    depth: 0.01 * sizeFactor,
                    bevelEnabled: true,
                    bevelThickness: 0.005 * sizeFactor,
                    bevelSize: 0.005 * sizeFactor,
                    bevelSegments: 3
                };
                
                const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, bladeExtrudeSettings);
                const blade = new THREE.Mesh(bladeGeo, bladeMaterial);
                blade.rotation.set(rotation, 0, 0);
                blade.position.z = 0.005 * sizeFactor;
                
                return blade;
            };
            
            // Create two blades for the propeller
            propGroup.add(createPropBlade(0));
            propGroup.add(createPropBlade(Math.PI));
            
            propGroup.userData.isClockwise = true;
            this.propellers.push(propGroup);
            
            motorGroup.add(motor, propGroup);
            aircraftGroup.add(motorGroup);
            
            // Battery compartment
            const batteryGeo = new THREE.BoxGeometry(0.18 * sizeFactor, 0.08 * sizeFactor, 0.25 * sizeFactor);
            const batteryMaterial = new THREE.MeshStandardMaterial({
                color: 0x005500,
                roughness: 0.7
            });
            const batteryBox = new THREE.Mesh(batteryGeo, batteryMaterial);
            batteryBox.position.set(0, 0.05 * sizeFactor, 0.05 * sizeFactor);
            aircraftGroup.add(batteryBox);
            
            // Electronics bay cover (canopy)
            const canopyGeo = new THREE.CapsuleGeometry(0.08 * sizeFactor, 0.2 * sizeFactor, 4, 8);
            const canopyMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x4477aa,
                metalness: 0.1,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            });
            const canopy = new THREE.Mesh(canopyGeo, canopyMaterial);
            canopy.rotation.z = Math.PI/2;
            canopy.position.set(0, 0.05 * sizeFactor, -0.1 * sizeFactor);
            aircraftGroup.add(canopy);
            
        } else if (wingType === 'delta') {
            // Create a delta wing
            
            // Delta wing shape
            const deltaGroup = new THREE.Group();
            
            // Create delta wing shape (triangular)
            const wingShape = new THREE.Shape();
            const wingSpan = 1.6 * sizeFactor;
            const rootChord = 1.2 * sizeFactor;
            
            wingShape.moveTo(0, 0);
            wingShape.lineTo(-wingSpan/2, rootChord);
            wingShape.lineTo(wingSpan/2, rootChord);
            wingShape.lineTo(0, 0);
            
            // Extrude with airfoil profile
            const extrudeSettings = {
                steps: 1,
                depth: 0.06 * sizeFactor,
                bevelEnabled: true,
                bevelThickness: 0.02 * sizeFactor,
                bevelSize: 0.02 * sizeFactor,
                bevelSegments: 3
            };
            
            const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
            const wing = new THREE.Mesh(wingGeo, bodyMaterial);
            wing.rotation.x = -Math.PI/2;
            wing.position.z = -rootChord/2;
            deltaGroup.add(wing);
            
            // Elevons (control surfaces on trailing edge)
            const elevonGeo = new THREE.BoxGeometry(wingSpan * 0.8, 0.02 * sizeFactor, rootChord * 0.15);
            const elevons = new THREE.Mesh(elevonGeo, controlSurfaceMaterial);
            elevons.position.set(0, 0.03 * sizeFactor, rootChord/2);
            elevons.rotation.x = 0.1; // Slightly deflected
            deltaGroup.add(elevons);
            
            // Vertical fins at the wingtips
            const finShape = new THREE.Shape();
            finShape.moveTo(0, 0);
            finShape.lineTo(0.3 * sizeFactor, 0);
            finShape.lineTo(0.15 * sizeFactor, 0.2 * sizeFactor);
            finShape.lineTo(0, 0);
            
            const finExtrudeSettings = {
                steps: 1,
                depth: 0.02 * sizeFactor,
                bevelEnabled: true,
                bevelThickness: 0.005 * sizeFactor,
                bevelSize: 0.005 * sizeFactor,
                bevelSegments: 2
            };
            
            const finGeo = new THREE.ExtrudeGeometry(finShape, finExtrudeSettings);
            
            const leftFin = new THREE.Mesh(finGeo, bodyMaterial);
            leftFin.rotation.set(0, Math.PI/2, 0);
            leftFin.position.set(-wingSpan/2, 0.03 * sizeFactor, rootChord/2);
            
            const rightFin = new THREE.Mesh(finGeo, bodyMaterial);
            rightFin.rotation.set(0, -Math.PI/2, 0);
            rightFin.position.set(wingSpan/2, 0.03 * sizeFactor, rootChord/2);
            
            deltaGroup.add(leftFin, rightFin);
            
            // Cockpit/canopy
            const canopyShape = new THREE.Shape();
            const canopyLength = 0.4 * sizeFactor;
            const canopyWidth = 0.2 * sizeFactor;
            
            canopyShape.moveTo(0, 0);
            canopyShape.lineTo(0, canopyWidth);
            canopyShape.lineTo(canopyLength, canopyWidth/2);
            canopyShape.lineTo(0, 0);
            
            const canopyExtrudeSettings = {
                steps: 1,
                depth: 0.1 * sizeFactor,
                bevelEnabled: true,
                bevelThickness: 0.01 * sizeFactor,
                bevelSize: 0.01 * sizeFactor,
                bevelSegments: 3
            };
            
            const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, canopyExtrudeSettings);
            const canopyMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x4477aa,
                metalness: 0.1,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            });
            
            const canopy = new THREE.Mesh(canopyGeo, canopyMaterial);
            canopy.rotation.set(-Math.PI/2, 0, -Math.PI/2);
            canopy.position.set(0, 0.1 * sizeFactor, -rootChord/3);
            deltaGroup.add(canopy);
            
            aircraftGroup.add(deltaGroup);
            
            // Motor mount in the rear
            const motorMountGeo = new THREE.CylinderGeometry(0.08 * sizeFactor, 0.08 * sizeFactor, 0.1 * sizeFactor, 16);
            const motorMount = new THREE.Mesh(motorMountGeo, bodyMaterial);
            motorMount.rotation.x = Math.PI/2;
            motorMount.position.set(0, 0.1 * sizeFactor, rootChord/2);
            aircraftGroup.add(motorMount);
            
            // Motor and propeller
            const motorGroup = new THREE.Group();
            motorGroup.position.set(0, 0.1 * sizeFactor, rootChord/2 + 0.1 * sizeFactor);
            
            // Motor
            const motorGeo = new THREE.CylinderGeometry(0.06 * sizeFactor, 0.06 * sizeFactor, 0.15 * sizeFactor, 16);
            const motorMaterial = this.createMetallicMaterial(0x444444);
            const motor = new THREE.Mesh(motorGeo, motorMaterial);
            motor.rotation.x = Math.PI/2;
            
            // Propeller with hub and blades
            const propGroup = new THREE.Group();
            propGroup.position.z = 0.1 * sizeFactor;
            
            // Propeller hub
            const hubGeo = new THREE.CylinderGeometry(0.02 * sizeFactor, 0.025 * sizeFactor, 0.04 * sizeFactor, 16);
            const hubMaterial = this.createMetallicMaterial(0x333333);
            const hub = new THREE.Mesh(hubGeo, hubMaterial);
            hub.rotation.x = Math.PI/2;
            propGroup.add(hub);
            
            // Create propeller blades
            const bladeMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.2,
                roughness: 0.7,
                side: THREE.DoubleSide
            });
            
            const bladeLength = 0.5 * sizeFactor;
            const bladeWidth = 0.08 * sizeFactor;
            
            const blade1Geo = new THREE.BoxGeometry(bladeLength, 0.01 * sizeFactor, bladeWidth);
            const blade1 = new THREE.Mesh(blade1Geo, bladeMaterial);
            blade1.position.x = bladeLength/2;
            
            const blade2Geo = new THREE.BoxGeometry(bladeLength, 0.01 * sizeFactor, bladeWidth);
            const blade2 = new THREE.Mesh(blade2Geo, bladeMaterial);
            blade2.position.x = -bladeLength/2;
            blade2.rotation.x = Math.PI;
            
            propGroup.add(blade1, blade2);
            propGroup.userData.isClockwise = true;
            this.propellers.push(propGroup);
            
            motorGroup.add(motor, propGroup);
            aircraftGroup.add(motorGroup);
            
            // Landing skids
            const skidMaterial = this.createMetallicMaterial(0x333333);
            
            const leftSkidGeo = new THREE.CylinderGeometry(0.01 * sizeFactor, 0.01 * sizeFactor, 0.5 * sizeFactor, 8);
            const leftSkid = new THREE.Mesh(leftSkidGeo, skidMaterial);
            leftSkid.rotation.set(0, 0, Math.PI/2);
            leftSkid.position.set(-0.3 * sizeFactor, -0.06 * sizeFactor, 0);
            
            const rightSkidGeo = new THREE.CylinderGeometry(0.01 * sizeFactor, 0.01 * sizeFactor, 0.5 * sizeFactor, 8);
            const rightSkid = new THREE.Mesh(rightSkidGeo, skidMaterial);
            rightSkid.rotation.set(0, 0, Math.PI/2);
            rightSkid.position.set(0.3 * sizeFactor, -0.06 * sizeFactor, 0);
            
            aircraftGroup.add(leftSkid, rightSkid);
        }
        
        // Add common elements for all fixed-wing types
        
        // Add battery based on type
        const cellCount = parseInt(batteryType.replace('s', ''));
        const batteryLength = 0.3 * sizeFactor;
        const batteryWidth = 0.2 * sizeFactor;
        const batteryHeight = 0.04 * cellCount;
        
        const batteryGeo = new THREE.BoxGeometry(batteryLength, batteryHeight, batteryWidth);
        const batteryMaterial = new THREE.MeshPhongMaterial({
            color: 0x005500,
            specular: 0x333333,
            shininess: 30
        });
        const battery = new THREE.Mesh(batteryGeo, batteryMaterial);
        
        // Position battery based on wing type
        if (wingType === 'conventional') {
            battery.position.set(0.1 * sizeFactor, 0, 0);
        } else if (wingType === 'flying') {
            battery.position.set(0, 0.1 * sizeFactor, 0);
        } else { // delta
            battery.position.set(0, 0, -0.2 * sizeFactor);
        }
        
        aircraftGroup.add(battery);
        
        // Set the completed model
        this.currentModel = aircraftGroup;
        this.scene.add(aircraftGroup);
        
        // Adjust camera position based on aircraft size
        this.camera.position.set(2 * sizeFactor, 1.5 * sizeFactor, 2 * sizeFactor);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    }
}
