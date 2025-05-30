class ComponentAnalyzer {
    constructor(calculator) {
        this.calculator = calculator;
        this.droneType = calculator ? calculator.droneType : 'fpv';
        
        // Enhanced thermal modeling constants
        this.thermalConstants = {
            motorThermalResistance: 8, // °C/W
            escThermalResistance: 12,  // °C/W
            ambientTemperature: 25,    // °C
            criticalTemperature: 85    // °C
        };
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
        
        // Use this.droneType directly instead of accessing through calculator
        if (this.droneType === 'fpv') {
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
        if (this.droneType === 'fpv') {
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
        
        if (this.droneType === 'fpv') {
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
                temperature: parseFloat(motorTemp.toFixed(2))
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
                noise: parseFloat(noiseLevel.toFixed(2))
            };
        });
    }
    
    /**
     * Get propeller efficiency data
     */
    getPropEfficiencyData(config) {
        const motorKv = parseInt(config.motorKv);
        const batteryVoltage = this.getBatteryVoltage(config);
        const propSize = parseFloat(config.frameSize || config.wingspan);
        
        // Calculate optimal RPM: Optimal RPM range = 2300 × prop diameter in inches
        const optimalRPM = 2300 * propSize;
        
        // Sample RPM range from 50% to 150% of optimal
        const rpmPoints = [0.5, 0.75, 1.0, 1.25, 1.5];
        
        // Propeller constant for efficiency calculation
        const propConstant = 0.12; // Example value
        
        return rpmPoints.map(factor => {
            const rpm = optimalRPM * factor;
            const throttlePercent = (rpm / (motorKv * batteryVoltage)) * 100;
            
            // Simplified thrust calculation
            const thrust = 0.5 * Math.pow(rpm/1000, 2) * propSize;
            
            // Simplified power calculation
            const power = throttlePercent/100 * batteryVoltage * (batteryVoltage/motorKv);
            
            // Efficiency: η = (Thrust² ÷ Power) × k
            const efficiency = (Math.pow(thrust, 2) / power) * propConstant;
            
            return {
                rpmFactor: factor.toFixed(2),
                rpm: rpm.toFixed(0),
                efficiency: Math.min(100, efficiency).toFixed(2)
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
                thrust: parseFloat(thrust.toFixed(2))
            };
        });
    }
    
    /**
     * Enhanced thermal analysis with multiple components
     */
    getThermalAnalysis(config) {
        const kvRating = parseInt(config.motorKv);
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const frameSize = config.frameSize;
        
        // Motor thermal analysis
        const motorAnalysis = this.getMotorThermalAnalysis(kvRating, batteryType, cellCount);
        
        // ESC thermal analysis
        const escAnalysis = this.getESCThermalAnalysis(config);
        
        // Battery thermal analysis
        const batteryAnalysis = this.getBatteryThermalAnalysis(config);
        
        // VTX thermal analysis
        const vtxAnalysis = this.getVTXThermalAnalysis(config);
        
        return {
            motor: motorAnalysis,
            esc: escAnalysis,
            battery: batteryAnalysis,
            vtx: vtxAnalysis,
            overallRisk: this.calculateOverallThermalRisk([motorAnalysis, escAnalysis, batteryAnalysis, vtxAnalysis])
        };
    }

    getMotorThermalAnalysis(kvRating, batteryType, cellCount) {
        const baseTemp = this.thermalConstants.ambientTemperature;
        
        // Higher KV motors generate more heat
        const kvHeatFactor = (kvRating - 1500) / 1500 * 0.4;
        
        // Battery type affects heat generation
        const batteryHeatFactor = batteryType === 'lipo' ? 1.0 : 0.8;
        
        // Cell count affects voltage and thus heat
        const voltageHeatFactor = (cellCount - 3) * 0.15;
        
        const throttleLevels = [0, 25, 50, 75, 100];
        const temperatures = throttleLevels.map(throttle => {
            const loadFactor = Math.pow(throttle / 100, 1.8);
            const heatGeneration = 15 * loadFactor * (1 + kvHeatFactor) * batteryHeatFactor * (1 + voltageHeatFactor);
            return baseTemp + heatGeneration;
        });
        
        return {
            temperatures,
            maxTemp: Math.max(...temperatures),
            riskLevel: this.getThermalRiskLevel(Math.max(...temperatures)),
            recommendations: this.getMotorCoolingRecommendations(Math.max(...temperatures), kvRating)
        };
    }

    getESCThermalAnalysis(config) {
        const current = this.calculator.calculateHoverCurrent(config, this.getTotalWeight(config));
        const maxCurrent = current * 2.5; // Estimate max current as 2.5x hover
        
        const baseTemp = this.thermalConstants.ambientTemperature;
        const powerLoss = maxCurrent * maxCurrent * 0.005; // Simplified resistance calculation
        const tempRise = powerLoss * this.thermalConstants.escThermalResistance;
        
        return {
            maxTemp: baseTemp + tempRise,
            powerLoss: powerLoss,
            riskLevel: this.getThermalRiskLevel(baseTemp + tempRise),
            recommendations: this.getESCCoolingRecommendations(baseTemp + tempRise)
        };
    }

    getBatteryThermalAnalysis(config) {
        const batteryType = config.batteryType.split('-')[0];
        const capacity = parseInt(config.batteryCapacity);
        const dischargeRate = this.calculator.calculateBatteryDischargeRate(config, this.getTotalWeight(config));
        const cRating = parseInt(dischargeRate.split('C')[0]);
        
        // Li-ion runs cooler than LiPo but has lower C-ratings
        const baseTempRise = batteryType === 'lipo' ? 
            cRating * 0.3 : // LiPo: 0.3°C per C
            cRating * 0.5;  // Li-ion: 0.5°C per C (higher because it's stressed more)
        
        const capacityFactor = Math.sqrt(capacity / 1500); // Larger batteries dissipate heat better
        const actualTempRise = baseTempRise / capacityFactor;
        
        return {
            maxTemp: this.thermalConstants.ambientTemperature + actualTempRise,
            cRating: cRating,
            riskLevel: this.getThermalRiskLevel(this.thermalConstants.ambientTemperature + actualTempRise),
            recommendations: this.getBatteryCoolingRecommendations(cRating, batteryType)
        };
    }

    getVTXThermalAnalysis(config) {
        const vtxPower = parseInt(config.vtxPower);
        const efficiency = 0.85; // Typical VTX efficiency
        const powerLoss = vtxPower * (1 - efficiency) / 1000; // Convert mW to W
        
        const tempRise = powerLoss * 25; // VTX thermal resistance ~25°C/W
        
        return {
            maxTemp: this.thermalConstants.ambientTemperature + tempRise,
            powerLoss: powerLoss,
            riskLevel: this.getThermalRiskLevel(this.thermalConstants.ambientTemperature + tempRise),
            recommendations: this.getVTXCoolingRecommendations(vtxPower)
        };
    }

    getThermalRiskLevel(temperature) {
        if (temperature > this.thermalConstants.criticalTemperature) return 'Critical';
        if (temperature > 70) return 'High';
        if (temperature > 55) return 'Medium';
        return 'Low';
    }

    getMotorCoolingRecommendations(maxTemp, kvRating) {
        const recommendations = [];
        
        if (maxTemp > 80) {
            recommendations.push('Consider lower KV motors or larger propellers');
            recommendations.push('Add motor heat sinks or cooling fans');
        }
        if (maxTemp > 70) {
            recommendations.push('Ensure adequate airflow around motors');
            if (kvRating > 2700) {
                recommendations.push('Consider reducing motor KV for better efficiency');
            }
        }
        if (maxTemp > 60) {
            recommendations.push('Monitor motor temperatures during long flights');
        }
        
        return recommendations.length > 0 ? recommendations : ['Thermal management adequate'];
    }

    getESCCoolingRecommendations(maxTemp) {
        const recommendations = [];
        
        if (maxTemp > 85) {
            recommendations.push('Add ESC heat sinks immediately');
            recommendations.push('Consider higher-rated ESCs');
        }
        if (maxTemp > 70) {
            recommendations.push('Ensure ESCs have adequate airflow');
            recommendations.push('Consider ESCs with better thermal design');
        }
        
        return recommendations.length > 0 ? recommendations : ['ESC thermal management adequate'];
    }

    getBatteryCoolingRecommendations(cRating, batteryType) {
        const recommendations = [];
        
        const maxSafeCRating = batteryType === 'lipo' ? 50 : 10;
        
        if (cRating > maxSafeCRating) {
            recommendations.push(`C-rating too high for ${batteryType.toUpperCase()}`);
            if (batteryType === 'liion') {
                recommendations.push('Consider switching to LiPo for high discharge applications');
            }
            recommendations.push('Increase battery capacity to reduce C-rating requirement');
        }
        if (cRating > maxSafeCRating * 0.8) {
            recommendations.push('Monitor battery temperature during flight');
            recommendations.push('Allow cooling time between flights');
        }
        
        return recommendations.length > 0 ? recommendations : ['Battery thermal management adequate'];
    }

    getVTXCoolingRecommendations(vtxPower) {
        const recommendations = [];
        
        if (vtxPower >= 1000) {
            recommendations.push('Mandatory heat sink for 1W+ VTX');
            recommendations.push('Ensure VTX has good airflow');
        }
        if (vtxPower >= 600) {
            recommendations.push('Consider heat sink for improved reliability');
        }
        
        return recommendations.length > 0 ? recommendations : ['VTX thermal management adequate'];
    }

    calculateOverallThermalRisk(analyses) {
        const riskLevels = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
        const maxRisk = Math.max(...analyses.map(a => riskLevels[a.riskLevel]));
        
        return Object.keys(riskLevels).find(key => riskLevels[key] === maxRisk);
    }

    /**
     * Perform a full analysis of the current configuration
     */
    analyzeConfiguration(config) {
        try {
            const components = this.getWeightBreakdown(config);
            const heaviestComponent = this.getHeaviestComponent(config);
            const limitingFactor = this.getLimitingFactor(config);
            const suggestedImprovement = this.getSuggestedImprovement(config);
            
            // Enhanced analyses
            const thermalAnalysis = this.getThermalAnalysis(config);
            const thermalData = this.getThermalEfficiencyData(config);
            const noiseData = this.getNoiseData(config);
            const propEfficiencyData = this.getPropEfficiencyData(config);
            const thrustCurveData = this.getThrustCurveData(config);
            
            return {
                components,
                heaviestComponent,
                limitingFactor,
                suggestedImprovement,
                thermalAnalysis,
                thermalData,
                noiseData,
                propEfficiencyData,
                thrustCurveData,
                overallScore: this.calculateOverallScore(config),
                optimizationSuggestions: this.getOptimizationSuggestions(config)
            };
        } catch (error) {
            console.error('Error analyzing configuration:', error);
            return {
                components: {},
                heaviestComponent: 'Analysis Error',
                limitingFactor: 'Analysis Error',
                suggestedImprovement: 'Please check configuration',
                thermalAnalysis: null,
                thermalData: [],
                noiseData: [],
                propEfficiencyData: [],
                thrustCurveData: [],
                overallScore: 0,
                optimizationSuggestions: ['Configuration analysis failed']
            };
        }
    }

    /**
     * Calculate overall configuration score (0-100)
     */
    calculateOverallScore(config) {
        try {
            const weight = this.getTotalWeight(config);
            const limitingFactor = this.getLimitingFactor(config);
            const thermalAnalysis = this.getThermalAnalysis(config);
            
            let score = 70; // Base score
            
            // Weight optimization (±15 points)
            const idealWeight = this.droneType === 'fpv' ? 550 : 800;
            const weightDiff = Math.abs(weight - idealWeight) / idealWeight;
            score += (1 - Math.min(weightDiff, 0.5)) * 15;
            
            // Limiting factor penalty (-10 to 0 points)
            if (limitingFactor !== 'Well balanced setup') {
                score -= 10;
            }
            
            // Thermal management (±15 points)
            const overallRisk = thermalAnalysis.overallRisk;
            const thermalScores = { 'Low': 15, 'Medium': 5, 'High': -5, 'Critical': -15 };
            score += thermalScores[overallRisk] || 0;
            
            return parseFloat(Math.max(0, Math.min(100, score)).toFixed(2));
        } catch (error) {
            console.error('Error calculating overall score:', error);
            return 50; // Default score on error
        }
    }

    /**
     * Get specific optimization suggestions
     */
    getOptimizationSuggestions(config) {
        const suggestions = [];
        
        try {
            const weight = this.getTotalWeight(config);
            const thermalAnalysis = this.getThermalAnalysis(config);
            
            // Weight-based suggestions
            if (this.droneType === 'fpv' && weight > 700) {
                suggestions.push('Consider lighter frame or smaller battery for better agility');
            }
            if (this.droneType === 'fpv' && weight < 400) {
                suggestions.push('Could handle larger battery for longer flight time');
            }
            
            // Thermal-based suggestions
            if (thermalAnalysis.overallRisk === 'High' || thermalAnalysis.overallRisk === 'Critical') {
                suggestions.push('Thermal management needs attention - see individual component recommendations');
            }
            
            // Performance optimization
            const kvRating = parseInt(config.motorKv);
            const frameSize = parseInt(config.frameSize?.replace('inch', '') || '5');
            
            if (kvRating > 2700 && frameSize >= 7) {
                suggestions.push('Lower KV motors recommended for larger props - better efficiency');
            }
            if (kvRating < 2000 && frameSize <= 5) {
                suggestions.push('Higher KV motors recommended for smaller props - better performance');
            }
            
            // Battery optimization
            const batteryType = config.batteryType;
            const capacity = parseInt(config.batteryCapacity);
            
            if (batteryType.includes('liion') && capacity < 2200) {
                suggestions.push('Li-ion benefits more apparent with higher capacities');
            }
            
            if (suggestions.length === 0) {
                suggestions.push('Configuration appears well optimized');
            }
            
        } catch (error) {
            console.error('Error generating optimization suggestions:', error);
            suggestions.push('Unable to generate optimization suggestions');
        }
        
        return suggestions;
    }

    /**
     * Get battery voltage based on configuration
     */
    getBatteryVoltage(config) {
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
        return cellCount * cellVoltage;
    }
    
    /**
     * Get total drone weight
     */
    getTotalWeight(config) {
        if (!this.calculator) {
            return 500; // Default fallback if calculator not available
        }
        
        return this.droneType === 'fpv' ? 
            this.calculator.calculateFPVDroneWeight(config) : 
            this.calculator.calculateFixedWingWeight(config);
    }

    /**
     * Get APC thrust curve data using real propeller performance data
     */
    getAPCThrustCurveData(config) {
        // Check if APC is available and enabled
        if (!this.calculator || !this.calculator.apcEnabled || !this.calculator.apcIntegration) {
            // Fallback to basic thrust curve calculation
            return this.getThrustCurveData(config);
        }

        try {
            // Generate APC performance data
            const apcPerformanceData = this.calculator.generateAPCPerformanceData(config);
            
            if (!apcPerformanceData || !apcPerformanceData.thrust || !apcPerformanceData.rpm) {
                // Fallback to basic calculation if APC data unavailable
                return this.getThrustCurveData(config);
            }

            // Convert RPM-based data to throttle-based data for charts
            const maxRPM = Math.max(...apcPerformanceData.rpm);
            const minRPM = Math.min(...apcPerformanceData.rpm);
            
            return apcPerformanceData.rpm.map((rpm, index) => {
                const throttlePercent = Math.round(((rpm - minRPM) / (maxRPM - minRPM)) * 100);
                // Convert thrust from Newtons to grams for UI compatibility
                const thrustGrams = apcPerformanceData.thrust[index] * 101.97; // N to grams conversion
                
                return {
                    throttle: throttlePercent,
                    thrust: parseFloat(thrustGrams.toFixed(2))
                };
            }).sort((a, b) => a.throttle - b.throttle);

        } catch (error) {
            console.error('Error generating APC thrust curve data:', error);
            // Fallback to basic calculation
            return this.getThrustCurveData(config);
        }
    }

    /**
     * Get APC propeller efficiency data using real performance data
     */
    getAPCPropEfficiencyData(config) {
        // Check if APC is available and enabled
        if (!this.calculator || !this.calculator.apcEnabled || !this.calculator.apcIntegration) {
            // Fallback to basic efficiency calculation
            return this.getPropEfficiencyData(config);
        }

        try {
            // Generate APC performance data
            const apcPerformanceData = this.calculator.generateAPCPerformanceData(config);
            
            if (!apcPerformanceData || !apcPerformanceData.efficiency || !apcPerformanceData.rpm) {
                // Fallback to basic calculation if APC data unavailable
                return this.getPropEfficiencyData(config);
            }

            return apcPerformanceData.rpm.map((rpm, index) => {
                const efficiency = apcPerformanceData.efficiency[index];
                
                return {
                    rpm: Math.round(rpm),
                    efficiency: parseFloat((efficiency * 100).toFixed(2)) // Convert to percentage
                };
            }).filter(point => point.efficiency > 0); // Remove invalid efficiency points

        } catch (error) {
            console.error('Error generating APC propeller efficiency data:', error);
            // Fallback to basic calculation
            return this.getPropEfficiencyData(config);
        }
    }

    /**
     * Get APC propeller analysis with detailed performance insights
     */
    getAPCPropellerAnalysis(config) {
        // Check if APC is available and enabled
        if (!this.calculator || !this.calculator.apcEnabled || !this.calculator.apcIntegration) {
            return {
                available: false,
                message: 'APC analysis not available - using estimated calculations',
                propeller: null,
                performance: null
            };
        }

        try {
            // Get selected propeller information
            const selectedProp = this.calculator.getSelectedPropeller(config);
            if (!selectedProp) {
                return {
                    available: false,
                    message: 'No suitable APC propeller found for this configuration',
                    propeller: null,
                    performance: null
                };
            }

            // Get performance data
            const performanceData = this.calculator.generateAPCPerformanceData(config);
            
            if (performanceData) {
                const maxThrust = Math.max(...performanceData.thrust);
                const maxEfficiency = Math.max(...performanceData.efficiency);
                const avgEfficiency = performanceData.efficiency.reduce((a, b) => a + b, 0) / performanceData.efficiency.length;

                return {
                    available: true,
                    message: 'Real APC propeller data available',
                    propeller: {
                        id: selectedProp.id || selectedProp,
                        diameter: selectedProp.diameter,
                        pitch: selectedProp.pitch
                    },
                    performance: {
                        maxThrust: parseFloat((maxThrust * 101.97).toFixed(2)), // Convert to grams
                        maxEfficiency: parseFloat((maxEfficiency * 100).toFixed(2)), // Convert to percentage
                        avgEfficiency: parseFloat((avgEfficiency * 100).toFixed(2)),
                        dataPoints: performanceData.rpm.length
                    }
                };
            }

            return {
                available: true,
                message: 'APC propeller selected but performance data unavailable',
                propeller: {
                    id: selectedProp.id || selectedProp,
                    diameter: selectedProp.diameter,
                    pitch: selectedProp.pitch
                },
                performance: null
            };

        } catch (error) {
            console.error('Error generating APC propeller analysis:', error);
            return {
                available: false,
                message: 'Error accessing APC propeller analysis',
                propeller: null,
                performance: null
            };
        }
    }

    /**
     * Get APC-based recommendations for propeller optimization
     */
    getAPCRecommendations(config) {
        const recommendations = [];

        // Check if APC is available and enabled
        if (!this.calculator || !this.calculator.apcEnabled || !this.calculator.apcIntegration) {
            recommendations.push({
                type: 'info',
                message: 'APC propeller database not available - recommendations based on estimated calculations'
            });
            return recommendations;
        }

        try {
            // Get available propellers for this configuration
            const availableProps = this.calculator.getAvailableAPCPropellers ? 
                this.calculator.getAvailableAPCPropellers(config) : [];

            if (availableProps.length === 0) {
                recommendations.push({
                    type: 'warning',
                    message: 'No APC propellers available for this frame size - consider adjusting configuration'
                });
                return recommendations;
            }

            // Get current propeller analysis
            const analysis = this.getAPCPropellerAnalysis(config);
            
            if (analysis.available && analysis.performance) {
                // Performance-based recommendations
                if (analysis.performance.maxEfficiency < 70) {
                    recommendations.push({
                        type: 'suggestion',
                        message: `Current propeller efficiency is ${analysis.performance.maxEfficiency}% - consider alternative propellers for better efficiency`
                    });
                }

                if (analysis.performance.avgEfficiency < 50) {
                    recommendations.push({
                        type: 'warning',
                        message: 'Average efficiency is low - check propeller selection and motor KV compatibility'
                    });
                }

                // Provide alternative propeller suggestions
                if (availableProps.length > 1) {
                    const alternatives = availableProps
                        .filter(prop => prop.id !== analysis.propeller.id)
                        .slice(0, 2);
                    
                    if (alternatives.length > 0) {
                        recommendations.push({
                            type: 'info',
                            message: `Alternative APC propellers available: ${alternatives.map(p => p.id).join(', ')}`
                        });
                    }
                }
            } else {
                recommendations.push({
                    type: 'info',
                    message: `${availableProps.length} APC propellers available for this configuration`
                });
            }

            // Configuration-specific recommendations
            const frameSize = parseInt(config.frameSize?.replace('inch', '') || '5');
            const motorKv = parseInt(config.motorKv);

            if (frameSize >= 7 && motorKv > 2500) {
                recommendations.push({
                    type: 'suggestion',
                    message: 'Large frame with high KV motor - consider lower KV for better efficiency with APC propellers'
                });
            }

            if (frameSize <= 3 && motorKv < 2000) {
                recommendations.push({
                    type: 'suggestion',
                    message: 'Small frame with low KV motor - consider higher KV for better performance with APC propellers'
                });
            }

        } catch (error) {
            console.error('Error generating APC recommendations:', error);
            recommendations.push({
                type: 'error',
                message: 'Unable to generate APC recommendations - check propeller data availability'
            });
        }

        return recommendations;
    }
}
