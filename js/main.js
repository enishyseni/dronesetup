document.addEventListener('DOMContentLoaded', function() {
    // Initialize the calculator with error handling
    let calculator, componentAnalyzer, droneCharts;
    
    try {
        calculator = new DroneCalculator();
        componentAnalyzer = new ComponentAnalyzer(calculator);
        droneCharts = new DroneCharts(calculator, componentAnalyzer);
        
        // Initialize APC Integration
        initializeAPCIntegration();
    } catch (error) {
        console.error('Failed to initialize calculators:', error);
        showUserError('Failed to initialize application. Please refresh the page.');
        return;
    }
    
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
    
    // Enhanced function to update results with error handling
    function updateResults() {
        try {
            const config = getCurrentConfig();
            
            // Validate configuration
            if (!calculator.validateConfig(config)) {
                showUserWarning('Invalid configuration detected. Please check your settings.');
                return;
            }
            
            // Calculate metrics using the already initialized calculator
            const metrics = calculator.calculateAllMetrics(config);
            
            // Use the existing analyzer instance that was properly initialized
            const analysisData = componentAnalyzer.analyzeConfiguration(config);
            
            // Update UI with calculations
            safelyUpdateElementText('heaviestComponent', analysisData.heaviestComponent);
            safelyUpdateElementText('limitingFactor', analysisData.limitingFactor);
            safelyUpdateElementText('suggestedImprovement', analysisData.suggestedImprovement);
            
            // Update overall score if element exists
            if (analysisData.overallScore !== undefined) {
                safelyUpdateElementText('overallScore', `${analysisData.overallScore}/100`);
            }
            
            // Update optimization suggestions
            if (analysisData.optimizationSuggestions && document.getElementById('optimizationSuggestions')) {
                const suggestionsElement = document.getElementById('optimizationSuggestions');
                suggestionsElement.innerHTML = analysisData.optimizationSuggestions
                    .map(suggestion => `<li>${suggestion}</li>`)
                    .join('');
            }
            
            // Update power system optimization details if these elements exist
            if (document.getElementById('optimalPowerBand')) {
                const powerSystemData = componentAnalyzer.getPowerSystemOptimization(config);
                document.getElementById('optimalPowerBand').textContent = 
                    `${powerSystemData.optimalPowerBand.min}W - ${powerSystemData.optimalPowerBand.max}W`;
            }
            
            if (document.getElementById('maxRPM')) {
                const motorKv = parseInt(config.motorKv);
                const batteryType = config.batteryType.split('-')[0];
                const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
                const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
                const batteryVoltage = cellCount * cellVoltage;
                const maxRPM = calculator.calculateMaxRPM(motorKv, batteryVoltage);
                document.getElementById('maxRPM').textContent = `${maxRPM.toFixed(0)} RPM`;
            }
            
            // Update basic metrics that are likely to exist
            safelyUpdateElementText('totalWeight', `${metrics.totalWeight}`);
            safelyUpdateElementText('flightTime', `${metrics.flightTime}`);
            safelyUpdateElementText('maxSpeed', `${metrics.maxSpeed}`);
            safelyUpdateElementText('pwr', `${metrics.powerToWeight}`);
            safelyUpdateElementText('range', `${metrics.range}`);
            safelyUpdateElementText('payloadCapacity', `${metrics.payloadCapacity}`);
            safelyUpdateElementText('dischargeRate', `${metrics.dischargeRate}`);
            safelyUpdateElementText('hoverCurrent', `${metrics.hoverCurrent}`);
            
            // Update advanced metrics only if enabled in the UI
            if (document.querySelector('.advanced-metrics')) {
                updateAdvancedMetrics(config);
            }
            
            // Update charts with current configuration
            // This ensures that APC propeller changes are reflected in the charts
            if (droneCharts && droneCharts.updateCharts) {
                droneCharts.updateCharts(config, null);
            }
        } catch (error) {
            console.error('Error updating results:', error);
            showUserError('Error calculating results. Please check your configuration.');
        }
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
    
    // Add user notification functions
    function showUserError(message) {
        createNotification(message, 'error');
    }
    
    function showUserWarning(message) {
        createNotification(message, 'warning');
    }
    
    function showUserInfo(message) {
        createNotification(message, 'info');
    }
    
    function createNotification(message, type) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
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
    
    // APC Propeller selection event listeners
    const propellerTypeSelect = document.getElementById('propellerType');
    const apcPropSelection = document.getElementById('apcPropSelection');
    const apcPropellerSelect = document.getElementById('apcPropeller');
    
    if (propellerTypeSelect) {
        propellerTypeSelect.addEventListener('change', function() {
            const isManual = this.value === 'manual';
            apcPropSelection.style.display = isManual ? 'block' : 'none';
            
            if (isManual && calculator.apcEnabled) {
                updateAPCPropellerList();
            }
            
            updateResults();
        });
    }
    
    if (apcPropellerSelect) {
        apcPropellerSelect.addEventListener('change', updateResults);
    }
    
    // APC Integration Functions
    async function initializeAPCIntegration() {
        try {
            console.log('Initializing APC Integration...');
            const success = await calculator.initializeAPC();
            
            if (success) {
                setupAPCEventHandlers();
                await updateAPCPropellerList();
                showAPCStatus(true);
                console.log('APC Integration ready');
            } else {
                showAPCStatus(false);
                console.warn('APC Integration failed to initialize');
            }
        } catch (error) {
            console.error('Error during APC initialization:', error);
            showAPCStatus(false);
        }
    }

    function setupAPCEventHandlers() {
        const propellerTypeSelect = document.getElementById('propellerType');
        const apcPropellerSelect = document.getElementById('apcPropeller');
        const apcPropSelection = document.getElementById('apcPropSelection');

        if (propellerTypeSelect) {
            propellerTypeSelect.addEventListener('change', function() {
                const isManual = this.value === 'manual';
                if (apcPropSelection) {
                    apcPropSelection.style.display = isManual ? 'block' : 'none';
                }
                
                // Update calculations when propeller selection mode changes
                updateResults();
            });
        }

        if (apcPropellerSelect) {
            apcPropellerSelect.addEventListener('change', function() {
                // Update calculations when specific propeller is selected
                updateResults();
            });
        }
    }

    async function updateAPCPropellerList() {
        const apcPropellerSelect = document.getElementById('apcPropeller');
        if (!apcPropellerSelect || !calculator.apcEnabled || !calculator.apcIntegration) {
            return;
        }

        try {
            const propellers = calculator.apcIntegration.database.getAllPropellers();
            apcPropellerSelect.innerHTML = '<option value="">Select Propeller...</option>';
            
            propellers.forEach(prop => {
                const option = document.createElement('option');
                option.value = prop.model;
                // More compact format for better sidebar fit
                option.textContent = `${prop.diameter}"×${prop.pitch}" ${prop.model}`;
                option.title = `${prop.diameter}" × ${prop.pitch}" - ${prop.model} (${prop.dataPointCount} data points)`; // Full info in tooltip
                apcPropellerSelect.appendChild(option);
            });
            
            console.log(`Loaded ${propellers.length} APC propellers`);
        } catch (error) {
            console.error('Error updating APC propeller list:', error);
            apcPropellerSelect.innerHTML = '<option value="">Error loading propellers</option>';
        }
    }

    function showAPCStatus(isEnabled) {
        const apcStatus = document.getElementById('apcStatus');
        if (apcStatus) {
            apcStatus.style.display = 'block';
            const statusText = apcStatus.querySelector('.status-text');
            const statusIcon = apcStatus.querySelector('.status-icon');
            
            if (isEnabled) {
                apcStatus.className = 'config-section apc-status-enabled';
                if (statusText) statusText.textContent = 'APC Database Active';
                if (statusIcon) statusIcon.textContent = '✅';
            } else {
                apcStatus.className = 'config-section apc-status-disabled';
                if (statusText) statusText.textContent = 'APC Database Offline';
                if (statusIcon) statusIcon.textContent = '❌';
            }
        }
    }
    
    // Enhanced initialization with better error handling
    try {
        // Initialize sliders
        initSliders();
        
        // Update sliders for current drone type
        updateSlidersForDroneType();
        
        // Initial update of metrics
        updateResults();
        
        // Initialize APC Integration Framework
        calculator.initializeAPC().then((success) => {
            if (success) {
                console.log('APC Integration Framework ready');
                showUserInfo('Enhanced APC propeller calculations available');
                
                // Show APC status indicator
                const apcStatus = document.getElementById('apcStatus');
                if (apcStatus) {
                    apcStatus.style.display = 'block';
                }
                
                // Update propeller list if manual selection is active
                const propellerType = document.getElementById('propellerType');
                if (propellerType && propellerType.value === 'manual') {
                    updateAPCPropellerList();
                }
                
                // Refresh charts with APC data
                updateResults();
                
            } else {
                console.log('APC data not available - using simplified calculations');
            }
        }).catch(() => {
            console.log('APC data not available - using simplified calculations');
        });
        
        // Try to load legacy calculator data if available
        // This is kept for backwards compatibility but APC integration is handled above
        
        // Initialize charts with data after a delay to ensure DOM is ready
        setTimeout(() => {
            try {
                initializeChartsWithData();
                
                // Add a second forced redraw to handle edge cases
                setTimeout(forceChartRedraw, 1000);
            } catch (chartError) {
                console.error('Chart initialization failed:', chartError);
                showUserWarning('Some charts may not display correctly');
            }
        }, 300);
        
        showUserInfo('Drone configuration tool loaded successfully');
        
    } catch (error) {
        console.error('Error during initialization:', error);
        showUserError('Application initialization failed. Some features may not work correctly.');
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
