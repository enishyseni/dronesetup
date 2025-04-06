document.addEventListener('DOMContentLoaded', function() {
    // Initialize the calculator
    const calculator = new DroneCalculator();
    
    // Initialize 3D model renderer
    const modelRenderer = new DroneModelRenderer('model-container');
    
    // Get all configuration inputs
    const configInputs = document.querySelectorAll('.glass-select');
    const droneTypeToggle = document.getElementById('droneTypeToggle');
    const fixedWingOnlyElements = document.querySelectorAll('.fixed-wing-only');
    
    // Function to collect current configuration
    function getCurrentConfig() {
        const config = {};
        configInputs.forEach(input => {
            if (!input.parentElement.classList.contains('hidden')) {
                config[input.id] = input.value;
            }
        });
        return config;
    }
    
    // Function to update all result displays
    function updateResults() {
        const config = getCurrentConfig();
        const results = calculator.calculateAllMetrics(config);
        
        // Update result displays
        document.getElementById('totalWeight').textContent = results.totalWeight;
        document.getElementById('flightTime').textContent = results.flightTime;
        document.getElementById('payloadCapacity').textContent = results.payloadCapacity;
        document.getElementById('maxSpeed').textContent = results.maxSpeed;
        document.getElementById('powerToWeight').textContent = results.powerToWeight;
        
        // Update 3D model based on configuration
        modelRenderer.updateModelBasedOnConfig(config);
    }
    
    // Function to toggle between drone types
    function toggleDroneType() {
        const isFPV = !droneTypeToggle.checked;
        
        if (isFPV) {
            calculator.setDroneType('fpv');
            modelRenderer.setDroneType('fpv');
            fixedWingOnlyElements.forEach(el => el.classList.add('hidden'));
        } else {
            calculator.setDroneType('fixedWing');
            modelRenderer.setDroneType('fixedWing');
            fixedWingOnlyElements.forEach(el => el.classList.remove('hidden'));
        }
        
        updateResults();
    }
    
    // Event listeners for configuration changes
    configInputs.forEach(input => {
        input.addEventListener('change', updateResults);
    });
    
    // Event listener for drone type toggle
    droneTypeToggle.addEventListener('change', toggleDroneType);
    
    // Initial update
    updateResults();
});
