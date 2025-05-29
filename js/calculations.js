class DroneCalculator {
    constructor() {
        this.droneType = 'fpv'; // 'fpv' or 'fixedWing'
        this.apcPropData = null; // For future APC integration
        this.apcIntegration = null; // APC Integration instance
        this.apcEnabled = false; // Flag for APC integration status
    }

    setDroneType(type) {
        this.droneType = type;
    }

    validateConfig(config) {
        const requiredFields = ['motorKv', 'batteryType', 'batteryCapacity'];
        const droneSpecificFields = {
            fpv: ['frameSize'],
            fixedWing: ['wingspan', 'wingType']
        };
        
        const allRequired = [...requiredFields, ...droneSpecificFields[this.droneType]];
        
        for (const field of allRequired) {
            if (!config[field]) {
                console.warn(`Missing required configuration field: ${field}`);
                return false;
            }
        }
        
        // Validate numeric values
        const kvRating = parseInt(config.motorKv);
        if (isNaN(kvRating) || kvRating < 1000 || kvRating > 4000) {
            console.warn(`Invalid motor KV rating: ${config.motorKv}`);
            return false;
        }
        
        return true;
    }

    calculateFPVDroneWeight(config) {
        if (!this.validateConfig(config)) {
            return 500; // Default fallback weight
        }
        
        // Basic weight calculations for FPV drone components
        const frameWeights = {
            '3inch': 80,
            '5inch': 120,
            '7inch': 180,
            '10inch': 250
        };

        const motorWeights = {
            '1700': 28,
            '2400': 32,
            '2700': 34,
            '3000': 36
        };

        // Updated battery weights for both LiPo and Li-Ion
        const batteryWeights = {
            'lipo-3s': {
                '1300': 150,
                '1500': 170,
                '2200': 230,
                '3000': 320,
                '4000': 410,
                '5000': 500
            },
            'lipo-4s': {
                '1300': 180,
                '1500': 200,
                '2200': 260,
                '3000': 350,
                '4000': 450,
                '5000': 550
            },
            'lipo-6s': {
                '1300': 230,
                '1500': 260,
                '2200': 320,
                '3000': 420,
                '4000': 530,
                '5000': 650
            },
            'liion-3s': {
                '1300': 180,
                '1500': 210,
                '2200': 280,
                '3000': 380,
                '4000': 490,
                '5000': 600
            },
            'liion-4s': {
                '1300': 220,
                '1500': 250,
                '2200': 320,
                '3000': 420,
                '4000': 540,
                '5000': 660
            },
            'liion-6s': {
                '1300': 290,
                '1500': 330,
                '2200': 410,
                '3000': 520,
                '4000': 650,
                '5000': 780
            }
        };

        const fcWeight = config.flightController === 'f4' ? 10 : (config.flightController === 'f7' ? 12 : 14);
        const escWeight = 15;
        const cameraWeight = config.camera === 'analog' ? 20 : (config.camera === 'digital' ? 35 : 45);
        const receiverWeight = 5;
        const vtxWeight = parseInt(config.vtxPower) / 100 + 8; // Higher power VTX weighs more
        const propWeight = frameWeights[config.frameSize] / 30; // Prop weight scales with frame size
        const wiringWeight = 15;
        
        // Calculate total weight
        const frameWeight = frameWeights[config.frameSize];
        const totalMotorWeight = motorWeights[config.motorKv] * 4; // Assuming quadcopter
        const batteryWeight = batteryWeights[config.batteryType][config.batteryCapacity];
        
        const totalWeight = frameWeight + totalMotorWeight + batteryWeight + fcWeight + 
                            escWeight + cameraWeight + receiverWeight + vtxWeight + 
                            (propWeight * 4) + wiringWeight;
        
        return totalWeight;
    }

    calculateFixedWingWeight(config) {
        const wingspanWeights = {
            '800': 250,
            '1000': 350,
            '1500': 650,
            '2000': 950
        };

        const wingTypeMultipliers = {
            'conventional': 1.1, // Conventional has tail, so slightly heavier
            'flying': 0.9,       // Flying wing is more efficient/lighter
            'delta': 0.95        // Delta is between conventional and flying wing
        };

        const motorWeights = {
            '1700': 45,
            '2400': 40,
            '2700': 38,
            '3000': 35
        };

        // Updated battery weights for both LiPo and Li-Ion
        const batteryWeights = {
            'lipo-3s': {
                '1300': 150,
                '1500': 170,
                '2200': 230,
                '3000': 320,
                '4000': 410,
                '5000': 500
            },
            'lipo-4s': {
                '1300': 180,
                '1500': 200,
                '2200': 260,
                '3000': 350,
                '4000': 450,
                '5000': 550
            },
            'lipo-6s': {
                '1300': 230,
                '1500': 260,
                '2200': 320,
                '3000': 420,
                '4000': 530,
                '5000': 650
            },
            'liion-3s': {
                '1300': 180,
                '1500': 210,
                '2200': 280,
                '3000': 380,
                '4000': 490,
                '5000': 600
            },
            'liion-4s': {
                '1300': 220,
                '1500': 250,
                '2200': 320,
                '3000': 420,
                '4000': 540,
                '5000': 660
            },
            'liion-6s': {
                '1300': 290,
                '1500': 330,
                '2200': 410,
                '3000': 520,
                '4000': 650,
                '5000': 780
            }
        };

        const baseWeight = wingspanWeights[config.wingspan] * wingTypeMultipliers[config.wingType];
        const motorWeight = motorWeights[config.motorKv];
        const batteryWeight = batteryWeights[config.batteryType][config.batteryCapacity];
        const electronicsWeight = 80; // FC, ESC, receiver, servos, etc.
        const cameraWeight = config.camera === 'analog' ? 20 : (config.camera === 'digital' ? 35 : 45);
        const vtxWeight = parseInt(config.vtxPower) / 100 + 8; // Higher power VTX weighs more

        return baseWeight + motorWeight + batteryWeight + electronicsWeight + cameraWeight + vtxWeight;
    }

    calculateFlightTime(config, totalWeight) {
        // Flight time calculation accounting for battery chemistry
        const capacityFactor = parseInt(config.batteryCapacity) / 1000; // Convert to Ah
        const batteryType = config.batteryType.split('-')[0]; // 'lipo' or 'liion'
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        
        // Energy density factor - Li-ion has better energy density
        const energyDensityFactor = batteryType === 'lipo' ? 1.0 : 1.3;
        
        // Nominal voltage per cell
        const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
        const voltage = cellCount * cellVoltage;
        
        let avgCurrent;

        if (this.droneType === 'fpv') {
            // FPV drones draw more current - Fixed the calculation to be more realistic
            const kvFactor = parseInt(config.motorKv) / 2400; // Normalized to a common KV
            // Li-ion can't handle as high discharge rates as LiPo
            const dischargeFactor = batteryType === 'lipo' ? 1.0 : 0.7;
            
            // Completely revised formula for more reasonable current draw
            avgCurrent = (totalWeight / 250) * kvFactor * dischargeFactor; // Much more realistic estimate
        } else {
            // Fixed wings are more efficient
            const dischargeFactor = batteryType === 'lipo' ? 1.0 : 0.8;
            // Revised formula for fixed wing
            avgCurrent = (totalWeight / 500) * 0.8 * dischargeFactor;
        }

        // Calculate flight time in minutes
        // Using a discharge factor (you don't fully discharge the battery)
        const dischargeSafety = batteryType === 'lipo' ? 0.8 : 0.9; // Li-ion can be discharged more deeply
        const calculatedTime = (capacityFactor / avgCurrent) * 60 * dischargeSafety * energyDensityFactor;
        
        // Add a minimum realistic flight time
        // Using safety bounds
        const boundedTime = Math.max(Math.min(calculatedTime, 60), 2); // Between 2-60 minutes
        return Math.round(boundedTime);
    }

    calculatePayloadCapacity(config, totalWeight) {
        // Calculate how much additional weight the drone can carry
        let maxTakeoffWeight;
        
        if (this.droneType === 'fpv') {
            // FPV drone thrust-to-weight calculation
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            const kvFactor = parseInt(config.motorKv) / 1000;
            const batteryType = config.batteryType.split('-')[0];
            const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
            
            // Li-ion has lower C-rating (discharge rate) so produces less peak power
            const batteryPowerFactor = batteryType === 'lipo' ? 1.0 : 0.7;
            
            // Estimate thrust for each motor
            const estimatedThrustPerMotor = frameSize * 100 * kvFactor * cellCount * batteryPowerFactor / 4;
            const totalThrust = estimatedThrustPerMotor * 4;
            
            // For safe flight, thrust-to-weight should be at least 2:1
            maxTakeoffWeight = totalThrust / 2;
        } else {
            // Fixed wing payload calculation
            const wingspan = parseInt(config.wingspan);
            const wingType = config.wingType;
            
            // Wing loading factor based on wing type
            const wingLoadingFactor = {
                'conventional': 1.0,
                'flying': 1.2,      // Flying wings can handle higher wing loading
                'delta': 1.1        // Delta wings are in between
            }[wingType];
            
            // Wing area rough estimate (very simplified)
            const wingArea = (wingspan / 1000) * (wingspan / 3000);
            
            // Max wing loading in g/dm²
            const maxWingLoading = 80 * wingLoadingFactor;
            
            maxTakeoffWeight = maxWingLoading * wingArea * 100;
        }
        
        // Payload capacity is max takeoff weight minus the drone's weight
        return Math.max(0, Math.round(maxTakeoffWeight - totalWeight));
    }

    calculateMaxSpeed(config) {
        // Updated speed calculation considering battery chemistry
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        
        // Li-ion has lower discharge rates, so less peak power
        const powerFactor = batteryType === 'lipo' ? 1.0 : 0.85;
        
        if (this.droneType === 'fpv') {
            const kvFactor = parseInt(config.motorKv) / 1000;
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            
            // Larger frames typically have higher top speeds due to larger props
            const frameFactor = Math.sqrt(frameSize / 5);
            
            // Calculate rough max speed in km/h
            return Math.round(kvFactor * cellCount * 20 * frameFactor * powerFactor);
        } else {
            const wingspan = parseInt(config.wingspan);
            const wingType = config.wingType;
            
            // Base speed depends on wing type
            const baseSpeed = {
                'conventional': 70,
                'flying': 85,
                'delta': 90
            }[wingType];
            
            // Size factor - smaller wings usually faster
            const sizeFactor = Math.pow(1000 / wingspan, 0.5);
            
            // Motor contribution
            const kvFactor = parseInt(config.motorKv) / 2000;
            
            return Math.round(baseSpeed * sizeFactor * kvFactor * cellCount * powerFactor);
        }
    }

    calculatePowerToWeightRatio(config, totalWeight) {
        // Calculate power to weight ratio
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        
        // Nominal voltage per cell
        const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
        const voltage = cellCount * cellVoltage;
        
        // Power factor based on battery chemistry
        const powerFactor = batteryType === 'lipo' ? 1.0 : 0.8;
        
        let power;
        
        if (this.droneType === 'fpv') {
            const kvFactor = parseInt(config.motorKv) / 1000;
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            
            // Estimate maximum current draw per motor
            const maxCurrentPerMotor = kvFactor * frameSize * 5 * powerFactor;
            
            // Total power (4 motors)
            power = voltage * maxCurrentPerMotor * 4;
        } else {
            const kvFactor = parseInt(config.motorKv) / 1000;
            const wingspan = parseInt(config.wingspan) / 1000;
            
            // Estimate maximum current draw
            const maxCurrent = kvFactor * wingspan * 15 * powerFactor;
            
            // Total power (single motor typically)
            power = voltage * maxCurrent;
        }
        
        // Convert weight to kg for power-to-weight calculation
        const weightKg = totalWeight / 1000;
        
        // Calculate power to weight ratio (W/kg)
        const ratio = power / weightKg;
        
        // Return a simplified ratio for display with 1 decimal place
        return (ratio / 100).toFixed(1) + ":1";
    }

    calculateRange(config) {
        // Calculate approximate range based on VTX power and terrain
        const vtxPower = parseInt(config.vtxPower);
        const camera = config.camera;
        
        // Base range in meters for a 25mW system in open terrain
        let baseRange = 500;
        
        // Power factor: higher power = longer range (not linear)
        const powerFactor = Math.sqrt(vtxPower / 25);
        
        // Digital systems have better range than analog
        const systemFactor = camera === 'analog' ? 1.0 : 
                            (camera === 'digital' ? 1.5 : 1.8); // 4K systems often have better antennas/reception
        
        // Flight time affects practical range
        const flightTime = this.calculateFlightTime(config, 
            this.droneType === 'fpv' ? 
            this.calculateFPVDroneWeight(config) : 
            this.calculateFixedWingWeight(config));
        
        // Speed affects how far you can get in the available time
        const maxSpeed = this.calculateMaxSpeed(config);
        
        // Fixed wings have better aerodynamic efficiency, so better range
        const aircraftFactor = this.droneType === 'fpv' ? 1.0 : 2.5;
        
        // Calculate practical range considering flight time and speed
        // Drone doesn't travel at max speed and needs to return, so divide by factors
        const timeBasedRange = (maxSpeed * 1000 / 3600) * (flightTime * 60) / 4;
        
        // Signal-based range
        const signalRange = baseRange * powerFactor * systemFactor * aircraftFactor;
        
        // The actual range is limited by the shorter of the two factors
        return Math.round(Math.min(timeBasedRange, signalRange));
    }

    calculateBatteryDischargeRate(config, totalWeight) {
        // Calculate the C rating required for the battery
        const batteryType = config.batteryType.split('-')[0];
        const capacityMah = parseInt(config.batteryCapacity);
        const capacity = capacityMah / 1000; // Convert to Ah
        
        let maxCurrentDraw;
        
        if (this.droneType === 'fpv') {
            const kvFactor = parseInt(config.motorKv) / 1000;
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
            
            // Revised formula for more realistic current demands
            // Estimate maximum current draw per motor during hard acceleration
            const maxCurrentPerMotor = kvFactor * frameSize * 0.6; // Reduced multiplier
            
            // Total maximum current (4 motors but not all at full power simultaneously)
            maxCurrentDraw = maxCurrentPerMotor * 3; // Changed from 4 to 3 to reflect real-world usage
        } else {
            const kvFactor = parseInt(config.motorKv) / 1000;
            const wingspan = parseInt(config.wingspan) / 1000;
            const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
            
            // Revised formula for fixed wing
            maxCurrentDraw = kvFactor * wingspan * 2; // Reduced multiplier
        }
        
        // Calculate the C rating (current / capacity)
        const cRating = maxCurrentDraw / capacity;
        
        // Round to nearest 5 for display
        const roundedCRating = Math.ceil(cRating / 5) * 5;
        
        // Updated maximum C-ratings for different battery chemistries
        const maxCRating = batteryType === 'lipo' ? 100 : 15; // Increased thresholds
        
        if (roundedCRating > maxCRating) {
            return roundedCRating + "C (Too high for " + (batteryType === 'lipo' ? "LiPo)" : "Li-Ion)");
        }
        
        return roundedCRating + "C";
    }

    calculateHoverCurrent(config, totalWeight) {
        // Calculate current draw during hover (for FPV) or cruise (for fixed wing)
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
        const voltage = cellCount * cellVoltage;
        
        let hoverCurrent;
        
        if (this.droneType === 'fpv') {
            // For a quadcopter to hover, it needs to produce enough thrust to counter gravity
            // A very rough estimate is that hover requires ~50% of max throttle
            const kvFactor = parseInt(config.motorKv) / 1000;
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            
            // Current per motor at hover (simplified)
            const currentPerMotor = (totalWeight / 1000) * 9.8 / 4 / (voltage * 0.7 * kvFactor * 0.05 * frameSize);
            
            // Total hover current
            hoverCurrent = currentPerMotor * 4;
        } else {
            // For fixed wing, cruise current is typically much lower than for a quad
            const wingspan = parseInt(config.wingspan) / 1000;
            const wingType = config.wingType;
            
            // Efficiency factor based on wing type
            const efficiencyFactor = {
                'conventional': 1.0,
                'flying': 0.9,
                'delta': 1.1
            }[wingType];
            
            // Very simplified cruise current calculation
            hoverCurrent = (totalWeight / 1000) * 9.8 / (voltage * 1.5 * wingspan * efficiencyFactor);
        }
        
        return parseFloat(hoverCurrent.toFixed(1));
    }

    /**
     * Enhanced thrust calculation that could integrate APC propeller data
     */
    calculateThrustAdvanced(config) {
        const motorKv = parseInt(config.motorKv);
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
        const voltage = cellCount * cellVoltage;
        
        // Calculate motor RPM
        const rpm = motorKv * voltage;
        
        // Get propeller specifications
        const propSpecs = this.getPropellerSpecs(config);
        
        // If APC data is available, use it for more accurate calculations
        if (this.apcPropData && propSpecs.apcEquivalent) {
            return this.calculateThrustFromAPC(rpm, propSpecs.apcEquivalent, 0); // 0 airspeed for static thrust
        }
        
        // Fallback to simplified calculation
        return this.calculateThrust(config);
    }

    /**
     * Get propeller specifications based on frame size
     */
    getPropellerSpecs(config) {
        const frameSize = config.frameSize;
        const propSpecs = {
            '3inch': {
                diameter: 3.0, // inches
                pitch: 3.0,
                apcEquivalent: '3x3' // Could map to APC prop
            },
            '5inch': {
                diameter: 5.0,
                pitch: 4.3,
                apcEquivalent: '5x4.3'
            },
            '7inch': {
                diameter: 7.0,
                pitch: 4.5,
                apcEquivalent: '7x4.5'
            },
            '10inch': {
                diameter: 10.0,
                pitch: 4.7,
                apcEquivalent: '10x4.7'
            }
        };
        
        return propSpecs[frameSize] || propSpecs['5inch'];
    }

    /**
     * Future method to integrate APC propeller data
     * This would use the interpolator files mentioned in APC-readme.md
     */
    calculateThrustFromAPC(rpm, propId, airspeed) {
        // Placeholder for APC integration
        // This would load the interpolator file for the specific prop
        // and return thrust based on RPM and airspeed
        
        if (!this.apcPropData || !this.apcPropData[propId]) {
            console.warn(`APC data not available for prop: ${propId}`);
            return null;
        }
        
        // Would implement interpolation here
        // return this.apcPropData[propId].interpolateThrust(rpm, airspeed);
        return null;
    }

    /**
     * Initialize APC Integration Framework
     */
    async initializeAPC() {
        try {
            if (!window.APCIntegration) {
                console.warn('APC Integration module not loaded');
                return false;
            }
            
            this.apcIntegration = new APCIntegration();
            const success = await this.apcIntegration.initialize('APC-Prop-DB.csv');
            this.apcEnabled = success;
            
            if (success) {
                console.log('APC Integration initialized successfully');
                // Update UI to show APC is available
                this.updateAPCStatus(true);
            } else {
                console.warn('Failed to initialize APC database');
                this.updateAPCStatus(false);
            }
            
            return success;
        } catch (error) {
            console.error('Error initializing APC integration:', error);
            this.apcEnabled = false;
            this.updateAPCStatus(false);
            return false;
        }
    }

    updateAPCStatus(isEnabled) {
        const statusElement = document.getElementById('apcStatus');
        if (statusElement) {
            statusElement.className = isEnabled ? 'apc-status apc-enabled' : 'apc-status apc-disabled';
            statusElement.textContent = isEnabled ? 'APC Database: Connected' : 'APC Database: Offline';
        }
    }

    async calculateThrustWithAPC(config, throttlePercent = 100) {
        if (!this.apcEnabled || !this.apcIntegration) {
            return this.calculateThrust(config, throttlePercent);
        }

        try {
            const propeller = this.getSelectedPropeller(config);
            if (!propeller) {
                return this.calculateThrust(config, throttlePercent);
            }

            const rpm = this.calculateRPM(config, throttlePercent);
            const thrustData = await this.apcIntegration.calculateThrust(propeller, rpm);
            
            return thrustData ? thrustData.thrust : this.calculateThrust(config, throttlePercent);
        } catch (error) {
            console.error('Error calculating thrust with APC:', error);
            return this.calculateThrust(config, throttlePercent);
        }
    }

    async calculatePowerWithAPC(config, throttlePercent = 100) {
        if (!this.apcEnabled || !this.apcIntegration) {
            return this.calculatePower(config, throttlePercent);
        }

        try {
            const propeller = this.getSelectedPropeller(config);
            if (!propeller) {
                return this.calculatePower(config, throttlePercent);
            }

            const rpm = this.calculateRPM(config, throttlePercent);
            const powerData = await this.apcIntegration.calculatePower(propeller, rpm);
            
            return powerData ? powerData.power : this.calculatePower(config, throttlePercent);
        } catch (error) {
            console.error('Error calculating power with APC:', error);
            return this.calculatePower(config, throttlePercent);
        }
    }

    getSelectedPropeller(config) {
        const propSelectionMode = document.getElementById('propellerSelectionMode')?.value || 'auto';
        
        if (propSelectionMode === 'manual') {
            const selectedProp = document.getElementById('apcPropellerSelect')?.value;
            if (selectedProp && this.apcIntegration) {
                return this.apcIntegration.database.findPropeller(selectedProp);
            }
        }
        
        // Auto selection based on configuration
        if (this.apcIntegration && this.apcEnabled) {
            return this.apcIntegration.selectOptimalPropeller(config);
        }
        
        return null;
    }

    generateAPCPerformanceData(config) {
        if (!this.apcEnabled || !this.apcIntegration) {
            return null;
        }

        try {
            const propeller = this.getSelectedPropeller(config);
            if (!propeller) {
                return null;
            }

            // Pass propeller ID to generatePerformanceData method
            const propId = propeller.id || propeller;
            return this.apcIntegration.generatePerformanceData(config, propId);
        } catch (error) {
            console.error('Error generating APC performance data:', error);
            return null;
        }
    }

    getComparisonData(config, metric) {
        if (!this.validateConfig(config)) {
            console.warn('Invalid configuration for comparison');
            return [];
        }

        try {
            const currentValue = config[metric];
            let options;
            
            switch(metric) {
                case 'batteryType':
                    if (this.droneType === 'fpv') {
                        options = ['lipo-3s', 'lipo-4s', 'lipo-6s', 'liion-3s', 'liion-4s', 'liion-6s'];
                    } else {
                        options = ['lipo-3s', 'lipo-4s', 'lipo-6s', 'liion-3s', 'liion-4s', 'liion-6s'];
                    }
                    break;
                case 'batteryCapacity':
                    options = ['1300', '1500', '2200', '3000', '4000', '5000'];
                    break;
                case 'motorKv':
                    options = ['1700', '2400', '2700', '3000'];
                    break;
                case 'frameSize':
                    if (this.droneType === 'fpv') {
                        options = ['3inch', '5inch', '7inch', '10inch'];
                    } else {
                        return null; // Not applicable for fixed wing
                    }
                    break;
                case 'wingspan':
                    if (this.droneType === 'fixedWing') {
                        options = ['800', '1000', '1500', '2000'];
                    } else {
                        return null; // Not applicable for FPV
                    }
                    break;
                default:
                    return null;
            }
            
            // Generate results for each option with error handling
            const results = [];
            for (const option of options) {
                try {
                    const tempConfig = {...config};
                    tempConfig[metric] = option;
                    
                    const weight = this.droneType === 'fpv' ? 
                        this.calculateFPVDroneWeight(tempConfig) : 
                        this.calculateFixedWingWeight(tempConfig);
                    
                    // Validate calculated weight
                    if (weight < 50 || weight > 5000) {
                        console.warn(`Unrealistic weight calculated: ${weight}g for ${option}`);
                        continue;
                    }
                    
                    const flightTime = this.calculateFlightTime(tempConfig, weight);
                    const hoverCurrent = this.calculateHoverCurrent(tempConfig, weight);
                    
                    // Ensure numeric precision
                    results.push({
                        option: option,
                        flightTime: Math.round(flightTime),
                        maxSpeed: Math.round(this.calculateMaxSpeed(tempConfig)),
                        weight: Math.round(weight),
                        payload: Math.round(this.calculatePayloadCapacity(tempConfig, weight)),
                        range: Math.round(this.calculateRange(tempConfig)),
                        current: parseFloat(hoverCurrent.toFixed(1)),
                        efficiency: parseFloat((weight / flightTime).toFixed(1))
                    });
                } catch (optionError) {
                    console.warn(`Error calculating for option ${option}:`, optionError);
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error generating comparison data:', error);
            return [];
        }
    }

    calculateAllMetrics(config) {
        let totalWeight;
        
        if (this.droneType === 'fpv') {
            totalWeight = this.calculateFPVDroneWeight(config);
        } else {
            totalWeight = this.calculateFixedWingWeight(config);
        }
        
        // Round totalWeight to a whole number
        totalWeight = Math.round(totalWeight);
        
        const flightTime = this.calculateFlightTime(config, totalWeight);
        const payloadCapacity = this.calculatePayloadCapacity(config, totalWeight);
        const maxSpeed = this.calculateMaxSpeed(config);
        const powerToWeight = this.calculatePowerToWeightRatio(config, totalWeight);
        const range = this.calculateRange(config);
        const dischargeRate = this.calculateBatteryDischargeRate(config, totalWeight);
        const hoverCurrent = this.calculateHoverCurrent(config, totalWeight);
        
        return {
            totalWeight: totalWeight + 'g',
            flightTime: flightTime + ' mins',
            payloadCapacity: payloadCapacity + 'g',
            maxSpeed: maxSpeed + ' km/h',
            powerToWeight: powerToWeight,
            range: range + ' m',
            dischargeRate: dischargeRate,
            hoverCurrent: hoverCurrent + ' A'
        };
    }

    /**
     * Calculate motor RPM based on KV rating and battery voltage
     */
    calculateMotorRPM(config) {
        const kvRating = parseInt(config.motorKv);
        const batteryType = config.batteryType;
        const cellCount = parseInt(batteryType.split('-')[1].replace('s', ''));
        const nominalVoltage = 3.7 * cellCount; // Nominal LiPo/Li-ion voltage
        
        return kvRating * nominalVoltage;
    }
    
    /**
     * Calculate thrust based on motor/prop combination
     * T = Ct × ρ × n² × D⁴
     */
    calculateThrust(config) {
        const rpm = this.calculateMotorRPM(config);
        
        // Constants and conversions
        const airDensity = 1.225; // kg/m³ at sea level
        const thrustCoefficient = 0.09; // Approximation - would be from prop data in reality
        
        // Map frame size to prop diameter in inches then convert to meters
        const propDiameters = {
            '3inch': 0.0762, // 3in to meters
            '5inch': 0.127,  // 5in to meters
            '7inch': 0.1778, // 7in to meters
            '10inch': 0.254  // 10in to meters
        };
        
        const propDiameter = propDiameters[config.frameSize];
        const rps = rpm / 60; // Convert RPM to revolutions per second
        
        // Calculate thrust in newtons
        const thrust = thrustCoefficient * airDensity * Math.pow(rps, 2) * Math.pow(propDiameter, 4);
        
        // Return thrust in grams (1N ≈ 102g)
        return thrust * 102;
    }
    
    /**
     * Calculate motor efficiency
     */
    calculateMotorEfficiency(config) {
        // This would require more data like current draw and power
        // Using simplified model based on motor KV and prop matching
        const kvRating = parseInt(config.motorKv);
        const frameSize = config.frameSize;
        
        // Optimal KV ranges for different frame sizes
        const optimalKvRanges = {
            '3inch': [2500, 3000],
            '5inch': [2000, 2600],
            '7inch': [1600, 2200],
            '10inch': [1000, 1700]
        };
        
        const [minKv, maxKv] = optimalKvRanges[frameSize];
        
        // Calculate efficiency as percentage of optimal range
        if (kvRating < minKv) {
            return 70 + (kvRating - minKv + 500) / 500 * 15; // Underpowered
        } else if (kvRating > maxKv) {
            return 85 - (kvRating - maxKv) / 400 * 15; // Overpowered
        } else {
            // Within optimal range
            const rangeWidth = maxKv - minKv;
            const midpoint = minKv + rangeWidth / 2;
            const distanceFromMid = Math.abs(kvRating - midpoint);
            return 95 - (distanceFromMid / (rangeWidth / 2)) * 10;
        }
    }
    
    /**
     * Calculate PID values based on frame size and motor KV
     */
    calculateRecommendedPIDValues(config) {
        const frameSize = config.frameSize;
        const motorKv = parseInt(config.motorKv);
        
        // Base PID values by frame size
        const basePIDs = {
            '3inch': { P: 40, I: 50, D: 25 },
            '5inch': { P: 45, I: 45, D: 25 },
            '7inch': { P: 38, I: 40, D: 22 },
            '10inch': { P: 30, I: 35, D: 18 }
        };
        
        const pid = {...basePIDs[frameSize]};
        
        // Adjust P based on motor KV (higher KV = more responsive = higher P)
        if (motorKv > 2600) {
            pid.P *= 1.15;
        } else if (motorKv < 2000) {
            pid.P *= 0.85;
        }
        
        // Adjust D based on frame size and motor KV
        if (frameSize === '5inch' && motorKv > 2400) {
            pid.D *= 1.2; // More dampening for high KV 5" builds
        }
        
        return pid;
    }
    
    /**
     * Calculate latency based on radio protocol
     */
    calculateControlLatency(protocol) {
        const protocolLatencies = {
            'crsf': 5,       // 4-6ms
            'elrs': 3.5,     // 2-5ms
            'frsky_d8': 20,  // 18-22ms
            'frsky_d16': 13, // 12-15ms
            'spektrum': 13   // 12-14ms
        };
        
        return protocolLatencies[protocol] || 15; // Default if unknown
    }

    // Add methods for calculations mentioned in README
    
    /**
     * Calculate motor max RPM based on KV rating and battery voltage
     * Formula: Max RPM = KV rating × Battery voltage
     */
    calculateMaxRPM(kvRating, batteryVoltage) {
        return kvRating * batteryVoltage;
    }
    
    /**
     * Calculate thrust using the thrust coefficient formula
     * T = Ct × ρ × n² × D⁴ (where Ct is thrust coefficient, ρ is air density, n is rotational speed, D is prop diameter)
     */
    calculateThrust(thrustCoefficient, airDensity, rotationalSpeed, propDiameter) {
        return thrustCoefficient * airDensity * Math.pow(rotationalSpeed, 2) * Math.pow(propDiameter, 4);
    }
    
    /**
     * Calculate efficiency
     * η = (Thrust² ÷ Power) × k (where k is prop constant)
     */
    calculateEfficiency(thrust, power, propConstant) {
        return (Math.pow(thrust, 2) / power) * propConstant;
    }
    
    /**
     * Calculate optimal RPM range
     * Optimal RPM range = 2300 × prop diameter in inches
     */
    calculateOptimalRPM(propDiameterInches) {
        return 2300 * propDiameterInches;
    }
    
    /**
     * Calculate current draw estimation
     * I = (Thrust × 3.5) ÷ Voltage
     */
    calculateCurrentDraw(thrust, voltage) {
        return (thrust * 3.5) / voltage;
    }
    
    /**
     * Calculate motor efficiency
     * η = (Mechanical power out ÷ Electrical power in) × 100%
     */
    calculateMotorEfficiency(mechanicalPowerOut, electricalPowerIn) {
        return (mechanicalPowerOut / electricalPowerIn) * 100;
    }
    
    /**
     * Calculate thermal modeling
     * T_rise = P_loss × R_thermal (°C)
     */
    calculateTemperatureRise(powerLoss, thermalResistance) {
        return powerLoss * thermalResistance;
    }
    
    /**
     * Calculate rates for flight dynamics
     * Max rotation rate = deg/sec = (RC_Rate × Super_Rate × 200)
     */
    calculateMaxRotationRate(rcRate, superRate) {
        return rcRate * superRate * 200;
    }
}
