# APC Integration Framework

This document describes the complete APC (American Propeller Company) Integration Framework that has been integrated into the Drone Setup tool.

## Overview

The APC Integration Framework provides real-world propeller performance data integration for accurate thrust, power, and efficiency calculations. It uses the APC propeller database to replace simplified calculations with actual measured performance data.

## Features

### 🚁 **Real-World Propeller Data**

- Complete APC propeller database integration
- Over 280+ propeller models with performance data
- Thrust, power, and efficiency data across RPM and airspeed ranges
- Interpolation for smooth performance curves

### 📊 **Enhanced Calculations**

- Accurate thrust calculations using APC data
- Real-world power consumption estimates
- Propeller efficiency optimization
- Operating envelope analysis

### 🔍 **Intelligent Propeller Selection**

- Automatic optimal propeller matching
- Manual APC propeller selection
- Compatibility analysis for different configurations
- Alternative propeller recommendations

### 📈 **Advanced Analytics**

- Performance data visualization
- Thrust curve analysis with real data
- Efficiency mapping across operating conditions
- Comparative analysis between configurations

## File Structure

```
js/
├── apcIntegration.js     # Core APC integration framework
├── apcDemo.js           # Demo and testing utilities
├── calculations.js      # Enhanced with APC integration
├── componentAnalysis.js # APC-enhanced analysis methods
├── charts.js           # Charts with APC data visualization
└── main.js             # UI integration and event handling
```

## Usage

### Basic Integration

The APC integration is automatically initialized when the page loads:

```javascript
// Automatic initialization
calculator.initializeAPC().then((success) => {
  if (success) {
    console.log("APC Integration ready");
    // Enhanced calculations now available
  }
});
```

### Using APC Data in Calculations

```javascript
// Enhanced thrust calculation with APC data
const thrust = calculator.calculateThrustWithAPC(config, airspeed_ms);

// Enhanced power calculation with APC data
const power = calculator.calculatePowerWithAPC(config, airspeed_ms);

// Get propeller efficiency
const efficiency = calculator.getPropellerEfficiency(config, airspeed_ms);
```

### Propeller Selection

```javascript
// Find optimal propeller for configuration
const optimalProp = calculator.selectOptimalAPCPropeller(config);

// Get all available propellers for current specs
const availableProps = calculator.getAvailableAPCPropellers(config);

// Generate performance data for charts
const perfData = calculator.generateAPCPerformanceData(config, propId);
```

### Direct Database Access

```javascript
// Access APC database directly
const apcDB = calculator.apcIntegration.database;

// Find propeller by specifications
const prop = apcDB.findBestProp(targetDiameter, targetPitch);

// Interpolate thrust at specific operating point
const thrust = apcDB.interpolateThrust(propId, rpm, airspeed);

// Get operating envelope
const envelope = apcDB.getOperatingEnvelope(propId);
```

## API Reference

### APCPropellerDatabase Class

#### Methods

- `loadDatabase(csvPath)` - Load APC database from CSV
- `findBestProp(diameter, pitch, tolerance)` - Find matching propeller
- `getPropsByDiameter(diameter, tolerance)` - Get propellers by diameter
- `interpolateThrust(propId, rpm, airspeed)` - Calculate thrust
- `interpolatePower(propId, rpm, airspeed)` - Calculate power
- `calculateEfficiency(propId, rpm, airspeed)` - Calculate efficiency
- `getOperatingEnvelope(propId)` - Get operating limits
- `getAllPropellers()` - Get all propeller IDs

### APCIntegration Class

#### Methods

- `initialize()` - Initialize APC integration
- `selectOptimalPropeller(config)` - Select best propeller
- `calculateThrustAPC(config, airspeed)` - Calculate thrust
- `calculatePowerAPC(config, airspeed)` - Calculate power
- `getEfficiency(config, airspeed)` - Get efficiency
- `getAvailablePropellers(config)` - Get available propellers
- `generatePerformanceData(config, propId)` - Generate chart data

### Enhanced DroneCalculator Methods

#### APC-Enhanced Calculations

- `initializeAPC()` - Initialize APC framework
- `calculateThrustWithAPC(config, airspeed)` - Enhanced thrust calculation
- `calculatePowerWithAPC(config, airspeed)` - Enhanced power calculation
- `getPropellerEfficiency(config, airspeed)` - Get efficiency
- `selectOptimalAPCPropeller(config)` - Select optimal propeller
- `getAvailableAPCPropellers(config)` - Get available propellers
- `generateAPCPerformanceData(config, propId)` - Generate performance data

## Demo and Testing

### Built-in Demo

The framework includes a comprehensive demo system:

```javascript
// Run the full demo
window.apcDemo.runDemo();

// Test specific propeller
window.apcDemo.testSpecificPropeller("1225x375");

// Run performance benchmark
window.apcDemo.benchmark();

// Display database statistics
window.apcDemo.displayDatabaseStats();
```

### Demo Configurations

The demo includes pre-configured test cases:

- Racing 5-inch FPV Quad
- Freestyle 7-inch Long Range
- Tiny Whoop 3-inch

### Performance Benchmarking

Built-in benchmarking for:

- Propeller selection performance
- Thrust calculation speed
- Performance data generation
- Database query efficiency

## Data Format

### APC Database Structure

The APC database contains the following data for each propeller:

```csv
PROP,DIAM,PITCH,EXTENSION,RPM,V_ms,V_mph,J,Pe,Ct,Cp,PWR_Hp,Torque_In_Lbf,Thrust_Lbf,PWR_W,Torque_Nm,Thrust_N,THR/PWR_g_W,Mach,Reyn,FOM
```

### Key Data Points

- **PROP**: Propeller identifier (e.g., "1225x375")
- **DIAM**: Diameter in inches
- **PITCH**: Pitch in inches
- **RPM**: Rotational speed
- **V_ms**: Airspeed in m/s
- **Thrust_N**: Thrust in Newtons
- **PWR_W**: Power in Watts
- **Ct**: Thrust coefficient
- **Cp**: Power coefficient

## Integration Benefits

### Accuracy Improvements

- **Real-world data**: Replaces theoretical calculations with measured data
- **Operating envelope**: Respects actual propeller limitations
- **Efficiency optimization**: Uses real efficiency curves
- **Performance validation**: Validated against actual propeller tests

### User Experience

- **Automatic selection**: Intelligent propeller matching
- **Visual feedback**: APC status indicator
- **Performance insights**: Detailed propeller analysis
- **Comparative analysis**: Compare different propeller options

### Developer Benefits

- **Modular design**: Clean separation of concerns
- **Extensible API**: Easy to add new features
- **Error handling**: Graceful fallback to estimated calculations
- **Performance optimized**: Efficient database queries and caching

## Configuration

### Propeller Selection Modes

1. **Auto (Default)**: Automatically selects optimal APC propeller
2. **Manual**: User selects from available APC propellers

### UI Components

- **Propeller Type Selector**: Auto vs Manual selection
- **APC Propeller Dropdown**: Manual propeller selection
- **APC Status Indicator**: Shows when APC data is active

### Fallback Behavior

When APC data is not available:

- Falls back to simplified calculations
- Maintains full functionality
- Displays appropriate user feedback
- No disruption to user experience

## Future Enhancements

### Planned Features

- **Propeller recommendation engine**: AI-powered suggestions
- **Performance optimization**: Multi-objective optimization
- **Custom propeller support**: User-defined propeller data
- **Real-time validation**: Live performance validation
- **Export capabilities**: Export propeller analysis data

### Integration Opportunities

- **Weather integration**: Altitude and temperature effects
- **Flight mode optimization**: Mode-specific propeller selection
- **Battery optimization**: Propeller selection for maximum flight time
- **Noise analysis**: Propeller noise characteristics

## Troubleshooting

### Common Issues

1. **APC data not loading**

   - Check CSV file path and format
   - Verify network connectivity
   - Check browser console for errors

2. **No matching propellers found**

   - Adjust tolerance settings
   - Check propeller specifications
   - Try different frame sizes

3. **Performance issues**
   - Check database size
   - Monitor interpolation complexity
   - Consider data caching

### Debug Information

Enable debug logging:

```javascript
// Enable detailed logging
calculator.apcIntegration.database.debug = true;
```

Check integration status:

```javascript
// Check if APC is enabled
console.log("APC Enabled:", calculator.apcEnabled);

// Check available propellers
console.log("Available props:", calculator.getAvailableAPCPropellers(config));
```

## Contributing

### Adding New Propeller Data

1. Update APC-Prop-DB.csv with new propeller data
2. Follow existing CSV format
3. Test with demo scripts
4. Validate performance data

### Extending Functionality

1. Follow existing API patterns
2. Add comprehensive error handling
3. Include unit tests
4. Update documentation

### Performance Optimization

1. Profile database queries
2. Optimize interpolation algorithms
3. Implement caching strategies
4. Monitor memory usage

## License and Credits

This integration framework is built on top of the APC Propeller Database and follows the same licensing terms as the original drone setup tool.

**Credits:**

- APC (American Propeller Company) for propeller data
- Original APC Prop Helper Project contributors
- Drone Setup tool developers
