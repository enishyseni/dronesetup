class DroneCalculator {
    constructor() {
        this.droneType = 'fpv'; // 'fpv' or 'fixedWing'
    }

    setDroneType(type) {
        this.droneType = type;
    }

    calculateFPVDroneWeight(config) {
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
            // FPV drones draw more current, especially with higher KV motors
            const kvFactor = parseInt(config.motorKv) / 1000;
            // Li-ion can't handle as high discharge rates as LiPo
            const dischargeFactor = batteryType === 'lipo' ? 1.0 : 0.7;
            avgCurrent = voltage * kvFactor * (totalWeight / 500) * dischargeFactor; // Rough estimate
        } else {
            // Fixed wings are more efficient
            const dischargeFactor = batteryType === 'lipo' ? 1.0 : 0.8;
            avgCurrent = voltage * 0.8 * (totalWeight / 800) * dischargeFactor;
        }

        // Calculate flight time in minutes
        // Using a discharge factor (you don't fully discharge the battery)
        const dischargeSafety = batteryType === 'lipo' ? 0.8 : 0.9; // Li-ion can be discharged more deeply
        return Math.round((capacityFactor / avgCurrent) * 60 * dischargeSafety * energyDensityFactor);
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
            
            // Estimate maximum current draw per motor during hard acceleration
            const maxCurrentPerMotor = kvFactor * frameSize * (cellCount / 4) * 5;
            
            // Total maximum current (4 motors at peak)
            maxCurrentDraw = maxCurrentPerMotor * 4;
        } else {
            const kvFactor = parseInt(config.motorKv) / 1000;
            const wingspan = parseInt(config.wingspan) / 1000;
            const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
            
            // Estimate maximum current draw for fixed wing
            maxCurrentDraw = kvFactor * wingspan * cellCount * 5;
        }
        
        // Calculate the C rating (current / capacity)
        const cRating = maxCurrentDraw / capacity;
        
        // Round to nearest 5 for display
        const roundedCRating = Math.ceil(cRating / 5) * 5;
        
        // Check if the battery chemistry can handle this discharge rate
        // LiPo can typically handle up to 75C, Li-Ion usually only up to 10C
        const maxCRating = batteryType === 'lipo' ? 75 : 10;
        
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
        
        return hoverCurrent.toFixed(1);
    }

    getComparisonData(config, metric) {
        // Generate data for the comparison charts based on different parameters
        const results = [];
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
        
        // Generate results for each option
        for (const option of options) {
            const tempConfig = {...config};
            tempConfig[metric] = option;
            
            const weight = this.droneType === 'fpv' ? 
                this.calculateFPVDroneWeight(tempConfig) : 
                this.calculateFixedWingWeight(tempConfig);
                
            results.push({
                option: option,
                flightTime: this.calculateFlightTime(tempConfig, weight),
                maxSpeed: this.calculateMaxSpeed(tempConfig),
                weight: weight,
                payload: this.calculatePayloadCapacity(tempConfig, weight),
                range: parseInt(this.calculateRange(tempConfig)),
                current: parseFloat(this.calculateHoverCurrent(tempConfig, weight)),
                efficiency: weight / this.calculateFlightTime(tempConfig, weight) // Lower is better
            });
        }
        
        return results;
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
}
