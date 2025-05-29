// Quick validation test
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== PROPELLER FIX VALIDATION ===');
    
    try {
        const calculator = new DroneCalculator();
        const apcSuccess = await calculator.initializeAPC();
        console.log('APC Init:', apcSuccess ? 'SUCCESS' : 'FAILED');
        
        if (apcSuccess) {
            const config = {
                frameSize: '5inch',
                motorKv: '2400',
                batteryType: 'lipo-4s',
                batteryCapacity: '1500',
                propellerType: 'auto',
                apcPropeller: ''
            };
            
            console.log('Test config:', config);
            
            // Test propeller selection
            const propeller = calculator.getSelectedPropeller(config);
            console.log('Selected propeller:', propeller);
            
            // Test with manual selection
            config.propellerType = 'manual';
            if (calculator.apcDatabase && calculator.apcDatabase.length > 0) {
                config.apcPropeller = calculator.apcDatabase[0].propeller;
                console.log('Manual config:', config);
                
                const manualPropeller = calculator.getSelectedPropeller(config);
                console.log('Manual propeller:', manualPropeller);
                
                const performanceData = calculator.generateAPCPerformanceData(config);
                console.log('Performance data:', performanceData);
            }
            
            console.log('=== VALIDATION COMPLETE ===');
        }
    } catch (error) {
        console.error('Validation error:', error);
    }
});
