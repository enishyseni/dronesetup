// Debug script to test APC integration directly
console.log('=== APC Integration Debug Test ===');

async function debugTest() {
    try {
        console.log('1. Creating DroneCalculator...');
        const calculator = new DroneCalculator();
        
        console.log('2. Setting drone type...');
        calculator.setDroneType("fpv");
        
        console.log('3. Initializing APC...');
        const apcSuccess = await calculator.initializeAPC();
        console.log('APC Initialization result:', apcSuccess);
        
        if (!apcSuccess) {
            console.error('APC initialization failed');
            return;
        }
        
        console.log('4. Checking APC integration object...');
        console.log('calculator.apcIntegration:', calculator.apcIntegration);
        console.log('calculator.apcIntegration.propDB:', calculator.apcIntegration?.propDB);
        
        if (calculator.apcIntegration?.propDB) {
            console.log('5. Testing database access...');
            const allProps = calculator.apcIntegration.propDB.getAllPropellers();
            console.log('All propellers count:', Object.keys(allProps).length);
            
            if (Object.keys(allProps).length > 0) {
                const firstPropId = Object.keys(allProps)[0];
                console.log('Sample propeller ID:', firstPropId);
                const specs = calculator.apcIntegration.propDB.getPropellerSpecs(firstPropId);
                console.log('Sample specs:', specs);
            }
        }
        
        console.log('6. Creating ComponentAnalyzer...');
        const analyzer = new ComponentAnalyzer(calculator);
        
        console.log('7. Testing thrust curve generation...');
        const config = {
            frameSize: "5inch",
            motorKv: "2400",
            batteryType: "lipo-4s"
        };
        
        const thrustData = analyzer.getAPCThrustCurveData(config);
        console.log('Thrust data:', thrustData);
        console.log('Thrust data length:', thrustData?.length);
        
        console.log('8. Testing efficiency data generation...');
        const effData = analyzer.getAPCPropEfficiencyData(config);
        console.log('Efficiency data:', effData);
        console.log('Efficiency data length:', effData?.length);
        
        console.log('9. Testing generateAPCPerformanceData method...');
        const perfData = calculator.generateAPCPerformanceData(config, "APC_5x3");
        console.log('Performance data:', perfData);
        
        console.log('=== Test completed successfully ===');
        
    } catch (error) {
        console.error('Debug test failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the debug test
debugTest();
