class DroneCharts {
    constructor(calculator) {
        this.calculator = calculator;
        this.charts = {
            speedChart: null,
            flightTimeChart: null,
            rangeChart: null,
            efficiencyChart: null
        };
    }

    initCharts() {
        // Set Chart.js global defaults
        Chart.defaults.color = '#ffffff';
        Chart.defaults.font.family = "'Roboto', sans-serif";
        Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.1)';
        
        // Set responsive options
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;

        // Create empty charts
        this.createSpeedChart([]);
        this.createFlightTimeChart([]);
        this.createRangeChart([]);
        this.createEfficiencyChart([]);
        
        // Add resize event listener to handle chart resizing
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleResize() {
        // Update all charts on window resize
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }

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
        
        // Update all charts with the new data
        this.createSpeedChart(data);
        this.createFlightTimeChart(data);
        this.createRangeChart(data);
        this.createEfficiencyChart(data);
        
        // Force layout update for charts
        setTimeout(() => {
            Object.values(this.charts).forEach(chart => {
                if (chart) {
                    chart.resize();
                }
            });
        }, 100);
    }
}
