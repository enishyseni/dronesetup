class DroneCalculator {
    constructor() {
        this.droneType = 'fpv'; // 'fpv' or 'fixedWing'
        this.apcPropData = null; // For future APC integration
        this.apcIntegration = null; // APC Integration instance
        this.apcEnabled = false; // Flag for APC integration status
        this.lastValidationErrors = [];
    }

    db() {
        return (typeof globalThis !== 'undefined' && globalThis.COMPONENT_DB) || null;
    }

    kv(config) {
        const database = this.db();
        if (database && typeof database.resolveKv === 'function') {
            return database.resolveKv(config);
        }
        return parseFloat(config && config.motorKv);
    }

    chemistry(config) {
        const database = this.db();
        if (database && typeof database.parseChemistry === 'function') {
            return database.parseChemistry(config && config.batteryType);
        }
        return null;
    }

    setDroneType(type) {
        this.droneType = type;
    }

    validateConfig(config) {
        const errors = [];
        const requiredFields = ['batteryType', 'batteryCapacity'];
        const droneSpecificFields = {
            fpv: ['frameSize'],
            fixedWing: ['wingspan', 'wingType']
        };

        const allRequired = [...requiredFields, ...(droneSpecificFields[this.droneType] || [])];
        for (const field of allRequired) {
            if (!config || !config[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        const kvRating = this.kv(config);
        if (isNaN(kvRating) || kvRating < 400 || kvRating > 4500) {
            errors.push(`Invalid motor KV rating: ${config && config.motorKv}`);
        }

        if (!this.chemistry(config)) {
            errors.push(`Invalid battery type: ${config && config.batteryType}`);
        }

        this.lastValidationErrors = errors;
        if (errors.length) {
            errors.forEach((msg) => console.warn(msg));
            return false;
        }
        return true;
    }

    calculateFPVDroneWeight(config) {
        if (!this.validateConfig(config)) {
            return null;
        }
        return this.calculateAirframeWeight(config);
    }

    calculateFixedWingWeight(config) {
        if (!this.validateConfig(config)) {
            return null;
        }
        return this.calculateAirframeWeight(config);
    }

    calculateAirframeWeight(config) {
        const database = this.db();
        if (!database) return null;
        const parts = this.droneType === 'fpv'
            ? database.fpvBreakdown(config)
            : database.fwBreakdown(config);
        if (!parts) return null;
        const dryPlusPayload = database.sumBreakdown(parts);
        const override = parseFloat(config && config.auwOverride);
        if (override > 0) return override;
        return dryPlusPayload;
    }

    calculateFlightTime(config, totalWeight) {
        if (!totalWeight || totalWeight <= 0) return null;
        const chem = this.chemistry(config);
        if (!chem) return null;

        const hoverCurrent = this.calculateHoverCurrent(config, totalWeight);
        if (!hoverCurrent || hoverCurrent <= 0) return null;

        const database = this.db();
        const load = database
            ? database.missionLoadFactor(config.missionLoad || 'mixed', this.droneType)
            : 1.35;
        const usableAh = (parseInt(config.batteryCapacity, 10) / 1000) * chem.usableFraction;
        const avgCurrent = hoverCurrent * load;
        const minutes = (usableAh / avgCurrent) * 60;
        if (!isFinite(minutes) || minutes < 0) return null;
        return parseFloat(minutes.toFixed(2));
    }

    calculatePayloadCapacity(config, totalWeight) {
        // Calculate how much additional weight the drone can carry
        let maxTakeoffWeight;
        
        if (this.droneType === 'fpv') {
            // FPV drone thrust-to-weight calculation
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            const kvFactor = this.kv(config) / 1000;
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
        return parseFloat(Math.max(0, maxTakeoffWeight - totalWeight).toFixed(2));
    }

    calculateMaxSpeed(config) {
        // Updated speed calculation considering battery chemistry
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        
        // Li-ion has lower discharge rates, so less peak power
        const powerFactor = batteryType === 'lipo' ? 1.0 : 0.85;
        
        if (this.droneType === 'fpv') {
            const kvFactor = this.kv(config) / 1000;
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            
            // Larger frames/props have higher pitch speed
            const frameFactor = Math.sqrt(frameSize / 5);
            
            // Calculate rough max speed in km/h
            // A 5" 2400KV on 4S: 2.4 * 4 * 20 * 1.0 * 1.0 = 192 → reasonable for FPV
            return parseFloat((kvFactor * cellCount * 20 * frameFactor * powerFactor).toFixed(2));
        } else {
            const wingspan = parseInt(config.wingspan);
            const wingType = config.wingType;
            
            // Base speed depends on wing type
            const baseSpeed = {
                'conventional': 45,  // Conservative cruiser
                'flying': 55,        // Flying wings are faster
                'delta': 60          // Delta wings fastest
            }[wingType];
            
            // Larger wingspan = slower (more drag, optimized for efficiency)
            const sizeFactor = Math.pow(1000 / wingspan, 0.3);
            
            // Motor contribution (diminishing returns)
            const kvFactor = Math.pow(this.kv(config) / 2000, 0.5);
            
            // Cell count adds voltage → more speed, but sub-linear
            const voltageFactor = Math.pow(cellCount / 4, 0.6);
            
            return parseFloat((baseSpeed * sizeFactor * kvFactor * voltageFactor * powerFactor).toFixed(2));
        }
    }

    calculateElectricalPower(config, totalWeight) {
        const chem = this.chemistry(config);
        if (!chem || !totalWeight) return 0;
        const voltage = chem.cells * chem.nominalV;
        const hoverCurrent = this.calculateHoverCurrent(config, totalWeight);
        const database = this.db();
        const load = database
            ? database.missionLoadFactor(config.missionLoad || 'mixed', this.droneType)
            : 1.35;
        return voltage * hoverCurrent * load;
    }

    calculatePowerDensity(config, totalWeight) {
        const weightKg = totalWeight / 1000;
        if (!weightKg) return 0;
        return this.calculateElectricalPower(config, totalWeight) / weightKg;
    }

    calculateThrustToWeight(config, totalWeight) {
        if (!totalWeight) return 0;
        const perMotor = this.calculateThrust(config);
        const motors = this.droneType === 'fpv' ? 4 : 1;
        const totalThrust = perMotor * motors;
        return totalThrust / totalWeight;
    }

    calculatePowerToWeightRatio(config, totalWeight) {
        const tw = this.calculateThrustToWeight(config, totalWeight);
        return tw.toFixed(2) + ':1';
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
        const weight = this.droneType === 'fpv'
            ? this.calculateFPVDroneWeight(config)
            : this.calculateFixedWingWeight(config);
        const flightTime = this.calculateFlightTime(config, weight);
        if (flightTime == null) return 0;
        
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
        return parseFloat(Math.min(timeBasedRange, signalRange).toFixed(2));
    }

    calculateBatteryDischargeRate(config, totalWeight) {
        // Calculate the C rating required for the battery
        const batteryType = config.batteryType.split('-')[0];
        const capacityMah = parseInt(config.batteryCapacity);
        const capacity = capacityMah / 1000; // Convert to Ah
        
        let maxCurrentDraw;
        
        if (this.droneType === 'fpv') {
            const kvFactor = this.kv(config) / 1000;
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
            
            // Max current per motor scales with KV, prop size, and voltage
            // A 5" 2400KV on 4S draws ~30A burst per motor
            const maxCurrentPerMotor = kvFactor * frameSize * cellCount * 0.6;
            
            // Total max current (4 motors, ~75% simultaneous max is realistic)
            maxCurrentDraw = maxCurrentPerMotor * 3;
        } else {
            const kvFactor = this.kv(config) / 1000;
            const wingspan = parseInt(config.wingspan) / 1000;
            const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
            
            // Single motor fixed wing, full throttle burst
            maxCurrentDraw = kvFactor * wingspan * cellCount * 1.5;
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
        if (!totalWeight || totalWeight <= 0) return null;
        // Calculate current draw during hover (for FPV) or cruise (for fixed wing)
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
        const voltage = cellCount * cellVoltage;
        
        let hoverCurrent;
        
        if (this.droneType === 'fpv') {
            // Hover power: P_hover ≈ mg * sqrt(mg / (2 * rho * A))
            // Higher KV → motor runs faster for same thrust → draws more amps
            // Larger prop → more disc area → more efficient hover (less current)
            const kvFactor = this.kv(config) / 2400;
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            const propDiameter = frameSize * 0.0254; // inches to meters
            const discArea = Math.PI * Math.pow(propDiameter / 2, 2) * 4; // 4 props
            const weightN = (totalWeight / 1000) * 9.81; // weight in Newtons
            
            // Hover power from momentum theory: P = T * sqrt(T / (2 * rho * A))
            const rho = 1.225; // air density kg/m³
            const hoverPower = weightN * Math.sqrt(weightN / (2 * rho * discArea));
            
            // Account for motor+ESC+prop inefficiency (~50-60% overall)
            const systemEfficiency = 0.55;
            const electricalPower = hoverPower / systemEfficiency;
            
            // Higher KV motors are slightly less efficient at hover (optimized for speed)
            const kvEfficiencyPenalty = 0.85 + 0.15 * kvFactor;
            
            hoverCurrent = (electricalPower * kvEfficiencyPenalty) / voltage;
        } else {
            // For fixed wing, cruise current: need to overcome drag
            const wingspan = parseInt(config.wingspan) / 1000;
            const wingType = config.wingType;
            
            // Efficiency factor based on wing type (L/D ratio proxy)
            const efficiencyFactor = {
                'conventional': 1.0,
                'flying': 0.85,  // Flying wings have lower drag
                'delta': 0.95
            }[wingType];
            
            // Cruise power ≈ weight * cruise_speed / L_D_ratio
            // Simplified: P = mg * v_cruise / (L/D)
            // For a typical RC plane, L/D ~ 8-12, cruise ~ 15-25 m/s
            const wingArea = (wingspan * wingspan / 6); // rough AR-based area estimate in m²
            const wingLoading = (totalWeight / 1000) * 9.81 / wingArea;
            const cruiseSpeed = Math.sqrt(2 * wingLoading / (1.225 * 0.5)); // speed for Cl~0.5
            const liftToDrag = 8 * Math.sqrt(wingspan) * (1 / efficiencyFactor);
            const cruisePower = (totalWeight / 1000) * 9.81 * cruiseSpeed / liftToDrag;
            
            const systemEfficiency = 0.6;
            hoverCurrent = cruisePower / (systemEfficiency * voltage);
        }
        
        return parseFloat(hoverCurrent.toFixed(2));
    }

    /**
     * Enhanced thrust calculation that could integrate APC propeller data
     */
    calculateThrustAdvanced(config) {
        const motorKv = this.kv(config);
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
            const success = await this.apcIntegration.initialize('data/apc-lite.json');
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
        // Status updates handled by main.js showAPCStatus function
    }

    /**
     * Select optimal APC propeller (delegates to apcIntegration)
     */
    selectOptimalAPCPropeller(config) {
        if (!this.apcEnabled || !this.apcIntegration) return null;
        return this.apcIntegration.selectOptimalPropeller(config);
    }

    /**
     * Get propeller efficiency via APC integration
     */
    getPropellerEfficiency(config) {
        if (!this.apcEnabled || !this.apcIntegration) return null;
        return this.apcIntegration.getEfficiency(config);
    }

    /**
     * Get compatible propeller diameter range for a given frame/wingspan
     */
    getCompatiblePropRange(config) {
        if (this.droneType === 'fpv') {
            const ranges = {
                '3inch':  { min: 2.5, max: 3.5 },
                '5inch':  { min: 4.5, max: 5.5 },
                '7inch':  { min: 6.0, max: 7.5 },
                '10inch': { min: 8.0, max: 10.5 }
            };
            return ranges[config.frameSize] || ranges['5inch'];
        } else {
            const ranges = {
                '800':  { min: 6, max: 10 },
                '1000': { min: 7, max: 11 },
                '1500': { min: 8, max: 13 },
                '2000': { min: 9, max: 14 }
            };
            return ranges[config.wingspan] || ranges['1000'];
        }
    }

    /**
     * Get available APC propellers for current config (filtered by compatibility)
     */
    getAvailableAPCPropellers(config) {
        if (!this.apcEnabled || !this.apcIntegration) return [];
        const range = this.getCompatiblePropRange(config);
        const all = this.apcIntegration.database.getAllPropellers();
        return all.filter(p => p.diameter >= range.min && p.diameter <= range.max);
    }

    async calculateThrustWithAPC(config, throttlePercent = 100) {
        if (!this.apcEnabled || !this.apcIntegration) {
            return this.calculateThrust(config);
        }

        try {
            const propeller = this.getSelectedPropeller(config);
            if (!propeller) {
                return this.calculateThrust(config);
            }

            // Set the selected propeller in the integration so it uses this prop
            this.apcIntegration.selectedPropeller = propeller.id || propeller;

            const rpm = this.calculateMotorRPM(config) * (throttlePercent / 100);
            const thrustData = this.apcIntegration.database.interpolateThrust(
                this.apcIntegration.selectedPropeller, rpm, 0
            );
            
            // thrustData is in Newtons, convert to grams (1N ≈ 101.97g)
            return thrustData !== null ? thrustData * 101.97 : this.calculateThrust(config);
        } catch (error) {
            console.error('Error calculating thrust with APC:', error);
            return this.calculateThrust(config);
        }
    }

    calculatePowerWithAPC(config, throttlePercent = 100) {
        if (!this.apcEnabled || !this.apcIntegration) {
            return this.calculatePowerEstimate(config, throttlePercent);
        }

        try {
            const propeller = this.getSelectedPropeller(config);
            if (!propeller) {
                return this.calculatePowerEstimate(config, throttlePercent);
            }

            this.apcIntegration.selectedPropeller = propeller.id || propeller;

            const rpm = this.calculateMotorRPM(config) * (throttlePercent / 100);
            const powerData = this.apcIntegration.database.interpolatePower(
                this.apcIntegration.selectedPropeller, rpm, 0
            );
            
            return powerData !== null ? powerData : this.calculatePowerEstimate(config, throttlePercent);
        } catch (error) {
            console.error('Error calculating power with APC:', error);
            return this.calculatePowerEstimate(config, throttlePercent);
        }
    }

    /**
     * Estimate power consumption from config
     */
    calculatePowerEstimate(config, throttlePercent = 100) {
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
        const voltage = cellCount * cellVoltage;
        const current = this.calculateHoverCurrent(config, 
            this.droneType === 'fpv' ? this.calculateFPVDroneWeight(config) : this.calculateFixedWingWeight(config)
        );
        return voltage * current * (throttlePercent / 100);
    }

    getSelectedPropeller(config) {
        if (!this.apcEnabled || !this.apcIntegration) {
            return null;
        }

        // Check if manual propeller selection is enabled
        const propSelectionMode = config.propellerType || document.getElementById('propellerType')?.value || 'auto';
        
        if (propSelectionMode === 'manual') {
            const selectedProp = config.apcPropeller || document.getElementById('apcPropeller')?.value;
            if (selectedProp && this.apcIntegration) {
                const found = this.apcIntegration.database.findPropeller(selectedProp);
                return found;
            }
        }
        
        // Auto selection based on configuration
        if (this.apcIntegration && this.apcEnabled) {
            const optimal = this.apcIntegration.selectOptimalPropeller(config);
            return optimal;
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

    getComparisonData(config, metric, extraEnv) {
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
                    options = this.db() ? this.db().motorOptions(this.droneType) : ['1700', '2400', '2700', '3000'];
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
                case 'vtxPower':
                    options = ['25', '200', '600', '1000'];
                    break;
                case 'all':
                    // For 'all', default to batteryType comparison
                    options = ['lipo-3s', 'lipo-4s', 'lipo-6s', 'liion-3s', 'liion-4s', 'liion-6s'];
                    metric = 'batteryType';
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
                    if (weight == null || !isFinite(weight) || weight < 50 || weight > 8000) {
                        console.warn(`Unrealistic weight calculated: ${weight}g for ${option}`);
                        continue;
                    }
                    
                    const flightTime = this.calculateFlightTime(tempConfig, weight);
                    const hoverCurrent = this.calculateHoverCurrent(tempConfig, weight);
                    if (flightTime == null || hoverCurrent == null) continue;

                    const chem = this.chemistry(tempConfig);
                    const voltage = chem ? chem.cells * chem.nominalV : 14.8;
                    const energyWh = voltage * hoverCurrent * (flightTime / 60);
                    const rangeM = this.calculateRange(tempConfig);
                    const rangeKm = Math.max(rangeM / 1000, 0.001);
                    const env = extraEnv || null;
                    let row = {
                        option: option,
                        flightTime: parseFloat(flightTime.toFixed(2)),
                        maxSpeed: parseFloat(this.calculateMaxSpeed(tempConfig).toFixed(2)),
                        weight: parseFloat(weight.toFixed(2)),
                        payload: parseFloat(this.calculatePayloadCapacity(tempConfig, weight).toFixed(2)),
                        range: parseFloat(rangeM.toFixed(2)),
                        current: parseFloat(hoverCurrent.toFixed(2)),
                        efficiency: parseFloat((energyWh / rangeKm).toFixed(2)),
                        thrustToWeight: parseFloat(this.calculateThrustToWeight(tempConfig, weight).toFixed(2)),
                        powerDensity: parseFloat(this.calculatePowerDensity(tempConfig, weight).toFixed(1))
                    };
                    if (env) {
                        row = this.applyOperationalAdjustments(row, env);
                    }
                    results.push(row);
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
        const totalWeightRaw = this.droneType === 'fpv'
            ? this.calculateFPVDroneWeight(config)
            : this.calculateFixedWingWeight(config);

        if (totalWeightRaw == null || !isFinite(totalWeightRaw)) {
            return { error: (this.lastValidationErrors || []).join(' ') || 'Invalid configuration' };
        }

        const totalWeight = parseFloat(totalWeightRaw.toFixed(2));
        const flightTime = this.calculateFlightTime(config, totalWeight);
        const payloadCapacity = this.calculatePayloadCapacity(config, totalWeight);
        const maxSpeed = this.calculateMaxSpeed(config);
        const thrustToWeight = this.calculateThrustToWeight(config, totalWeight);
        const powerDensity = this.calculatePowerDensity(config, totalWeight);
        const range = this.calculateRange(config);
        const dischargeRate = this.calculateBatteryDischargeRate(config, totalWeight);
        const hoverCurrent = this.calculateHoverCurrent(config, totalWeight);

        return {
            totalWeight: totalWeight.toFixed(2) + 'g',
            flightTime: (flightTime == null ? '—' : flightTime.toFixed(2) + ' mins'),
            payloadCapacity: payloadCapacity.toFixed(2) + 'g',
            maxSpeed: maxSpeed.toFixed(2) + ' km/h',
            powerToWeight: thrustToWeight.toFixed(2) + ':1',
            powerDensity: powerDensity.toFixed(0) + ' W/kg',
            range: range.toFixed(2) + ' m',
            dischargeRate: dischargeRate,
            hoverCurrent: hoverCurrent.toFixed(2) + ' A'
        };
    }

    /**
     * Calculate motor RPM based on KV rating and battery voltage
     */
    calculateMotorRPM(config) {
        const kvRating = this.kv(config);
        const chem = this.chemistry(config);
        const nominalVoltage = chem ? chem.cells * chem.nominalV : 14.8;
        return kvRating * nominalVoltage;
    }
    
    /**
     * Calculate thrust based on motor/prop combination
     * T = Ct × ρ × n² × D⁴
     */
    calculateThrust(config) {
        const rpm = this.calculateMotorRPM(config);
        const airDensity = 1.225;
        const thrustCoefficient = 0.09;
        let propDiameter;
        if (this.droneType === 'fpv') {
            const propDiameters = {
                '3inch': 0.0762,
                '5inch': 0.127,
                '7inch': 0.1778,
                '10inch': 0.254
            };
            propDiameter = propDiameters[config.frameSize] || 0.127;
        } else {
            const spanM = (parseInt(config.wingspan, 10) || 1000) / 1000;
            propDiameter = Math.min(0.356, Math.max(0.152, spanM * 0.12));
        }
        const rps = rpm / 60;
        const thrust = thrustCoefficient * airDensity * Math.pow(rps, 2) * Math.pow(propDiameter, 4);
        return parseFloat((thrust * 102).toFixed(2));
    }
    
    /**
     * Calculate motor efficiency
     */
    calculateMotorEfficiency(config) {
        const kvRating = this.kv(config);
        let minKv;
        let maxKv;
        if (this.droneType === 'fpv') {
            const optimalKvRanges = {
                '3inch': [2500, 3000],
                '5inch': [2000, 2600],
                '7inch': [1600, 2200],
                '10inch': [1000, 1700]
            };
            [minKv, maxKv] = optimalKvRanges[config.frameSize] || optimalKvRanges['5inch'];
        } else {
            const span = parseInt(config.wingspan, 10) || 1000;
            [minKv, maxKv] = span >= 1500 ? [700, 1400] : [900, 1700];
        }
        if (kvRating < minKv) {
            return parseFloat(Math.max(40, 70 + (kvRating - minKv + 500) / 500 * 15).toFixed(2));
        }
        if (kvRating > maxKv) {
            return parseFloat(Math.max(40, 85 - (kvRating - maxKv) / 400 * 15).toFixed(2));
        }
        const rangeWidth = maxKv - minKv;
        const midpoint = minKv + rangeWidth / 2;
        const distanceFromMid = Math.abs(kvRating - midpoint);
        return parseFloat((95 - (distanceFromMid / (rangeWidth / 2)) * 10).toFixed(2));
    }
    
    /**
     * Recommended PIDs on Betaflight 4.x / EmuFlight scale.
     */
    calculateRecommendedPIDValues(config) {
        const frameSize = config.frameSize || '5inch';
        const motorKv = this.kv(config);
        const basePIDs = {
            '3inch': { P: 4.0, I: 0.045, D: 22, firmware: 'Betaflight 4.x' },
            '5inch': { P: 3.5, I: 0.035, D: 30, firmware: 'Betaflight 4.x' },
            '7inch': { P: 3.0, I: 0.030, D: 35, firmware: 'Betaflight 4.x' },
            '10inch': { P: 2.4, I: 0.025, D: 40, firmware: 'Betaflight 4.x' }
        };
        const pid = { ...(basePIDs[frameSize] || basePIDs['5inch']) };
        if (this.droneType !== 'fpv') {
            pid.P = 2.8;
            pid.I = 0.03;
            pid.D = 38;
            pid.firmware = 'INAV / Betaflight 4.x';
        } else if (motorKv > 2600) {
            pid.P *= 1.15;
        } else if (motorKv < 2000) {
            pid.P *= 0.85;
        }
        if (frameSize === '5inch' && motorKv > 2400) {
            pid.D *= 1.15;
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
    calculateThrustPhysics(thrustCoefficient, airDensity, rotationalSpeed, propDiameter) {
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
     * Calculate motor efficiency (physics formula)
     * η = (Mechanical power out ÷ Electrical power in) × 100%
     */
    calculateMotorEfficiencyPhysics(mechanicalPowerOut, electricalPowerIn) {
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

    applyOperationalAdjustments(baseMetrics, env) {
        const altitude = parseFloat(env && env.altitude) || 0;
        const temperature = env && env.temperature != null ? parseFloat(env.temperature) : 20;
        const wind = parseFloat(env && env.wind) || 0;
        const batteryHealth = env && env.batteryHealth != null ? parseFloat(env.batteryHealth) : 100;
        const batteryCycles = parseFloat(env && env.batteryCycles) || 0;
        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
        const airDensityFactor = Math.exp(-altitude / 8500);
        const tempFactor = temperature < 15
            ? (1 - (15 - temperature) * 0.005)
            : temperature > 30
                ? (1 - (temperature - 30) * 0.004)
                : 1;
        const cycleFactor = clamp(1 - batteryCycles * 0.0006, 0.7, 1);
        const healthFactor = clamp((batteryHealth / 100) * tempFactor * cycleFactor, 0.6, 1.05);
        const windFactor = clamp(1 - wind / 220, 0.5, 1);
        const liftFactor = Math.pow(airDensityFactor, 0.35);
        return {
            ...baseMetrics,
            flightTime: baseMetrics.flightTime * healthFactor * windFactor,
            maxSpeed: baseMetrics.maxSpeed * Math.pow(airDensityFactor, 0.25) * clamp(1 - wind / 260, 0.6, 1),
            payloadCapacity: (baseMetrics.payloadCapacity != null ? baseMetrics.payloadCapacity : baseMetrics.payload) * liftFactor,
            payload: (baseMetrics.payload != null ? baseMetrics.payload : baseMetrics.payloadCapacity) * liftFactor,
            range: baseMetrics.range * healthFactor * clamp(1 - wind / 180, 0.55, 1),
            hoverCurrent: baseMetrics.hoverCurrent
                ? baseMetrics.hoverCurrent / (healthFactor * liftFactor)
                : baseMetrics.current / (healthFactor * liftFactor),
            current: (baseMetrics.current || baseMetrics.hoverCurrent) / (healthFactor * liftFactor),
            powerToWeight: baseMetrics.powerToWeight != null
                ? baseMetrics.powerToWeight * liftFactor * healthFactor
                : baseMetrics.thrustToWeight,
            thrustToWeight: (baseMetrics.thrustToWeight || baseMetrics.powerToWeight || 0) * liftFactor * healthFactor,
            dischargeRate: (baseMetrics.dischargeRate || 0) / (healthFactor * liftFactor),
            envFactors: { airDensityFactor, tempFactor, cycleFactor, healthFactor, windFactor, liftFactor }
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DroneCalculator;
}
