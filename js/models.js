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
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        this.container.appendChild(this.renderer.domElement);
        
        // Add OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight2.position.set(-1, 0.5, -1);
        this.scene.add(directionalLight2);
        
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
        
        // Rotate model slightly
        if (this.currentModel) {
            this.currentModel.rotation.y += 0.005;
        }
        
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
        }
        
        // Create new model based on configuration
        this.createModel(config);
    }
    
    createModel(config = {}) {
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        if (this.droneType === 'fpv') {
            this.createFPVDroneModel(config);
        } else {
            this.createFixedWingModel(config);
        }
    }
    
    createFPVDroneModel(config = {}) {
        // Default values if not provided
        const frameSize = config.frameSize || '5inch';
        const sizeFactor = parseInt(frameSize.replace('inch', '')) / 5;
        
        // Create a group to hold all drone parts
        const droneGroup = new THREE.Group();
        
        // Create the main frame (center plate)
        const frameGeometry = new THREE.BoxGeometry(1 * sizeFactor, 0.1, 1 * sizeFactor);
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        droneGroup.add(frame);
        
        // Create four arms
        const armGeometry = new THREE.BoxGeometry(0.7 * sizeFactor, 0.1, 0.1);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        // Position the arms at 45-degree angles from the center
        for (let i = 0; i < 4; i++) {
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            arm.position.x = Math.cos(Math.PI / 4 + i * Math.PI / 2) * 0.5 * sizeFactor;
            arm.position.z = Math.sin(Math.PI / 4 + i * Math.PI / 2) * 0.5 * sizeFactor;
            arm.rotation.y = Math.PI / 4 + i * Math.PI / 2;
            droneGroup.add(arm);
            
            // Add motors at the end of each arm
            const motorGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.12, 16);
            const motorMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
            const motor = new THREE.Mesh(motorGeometry, motorMaterial);
            motor.position.x = Math.cos(Math.PI / 4 + i * Math.PI / 2) * 0.85 * sizeFactor;
            motor.position.z = Math.sin(Math.PI / 4 + i * Math.PI / 2) * 0.85 * sizeFactor;
            motor.position.y = 0.05;
            motor.rotation.x = Math.PI / 2;
            droneGroup.add(motor);
            
            // Add propellers
            const propGeometry = new THREE.BoxGeometry(0.6 * sizeFactor, 0.01, 0.05);
            const propMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
            const prop = new THREE.Mesh(propGeometry, propMaterial);
            prop.position.x = Math.cos(Math.PI / 4 + i * Math.PI / 2) * 0.85 * sizeFactor;
            prop.position.z = Math.sin(Math.PI / 4 + i * Math.PI / 2) * 0.85 * sizeFactor;
            prop.position.y = 0.12;
            droneGroup.add(prop);
        }
        
        // Add battery
        const batteryGeometry = new THREE.BoxGeometry(0.6 * sizeFactor, 0.1, 0.3 * sizeFactor);
        const batteryMaterial = new THREE.MeshPhongMaterial({ color: 0x005500 });
        const battery = new THREE.Mesh(batteryGeometry, batteryMaterial);
        battery.position.y = -0.1;
        droneGroup.add(battery);
        
        // Add camera
        const cameraGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const cameraMaterial = new THREE.MeshPhongMaterial({ color: 0x000055 });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.z = 0.45 * sizeFactor;
        camera.position.y = 0;
        droneGroup.add(camera);
        
        // Add camera tilt (for FPV)
        camera.rotation.x = -Math.PI / 6;
        
        // Set the completed model
        this.currentModel = droneGroup;
        this.scene.add(droneGroup);
        
        // Adjust camera position based on drone size
        this.camera.position.z = 3 * sizeFactor;
        this.controls.update();
    }
    
    createFixedWingModel(config = {}) {
        // Default values if not provided
        const wingspan = config.wingspan || '1000';
        const wingType = config.wingType || 'conventional';
        const sizeFactor = parseInt(wingspan) / 1000;
        
        // Create a group to hold all aircraft parts
        const aircraftGroup = new THREE.Group();
        
        if (wingType === 'conventional') {
            // Create a conventional fixed wing with fuselage and tail
            
            // Main wing
            const wingGeometry = new THREE.BoxGeometry(2 * sizeFactor, 0.05, 0.4 * sizeFactor);
            const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.position.y = 0;
            aircraftGroup.add(wing);
            
            // Fuselage
            const fuselageGeometry = new THREE.CylinderGeometry(0.1 * sizeFactor, 0.1 * sizeFactor, 1.6 * sizeFactor, 16);
            const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
            const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
            fuselage.rotation.z = Math.PI / 2;
            aircraftGroup.add(fuselage);
            
            // Horizontal stabilizer (tail)
            const hStabGeometry = new THREE.BoxGeometry(0.6 * sizeFactor, 0.03, 0.2 * sizeFactor);
            const hStabMaterial = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
            const hStab = new THREE.Mesh(hStabGeometry, hStabMaterial);
            hStab.position.x = -0.7 * sizeFactor;
            hStab.position.y = 0;
            aircraftGroup.add(hStab);
            
            // Vertical stabilizer
            const vStabGeometry = new THREE.BoxGeometry(0.3 * sizeFactor, 0.3 * sizeFactor, 0.03);
            const vStabMaterial = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
            const vStab = new THREE.Mesh(vStabGeometry, vStabMaterial);
            vStab.position.x = -0.7 * sizeFactor;
            vStab.position.y = 0.15 * sizeFactor;
            aircraftGroup.add(vStab);
            
            // Propeller
            const propellerGeometry = new THREE.BoxGeometry(0.05, 0.5 * sizeFactor, 0.05);
            const propellerMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
            const propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
            propeller.position.x = 0.8 * sizeFactor;
            aircraftGroup.add(propeller);
            
        } else if (wingType === 'flying') {
            // Create a flying wing (no fuselage/tail)
            
            // Main wing with sweep
            const wingShape = new THREE.Shape();
            wingShape.moveTo(-1 * sizeFactor, -0.6 * sizeFactor);
            wingShape.lineTo(1 * sizeFactor, -0.3 * sizeFactor);
            wingShape.lineTo(1 * sizeFactor, 0.3 * sizeFactor);
            wingShape.lineTo(-1 * sizeFactor, 0.6 * sizeFactor);
            wingShape.lineTo(-1 * sizeFactor, -0.6 * sizeFactor);
            
            const extrudeSettings = {
                depth: 0.05,
                bevelEnabled: false,
            };
            
            const wingGeometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
            const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.rotation.x = Math.PI / 2;
            wing.position.y = 0.025;
            aircraftGroup.add(wing);
            
            // Add a motor in the middle back
            const motorGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 16);
            const motorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
            const motor = new THREE.Mesh(motorGeometry, motorMaterial);
            motor.rotation.z = Math.PI / 2;
            motor.position.x = -0.8 * sizeFactor;
            aircraftGroup.add(motor);
            
            // Propeller
            const propellerGeometry = new THREE.BoxGeometry(0.05, 0.4 * sizeFactor, 0.05);
            const propellerMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
            const propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
            propeller.position.x = -0.9 * sizeFactor;
            aircraftGroup.add(propeller);
            
        } else if (wingType === 'delta') {
            // Create a delta wing
            
            const wingShape = new THREE.Shape();
            wingShape.moveTo(0, 0);
            wingShape.lineTo(-0.8 * sizeFactor, 0.8 * sizeFactor);
            wingShape.lineTo(0.8 * sizeFactor, 0.8 * sizeFactor);
            wingShape.lineTo(0, 0);
            
            const extrudeSettings = {
                depth: 0.05,
                bevelEnabled: false,
            };
            
            const wingGeometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
            const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.rotation.x = Math.PI / 2;
            wing.position.y = 0.025;
            wing.position.z = -0.4 * sizeFactor;
            aircraftGroup.add(wing);
            
            // Add vertical fins at the wingtips
            const finGeometry = new THREE.BoxGeometry(0.05, 0.15 * sizeFactor, 0.3 * sizeFactor);
            const finMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd });
            
            const leftFin = new THREE.Mesh(finGeometry, finMaterial);
            leftFin.position.x = -0.75 * sizeFactor;
            leftFin.position.y = 0.075 * sizeFactor;
            leftFin.position.z = 0.25 * sizeFactor;
            aircraftGroup.add(leftFin);
            
            const rightFin = new THREE.Mesh(finGeometry, finMaterial);
            rightFin.position.x = 0.75 * sizeFactor;
            rightFin.position.y = 0.075 * sizeFactor;
            rightFin.position.z = 0.25 * sizeFactor;
            aircraftGroup.add(rightFin);
            
            // Add a motor in the back
            const motorGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 16);
            const motorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
            const motor = new THREE.Mesh(motorGeometry, motorMaterial);
            motor.rotation.x = Math.PI / 2;
            motor.position.z = 0.3 * sizeFactor;
            motor.position.y = 0.075 * sizeFactor;
            aircraftGroup.add(motor);
            
            // Propeller
            const propellerGeometry = new THREE.BoxGeometry(0.4 * sizeFactor, 0.05, 0.05);
            const propellerMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
            const propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
            propeller.position.z = 0.4 * sizeFactor;
            propeller.position.y = 0.075 * sizeFactor;
            aircraftGroup.add(propeller);
        }
        
        // Set the completed model
        this.currentModel = aircraftGroup;
        this.scene.add(aircraftGroup);
        
        // Adjust camera position based on aircraft size
        this.camera.position.z = 3 * sizeFactor;
        this.controls.update();
    }
}
