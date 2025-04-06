document.addEventListener('DOMContentLoaded', function() {
    // Initialize the calculator
    const calculator = new DroneCalculator();
    
    // Initialize component analyzer
    const componentAnalyzer = new ComponentAnalyzer(calculator);
    
    // Initialize charts with analyzer - SIMPLIFIED
    const droneCharts = new DroneCharts(calculator, componentAnalyzer);
    
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
        const metrics = calculator.calculateAllMetrics(config);
        
        // Update basic metrics that are likely to exist
        safelyUpdateElementText('totalWeight', `${metrics.totalWeight}`);
        safelyUpdateElementText('flightTime', `${metrics.flightTime}`);
        safelyUpdateElementText('maxSpeed', `${metrics.maxSpeed} km/h`);
        safelyUpdateElementText('pwr', `${metrics.powerToWeightRatio}`);
        safelyUpdateElementText('range', `${metrics.range}`);
        
        // Update advanced metrics only if enabled in the UI
        if (document.querySelector('.advanced-metrics')) {
            updateAdvancedMetrics(config);
        }
        
        // Update suggestion
        safelyUpdateElementText('suggestedImprovement', componentAnalyzer.getSuggestedImprovement(config));
    }
    
    // Helper function to safely update element text only if element exists
    function safelyUpdateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }
    
    // Previous updateElementText function is now just for logging
    function updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        } else {
            // Log warning to console but don't show to user
            console.debug(`Element with ID '${elementId}' not found in the DOM.`);
        }
    }
    
    // Function to update advanced metrics with null checks
    function updateAdvancedMetrics(config) {
        // Calculate motor RPM
        const rpm = calculator.calculateMotorRPM(config);
        safelyUpdateElementText('motorRPM', `${Math.round(rpm)} RPM`);
        
        // Calculate thrust
        const thrust = calculator.calculateThrust(config);
        safelyUpdateElementText('motorThrust', `${Math.round(thrust)}g`);
        
        // Calculate motor efficiency
        const efficiency = calculator.calculateMotorEfficiency(config);
        safelyUpdateElementText('motorEfficiency', `${Math.round(efficiency)}%`);
        
        // Calculate recommended PID values
        const pids = calculator.calculateRecommendedPIDValues(config);
        safelyUpdateElementText('recommendedP', Math.round(pids.P));
        safelyUpdateElementText('recommendedI', Math.round(pids.I));
        safelyUpdateElementText('recommendedD', Math.round(pids.D));
        
        // Get power system optimization data
        const powerSystem = componentAnalyzer.getPowerSystemOptimization(config);
        safelyUpdateElementText('powerEfficiency', `${Math.round(powerSystem.efficiency)}%`);
        safelyUpdateElementText('thermalRise', `${Math.round(powerSystem.thermalRise)}°C`);
        
        // Get frame geometry effects
        const frameGeometry = componentAnalyzer.getFrameGeometryEffects(config);
        safelyUpdateElementText('frameFrequency', `${Math.round(frameGeometry.naturalFrequency)} Hz`);
        safelyUpdateElementText('propwashResistance', frameGeometry.propwashResistance);
        
        // Get radio system analysis
        const radioProtocol = 'crsf';
        const txPower = 250; // mW
        const radioSystem = componentAnalyzer.getRadioSystemAnalysis(radioProtocol, txPower);
        safelyUpdateElementText('radioLatency', radioSystem.latency);
        safelyUpdateElementText('radioRange', radioSystem.theoreticalRange);
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
    
    // REVISED chart initialization with pre-loading data for comparison charts
    function initializeChartsWithData() {
        try {
            console.log("Initializing charts with data...");
            // First initialize the charts
            droneCharts.initCharts();
            
            // Get current configuration
            const config = getCurrentConfig();
            
            // Force data generation for all comparison metrics
            const comparisonMetrics = ['batteryType', 'batteryCapacity', 'motorKv', 'frameSize', 'wingspan'];
            
            // For each comparison metric, pre-generate the data
            comparisonMetrics.forEach(metric => {
                const comparisonData = calculator.getComparisonData(config, metric);
                console.log(`Pre-generating data for ${metric} comparison`);
                
                // Store the data in the charts object or directly update the charts
                if (droneCharts.preloadComparisonData) {
                    droneCharts.preloadComparisonData(metric, comparisonData);
                }
            });
            
            // Now trigger the actual chart update with this pre-loaded data
            console.log("Updating all charts with initial data");
            droneCharts.updateCharts(config, 'batteryCapacity'); // Use a specific parameter to ensure comparison views show data
            
            // Ensure specific graphs mentioned in the issues are properly initialized
            setTimeout(() => {
                console.log("Ensuring specific graphs are updated");
                // Force redraw of specific charts
                if (droneCharts.updateSpecificChart) {
                    const problematicCharts = ['maxSpeed', 'flightTime', 'range', 'current'];
                    problematicCharts.forEach(chartType => {
                        droneCharts.updateSpecificChart(chartType, config);
                    });
                } else {
                    // If no specific update method, just update all charts again
                    droneCharts.updateCharts(config, null);
                }
            }, 300);
            
            console.log("Charts initialized successfully");
        } catch (error) {
            console.error("Error initializing charts:", error);
        }
    }
    
    // Add a method to force redraw of all charts
    function forceChartRedraw() {
        // Get all chart canvases
        const chartCanvases = document.querySelectorAll('canvas[id$="Chart"]');
        console.log(`Found ${chartCanvases.length} chart canvases to redraw`);
        
        chartCanvases.forEach(canvas => {
            // Force a reflow/repaint of the canvas
            canvas.style.display = 'none';
            // Trigger reflow
            void canvas.offsetHeight;
            canvas.style.display = 'block';
        });
        
        // After forcing reflow, update all charts with current config
        const config = getCurrentConfig();
        droneCharts.updateCharts(config, null);
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
    
    // Initial setup and update - REVISED for better chart loading
    try {
        // Initialize sliders
        initSliders();
        
        // Update sliders for current drone type
        updateSlidersForDroneType();
        
        // Initial update of metrics
        updateResults();
        
        // Initialize charts with data after a delay to ensure DOM is ready
        setTimeout(() => {
            initializeChartsWithData();
            
            // Add a second forced redraw to handle edge cases
            setTimeout(forceChartRedraw, 1000);
        }, 300);
        
        // Log message to inform about advanced metrics
        console.info('Note: Some advanced metrics elements are not in the DOM. Add the HTML elements to display these values.');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
    
    // Improved tab button handling for charts
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // When any tab is clicked, do a complete chart refresh
                setTimeout(() => {
                    console.log("Tab clicked, doing complete chart refresh");
                    // Get current configuration
                    const config = getCurrentConfig();
                    
                    // Force a redraw of chart containers first
                    forceChartRedraw();
                    
                    // Then update all charts with current config
                    droneCharts.updateCharts(config, null);
                }, 100);
            });
        });
    }
    
    // Also ensure graphs load when window is resized
    window.addEventListener('resize', function() {
        // Debounce the resize event
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(function() {
            console.log("Window resized, refreshing charts");
            forceChartRedraw();
        }, 500);
    });
});
