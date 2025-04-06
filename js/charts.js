class DroneCharts {
    constructor(calculator, analyzer) {
        this.calculator = calculator;
        this.analyzer = analyzer;
        this.charts = {
            // Basic performance charts
            speedChart: null,
            flightTimeChart: null,
            rangeChart: null,
            efficiencyChart: null,
            
            // Weight analysis charts
            weightDistributionChart: null,
            payloadCapacityChart: null,
            weightComparisonChart: null,
            componentWeightChart: null,
            
            // Power usage charts
            currentDrawChart: null,
            powerToWeightChart: null,
            batteryDischargeChart: null,
            thermalEfficiencyChart: null,
            
            // Advanced charts
            thrustCurveChart: null,
            efficiencyMapChart: null,
            noiseChart: null,
            propEfficiencyChart: null
        };
        
        // Chart color palette
        this.colorPalette = [
            'rgba(54, 162, 235, 0.7)',   // Blue
            'rgba(255, 99, 132, 0.7)',   // Red
            'rgba(255, 206, 86, 0.7)',   // Yellow
            'rgba(75, 192, 192, 0.7)',   // Teal
            'rgba(153, 102, 255, 0.7)',  // Purple
            'rgba(255, 159, 64, 0.7)',   // Orange
            'rgba(199, 199, 199, 0.7)',  // Gray
            'rgba(83, 102, 255, 0.7)',   // Indigo
            'rgba(78, 205, 196, 0.7)',   // Mint
            'rgba(255, 99, 71, 0.7)'     // Tomato
        ];
    }

    initCharts() {
        // Set Chart.js global defaults
        Chart.defaults.color = '#ffffff';
        Chart.defaults.font.family = "'Roboto', sans-serif";
        Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.1)';
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;

        // Register Chart.js plugins if needed
        Chart.register(ChartDataLabels);

        // Create empty base charts (first tab)
        this.createSpeedChart([]);
        this.createFlightTimeChart([]);
        this.createRangeChart([]);
        this.createEfficiencyChart([]);
        
        // Add resize event listener
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Setup tab behavior
        this.setupTabs();
    }
    
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');
                
                // Create charts for this tab if they haven't been created yet
                this.createChartsForActiveTab(tabId);
                
                // Resize charts to fit new container
                setTimeout(() => this.handleResize(), 100);
            });
        });
    }
    
    createChartsForActiveTab(tabId) {
        const config = this.getCurrentConfig();
        const data = this.calculator.getComparisonData(config, 'batteryType');
        
        if (!data) return;
        
        // Make sure analyzer is defined before using it
        if (!this.analyzer) {
            console.error('Component analyzer is not defined');
            return;
        }
        
        switch(tabId) {
            case 'weight-tab':
                this.createWeightDistributionChart(config);
                this.createPayloadCapacityChart(data);
                this.createWeightComparisonChart(data);
                this.createComponentWeightChart(config);
                break;
                
            case 'power-tab':
                this.createCurrentDrawChart(data);
                this.createPowerToWeightChart(data);
                this.createBatteryDischargeChart(data);
                this.createThermalEfficiencyChart(config);
                break;
                
            case 'advanced-tab':
                this.createThrustCurveChart(config);
                this.createEfficiencyMapChart(config);
                this.createNoiseChart(config);
                this.createPropEfficiencyChart(config);
                break;
        }
    }
    
    getCurrentConfig() {
        // Get all configuration inputs
        const configInputs = document.querySelectorAll('.glass-select');
        const config = {};
        
        configInputs.forEach(input => {
            if (!input.parentElement.classList.contains('hidden')) {
                config[input.id] = input.value;
            }
        });
        
        return config;
    }
    
    handleResize() {
        // Update all visible charts on window resize
        const activeTabId = document.querySelector('.tab-content.active').id;
        const activeCharts = Array.from(document.querySelectorAll(`#${activeTabId} canvas`))
            .map(canvas => canvas.id);
        
        activeCharts.forEach(chartId => {
            if (this.charts[chartId]) {
                this.charts[chartId].resize();
            }
        });
    }

    // Basic Performance Charts
    
    createSpeedChart(data) {
        const ctx = document.getElementById('speedChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.speedChart) {
            this.charts.speedChart.destroy();
        }
        
        this.charts.speedChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => this.formatLabel(d.option)),
                datasets: [{
                    label: 'Max Speed (km/h)',
                    data: data.map(d => d.maxSpeed),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Maximum Speed Comparison',
                        font: {
                            size: 14
                        },
                        padding: {
                            top: 5,
                            bottom: 5
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Speed (km/h)',
                            font: {
                                size: 12
                            }
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }

    createFlightTimeChart(data) {
        const ctx = document.getElementById('flightTimeChart').getContext('2d');
        
        if (this.charts.flightTimeChart) {
            this.charts.flightTimeChart.destroy();
        }
        
        this.charts.flightTimeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => this.formatLabel(d.option)),
                datasets: [{
                    label: 'Flight Time (mins)',
                    data: data.map(d => d.flightTime),
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Flight Time Comparison',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time (mins)'
                        }
                    }
                }
            }
        });
    }

    createRangeChart(data) {
        const ctx = document.getElementById('rangeChart').getContext('2d');
        
        if (this.charts.rangeChart) {
            this.charts.rangeChart.destroy();
        }
        
        this.charts.rangeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => this.formatLabel(d.option)),
                datasets: [{
                    label: 'Range (m)',
                    data: data.map(d => d.range),
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Operating Range Comparison',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Range (m)'
                        }
                    }
                }
            }
        });
    }

    createEfficiencyChart(data) {
        const ctx = document.getElementById('efficiencyChart').getContext('2d');
        
        if (this.charts.efficiencyChart) {
            this.charts.efficiencyChart.destroy();
        }
        
        // Prepare data for the efficiency chart (weight to flight time ratio)
        // Lower ratio means more efficient (lighter weight for longer flight times)
        const efficiencyData = data.map(d => ({
            option: d.option,
            // Current draw during hover/cruise
            current: d.current
        }));
        
        this.charts.efficiencyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: efficiencyData.map(d => this.formatLabel(d.option)),
                datasets: [{
                    label: 'Current Draw (A)',
                    data: efficiencyData.map(d => d.current),
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Current Draw (Lower is Better)',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Current (A)'
                        }
                    }
                }
            }
        });
    }
    
    // Weight Analysis Charts
    
    createWeightDistributionChart(config) {
        const ctx = document.getElementById('weightDistributionChart').getContext('2d');
        
        if (this.charts.weightDistributionChart) {
            this.charts.weightDistributionChart.destroy();
        }
        
        // Make sure analyzer is defined
        if (!this.analyzer) {
            console.error('Component analyzer is not defined');
            return;
        }
        
        // Get component weight breakdown
        const components = this.analyzer.getWeightBreakdown(config);
        
        // Prepare data for pie chart
        const labels = [];
        const values = [];
        const backgroundColors = [];
        
        let i = 0;
        for (const [name, weight] of Object.entries(components)) {
            // Skip components with very low weight
            if (weight < 5) continue;
            
            labels.push(name.charAt(0).toUpperCase() + name.slice(1));
            values.push(weight);
            backgroundColors.push(this.colorPalette[i % this.colorPalette.length]);
            i++;
        }
        
        this.charts.weightDistributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Weight Distribution',
                        font: { size: 14 }
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            font: { size: 11 }
                        }
                    },
                    datalabels: {
                        formatter: (value, ctx) => {
                            const totalWeight = values.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / totalWeight) * 100);
                            return percentage >= 5 ? `${percentage}%` : '';
                        },
                        color: '#fff',
                        font: { size: 10, weight: 'bold' }
                    }
                }
            }
        });
    }
    
    createPayloadCapacityChart(data) {
        const ctx = document.getElementById('payloadCapacityChart').getContext('2d');
        
        if (this.charts.payloadCapacityChart) {
            this.charts.payloadCapacityChart.destroy();
        }
        
        this.charts.payloadCapacityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => this.formatLabel(d.option)),
                datasets: [{
                    label: 'Payload Capacity (g)',
                    data: data.map(d => d.payload),
                    backgroundColor: this.colorPalette[1],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Payload Capacity',
                        font: { size: 14 }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { 
                            display: true, 
                            text: 'Capacity (g)',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    createWeightComparisonChart(data) {
        const ctx = document.getElementById('weightComparisonChart').getContext('2d');
        
        if (this.charts.weightComparisonChart) {
            this.charts.weightComparisonChart.destroy();
        }
        
        this.charts.weightComparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => this.formatLabel(d.option)),
                datasets: [{
                    label: 'Total Weight (g)',
                    data: data.map(d => d.weight),
                    backgroundColor: this.colorPalette[2],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Total Weight Comparison',
                        font: { size: 14 }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { 
                            display: true, 
                            text: 'Weight (g)',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    createComponentWeightChart(config) {
        const ctx = document.getElementById('componentWeightChart').getContext('2d');
        
        if (this.charts.componentWeightChart) {
            this.charts.componentWeightChart.destroy();
        }
        
        // Compare weight of key components across different options
        const categories = this.calculator.droneType === 'fpv' ? 
            ['3inch', '5inch', '7inch', '10inch'] : 
            ['800', '1000', '1500', '2000'];
            
        const categoryKey = this.calculator.droneType === 'fpv' ? 'frameSize' : 'wingspan';
        
        const datasets = [];
        const componentLabels = this.calculator.droneType === 'fpv' ? 
            ['Frame', 'Motors', 'Battery', 'Electronics'] : 
            ['Airframe', 'Motor', 'Battery', 'Electronics'];
            
        // Create comparison data for each category
        categories.forEach((category, index) => {
            const tempConfig = {...config};
            tempConfig[categoryKey] = category;
            
            const components = this.analyzer.getWeightBreakdown(tempConfig);
            
            // Group some components together for clarity
            let electronics = 0;
            if (this.calculator.droneType === 'fpv') {
                electronics = (components.fc || 0) + 
                              (components.esc || 0) + 
                              (components.camera || 0) + 
                              (components.vtx || 0) + 
                              (components.receiver || 0);
            } else {
                electronics = components.electronics || 0;
            }
            
            const frameWeight = this.calculator.droneType === 'fpv' ? 
                (components.frame || 0) : (components.airframe || 0);
                
            const motorWeight = this.calculator.droneType === 'fpv' ?
                (components.motors || 0) : (components.motor || 0);
                
            datasets.push({
                label: this.formatLabel(category),
                data: [
                    frameWeight,
                    motorWeight,
                    components.battery || 0,
                    electronics
                ],
                backgroundColor: this.colorPalette[index % this.colorPalette.length]
            });
        });
        
        this.charts.componentWeightChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: componentLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Component Weights by Size',
                        font: { size: 14 }
                    },
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Component',
                            font: { size: 11 }
                        }
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Weight (g)',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    // Power Usage Charts
    
    createCurrentDrawChart(data) {
        const ctx = document.getElementById('currentDrawChart').getContext('2d');
        
        if (this.charts.currentDrawChart) {
            this.charts.currentDrawChart.destroy();
        }
        
        this.charts.currentDrawChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => this.formatLabel(d.option)),
                datasets: [{
                    label: 'Current Draw (A)',
                    data: data.map(d => d.current),
                    backgroundColor: this.colorPalette[3],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Current Draw Comparison',
                        font: { size: 14 }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Current (A)',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    createPowerToWeightChart(data) {
        const ctx = document.getElementById('powerToWeightChart').getContext('2d');
        
        if (this.charts.powerToWeightChart) {
            this.charts.powerToWeightChart.destroy();
        }
        
        // Extract numerical value from power-to-weight ratio
        const powerToWeightValues = data.map(d => {
            const pwrStr = this.calculator.calculatePowerToWeightRatio(
                { ...this.getCurrentConfig(), [Object.keys(data[0].option)[0]]: d.option },
                d.weight
            );
            return parseFloat(pwrStr.split(':')[0]);
        });
        
        this.charts.powerToWeightChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => this.formatLabel(d.option)),
                datasets: [{
                    label: 'Power-to-Weight Ratio',
                    data: powerToWeightValues,
                    backgroundColor: this.colorPalette[4],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Power-to-Weight Ratio',
                        font: { size: 14 }
                    },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.raw}:1`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Ratio',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    createBatteryDischargeChart(data) {
        const ctx = document.getElementById('batteryDischargeChart').getContext('2d');
        
        if (this.charts.batteryDischargeChart) {
            this.charts.batteryDischargeChart.destroy();
        }
        
        // Calculate discharge rates for each option
        const dischargeRates = data.map(d => {
            const tempConfig = { ...this.getCurrentConfig(), [Object.keys(data[0].option)[0]]: d.option };
            const dischargeStr = this.calculator.calculateBatteryDischargeRate(tempConfig, d.weight);
            return parseInt(dischargeStr.split('C')[0]); // Extract the numerical value
        });
        
        this.charts.batteryDischargeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => this.formatLabel(d.option)),
                datasets: [{
                    label: 'Required Discharge Rate (C)',
                    data: dischargeRates,
                    backgroundColor: this.colorPalette[5],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Battery Discharge Requirements',
                        font: { size: 14 }
                    },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.raw}C`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'C Rating',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    createThermalEfficiencyChart(config) {
        const ctx = document.getElementById('thermalEfficiencyChart').getContext('2d');
        
        if (this.charts.thermalEfficiencyChart) {
            this.charts.thermalEfficiencyChart.destroy();
        }
        
        // Get thermal data from analyzer
        const thermalData = this.analyzer.getThermalEfficiencyData(config);
        
        this.charts.thermalEfficiencyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: thermalData.map(d => `${d.throttle}%`),
                datasets: [{
                    label: 'Motor Temperature (°C)',
                    data: thermalData.map(d => d.temperature),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Motor Temperature',
                        font: { size: 14 }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Temperature (°C)',
                            font: { size: 11 }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Throttle',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    // Advanced Charts
    
    createThrustCurveChart(config) {
        const ctx = document.getElementById('thrustCurveChart').getContext('2d');
        
        if (this.charts.thrustCurveChart) {
            this.charts.thrustCurveChart.destroy();
        }
        
        // Get thrust curve data from analyzer
        const thrustData = this.analyzer.getThrustCurveData(config);
        
        this.charts.thrustCurveChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: thrustData.map(d => `${d.throttle}%`),
                datasets: [{
                    label: 'Thrust (g)',
                    data: thrustData.map(d => d.thrust),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Thrust Curve',
                        font: { size: 14 }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Thrust (g)',
                            font: { size: 11 }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Throttle',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    createEfficiencyMapChart(config) {
        const ctx = document.getElementById('efficiencyMapChart').getContext('2d');
        
        if (this.charts.efficiencyMapChart) {
            this.charts.efficiencyMapChart.destroy();
        }
        
        // Generate efficiency map for different motor KV options
        const kvOptions = ['1700', '2400', '2700', '3000'];
        const datasets = [];
        
        kvOptions.forEach((kv, index) => {
            const tempConfig = {...config, motorKv: kv};
            const throttleLevels = [0, 20, 40, 60, 80, 100];
            
            // Calculate efficiency at each throttle level
            const efficiencyData = throttleLevels.map(throttle => {
                // Higher KV is less efficient, especially at high throttle
                const baseEfficiency = 0.7 - (parseInt(kv) - 1700) / 1700 * 0.3;
                // Efficiency curve peaks at around 40-60% throttle
                const throttleFactor = 1 - Math.abs((throttle - 50) / 50);
                return baseEfficiency * (0.7 + throttleFactor * 0.3);
            });
            
            datasets.push({
                label: `${kv}KV`,
                data: efficiencyData,
                borderColor: this.colorPalette[index % this.colorPalette.length],
                backgroundColor: 'transparent',
                borderWidth: 2
            });
        });
        
        this.charts.efficiencyMapChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['0%', '20%', '40%', '60%', '80%', '100%'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Motor Efficiency Map',
                        font: { size: 14 }
                    },
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                            display: true,
                            text: 'Efficiency',
                            font: { size: 11 }
                        },
                        ticks: {
                            callback: (value) => `${Math.round(value * 100)}%`
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Throttle',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    createNoiseChart(config) {
        const ctx = document.getElementById('noiseChart').getContext('2d');
        
        if (this.charts.noiseChart) {
            this.charts.noiseChart.destroy();
        }
        
        // Get noise data from analyzer
        const noiseData = this.analyzer.getNoiseData(config);
        
        this.charts.noiseChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: noiseData.map(d => `${d.throttle}%`),
                datasets: [{
                    label: 'Noise Level (dB)',
                    data: noiseData.map(d => d.noise),
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Noise Levels',
                        font: { size: 14 }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Noise (dB)',
                            font: { size: 11 }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Throttle',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
    
    createPropEfficiencyChart(config) {
        const ctx = document.getElementById('propEfficiencyChart').getContext('2d');
        
        if (this.charts.propEfficiencyChart) {
            this.charts.propEfficiencyChart.destroy();
        }
        
        // Get propeller efficiency data from analyzer
        const propData = this.analyzer.getPropEfficiencyData(config);
        
        this.charts.propEfficiencyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: propData.map(d => `${d.throttle}%`),
                datasets: [{
                    label: 'Propeller Efficiency',
                    data: propData.map(d => d.efficiency),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Propeller Efficiency',
                        font: { size: 14 }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                            display: true,
                            text: 'Efficiency',
                            font: { size: 11 }
                        },
                        ticks: {
                            callback: (value) => `${Math.round(value * 100)}%`
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Throttle',
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    formatLabel(label) {
        // Format the labels to make them more readable
        if (label.includes('lipo') || label.includes('liion')) {
            const parts = label.split('-');
            return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} ${parts[1]}`;
        }
        if (label.includes('inch')) {
            return label;
        }
        // Check if it's a number (capacity or wing span)
        if (!isNaN(parseInt(label))) {
            if (parseInt(label) > 500) {
                return `${label}mm`;  // It's wingspan
            } else {
                return `${label}mAh`; // It's capacity
            }
        }
        return label;
    }

    updateCharts(config, primaryMetric) {
        // Get comparison data for the selected metric
        const data = this.calculator.getComparisonData(config, primaryMetric);
        
        if (!data) return;
        
        // Update charts on current tab
        const activeTabId = document.querySelector('.tab-content.active').id;
        
        switch (activeTabId) {
            case 'performance-tab':
                this.createSpeedChart(data);
                this.createFlightTimeChart(data);
                this.createRangeChart(data);
                this.createEfficiencyChart(data);
                break;
                
            case 'weight-tab':
                this.createWeightDistributionChart(config);
                this.createPayloadCapacityChart(data);
                this.createWeightComparisonChart(data);
                this.createComponentWeightChart(config);
                break;
                
            case 'power-tab':
                this.createCurrentDrawChart(data);
                this.createPowerToWeightChart(data);
                this.createBatteryDischargeChart(data);
                this.createThermalEfficiencyChart(config);
                break;
                
            case 'advanced-tab':
                this.createThrustCurveChart(config);
                this.createEfficiencyMapChart(config);
                this.createNoiseChart(config);
                this.createPropEfficiencyChart(config);
                break;
        }
        
        // Update component analysis section
        const analysis = this.analyzer.analyzeConfiguration(config);
        document.getElementById('heaviestComponent').textContent = analysis.heaviestComponent;
        document.getElementById('limitingFactor').textContent = analysis.limitingFactor;
        document.getElementById('suggestedImprovement').textContent = analysis.suggestedImprovement;
        
        // Force layout update for charts
        setTimeout(() => this.handleResize(), 100);
    }
}
