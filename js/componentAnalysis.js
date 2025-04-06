class ComponentAnalyzer {
    constructor(calculator) {
        this.calculator = calculator;
    }

    // Add a method to update the drone type if calculator changes it
    setDroneType(type) {
        this.droneType = type;
    }

    /**
     * Analyze weight distribution for each component
     */
    getWeightBreakdown(config) {
        const components = {};
        
        if (this.calculator.droneType === 'fpv') {
            // Frame weight
            const frameWeights = {
                '3inch': 80,
                '5inch': 120,
                '7inch': 180,
                '10inch': 250
            };
            components.frame = frameWeights[config.frameSize];
            
            // Motors weight
            const motorWeights = {
                '1700': 28,
                '2400': 32,
                '2700': 34,
                '3000': 36
            };
            components.motors = motorWeights[config.motorKv] * 4;
            
            // Battery weight
            const batteryType = config.batteryType;
            const batteryCapacity = config.batteryCapacity;
            
            const batteryWeightMap = {
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
            
            components.battery = batteryWeightMap[batteryType][batteryCapacity];
            
            // Flight Controller weight
            components.fc = config.flightController === 'f4' ? 10 : (config.flightController === 'f7' ? 12 : 14);
            
            // ESC weight
            components.esc = 15;
            
            // Camera weight
            components.camera = config.camera === 'analog' ? 20 : (config.camera === 'digital' ? 35 : 45);
            
            // VTX weight
            components.vtx = parseInt(config.vtxPower) / 100 + 8;
            
            // Receiver weight
            components.receiver = 5;
            
            // Props weight
            components.props = frameWeights[config.frameSize] / 30 * 4;
            
            // Wiring weight
            components.wiring = 15;
            
        } else {
            // Fixed wing weight analysis
            const wingspanWeights = {
                '800': 250,
                '1000': 350,
                '1500': 650,
                '2000': 950
            };
            
            const wingTypeMultipliers = {
                'conventional': 1.1,
                'flying': 0.9,
                'delta': 0.95
            };
            
            components.airframe = wingspanWeights[config.wingspan] * wingTypeMultipliers[config.wingType];
            
            // Motor weight
            const motorWeights = {
                '1700': 45,
                '2400': 40,
                '2700': 38,
                '3000': 35
            };
            components.motor = motorWeights[config.motorKv];
            
            // Battery weight (same as FPV drone)
            const batteryType = config.batteryType;
            const batteryCapacity = config.batteryCapacity;
            
            const batteryWeightMap = {
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
            
            components.battery = batteryWeightMap[batteryType][batteryCapacity];
            
            // Electronics weight (FC, receiver, ESC, servos combined)
            components.electronics = 80;
            
            // Camera weight
            components.camera = config.camera === 'analog' ? 20 : (config.camera === 'digital' ? 35 : 45);
            
            // VTX weight
            components.vtx = parseInt(config.vtxPower) / 100 + 8;
            
            // Propeller weight
            components.propeller = 15;
        }
        
        return components;
    }
    
    /**
     * Get the heaviest component
     */
    getHeaviestComponent(config) {
        const components = this.getWeightBreakdown(config);
        let heaviest = { name: '', weight: 0 };
        
        for (const [name, weight] of Object.entries(components)) {
            if (weight > heaviest.weight) {
                heaviest = { name, weight };
            }
        }
        
        // Format component name for display
        const formattedName = heaviest.name.charAt(0).toUpperCase() + heaviest.name.slice(1);
        return `${formattedName} (${heaviest.weight}g)`;
    }
    
    /**
     * Determine what's limiting the drone's performance
     */
    getLimitingFactor(config) {
        // Calculate weight first
        let totalWeight;
        if (this.calculator.droneType === 'fpv') {
            totalWeight = this.calculator.calculateFPVDroneWeight(config);
        } else {
            totalWeight = this.calculator.calculateFixedWingWeight(config);
        }
        
        // Get flight time
        const flightTime = this.calculator.calculateFlightTime(config, totalWeight);
        
        // Get battery details
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const capacity = parseInt(config.batteryCapacity);
        
        // Get thrust
        let thrustToWeight = 0;
        
        if (this.calculator.droneType === 'fpv') {
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            const kvFactor = parseInt(config.motorKv) / 1000;
            
            // Estimate thrust per motor
            const estimatedThrustPerMotor = frameSize * 100 * kvFactor * cellCount / 4;
            const totalThrust = estimatedThrustPerMotor * 4;
            
            thrustToWeight = totalThrust / totalWeight;
        } else {
            const wingspan = parseInt(config.wingspan);
            const wingType = config.wingType;
            
            // Estimate thrust for fixed wing
            const wingArea = (wingspan / 1000) * (wingspan / 3000);
            thrustToWeight = wingArea * 1000 / totalWeight; // Very simplified
        }
        
        // Calculate C-rating requirement
        const dischargeRate = this.calculator.calculateBatteryDischargeRate(config, totalWeight);
        const requiredCRating = parseInt(dischargeRate.split('C')[0]);
        
        // Determine the limiting factor
        const limitations = [];
        
        // Check for weight issues
        if (totalWeight > 1000 && this.calculator.droneType === 'fpv') {
            limitations.push({ factor: 'Weight', severity: (totalWeight - 1000) / 500 });
        }
        
        // Check for thrust issues
        if (thrustToWeight < 2 && this.calculator.droneType === 'fpv') {
            limitations.push({ factor: 'Thrust-to-weight ratio', severity: (2 - thrustToWeight) * 3 });
        } else if (thrustToWeight < 0.8 && this.calculator.droneType === 'fixedWing') {
            limitations.push({ factor: 'Thrust-to-weight ratio', severity: (0.8 - thrustToWeight) * 3 });
        }
        
        // Check for battery limitations
        if (flightTime < 5) {
            limitations.push({ factor: 'Battery capacity', severity: (5 - flightTime) / 2 });
        }
        
        // Check for discharge rate issues
        if ((batteryType === 'lipo' && requiredCRating > 50) || 
            (batteryType === 'liion' && requiredCRating > 7)) {
            const maxRating = batteryType === 'lipo' ? 50 : 7;
            limitations.push({ factor: 'Battery discharge rate', severity: (requiredCRating - maxRating) / 10 });
        }
        
        // Sort by severity and return the most limiting factor
        if (limitations.length > 0) {
            limitations.sort((a, b) => b.severity - a.severity);
            return limitations[0].factor;
        } else {
            return "Well balanced setup";
        }
    }
    
    /**
     * Generate a suggested improvement based on the current configuration
     */
    getSuggestedImprovement(config) {
        const limitingFactor = this.getLimitingFactor(config);
        
        switch (limitingFactor) {
            case 'Weight':
                if (this.calculator.droneType === 'fpv') {
                    return "Use a lighter frame or lower capacity battery";
                } else {
                    return "Reduce weight with lighter materials";
                }
            
            case 'Thrust-to-weight ratio':
                if (this.calculator.droneType === 'fpv') {
                    return "Use higher KV motors or larger propellers";
                } else {
                    return "Increase motor power or reduce weight";
                }
            
            case 'Battery capacity':
                const batteryType = config.batteryType.split('-')[0];
                if (batteryType === 'lipo') {
                    return "Increase battery capacity or switch to Li-Ion";
                } else {
                    return "Increase battery capacity";
                }
            
            case 'Battery discharge rate':
                const batteryChemistry = config.batteryType.split('-')[0];
                if (batteryChemistry === 'liion') {
                    return "Switch to LiPo for higher discharge rates";
                } else {
                    return "Use a higher C-rating battery";
                }
            
            default:
                return "No critical improvements needed";
        }
    }
    
    /**
     * Get thermal efficiency data
     */
    getThermalEfficiencyData(config) {
        // This would be a simplified model of thermal efficiency
        const kvRating = parseInt(config.motorKv);
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        
        // Higher KV motors generally run hotter
        const baseTemp = 30; // ambient temperature
        const kvTempIncrease = ((kvRating - 1500) / 1500) * 30;
        
        // Li-ion tends to run cooler than LiPo
        const batteryTempFactor = batteryType === 'lipo' ? 1.2 : 1.0;
        
        // Higher cell counts increase temperature
        const cellTempFactor = 1 + ((cellCount - 3) * 0.15);
        
        // Calculate motor temperatures at different throttle levels
        const throttleLevels = [0, 25, 50, 75, 100];
        return throttleLevels.map(throttle => {
            const loadFactor = Math.pow(throttle / 100, 2);
            const motorTemp = baseTemp + (kvTempIncrease * loadFactor * batteryTempFactor * cellTempFactor);
            return {
                throttle: throttle,
                temperature: Math.round(motorTemp)
            };
        });
    }
    
    /**
     * Get noise level data based on props and motors
     */
    getNoiseData(config) {
        const frameSize = this.calculator.droneType === 'fpv' ? 
            parseInt(config.frameSize.replace('inch', '')) : 
            parseInt(config.wingspan) / 100;
        
        const kvRating = parseInt(config.motorKv);
        
        // Base noise level in dB - bigger props are generally louder
        const baseNoise = 60 + (frameSize * 2);
        
        // Higher KV motors tend to be louder
        const kvNoiseFactor = 1 + ((kvRating - 1500) / 1500) * 0.5;
        
        // Calculate noise at different throttle levels
        const throttleLevels = [0, 25, 50, 75, 100];
        return throttleLevels.map(throttle => {
            // Noise scales non-linearly with throttle
            const throttleFactor = Math.pow(throttle / 100, 1.5);
            const noiseLevel = baseNoise * throttleFactor * kvNoiseFactor;
            return {
                throttle: throttle,
                noise: Math.round(noiseLevel)
            };
        });
    }
    
    /**
     * Get propeller efficiency data
     */
    getPropEfficiencyData(config) {
        // This would be based on prop size and pitch
        const frameSize = this.calculator.droneType === 'fpv' ? 
            parseInt(config.frameSize.replace('inch', '')) : 
            parseInt(config.wingspan) / 200;
            
        // Larger props are more efficient
        const baseEfficiency = 0.4 + (frameSize * 0.05);
        
        // Create efficiency curve across different throttle levels
        const throttleLevels = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        return throttleLevels.map(throttle => {
            // Propellers are most efficient at mid throttle
            const throttleFactor = 1 - Math.pow((throttle - 50) / 50, 2);
            const efficiency = baseEfficiency * throttleFactor;
            
            // Ensure exactly 1 decimal place by using a more robust approach
            return {
                throttle: throttle,
                efficiency: Number((Math.floor(efficiency * 10) / 10).toFixed(1))
            };
        });
    }
    
    /**
     * Get thrust curve data
     */
    getThrustCurveData(config) {
        const frameSize = this.calculator.droneType === 'fpv' ? 
            parseInt(config.frameSize.replace('inch', '')) : 
            parseInt(config.wingspan) / 200;
            
        const kvRating = parseInt(config.motorKv);
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        
        // Bigger props and higher KV generate more thrust
        const baseThrust = frameSize * 100 * (kvRating / 1500) * (cellCount / 4);
        
        // Thrust curve is non-linear with throttle
        const throttleLevels = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        return throttleLevels.map(throttle => {
            // Thrust increases with approximately square of throttle 
            // (simplified aerodynamic model)
            const thrustFactor = Math.pow(throttle / 100, 1.8);
            const thrust = baseThrust * thrustFactor;
            return {
                throttle: throttle,
                thrust: Math.round(thrust)
            };
        });
    }
    
    /**
     * Perform a full analysis of the current configuration
     */
    analyzeConfiguration(config) {
        const components = this.getWeightBreakdown(config);
        const heaviestComponent = this.getHeaviestComponent(config);
        const limitingFactor = this.getLimitingFactor(config);
        const suggestedImprovement = this.getSuggestedImprovement(config);
        
        // Get performance data for various charts
        const thermalData = this.getThermalEfficiencyData(config);
        const noiseData = this.getNoiseData(config);
        const propEfficiencyData = this.getPropEfficiencyData(config);
        const thrustCurveData = this.getThrustCurveData(config);
        
        return {
            components,
            heaviestComponent,
            limitingFactor,
            suggestedImprovement,
            thermalData,
            noiseData,
            propEfficiencyData,
            thrustCurveData
        };
    }

    /**
     * Calculate power system optimization parameters
     */
    getPowerSystemOptimization(config) {
        const totalWeight = this.calculator.calculateFPVDroneWeight(config);
        const thrust = this.calculator.calculateThrust(config);
        const hoverThrust = totalWeight * 9.81 / 4; // Divide by 4 motors, convert g to N
        
        // Optimal power calculations from README
        const optimalPowerMin = hoverThrust * 2.5;
        const optimalPowerMax = hoverThrust * 3.5;
        
        // Motor thermal modeling
        const thermalResistance = 8; // °C/W - typical for mini quad motors
        const motorEfficiency = this.calculator.calculateMotorEfficiency(config);
        const inputPower = thrust / 10; // Simplified power calculation in watts
        const powerLoss = inputPower * (1 - motorEfficiency/100);
        const tempRise = powerLoss * thermalResistance;
        
        return {
            optimalPowerMin,
            optimalPowerMax,
            currentPower: thrust / 10, // Simplified
            efficiency: motorEfficiency,
            thermalRise: tempRise
        };
    }
    
    /**
     * Calculate frame geometry effects
     */
    getFrameGeometryEffects(config) {
        const frameSize = config.frameSize;
        
        // Arm lengths based on frame size in mm
        const armLengths = {
            '3inch': 65,
            '5inch': 110,
            '7inch': 160,
            '10inch': 225
        };
        
        // Approximate stiffness (k) values
        const armStiffness = {
            '3inch': 75,
            '5inch': 60,
            '7inch': 45,
            '10inch': 30
        };
        
        // Calculate natural frequency: f = (1/2π) × √(k/m)
        const armLength = armLengths[frameSize];
        const stiffness = armStiffness[frameSize];
        const motorWeight = this.getComponentWeight('motor', config);
        const naturalFrequency = (1/(2 * Math.PI)) * Math.sqrt(stiffness/motorWeight) * 10;
        
        // X vs H configuration yaw authority calculation
        const xConfigYawAuthority = 1.0;
        const hConfigYawAuthority = 0.85; // 15% less yaw authority
        
        return {
            armLength,
            naturalFrequency,
            propwashResistance: naturalFrequency > 120 ? 'Good' : 'Moderate',
            xConfigYawBoost: `${Math.round((xConfigYawAuthority/hConfigYawAuthority - 1) * 100)}%`,
            cgToleranceLongitudinal: '±3mm',
            cgToleranceLateral: '±2mm'
        };
    }
    
    /**
     * Get component weight by type
     */
    getComponentWeight(type, config) {
        const components = this.getWeightBreakdown(config);
        
        switch(type) {
            case 'motor':
                return this.calculator.droneType === 'fpv' ? 
                    components.motors / 4 : // Divide by 4 for single motor weight
                    components.motor;
            default:
                return components[type] || 0;
        }
    }
    
    /**
     * Analyze radio system performance
     */
    getRadioSystemAnalysis(protocol, txPower) {
        const protocols = {
            'crsf': {
                latency: '4-6ms',
                refreshRate: '150/250/500Hz',
                resilience: 'Very High (FHSS)'
            },
            'elrs': {
                latency: '2-5ms', 
                refreshRate: '250/500/1000Hz',
                resilience: 'Extremely High (FHSS+TDMA)'
            },
            'frsky_d8': {
                latency: '18-22ms',
                refreshRate: '50Hz',
                resilience: 'Moderate (FHSS)'
            },
            'frsky_d16': {
                latency: '12-15ms',
                refreshRate: '100Hz',
                resilience: 'High (FHSS)'
            },
            'spektrum': {
                latency: '12-14ms',
                refreshRate: '91Hz',
                resilience: 'Moderate'
            }
        };
        
        // Link budget calculation (simplified)
        const txPowerDbm = 10 * Math.log10(txPower) + 30; // Convert mW to dBm
        const frequency = protocol === 'elrs' ? 2.4 : 0.9; // GHz - 2.4GHz or 900MHz
        const txGain = 2.15; // dBi
        const rxGain = 2.15; // dBi
        
        // Free space path loss calculation at 1km
        const distance = 1; // km
        const fspl = 20 * Math.log10(distance) + 20 * Math.log10(frequency * 1000) - 27.55;
        
        // Range estimation
        const rxSensitivity = -90; // dBm typical
        const linkBudget = txPowerDbm + txGain + rxGain - fspl;
        const margin = linkBudget - rxSensitivity;
        
        // Effective range (km) = 10^((margin)/20) assuming free space
        const effectiveRange = Math.pow(10, margin/20);
        
        return {
            ...protocols[protocol] || protocols['frsky_d16'],
            linkBudget: `${linkBudget.toFixed(1)} dBm`,
            theoreticalRange: `${effectiveRange.toFixed(1)} km`
        };
    }
}
