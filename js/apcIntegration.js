/**
 * APC Propeller Integration Framework
 * Integrates APC propeller performance data for accurate thrust and power calculations
 */

class APCPropellerDatabase {
    constructor() {
        this.propData = new Map();
        this.isLoaded = false;
        this.loadingPromise = null;
    }

    /**
     * Load APC propeller database from CSV
     */
    async loadDatabase(csvPath = './APC-Prop-DB.csv') {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._loadCSVData(csvPath);
        return this.loadingPromise;
    }

    /**
     * Parse CSV data and organize by propeller ID
     */
    async _loadCSVData(csvPath) {
        try {
            const response = await fetch(csvPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
            }
            
            const csvText = await response.text();
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('CSV file is empty');
            }
            
            // Parse CSV data
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                throw new Error('CSV file does not contain enough data');
            }
            
            const headers = lines[0].split(',');
            let validEntries = 0;
            
            // Group data by propeller
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                try {
                    const values = this._parseCSVLine(line);
                    if (values.length < headers.length) continue;
                    
                    const propId = values[0]; // PROP column
                    if (!propId || propId.trim() === '') continue;
                    
                    if (!this.propData.has(propId)) {
                        this.propData.set(propId, {
                            diameter: parseFloat(values[1].replace(',', '.')),
                            pitch: parseFloat(values[2].replace(',', '.')),
                            dataPoints: []
                        });
                    }
                    
                    // Add data point
                    const dataPoint = {
                        rpm: parseFloat(values[4]),
                        velocity_ms: parseFloat(values[5].replace(',', '.')),
                        velocity_mph: parseFloat(values[6].replace(',', '.')),
                        thrustCoeff: parseFloat(values[9].replace(',', '.')),
                        powerCoeff: parseFloat(values[10].replace(',', '.')),
                        thrust_N: parseFloat(values[16].replace(',', '.')),
                        power_W: parseFloat(values[14].replace(',', '.'))
                    };
                    
                    // Validate data point
                    if (!isNaN(dataPoint.rpm) && !isNaN(dataPoint.thrust_N) && !isNaN(dataPoint.power_W)) {
                        this.propData.get(propId).dataPoints.push(dataPoint);
                        validEntries++;
                    }
                } catch (parseError) {
                    console.warn(`Error parsing line ${i}: ${parseError.message}`);
                    continue;
                }
            }
            
            if (validEntries === 0) {
                throw new Error('No valid data entries found in CSV');
            }
            
            this.isLoaded = true;
            console.log(`APC Database loaded: ${this.propData.size} propellers, ${validEntries} data points`);
            
        } catch (error) {
            console.error('Failed to load APC database:', error);
            this.isLoaded = false;
            throw error;
        }
    }

    /**
     * Parse CSV line handling commas in quoted values
     */
    _parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Find best matching propeller for given specifications
     */
    findBestProp(targetDiameter, targetPitch, tolerance = 0.5) {
        if (!this.isLoaded) {
            console.warn('APC database not loaded');
            return null;
        }

        let bestMatch = null;
        let bestScore = Infinity;

        for (const [propId, propData] of this.propData) {
            const diameterDiff = Math.abs(propData.diameter - targetDiameter);
            const pitchDiff = Math.abs(propData.pitch - targetPitch);
            
            if (diameterDiff <= tolerance && pitchDiff <= tolerance) {
                const score = diameterDiff + pitchDiff;
                if (score < bestScore) {
                    bestScore = score;
                    bestMatch = { id: propId, ...propData };
                }
            }
        }

        return bestMatch;
    }

    /**
     * Get available propellers for given diameter
     */
    getPropsByDiameter(diameter, tolerance = 0.5) {
        if (!this.isLoaded) return [];

        const matches = [];
        for (const [propId, propData] of this.propData) {
            if (Math.abs(propData.diameter - diameter) <= tolerance) {
                matches.push({ id: propId, ...propData });
            }
        }

        return matches.sort((a, b) => a.pitch - b.pitch);
    }

    /**
     * Alias for getPropsByDiameter for backward compatibility
     */
    getPropellersByDiameter(diameter, tolerance = 0.5) {
        return this.getPropsByDiameter(diameter, tolerance);
    }

    /**
     * Interpolate thrust for given RPM and airspeed
     */
    interpolateThrust(propId, rpm, airspeed_ms = 0) {
        const propData = this.propData.get(propId);
        if (!propData) return null;

        // Find nearest data points
        const dataPoints = propData.dataPoints;
        
        // Filter by similar airspeed (within 2 m/s)
        const nearbyPoints = dataPoints.filter(point => 
            Math.abs(point.velocity_ms - airspeed_ms) <= 2
        );

        if (nearbyPoints.length === 0) {
            console.warn(`No data points found for airspeed ${airspeed_ms} m/s`);
            return null;
        }

        // Sort by RPM
        nearbyPoints.sort((a, b) => a.rpm - b.rpm);

        // Linear interpolation
        return this._interpolateValue(nearbyPoints, rpm, 'rpm', 'thrust_N');
    }

    /**
     * Interpolate power for given RPM and airspeed
     */
    interpolatePower(propId, rpm, airspeed_ms = 0) {
        const propData = this.propData.get(propId);
        if (!propData) return null;

        const dataPoints = propData.dataPoints;
        const nearbyPoints = dataPoints.filter(point => 
            Math.abs(point.velocity_ms - airspeed_ms) <= 2
        );

        if (nearbyPoints.length === 0) return null;

        nearbyPoints.sort((a, b) => a.rpm - b.rpm);
        return this._interpolateValue(nearbyPoints, rpm, 'rpm', 'power_W');
    }

    /**
     * Find RPM for target thrust at given airspeed
     */
    findRPMForThrust(propId, targetThrust_N, airspeed_ms = 0) {
        const propData = this.propData.get(propId);
        if (!propData) return null;

        const dataPoints = propData.dataPoints;
        const nearbyPoints = dataPoints.filter(point => 
            Math.abs(point.velocity_ms - airspeed_ms) <= 2
        );

        if (nearbyPoints.length === 0) return null;

        nearbyPoints.sort((a, b) => a.thrust_N - b.thrust_N);
        return this._interpolateValue(nearbyPoints, targetThrust_N, 'thrust_N', 'rpm');
    }

    /**
     * Linear interpolation helper
     */
    _interpolateValue(sortedPoints, targetX, xKey, yKey) {
        if (sortedPoints.length === 0) return null;
        if (sortedPoints.length === 1) return sortedPoints[0][yKey];

        // Check bounds
        if (targetX <= sortedPoints[0][xKey]) {
            return sortedPoints[0][yKey];
        }
        if (targetX >= sortedPoints[sortedPoints.length - 1][xKey]) {
            return sortedPoints[sortedPoints.length - 1][yKey];
        }

        // Find interpolation points
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const p1 = sortedPoints[i];
            const p2 = sortedPoints[i + 1];

            if (targetX >= p1[xKey] && targetX <= p2[xKey]) {
                const ratio = (targetX - p1[xKey]) / (p2[xKey] - p1[xKey]);
                return p1[yKey] + ratio * (p2[yKey] - p1[yKey]);
            }
        }

        return null;
    }

    /**
     * Get propeller efficiency at given operating point
     */
    calculateEfficiency(propId, rpm, airspeed_ms = 0) {
        const thrust = this.interpolateThrust(propId, rpm, airspeed_ms);
        const power = this.interpolatePower(propId, rpm, airspeed_ms);

        if (!thrust || !power || power <= 0) return null;

        // Propeller efficiency: η = (T × V) / P
        // For static thrust (V=0), use figure of merit: η = T^1.5 / sqrt(2ρA) / P
        if (airspeed_ms === 0) {
            const propData = this.propData.get(propId);
            const diameter_m = propData.diameter * 0.0254; // inches to meters
            const diskArea = Math.PI * Math.pow(diameter_m / 2, 2);
            const airDensity = 1.225; // kg/m³
            
            const idealPower = Math.pow(thrust, 1.5) / Math.sqrt(2 * airDensity * diskArea);
            return Math.min(idealPower / power, 1.0); // Cap at 100%
        } else {
            return (thrust * airspeed_ms) / power;
        }
    }

    /**
     * Get operating envelope for propeller
     */
    getOperatingEnvelope(propId) {
        const propData = this.propData.get(propId);
        if (!propData) return null;

        const points = propData.dataPoints;
        
        return {
            rpmRange: [
                Math.min(...points.map(p => p.rpm)),
                Math.max(...points.map(p => p.rpm))
            ],
            velocityRange: [
                Math.min(...points.map(p => p.velocity_ms)),
                Math.max(...points.map(p => p.velocity_ms))
            ],
            thrustRange: [
                Math.min(...points.map(p => p.thrust_N)),
                Math.max(...points.map(p => p.thrust_N))
            ],
            powerRange: [
                Math.min(...points.map(p => p.power_W)),
                Math.max(...points.map(p => p.power_W))
            ]
        };
    }

    /**
     * Get all available propeller IDs
     */
    getAllPropellers() {
        if (!this.isLoaded) return [];
        
        return Array.from(this.propData.keys()).map(propId => {
            const propData = this.propData.get(propId);
            return {
                model: propId,
                diameter: propData.diameter,
                pitch: propData.pitch,
                dataPointCount: propData.dataPoints.length
            };
        }).sort((a, b) => a.diameter - b.diameter || a.pitch - b.pitch);
    }

    /**
     * Get propeller specifications
     */
    getPropellerSpecs(propId) {
        const propData = this.propData.get(propId);
        if (!propData) return null;

        return {
            id: propId,
            diameter: propData.diameter,
            pitch: propData.pitch,
            dataPointCount: propData.dataPoints.length
        };
    }

    /**
     * Find propeller by ID
     */
    findPropeller(propId) {
        return this.getPropellerSpecs(propId);
    }
}

/**
 * APC Integration class for the drone calculator
 */
class APCIntegration {
    constructor() {
        this.database = new APCPropellerDatabase();
        this.selectedPropeller = null;
    }

    /**
     * Initialize APC integration
     */
    async initialize(csvPath = './APC-Prop-DB.csv') {
        try {
            await this.database.loadDatabase(csvPath);
            console.log('APC Integration initialized successfully');
            return true;
        } catch (error) {
            console.error('APC Integration initialization failed:', error);
            return false;
        }
    }

    /**
     * Select optimal propeller for drone configuration
     */
    selectOptimalPropeller(config) {
        if (!this.database.isLoaded) {
            console.warn('APC database not loaded');
            return null;
        }

        // Get target propeller specifications from config
        const targetSpecs = this._getTargetPropSpecs(config);
        
        // Find best matching propeller
        const bestProp = this.database.findBestProp(
            targetSpecs.diameter, 
            targetSpecs.pitch
        );

        if (bestProp) {
            this.selectedPropeller = bestProp.id;
            console.log(`Selected APC propeller: ${bestProp.id}`);
        }

        return bestProp;
    }

    /**
     * Calculate thrust using APC data
     */
    calculateThrustAPC(config, airspeed_ms = 0) {
        if (!this.selectedPropeller) {
            this.selectOptimalPropeller(config);
        }

        if (!this.selectedPropeller) {
            return null;
        }

        // Calculate motor RPM
        const rpm = this._calculateMotorRPM(config);
        
        // Get thrust from APC data
        return this.database.interpolateThrust(this.selectedPropeller, rpm, airspeed_ms);
    }

    /**
     * Calculate power using APC data
     */
    calculatePowerAPC(config, airspeed_ms = 0) {
        if (!this.selectedPropeller) {
            this.selectOptimalPropeller(config);
        }

        if (!this.selectedPropeller) {
            return null;
        }

        const rpm = this._calculateMotorRPM(config);
        return this.database.interpolatePower(this.selectedPropeller, rpm, airspeed_ms);
    }

    /**
     * Get propeller efficiency
     */
    getEfficiency(config, airspeed_ms = 0) {
        if (!this.selectedPropeller) {
            this.selectOptimalPropeller(config);
        }

        if (!this.selectedPropeller) {
            return null;
        }

        const rpm = this._calculateMotorRPM(config);
        return this.database.calculateEfficiency(this.selectedPropeller, rpm, airspeed_ms);
    }

    /**
     * Get target propeller specifications based on config
     */
    _getTargetPropSpecs(config) {
        const frameSize = config.frameSize || config.wingspan;
        
        // Default propeller specifications for different frame sizes
        const propSpecs = {
            '3inch': { diameter: 3.0, pitch: 3.0 },
            '5inch': { diameter: 5.0, pitch: 4.3 },
            '7inch': { diameter: 7.0, pitch: 4.5 },
            '10inch': { diameter: 10.0, pitch: 4.7 },
            // Fixed wing based on wingspan
            '800': { diameter: 8.0, pitch: 6.0 },
            '1000': { diameter: 9.0, pitch: 6.0 },
            '1500': { diameter: 10.0, pitch: 7.0 },
            '2000': { diameter: 11.0, pitch: 8.0 }
        };

        return propSpecs[frameSize] || propSpecs['5inch'];
    }

    /**
     * Calculate motor RPM from configuration
     */
    _calculateMotorRPM(config) {
        const motorKv = parseInt(config.motorKv);
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
        const voltage = cellCount * cellVoltage;
        
        return motorKv * voltage;
    }

    /**
     * Get available propellers for current configuration
     */
    getAvailablePropellers(config) {
        if (!this.database.isLoaded) return [];

        const targetSpecs = this._getTargetPropSpecs(config);
        return this.database.getPropsByDiameter(targetSpecs.diameter, 1.0);
    }

    /**
     * Generate propeller performance charts data
     */
    generatePerformanceData(config, propId = null) {
        if (!this.database.isLoaded) {
            console.warn('APC database not loaded');
            return null;
        }

        let targetProp = propId;
        
        // If no specific propId provided, try to get selected propeller
        if (!targetProp) {
            targetProp = this.selectedPropeller;
        }
        
        // If still no propeller, try to auto-select one
        if (!targetProp) {
            const selectedProp = this.selectOptimalPropeller(config);
            targetProp = selectedProp ? selectedProp.id : null;
        }
        
        if (!targetProp) {
            console.warn('No propeller selected for performance data generation');
            return null;
        }

        const envelope = this.database.getOperatingEnvelope(targetProp);
        if (!envelope) {
            console.warn(`No operating envelope found for propeller: ${targetProp}`);
            return null;
        }

        const rpmPoints = [];
        const thrustPoints = [];
        const powerPoints = [];
        const efficiencyPoints = [];

        // Generate data points across RPM range
        const rpmMin = envelope.rpmRange[0];
        const rpmMax = envelope.rpmRange[1];
        const rpmStep = (rpmMax - rpmMin) / 20;

        for (let rpm = rpmMin; rpm <= rpmMax; rpm += rpmStep) {
            const thrust = this.database.interpolateThrust(targetProp, rpm, 0);
            const power = this.database.interpolatePower(targetProp, rpm, 0);
            const efficiency = this.database.calculateEfficiency(targetProp, rpm, 0);

            if (thrust !== null && power !== null) {
                rpmPoints.push(rpm);
                thrustPoints.push(thrust);
                powerPoints.push(power);
                efficiencyPoints.push(efficiency || 0);
            }
        }

        if (rpmPoints.length === 0) {
            console.warn(`No valid data points generated for propeller: ${targetProp}`);
            return null;
        }

        return {
            rpm: rpmPoints,
            thrust: thrustPoints,
            power: powerPoints,
            efficiency: efficiencyPoints,
            propId: targetProp
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APCPropellerDatabase, APCIntegration };
} else if (typeof window !== 'undefined') {
    // Browser environment - add to global scope
    window.APCPropellerDatabase = APCPropellerDatabase;
    window.APCIntegration = APCIntegration;
}
