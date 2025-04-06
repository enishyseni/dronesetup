document.addEventListener('DOMContentLoaded', function() {
    // Initialize the calculator
    const calculator = new DroneCalculator();
    
    // Initialize charts
    const droneCharts = new DroneCharts(calculator);
    droneCharts.initCharts();
    
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
        document.getElementById('range').textContent = results.range;
        document.getElementById('dischargeRate').textContent = results.dischargeRate;
        document.getElementById('hoverCurrent').textContent = results.hoverCurrent;
        
        // Update charts - default to comparing battery types
        const chartMetric = calculator.droneType === 'fpv' ? 'batteryType' : 'batteryType';
        droneCharts.updateCharts(config, chartMetric);
    }
    
    // Function to toggle between drone types
    function toggleDroneType() {
        const isFPV = !droneTypeToggle.checked;
        
        if (isFPV) {
            calculator.setDroneType('fpv');
            fixedWingOnlyElements.forEach(el => el.classList.add('hidden'));
        } else {
            calculator.setDroneType('fixedWing');
            fixedWingOnlyElements.forEach(el => el.classList.remove('hidden'));
        }
        
        updateResults();
    }
    
    // Event listeners for configuration changes
    configInputs.forEach(input => {
        input.addEventListener('change', function() {
            updateResults();
            
            // When user changes a parameter, update charts to compare different values of that parameter
            droneCharts.updateCharts(getCurrentConfig(), this.id);
        });
    });
    
    // Event listener for drone type toggle
    droneTypeToggle.addEventListener('change', toggleDroneType);
    
    // Initial update
    updateResults();
});
