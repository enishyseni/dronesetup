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

        const batteryWeights = {
            '3s': {
                '1300': 150,
                '1500': 170,
                '2200': 230,
                '3000': 320
            },
            '4s': {
                '1300': 180,
                '1500': 200,
                '2200': 260,
                '3000': 350
            },
            '6s': {
                '1300': 230,
                '1500': 260,
                '2200': 320,
                '3000': 420
            }
        };

        const fcWeight = config.flightController === 'f4' ? 10 : 12;
        const escWeight = 15;
        const cameraWeight = config.camera === 'analog' ? 20 : 35;
        const receiverWeight = 5;
        const vtxWeight = 10;
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

        const batteryWeights = {
            '3s': {
                '1300': 150,
                '1500': 170,
                '2200': 230,
                '3000': 320
            },
            '4s': {
                '1300': 180,
                '1500': 200,
                '2200': 260,
                '3000': 350
            },
            '6s': {
                '1300': 230,
                '1500': 260,
                '2200': 320,
                '3000': 420
            }
        };

        const baseWeight = wingspanWeights[config.wingspan] * wingTypeMultipliers[config.wingType];
        const motorWeight = motorWeights[config.motorKv];
        const batteryWeight = batteryWeights[config.batteryType][config.batteryCapacity];
        const electronicsWeight = 80; // FC, ESC, receiver, servos, etc.
        const cameraWeight = config.camera === 'analog' ? 20 : 35;

        return baseWeight + motorWeight + batteryWeight + electronicsWeight + cameraWeight;
    }

    calculateFlightTime(config, totalWeight) {
        // Basic flight time calculation (very simplified)
        const capacityFactor = parseInt(config.batteryCapacity) / 1000; // Convert to Ah
        let cellCount = parseInt(config.batteryType.replace('s', ''));
        let avgCurrent;

        if (this.droneType === 'fpv') {
            // FPV drones draw more current, especially with higher KV motors
            const kvFactor = parseInt(config.motorKv) / 1000;
            avgCurrent = cellCount * 3.7 * kvFactor * (totalWeight / 500); // Rough estimate
        } else {
            // Fixed wings are more efficient
            avgCurrent = cellCount * 2.5 * (totalWeight / 800);
        }

        // Calculate flight time in minutes
        // Using a discharge factor of 0.8 (you usually don't fully discharge the battery)
        return Math.round((capacityFactor / avgCurrent) * 60 * 0.8);
    }

    calculatePayloadCapacity(config, totalWeight) {
        // Calculate how much additional weight the drone can carry
        let maxTakeoffWeight;
        
        if (this.droneType === 'fpv') {
            // FPV drone thrust-to-weight calculation
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            const kvFactor = parseInt(config.motorKv) / 1000;
            const cellCount = parseInt(config.batteryType.replace('s', ''));
            
            // Estimate thrust for each motor
            const estimatedThrustPerMotor = frameSize * 100 * kvFactor * cellCount / 4;
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
        // Simplified max speed calculation
        if (this.droneType === 'fpv') {
            const kvFactor = parseInt(config.motorKv) / 1000;
            const cellCount = parseInt(config.batteryType.replace('s', ''));
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            
            // Larger frames typically have higher top speeds due to larger props
            const frameFactor = Math.sqrt(frameSize / 5);
            
            // Calculate rough max speed in km/h
            return Math.round(kvFactor * cellCount * 20 * frameFactor);
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
            const cellCount = parseInt(config.batteryType.replace('s', ''));
            
            return Math.round(baseSpeed * sizeFactor * kvFactor * cellCount);
        }
    }

    calculatePowerToWeightRatio(config, totalWeight) {
        // Calculate power to weight ratio
        const cellCount = parseInt(config.batteryType.replace('s', ''));
        const voltage = cellCount * 3.7; // Nominal LiPo voltage
        
        let power;
        
        if (this.droneType === 'fpv') {
            const kvFactor = parseInt(config.motorKv) / 1000;
            const frameSize = parseInt(config.frameSize.replace('inch', ''));
            
            // Estimate maximum current draw per motor
            const maxCurrentPerMotor = kvFactor * frameSize * 5;
            
            // Total power (4 motors)
            power = voltage * maxCurrentPerMotor * 4;
        } else {
            const kvFactor = parseInt(config.motorKv) / 1000;
            const wingspan = parseInt(config.wingspan) / 1000;
            
            // Estimate maximum current draw
            const maxCurrent = kvFactor * wingspan * 15;
            
            // Total power (single motor typically)
            power = voltage * maxCurrent;
        }
        
        // Convert weight to kg for power-to-weight calculation
        const weightKg = totalWeight / 1000;
        
        // Calculate power to weight ratio (W/kg)
        const ratio = power / weightKg;
        
        // Return a simplified ratio for display
        return (ratio / 100).toFixed(1) + ":1";
    }

    calculateAllMetrics(config) {
        let totalWeight;
        
        if (this.droneType === 'fpv') {
            totalWeight = this.calculateFPVDroneWeight(config);
        } else {
            totalWeight = this.calculateFixedWingWeight(config);
        }
        
        const flightTime = this.calculateFlightTime(config, totalWeight);
        const payloadCapacity = this.calculatePayloadCapacity(config, totalWeight);
        const maxSpeed = this.calculateMaxSpeed(config);
        const powerToWeight = this.calculatePowerToWeightRatio(config, totalWeight);
        
        return {
            totalWeight: totalWeight + 'g',
            flightTime: flightTime + ' mins',
            payloadCapacity: payloadCapacity + 'g',
            maxSpeed: maxSpeed + ' km/h',
            powerToWeight: powerToWeight
        };
    }
}
