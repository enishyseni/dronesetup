/**
 * APC Integration Demo Script
 * This script demonstrates the APC Integration Framework functionality
 */

// Demo configuration for testing APC integration
const demoConfigs = [
    {
        name: "Racing 5-inch FPV Quad",
        config: {
            frameSize: "5inch",
            motorKv: "2400",
            batteryType: "lipo-4s",
            batteryCapacity: "1500",
            flightController: "f4",
            vtxPower: "600"
        }
    },
    {
        name: "Freestyle 7-inch Long Range",
        config: {
            frameSize: "7inch", 
            motorKv: "1700",
            batteryType: "lipo-6s",
            batteryCapacity: "3000",
            flightController: "f7",
            vtxPower: "1000"
        }
    },
    {
        name: "Tiny Whoop 3-inch",
        config: {
            frameSize: "3inch",
            motorKv: "3000", 
            batteryType: "lipo-3s",
            batteryCapacity: "1300",
            flightController: "f4",
            vtxPower: "25"
        }
    }
];

class APCDemo {
    constructor() {
        this.calculator = null;
        this.apcIntegration = null;
    }

    async initialize() {
        console.log('🚁 Initializing APC Integration Demo...');
        
        // Initialize calculator
        this.calculator = new DroneCalculator();
        
        // Initialize APC integration
        const success = await this.calculator.initializeAPC();
        
        if (success) {
            console.log('✅ APC Integration Framework initialized successfully');
            this.apcIntegration = this.calculator.apcIntegration;
            return true;
        } else {
            console.log('❌ APC Integration initialization failed');
            return false;
        }
    }

    async runDemo() {
        console.log('\n🧪 Running APC Integration Demo...\n');
        
        for (const demo of demoConfigs) {
            console.log(`\n📊 Testing Configuration: ${demo.name}`);
            console.log('=' .repeat(50));
            
            await this.testConfiguration(demo.config);
        }
        
        console.log('\n🎯 Demo completed!');
    }

    async testConfiguration(config) {
        try {
            // Test propeller selection
            console.log('🔍 Finding optimal APC propeller...');
            const optimalProp = this.calculator.selectOptimalAPCPropeller(config);
            
            if (optimalProp) {
                console.log(`✅ Selected: ${optimalProp.id} (${optimalProp.diameter}"×${optimalProp.pitch}")`);
                
                // Test performance calculations
                const apcThrust = this.calculator.calculateThrustWithAPC(config);
                const apcPower = this.calculator.calculatePowerWithAPC(config);
                const efficiency = this.calculator.getPropellerEfficiency(config);
                
                console.log(`📈 Performance Metrics:`);
                console.log(`   • Thrust: ${apcThrust?.toFixed(2)} N`);
                console.log(`   • Power: ${apcPower?.toFixed(2)} W`);
                console.log(`   • Efficiency: ${efficiency?.toFixed(2)}%`);
                
                // Test available propellers
                const availableProps = this.calculator.getAvailableAPCPropellers(config);
                console.log(`📋 Available propellers: ${availableProps.length}`);
                
                if (availableProps.length > 0) {
                    console.log('   Top 3 alternatives:');
                    availableProps.slice(0, 3).forEach((prop, index) => {
                        console.log(`   ${index + 1}. ${prop.id} (${prop.diameter}"×${prop.pitch}")`);
                    });
                }
                
                // Test performance data generation
                const perfData = this.calculator.generateAPCPerformanceData(config);
                if (perfData) {
                    console.log(`📊 Generated ${perfData.rpm.length} performance data points`);
                    const maxThrust = Math.max(...perfData.thrust);
                    const maxEfficiency = Math.max(...perfData.efficiency);
                    console.log(`   • Max thrust: ${maxThrust.toFixed(2)} N`);
                    console.log(`   • Max efficiency: ${(maxEfficiency * 100).toFixed(2)}%`);
                }
                
            } else {
                console.log('❌ No matching APC propeller found');
            }
            
        } catch (error) {
            console.error('❌ Error testing configuration:', error);
        }
    }

    async testSpecificPropeller(propId) {
        console.log(`\n🔬 Testing specific propeller: ${propId}`);
        
        if (!this.apcIntegration) {
            console.log('❌ APC integration not available');
            return;
        }
        
        const propSpecs = this.apcIntegration.database.getPropellerSpecs(propId);
        if (!propSpecs) {
            console.log('❌ Propeller not found in database');
            return;
        }
        
        console.log(`📏 Specifications: ${propSpecs.diameter}"×${propSpecs.pitch}"`);
        console.log(`📊 Data points: ${propSpecs.dataPointCount}`);
        
        // Test operating envelope
        const envelope = this.apcIntegration.database.getOperatingEnvelope(propId);
        if (envelope) {
            console.log('📈 Operating envelope:');
            console.log(`   • RPM: ${envelope.rpmRange[0]} - ${envelope.rpmRange[1]}`);
            console.log(`   • Velocity: ${envelope.velocityRange[0].toFixed(2)} - ${envelope.velocityRange[1].toFixed(2)} m/s`);
            console.log(`   • Thrust: ${envelope.thrustRange[0].toFixed(2)} - ${envelope.thrustRange[1].toFixed(2)} N`);
            console.log(`   • Power: ${envelope.powerRange[0].toFixed(2)} - ${envelope.powerRange[1].toFixed(2)} W`);
        }
        
        // Test interpolation at different operating points
        const testPoints = [
            { rpm: 8000, airspeed: 0 },
            { rpm: 12000, airspeed: 5 },
            { rpm: 16000, airspeed: 10 }
        ];
        
        console.log('🎯 Interpolation test:');
        testPoints.forEach(point => {
            const thrust = this.apcIntegration.database.interpolateThrust(propId, point.rpm, point.airspeed);
            const power = this.apcIntegration.database.interpolatePower(propId, point.rpm, point.airspeed);
            const efficiency = this.apcIntegration.database.calculateEfficiency(propId, point.rpm, point.airspeed);
            
            console.log(`   @ ${point.rpm} RPM, ${point.airspeed} m/s:`);
            console.log(`     Thrust: ${thrust?.toFixed(2)} N`);
            console.log(`     Power: ${power?.toFixed(2)} W`);
            console.log(`     Efficiency: ${efficiency != null ? (efficiency * 100).toFixed(2) : 'N/A'}%`);
        });
    }

    async benchmark() {
        console.log('\n⏱️  Running APC Integration Benchmark...');
        
        const iterations = 100;
        const config = demoConfigs[0].config;
        
        // Benchmark propeller selection
        console.time('Propeller Selection');
        for (let i = 0; i < iterations; i++) {
            this.calculator.selectOptimalAPCPropeller(config);
        }
        console.timeEnd('Propeller Selection');
        
        // Benchmark thrust calculations
        console.time('Thrust Calculations');
        for (let i = 0; i < iterations; i++) {
            this.calculator.calculateThrustWithAPC(config);
        }
        console.timeEnd('Thrust Calculations');
        
        // Benchmark performance data generation
        console.time('Performance Data Generation');
        for (let i = 0; i < 10; i++) { // Fewer iterations for complex operation
            this.calculator.generateAPCPerformanceData(config);
        }
        console.timeEnd('Performance Data Generation');
        
        console.log('✅ Benchmark completed');
    }

    displayDatabaseStats() {
        if (!this.apcIntegration) {
            console.log('❌ APC integration not available');
            return;
        }
        
        const allProps = this.apcIntegration.database.getAllPropellers();
        console.log(`\n📊 APC Database Statistics:`);
        console.log(`   • Total propellers: ${allProps.length}`);
        
        // Group by diameter
        const diameters = {};
        allProps.forEach(prop => {
            const diameter = prop.diameter;
            diameters[diameter] = (diameters[diameter] || 0) + 1;
        });
        
        console.log('   • By diameter:');
        Object.keys(diameters).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(diameter => {
            console.log(`     ${diameter}": ${diameters[diameter]} propellers`);
        });
    }
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
    window.APCDemo = APCDemo;
}

// Auto-run demo if loaded directly
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Wait a bit for other scripts to load
        setTimeout(async () => {
            const demo = new APCDemo();
            const initialized = await demo.initialize();
            
            if (initialized) {
                console.log('🎮 APC Demo loaded! Available commands:');
                console.log('   • window.apcDemo.runDemo() - Run full demo');
                console.log('   • window.apcDemo.testSpecificPropeller("1225x375") - Test specific prop');
                console.log('   • window.apcDemo.benchmark() - Run performance benchmark');
                console.log('   • window.apcDemo.displayDatabaseStats() - Show database stats');
                
                window.apcDemo = demo;
            }
        }, 2000);
    });
}
