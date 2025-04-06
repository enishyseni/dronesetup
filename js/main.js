document.addEventListener('DOMContentLoaded', function() {
    // Initialize the calculator
    const calculator = new DroneCalculator();
    
    // Initialize component analyzer
    const componentAnalyzer = new ComponentAnalyzer(calculator);
    
    // Initialize charts with analyzer
    const droneCharts = new DroneCharts(calculator, componentAnalyzer);
    droneCharts.initCharts();
    
    // Get all configuration inputs
    const configInputs = document.querySelectorAll('.glass-select');
    const configSliders = document.querySelectorAll('.config-slider');
    const droneTypeToggle = document.getElementById('droneTypeToggle');
    const fixedWingOnlyElements = document.querySelectorAll('.fixed-wing-only');
    
    // Config mapping for translating slider values to config values
    const sliderConfigMap = {
        batteryCapacity: ['1300', '1500', '2200', '3000', '4000', '5000'],
        batteryType: ['lipo-3s', 'lipo-4s', 'lipo-6s', 'liion-3s', 'liion-4s', 'liion-6s'],
        frameSize: ['3inch', '5inch', '7inch', '10inch'],
        wingspan: ['800', '1000', '1500', '2000'],
        motorKv: ['1700', '2400', '2700', '3000'],
        vtxPower: ['25', '200', '600', '1000']
    };
    
    // Initialize sliders based on current config values
    function initSliders() {
        configSliders.forEach(slider => {
            const configParam = slider.dataset.config;
            const configValue = document.getElementById(configParam).value;
            const valueIndex = sliderConfigMap[configParam].indexOf(configValue);
            slider.value = valueIndex >= 0 ? valueIndex : 0;
            
            // Add event listener for slider changes
            slider.addEventListener('input', handleSliderChange);
        });
    }
    
    // Update sliders for fixed wing / FPV switch
    function updateSlidersForDroneType() {
        const fpvSliders = document.querySelectorAll('.slider-container[data-target="frameSize"]');
        const fixedWingSliders = document.querySelectorAll('.slider-container[data-target="wingspan"]');
        
        if (calculator.droneType === 'fpv') {
            fpvSliders.forEach(slider => slider.classList.remove('hidden'));
            fixedWingSliders.forEach(slider => slider.classList.add('hidden'));
        } else {
            fpvSliders.forEach(slider => slider.classList.add('hidden'));
            fixedWingSliders.forEach(slider => slider.classList.remove('hidden'));
        }
    }
    
    // Handle slider changes
    function handleSliderChange(e) {
        const slider = e.target;
        const configParam = slider.dataset.config;
        const valueIndex = parseInt(slider.value);
        const configValue = sliderConfigMap[configParam][valueIndex];
        
        // Update the corresponding select element
        const selectElement = document.getElementById(configParam);
        if (selectElement) {
            selectElement.value = configValue;
            // Trigger change event to update calculations
            const event = new Event('change');
            selectElement.dispatchEvent(event);
        }
    }
    
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
        
        // Update component analysis section
        const analysis = componentAnalyzer.analyzeConfiguration(config);
        document.getElementById('heaviestComponent').textContent = analysis.heaviestComponent;
        document.getElementById('limitingFactor').textContent = analysis.limitingFactor;
        document.getElementById('suggestedImprovement').textContent = analysis.suggestedImprovement;
        
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
        
        // Also update the analyzer's drone type if needed
        componentAnalyzer.setDroneType && componentAnalyzer.setDroneType(calculator.droneType);
        
        // Update sliders for the current drone type
        updateSlidersForDroneType();
        
        updateResults();
    }
    
    // Event listeners for configuration changes
    configInputs.forEach(input => {
        input.addEventListener('change', function() {
            // Update the corresponding slider if it exists
            const slider = document.querySelector(`.config-slider[data-config="${this.id}"]`);
            if (slider) {
                const valueIndex = sliderConfigMap[this.id].indexOf(this.value);
                slider.value = valueIndex >= 0 ? valueIndex : 0;
            }
            
            updateResults();
            
            // When user changes a parameter, update charts to compare different values of that parameter
            droneCharts.updateCharts(getCurrentConfig(), this.id);
        });
    });
    
    // Event listener for drone type toggle
    droneTypeToggle.addEventListener('change', toggleDroneType);
    
    // Initialize sliders
    initSliders();
    
    // Update sliders for current drone type
    updateSlidersForDroneType();
    
    // Initial update
    updateResults();
});
