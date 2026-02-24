# DroneSetup

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/enishyseni/dronesetup)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)


![Drone Setup screenshot](fpvoptimizer.jpg)

## New Features in v1.1.0

### Enhanced Thermal Management

- **Comprehensive thermal analysis** for motors, ESCs, batteries, and VTX
- **Component-specific cooling recommendations**
- **Real-time thermal risk assessment** with visual indicators
- **Temperature predictions** across different throttle levels

### Advanced Component Analysis

- **Overall configuration scoring** (0-100 scale)
- **Intelligent optimization suggestions** based on component compatibility
- **Enhanced weight distribution analysis** with detailed breakdowns
- **Performance bottleneck identification** with specific recommendations

### APC Propeller Integration Ready

- **Framework for APC propeller database integration** (see APC-readme.md)
- **Enhanced thrust calculations** when propeller data is available
- **Propeller specification mapping** for accurate performance modeling
- **Future support for real-world propeller performance data**

### Improved User Experience

- **Real-time error handling** with user-friendly notifications
- **Configuration validation** to prevent invalid setups
- **Enhanced mobile responsiveness** for better tablet/phone usage
- **Loading states** and progress indicators

### Better Calculations

- **Improved decimal precision** across all calculations
- **Enhanced battery chemistry modeling** (LiPo vs Li-Ion differences)
- **More accurate current draw estimations**
- **Realistic thermal modeling** based on component specifications

## Technical Improvements

### Error Handling

```javascript
// Robust configuration validation
if (!calculator.validateConfig(config)) {
  showUserWarning("Invalid configuration detected");
  return;
}

// Graceful error recovery
try {
  const metrics = calculator.calculateAllMetrics(config);
} catch (error) {
  console.error("Calculation error:", error);
  showUserError("Please check your configuration");
}
```

### Thermal Analysis

```javascript
// Advanced thermal modeling
const thermalAnalysis = analyzer.getThermalAnalysis(config);
// Returns: motor, ESC, battery, VTX temperatures and recommendations
```

### APC Integration Framework

```javascript
// Future APC propeller data integration
await calculator.loadAPCData("./data/apc_props.json");
const thrust = calculator.calculateThrustFromAPC(rpm, propId, airspeed);
```

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Technical Analysis](#technical-analysis)
- [Use Cases](#use-cases)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## Overview

DroneSetup is an advanced drone configuration platform that combines engineering principles with user-friendly interfaces to provide detailed performance analysis. Whether you're building your first FPV racing quad or designing a long-range fixed-wing aircraft, this tool helps you understand how component choices affect flight characteristics, efficiency, and overall performance.

**Key Benefits:**

- 🚀 Real-time performance calculations
- 📊 Physics-based analysis engine
- 🎯 Component optimization recommendations
- 📱 Cross-platform compatibility
- 🔬 Educational insights into drone engineering

## Core Features

### 🚁 **Dual Aircraft Support**

- **FPV Quadcopters**: 3-inch to 10-inch frame configurations with racing, freestyle, and cinematic setups
- **Fixed-Wing Aircraft**: Conventional, flying wing, and delta configurations from 800mm to 2000mm wingspan
- Real-time switching between aircraft types with context-appropriate calculations

### 📊 **Advanced Performance Analytics**

- **Flight Performance Metrics**: Flight time, maximum speed, range calculations, and power-to-weight ratios
- **Component Impact Analysis**: Real-time feedback on how each component affects overall performance
- **Comparative Analysis**: Side-by-side comparisons of different configurations and component choices
- **Optimization Recommendations**: AI-driven suggestions for improving performance bottlenecks

### 🔧 **Comprehensive Component Database**

- **Battery Chemistry Support**: LiPo vs Li-Ion analysis with accurate capacity, weight, and discharge characteristics
- **Motor Analysis**: KV rating impacts on RPM, efficiency, and thermal characteristics
- **Frame Geometry**: Size-specific calculations for weight, stiffness, and aerodynamic properties
- **Power Systems**: VTX power analysis with range calculations and regulatory compliance

### 📈 **Interactive Visualization Suite**

#### Performance Charts

- **Speed Analysis**: Maximum speed comparisons across different configurations
- **Flight Time Optimization**: Battery capacity and chemistry impact on endurance
- **Range Calculations**: Line-of-sight range based on VTX power and antenna systems
- **Efficiency Curves**: Current draw analysis for optimal battery utilization

#### Weight Distribution Analysis

- **Component Breakdown**: Pie charts showing weight distribution across all components
- **Payload Capacity**: Available weight for cameras, action cams, or additional equipment
- **Center of Gravity**: Balance point calculations for optimal flight characteristics
- **Weight Comparison**: Side-by-side weight analysis for different configurations

#### Power System Analytics

- **Current Draw Profiles**: Hover, cruise, and maximum current consumption
- **Battery Discharge Analysis**: C-rating requirements and safety margins
- **Thermal Modeling**: Motor temperature predictions under various load conditions
- **Power Efficiency**: Optimal throttle ranges for maximum efficiency

#### Advanced Technical Analysis

- **Thrust Curves**: Non-linear thrust response across throttle ranges
- **Motor Efficiency Maps**: KV-specific efficiency profiles at different throttle positions
- **Noise Level Predictions**: dB calculations for various prop and motor combinations
- **Propeller Efficiency**: Optimal RPM ranges and efficiency curves

### 🎛️ **Interactive Configuration Interface**

- **Real-time Sliders**: Instant visual feedback as you adjust component parameters
- **Smart Defaults**: Industry-standard starting configurations for different use cases
- **Configuration Validation**: Warnings for incompatible or suboptimal component combinations
- **Save/Load Profiles**: Store and recall favorite configurations

### 🧮 **Physics-Based Calculations**

#### Propulsion System Analysis

- **Motor Performance**: RPM calculations using KV × Voltage formula
- **Thrust Calculations**: Using aerodynamic principles (T = Ct × ρ × n² × D⁴)
- **Efficiency Modeling**: Mechanical vs electrical power analysis
- **Optimal RPM Ranges**: Propeller-specific efficiency calculations (2300 × diameter rule)

#### Flight Dynamics

- **Thrust-to-Weight Ratios**: Performance classification (acrobatic >2:1, cruising 1.2-2:1)
- **Wing Loading**: Fixed-wing specific calculations for different wing types
- **Control Surface Authority**: Elevator, aileron, and rudder effectiveness analysis
- **Center of Gravity**: Longitudinal and lateral balance calculations

#### Battery System Analysis

- **Energy Density Comparisons**: LiPo vs Li-Ion performance characteristics
- **Discharge Rate Calculations**: C-rating requirements for different flight profiles
- **Voltage Sag Modeling**: Performance degradation under load
- **Cycle Life Predictions**: Long-term battery performance expectations

### 🔍 **Component Optimization Engine**

- **Bottleneck Identification**: Automatic detection of performance-limiting components
- **Improvement Suggestions**: Specific recommendations for upgrades or changes
- **Cost-Benefit Analysis**: Performance gains vs component cost considerations
- **Compatibility Checking**: Ensures all components work together optimally

### 📱 **Modern Web Interface**

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Theme**: Easy on the eyes for extended configuration sessions
- **Accessibility**: Screen reader compatible with keyboard navigation support
- **Progressive Web App**: Install as a desktop application for offline use

## Technology Stack

### Frontend

- **HTML5**: Semantic markup with modern web standards
- **CSS3**: Responsive design with Flexbox/Grid layouts
- **JavaScript (ES6+)**: Modern JavaScript with modules and async/await
- **Chart.js**: Interactive data visualization and charting library

### Core Libraries

- **Chart.js v3.x**: Advanced charting and data visualization
- **Web APIs**: Local Storage for configuration persistence
- **Service Workers**: Offline functionality and caching

### Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 13+, Chrome Mobile 80+
- **Features Required**: ES6 modules, Canvas API, Local Storage

## Installation

### Prerequisites

- Modern web browser with JavaScript enabled
- Internet connection (for initial load)
- Minimum 4GB RAM recommended for optimal performance

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/enishyseni/dronesetup.git
   cd dronesetup
   ```

2. **Local Development Server (Recommended)**

   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js (if you have live-server installed)
   npx live-server

   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   - Navigate to `http://localhost:8000`
   - Or simply open `index.html` directly (some features may be limited)

### Installation Verification

- Check browser console for any errors
- Verify charts load properly
- Test component sliders and real-time calculations

### Troubleshooting

**Common Issues:**

- **Charts not loading**: Ensure JavaScript is enabled and browser supports ES6
- **Slow performance**: Close other browser tabs, check available RAM
- **Mobile layout issues**: Try portrait orientation, zoom out if needed

## Usage

### Getting Started

1. **Select Aircraft Type**: Choose between quadcopter or fixed-wing configuration
2. **Configure Components**: Use sliders to adjust motor KV, battery capacity, frame size, etc.
3. **Analyze Performance**: Review real-time calculations and performance charts
4. **Optimize Setup**: Follow recommendations to improve specific performance metrics
5. **Save Configuration**: Store your setup for future reference

### Configuration Tips

- Start with preset configurations for your aircraft type
- Monitor thrust-to-weight ratios for your intended use case
- Balance flight time vs performance based on your priorities
- Check component compatibility warnings

## Technical Analysis

### Component Impact on Flight Parameters

#### Motor & Propulsion System

- **KV Rating Impact**: Higher KV = more speed, lower KV = more torque

  ```
  Max RPM = KV rating × Battery voltage
  Example: 2400KV motor with 4S (16.8V) = 40,320 RPM
  ```

- **Propeller Calculations**: Thrust formula implementation
  ```
  T = Ct × ρ × n² × D⁴
  Where: Ct = thrust coefficient, ρ = air density, n = RPM, D = diameter
  ```

#### Battery System Analysis

- **LiPo vs Li-Ion Characteristics**:

  - **LiPo**: Higher discharge rates (up to 100C), lighter weight
  - **Li-Ion**: Higher energy density, longer cycle life

- **Current Draw Estimation**:
  ```
  I = (Thrust × 3.5) ÷ Voltage
  Hover: 40-60% of max current
  Burst: 80-100% during maneuvers
  ```

#### Performance Classifications

- **Thrust-to-Weight Ratios**:
  - Acrobatic/Racing: >2.5:1
  - Sport/Freestyle: 2.0-2.5:1
  - Cinematic: 1.5-2.0:1
  - Long-range: 1.2-1.5:1

### Advanced Calculations

#### Motor Efficiency & Thermal Modeling

```
Efficiency (η) = (Mechanical Power Out ÷ Electrical Power In) × 100%
Temperature Rise = Power Loss × Thermal Resistance (°C)
```

#### Fixed-Wing Specific Analysis

- **Wing Loading**: Weight ÷ Wing Area

  - Low loading (<30 oz/ft²): Better slow-speed handling
  - High loading (>50 oz/ft²): Higher speeds, wind penetration

- **Center of Gravity**:
  - Conventional: 25-35% of mean aerodynamic chord
  - Flying wings: 15-25% (more critical)

## Use Cases

### 🏁 **FPV Racing**

Optimize for maximum speed and agility with minimal weight while maximizing thrust. Power system efficiency for competitive flight times.

### 🎬 **Cinematic/Photography**

Balance payload capacity with flight time. Smooth flight characteristics for stable footage and noise optimization.

### 🛫 **Long-Range/Explorer**

Maximum flight time and range calculations with efficient cruise configurations and battery optimization.

### 🔬 **Educational/Learning**

Understand component interactions, learn engineering principles, and experiment safely before purchases.

### 💼 **Professional Design**

Client consultation tool, performance validation, regulatory compliance, and documentation generation.

## Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly** across different browsers
5. **Submit a pull request**

### Contribution Guidelines

- **Code Style**: Use consistent indentation (2 spaces), meaningful variable names
- **Documentation**: Update README.md for new features
- **Testing**: Test on multiple browsers and devices
- **Performance**: Ensure changes don't impact calculation speed

### Areas for Contribution

- **Component Database**: Add new motors, batteries, frames
- **Calculations**: Improve accuracy of physics calculations
- **UI/UX**: Enhance user interface and experience
- **Features**: Add new analysis tools and visualizations
- **Documentation**: Improve guides and technical explanations

### Bug Reports

Use GitHub Issues with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/device information
- Screenshots if applicable

## Roadmap

### Version 1.1 (Q2 2024)

- [ ] Enhanced mobile responsive design
- [ ] Configuration export/import functionality
- [ ] Additional battery chemistry support
- [ ] Improved motor database

### Version 1.2 (Q3 2024)

- [ ] Multi-language support
- [ ] Advanced aerodynamic calculations
- [ ] Weather impact analysis
- [ ] Component cost tracking

### Version 2.0 (Q4 2024)

- [ ] 3D visualization of aircraft
- [ ] AI-powered optimization engine
- [ ] Community configuration sharing
- [ ] Advanced simulation features

## License

This project is licensed under the MIT License:

```
MIT License

Copyright (c) 2024 DroneSetup

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

- Thanks to the FPV and drone community for sharing knowledge and expertise
- Contributors who have helped develop and test this tool
- Open source libraries that make this project possible
- Beta testers and early adopters who provided valuable feedback

---

**Made with ❤️ for the drone community**

For questions, suggestions, or support, please [open an issue](https://github.com/enishyseni/dronesetup/issues) or reach out to the community.
