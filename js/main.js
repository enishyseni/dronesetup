document.addEventListener('DOMContentLoaded', function() {
    // Initialize the calculator with error handling
    let calculator, componentAnalyzer, droneCharts;
    let sensitivityChart = null;
    const snapshots = [];
    
    try {
        calculator = new DroneCalculator();
        componentAnalyzer = new ComponentAnalyzer(calculator);
        droneCharts = new DroneCharts(calculator, componentAnalyzer);
    } catch (error) {
        console.error('Failed to initialize calculators:', error);
        showUserError('Failed to initialize application. Please refresh the page.');
        return;
    }
    
    // Get all configuration inputs
    const configInputs = document.querySelectorAll('.glass-select');
    const configSliders = document.querySelectorAll('.config-slider');
    const droneTypeToggle = document.getElementById('droneTypeToggle');
    const fixedWingOnlyElements = document.querySelectorAll('.fixed-wing-only');
    
    // Config mapping for translating slider values to config values
    const sliderConfigMap = {
        batteryCapacity: ['1300', '1500', '2200', '3000', '4000', '5000'],
        batteryType: ['lipo-3s', 'lipo-4s', 'lipo-6s', 'liion-3s', 'liion-4s', 'liion-6s'],
        frameSize: ['3inch', '5inch', '7inch', '10inch'],
        wingspan: ['800', '1000', '1500', '2000'],
        motorKv: ['1700', '2400', '2700', '3000'],
        vtxPower: ['25', '200', '600', '1000']
    };
    
    // Initialize sliders based on current config values
    function initSliders() {
        configSliders.forEach(slider => {
            const configParam = slider.dataset.config;
            const configValue = document.getElementById(configParam).value;
            const valueIndex = sliderConfigMap[configParam].indexOf(configValue);
            slider.value = valueIndex >= 0 ? valueIndex : 0;
            
            // Add event listener for slider changes
            slider.addEventListener('input', handleSliderChange);
        });
    }
    
    // Update sliders for fixed wing / FPV switch
    function updateSlidersForDroneType() {
        const fpvSliders = document.querySelectorAll('.slider-container[data-target="frameSize"]');
        const fixedWingSliders = document.querySelectorAll('.slider-container[data-target="wingspan"]');
        
        if (calculator.droneType === 'fpv') {
            fpvSliders.forEach(slider => slider.classList.remove('hidden'));
            fixedWingSliders.forEach(slider => slider.classList.add('hidden'));
        } else {
            fpvSliders.forEach(slider => slider.classList.add('hidden'));
            fixedWingSliders.forEach(slider => slider.classList.remove('hidden'));
        }
    }
    
    // Handle slider changes
    function handleSliderChange(e) {
        const slider = e.target;
        const configParam = slider.dataset.config;
        const valueIndex = parseInt(slider.value);
        const configValue = sliderConfigMap[configParam][valueIndex];
        
        // Update the corresponding select element
        const selectElement = document.getElementById(configParam);
        if (selectElement) {
            selectElement.value = configValue;
            // Trigger change event to update calculations
            const event = new Event('change');
            selectElement.dispatchEvent(event);
        }
    }
    
    // Function to collect current configuration
    // Always include ALL inputs — hidden inputs still hold valid values needed by calculations
    function getCurrentConfig() {
        const config = {};
        configInputs.forEach(input => {
            config[input.id] = input.value;
        });
        return config;
    }

    // Get the active comparison metric from the "Analyze Impact By" selector
    function getCompareMetric() {
        const compareBySelect = document.getElementById('compareBy');
        return compareBySelect ? compareBySelect.value : 'batteryType';
    }

    function parseNumberFromMetric(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        const match = String(value).match(/-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function getEnvironmentState() {
        return {
            altitude: parseFloat(document.getElementById('envAltitude')?.value || '0'),
            temperature: parseFloat(document.getElementById('envTemperature')?.value || '20'),
            wind: parseFloat(document.getElementById('envWind')?.value || '0'),
            batteryHealth: parseFloat(document.getElementById('batteryHealth')?.value || '100'),
            batteryCycles: parseFloat(document.getElementById('batteryCycles')?.value || '0')
        };
    }

    function calculateDetailedMetrics(config) {
        const totalWeight = calculator.droneType === 'fpv'
            ? calculator.calculateFPVDroneWeight(config)
            : calculator.calculateFixedWingWeight(config);

        return {
            totalWeight,
            flightTime: calculator.calculateFlightTime(config, totalWeight),
            payloadCapacity: calculator.calculatePayloadCapacity(config, totalWeight),
            maxSpeed: calculator.calculateMaxSpeed(config),
            range: calculator.calculateRange(config),
            hoverCurrent: calculator.calculateHoverCurrent(config, totalWeight),
            powerToWeight: parseNumberFromMetric(calculator.calculatePowerToWeightRatio(config, totalWeight)),
            dischargeRate: parseNumberFromMetric(calculator.calculateBatteryDischargeRate(config, totalWeight))
        };
    }

    function applyOperationalAdjustments(baseMetrics) {
        const env = getEnvironmentState();
        const airDensityFactor = Math.exp(-env.altitude / 8500);
        const tempFactor = env.temperature < 15
            ? (1 - (15 - env.temperature) * 0.005)
            : env.temperature > 30
                ? (1 - (env.temperature - 30) * 0.004)
                : 1;
        const cycleFactor = clamp(1 - env.batteryCycles * 0.0006, 0.7, 1);
        const healthFactor = clamp((env.batteryHealth / 100) * tempFactor * cycleFactor, 0.6, 1.05);
        const windFactor = clamp(1 - env.wind / 220, 0.5, 1);
        const liftFactor = Math.pow(airDensityFactor, 0.35);

        return {
            ...baseMetrics,
            flightTime: baseMetrics.flightTime * healthFactor * windFactor,
            maxSpeed: baseMetrics.maxSpeed * Math.pow(airDensityFactor, 0.25) * clamp(1 - env.wind / 260, 0.6, 1),
            payloadCapacity: baseMetrics.payloadCapacity * liftFactor,
            range: baseMetrics.range * healthFactor * clamp(1 - env.wind / 180, 0.55, 1),
            hoverCurrent: baseMetrics.hoverCurrent / (healthFactor * liftFactor),
            powerToWeight: baseMetrics.powerToWeight * liftFactor * healthFactor,
            dischargeRate: baseMetrics.dischargeRate / (healthFactor * liftFactor),
            envFactors: { airDensityFactor, tempFactor, cycleFactor, healthFactor, windFactor, liftFactor }
        };
    }

    function formatAdjustedMetrics(metrics) {
        return {
            totalWeight: `${metrics.totalWeight.toFixed(2)}g`,
            flightTime: `${metrics.flightTime.toFixed(2)} mins`,
            payloadCapacity: `${Math.max(0, metrics.payloadCapacity).toFixed(2)}g`,
            maxSpeed: `${Math.max(0, metrics.maxSpeed).toFixed(2)} km/h`,
            powerToWeight: `${Math.max(0, metrics.powerToWeight).toFixed(2)}:1`,
            range: `${Math.max(0, metrics.range).toFixed(2)} m`,
            dischargeRate: `${Math.max(0, Math.ceil(metrics.dischargeRate / 5) * 5)}C`,
            hoverCurrent: `${Math.max(0, metrics.hoverCurrent).toFixed(2)} A`
        };
    }

    function getCostBreakdown(config) {
        const priceMaps = {
            frameSize: { '3inch': 45, '5inch': 65, '7inch': 90, '10inch': 130 },
            wingspan: { '800': 120, '1000': 160, '1500': 240, '2000': 340 },
            motorKv: { '1700': 95, '2400': 85, '2700': 90, '3000': 100 },
            flightController: { f4: 45, f7: 65, h7: 95 },
            camera: { analog: 35, digital: 120, digital4k: 180 },
            batteryType: { 'lipo-3s': 45, 'lipo-4s': 55, 'lipo-6s': 85, 'liion-3s': 60, 'liion-4s': 75, 'liion-6s': 110 },
            batteryCapacity: { '1300': 0, '1500': 8, '2200': 18, '3000': 28, '4000': 45, '5000': 62 },
            vtxPower: { '25': 25, '200': 40, '600': 65, '1000': 90 },
            wingType: { conventional: 0, flying: 25, delta: 35 }
        };

        const items = [];
        if (calculator.droneType === 'fpv') {
            items.push({ label: 'Frame Kit', cost: priceMaps.frameSize[config.frameSize] || 0 });
        } else {
            items.push({ label: 'Airframe Kit', cost: (priceMaps.wingspan[config.wingspan] || 0) + (priceMaps.wingType[config.wingType] || 0) });
        }
        items.push({ label: 'Motors', cost: priceMaps.motorKv[config.motorKv] || 0 });
        items.push({ label: 'Flight Controller', cost: priceMaps.flightController[config.flightController] || 0 });
        items.push({ label: 'Camera System', cost: priceMaps.camera[config.camera] || 0 });
        items.push({ label: 'Battery Pack', cost: (priceMaps.batteryType[config.batteryType] || 0) + (priceMaps.batteryCapacity[config.batteryCapacity] || 0) });
        items.push({ label: 'VTX/Link', cost: priceMaps.vtxPower[config.vtxPower] || 0 });
        items.push({ label: 'ESC + Receiver + Misc', cost: 85 });

        const total = items.reduce((sum, i) => sum + i.cost, 0);
        return { items, total };
    }

    function updateBomAndCost(config, adjustedMetrics) {
        const bomList = document.getElementById('bomList');
        const bomTotal = document.getElementById('bomTotal');
        const costEfficiency = document.getElementById('costEfficiency');
        if (!bomList || !bomTotal || !costEfficiency) return;

        const breakdown = getCostBreakdown(config);
        bomList.innerHTML = breakdown.items
            .map(item => `<li>${item.label}: $${item.cost.toFixed(2)}</li>`)
            .join('');

        bomTotal.textContent = `Total Cost: $${breakdown.total.toFixed(2)}`;
        const costPerMin = adjustedMetrics.flightTime > 0 ? breakdown.total / adjustedMetrics.flightTime : 0;
        costEfficiency.textContent = `Cost Efficiency: $${costPerMin.toFixed(2)} / min`;
    }

    function updateConfidenceBands(adjustedMetrics) {
        const rows = [
            ['confFlightTime', adjustedMetrics.flightTime, 'min'],
            ['confMaxSpeed', adjustedMetrics.maxSpeed, 'km/h'],
            ['confRange', adjustedMetrics.range, 'm'],
            ['confPayload', adjustedMetrics.payloadCapacity, 'g']
        ];

        rows.forEach(([id, value, unit]) => {
            const el = document.getElementById(id);
            if (!el) return;
            const best = value * 1.12;
            const typical = value;
            const worst = value * 0.88;
            el.textContent = `${best.toFixed(2)} / ${typical.toFixed(2)} / ${Math.max(0, worst).toFixed(2)} ${unit}`;
        });
    }

    function updateSafetyChecks(config, adjustedMetrics) {
        const safetyList = document.getElementById('safetyChecks');
        if (!safetyList) return;

        const warnings = [];
        const dischargeLimit = config.batteryType.startsWith('lipo') ? 100 : 15;
        if (adjustedMetrics.dischargeRate > dischargeLimit) {
            warnings.push(`Required C-rate (${adjustedMetrics.dischargeRate.toFixed(0)}C) exceeds ${config.batteryType.toUpperCase()} safe limit.`);
        }
        if (adjustedMetrics.hoverCurrent > 30 && calculator.droneType === 'fpv') {
            warnings.push('Hover current is very high; thermal overload risk on ESC/motors.');
        }
        if (adjustedMetrics.payloadCapacity < 150 && calculator.droneType === 'fpv') {
            warnings.push('Very low payload headroom; handling may feel unstable.');
        }
        if (adjustedMetrics.range < 700) {
            warnings.push('Low projected range; consider VTX, battery, or efficiency changes.');
        }
        if (adjustedMetrics.flightTime < 5) {
            warnings.push('Very short flight time; battery stress and mission margin are poor.');
        }

        if (warnings.length === 0) {
            safetyList.innerHTML = '<li>No critical safety flags detected for current scenario.</li>';
        } else {
            safetyList.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
        }
    }

    function generateSensitivityData(config, baselineMetrics) {
        const optionSets = {
            batteryType: ['lipo-3s', 'lipo-4s', 'lipo-6s', 'liion-3s', 'liion-4s', 'liion-6s'],
            batteryCapacity: ['1300', '1500', '2200', '3000', '4000', '5000'],
            motorKv: ['1700', '2400', '2700', '3000'],
            vtxPower: ['25', '200', '600', '1000'],
            frameSize: ['3inch', '5inch', '7inch', '10inch'],
            wingspan: ['800', '1000', '1500', '2000'],
            wingType: ['conventional', 'flying', 'delta']
        };

        const params = calculator.droneType === 'fpv'
            ? ['batteryType', 'batteryCapacity', 'motorKv', 'frameSize', 'vtxPower']
            : ['batteryType', 'batteryCapacity', 'motorKv', 'wingspan', 'wingType', 'vtxPower'];

        const labels = [];
        const impacts = [];

        params.forEach(param => {
            const options = optionSets[param];
            if (!options) return;
            const currentValue = config[param];
            const idx = options.indexOf(currentValue);
            const nextIndex = idx < options.length - 1 ? idx + 1 : Math.max(0, idx - 1);
            if (nextIndex === idx) return;

            const testConfig = { ...config, [param]: options[nextIndex] };
            const testBase = calculateDetailedMetrics(testConfig);
            const testAdjusted = applyOperationalAdjustments(testBase);

            const pct = (
                Math.abs((testAdjusted.flightTime - baselineMetrics.flightTime) / Math.max(1, baselineMetrics.flightTime)) +
                Math.abs((testAdjusted.maxSpeed - baselineMetrics.maxSpeed) / Math.max(1, baselineMetrics.maxSpeed)) +
                Math.abs((testAdjusted.range - baselineMetrics.range) / Math.max(1, baselineMetrics.range)) +
                Math.abs((testAdjusted.payloadCapacity - baselineMetrics.payloadCapacity) / Math.max(1, baselineMetrics.payloadCapacity))
            ) / 4 * 100;

            labels.push(param);
            impacts.push(parseFloat(pct.toFixed(2)));
        });

        return { labels, impacts };
    }

    function updateSensitivityChart(config, adjustedMetrics) {
        const canvas = document.getElementById('sensitivityChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const sensitivity = generateSensitivityData(config, adjustedMetrics);
        if (!sensitivity.labels.length) return;

        if (sensitivityChart) {
            sensitivityChart.destroy();
        }

        sensitivityChart = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: sensitivity.labels,
                datasets: [{
                    label: 'Average Output Sensitivity (%)',
                    data: sensitivity.impacts,
                    backgroundColor: 'rgba(108, 99, 255, 0.7)',
                    borderColor: 'rgba(108, 99, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(2)}% avg impact`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Impact (%)' }
                    }
                }
            }
        });
    }

    function refreshSnapshotSelectors() {
        const a = document.getElementById('snapshotA');
        const b = document.getElementById('snapshotB');
        if (!a || !b) return;

        const options = snapshots
            .map((s, i) => `<option value="${i}">${s.name}</option>`)
            .join('');
        a.innerHTML = options;
        b.innerHTML = options;
    }

    function updateSnapshotsList() {
        const list = document.getElementById('snapshotList');
        if (!list) return;

        list.innerHTML = snapshots
            .map((s, i) => `<li>${i + 1}. ${s.name} — ${s.metrics.flightTime.toFixed(2)} min, ${s.metrics.range.toFixed(0)} m, ${s.metrics.totalWeight.toFixed(0)} g</li>`)
            .join('');
    }

    function compareSnapshots() {
        const aIndex = parseInt(document.getElementById('snapshotA')?.value || '-1');
        const bIndex = parseInt(document.getElementById('snapshotB')?.value || '-1');
        const out = document.getElementById('snapshotDiff');
        if (!out) return;

        if (aIndex < 0 || bIndex < 0 || !snapshots[aIndex] || !snapshots[bIndex]) {
            out.textContent = 'Select two valid snapshots to compare.';
            return;
        }

        const A = snapshots[aIndex];
        const B = snapshots[bIndex];
        const diff = (k) => (B.metrics[k] - A.metrics[k]);

        out.textContent = [
            `${A.name} → ${B.name}`,
            `Flight Time: ${diff('flightTime').toFixed(2)} min`,
            `Max Speed: ${diff('maxSpeed').toFixed(2)} km/h`,
            `Range: ${diff('range').toFixed(2)} m`,
            `Payload: ${diff('payloadCapacity').toFixed(2)} g`,
            `Weight: ${diff('totalWeight').toFixed(2)} g`,
            `Hover Current: ${diff('hoverCurrent').toFixed(2)} A`
        ].join('\n');
    }

    function saveSnapshot(config, adjustedMetrics) {
        const nameInput = document.getElementById('snapshotName');
        const name = nameInput && nameInput.value.trim()
            ? nameInput.value.trim()
            : `Snapshot ${snapshots.length + 1}`;

        snapshots.push({
            name,
            timestamp: new Date().toISOString(),
            config: { ...config },
            metrics: { ...adjustedMetrics },
            environment: getEnvironmentState()
        });

        if (nameInput) nameInput.value = '';
        updateSnapshotsList();
        refreshSnapshotSelectors();
    }

    function exportReport(config, adjustedMetrics) {
        const report = {
            generatedAt: new Date().toISOString(),
            droneType: calculator.droneType,
            config,
            environment: getEnvironmentState(),
            adjustedMetrics,
            bom: getCostBreakdown(config),
            snapshotsCount: snapshots.length
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `drone-report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // Sync all slider positions to match the current select values
    function syncSlidersToSelects() {
        configSliders.forEach(slider => {
            const configParam = slider.dataset.config;
            const selectEl = document.getElementById(configParam);
            if (!selectEl || !sliderConfigMap[configParam]) return;
            const valueIndex = sliderConfigMap[configParam].indexOf(selectEl.value);
            if (valueIndex >= 0) slider.value = valueIndex;
        });
    }

    function applyMissionProfile(profileId) {
        const profiles = {
            freestyle: { type: 'fpv', frameSize: '5inch', motorKv: '2700', batteryType: 'lipo-6s', batteryCapacity: '1500', camera: 'digital', vtxPower: '600', flightController: 'f7' },
            longrange: { type: 'fpv', frameSize: '7inch', motorKv: '1700', batteryType: 'liion-6s', batteryCapacity: '4000', camera: 'digital', vtxPower: '200', flightController: 'f7' },
            cinematic: { type: 'fpv', frameSize: '5inch', motorKv: '2400', batteryType: 'lipo-4s', batteryCapacity: '2200', camera: 'digital4k', vtxPower: '200', flightController: 'h7' },
            trainer: { type: 'fpv', frameSize: '3inch', motorKv: '1700', batteryType: 'lipo-3s', batteryCapacity: '1300', camera: 'analog', vtxPower: '25', flightController: 'f4' },
            cruise_fw: { type: 'fixedWing', wingspan: '1500', wingType: 'conventional', motorKv: '1700', batteryType: 'liion-4s', batteryCapacity: '4000', camera: 'digital', vtxPower: '200', flightController: 'f7' },
            efficiency_fw: { type: 'fixedWing', wingspan: '2000', wingType: 'flying', motorKv: '1700', batteryType: 'liion-6s', batteryCapacity: '5000', camera: 'analog', vtxPower: '200', flightController: 'f7' },
            speed_fw: { type: 'fixedWing', wingspan: '1000', wingType: 'delta', motorKv: '3000', batteryType: 'lipo-6s', batteryCapacity: '2200', camera: 'digital', vtxPower: '600', flightController: 'h7' }
        };

        const profile = profiles[profileId];
        if (!profile) return;

        const shouldBeFixedWing = profile.type === 'fixedWing';
        if (droneTypeToggle.checked !== shouldBeFixedWing) {
            droneTypeToggle.checked = shouldBeFixedWing;
            toggleDroneType();
        }

        Object.entries(profile).forEach(([key, value]) => {
            if (key === 'type') return;
            const el = document.getElementById(key);
            if (el) el.value = value;
        });

        syncSlidersToSelects();
        updateResults();
        droneCharts.updateCharts(getCurrentConfig(), getCompareMetric());
    }

    function solveConstraints() {
        const targetFlightTime = parseFloat(document.getElementById('targetFlightTime')?.value || '0');
        const targetMaxWeight = parseFloat(document.getElementById('targetMaxWeight')?.value || '999999');
        const targetMinRange = parseFloat(document.getElementById('targetMinRange')?.value || '0');
        const targetMinPayload = parseFloat(document.getElementById('targetMinPayload')?.value || '0');

        const base = getCurrentConfig();
        const values = {
            batteryType: ['lipo-3s', 'lipo-4s', 'lipo-6s', 'liion-3s', 'liion-4s', 'liion-6s'],
            batteryCapacity: ['1300', '1500', '2200', '3000', '4000', '5000'],
            motorKv: ['1700', '2400', '2700', '3000'],
            vtxPower: ['25', '200', '600', '1000'],
            frameSize: ['3inch', '5inch', '7inch', '10inch'],
            wingspan: ['800', '1000', '1500', '2000'],
            wingType: ['conventional', 'flying', 'delta']
        };

        let best = null;
        const isFPV = calculator.droneType === 'fpv';

        const iterate = isFPV
            ? (cb) => {
                values.frameSize.forEach(frameSize =>
                    values.motorKv.forEach(motorKv =>
                        values.batteryType.forEach(batteryType =>
                            values.batteryCapacity.forEach(batteryCapacity =>
                                values.vtxPower.forEach(vtxPower => cb({ ...base, frameSize, motorKv, batteryType, batteryCapacity, vtxPower }))
                            )
                        )
                    )
                );
            }
            : (cb) => {
                values.wingspan.forEach(wingspan =>
                    values.wingType.forEach(wingType =>
                        values.motorKv.forEach(motorKv =>
                            values.batteryType.forEach(batteryType =>
                                values.batteryCapacity.forEach(batteryCapacity =>
                                    values.vtxPower.forEach(vtxPower => cb({ ...base, wingspan, wingType, motorKv, batteryType, batteryCapacity, vtxPower }))
                                )
                            )
                        )
                    )
                );
            };

        iterate(candidate => {
            const raw = calculateDetailedMetrics(candidate);
            const adjusted = applyOperationalAdjustments(raw);
            if (adjusted.flightTime < targetFlightTime) return;
            if (adjusted.totalWeight > targetMaxWeight) return;
            if (adjusted.range < targetMinRange) return;
            if (adjusted.payloadCapacity < targetMinPayload) return;

            const score = adjusted.flightTime * 0.45 + adjusted.range / 1000 * 0.35 + adjusted.payloadCapacity / 1000 * 0.2;
            if (!best || score > best.score) {
                best = { config: candidate, metrics: adjusted, score };
            }
        });

        const resultEl = document.getElementById('solverResult');
        const resultBodyEl = document.getElementById('solverResultBody');

        if (!best) {
            if (resultEl) {
                resultEl.style.display = 'block';
                resultEl.style.borderColor = 'rgba(255,71,87,0.5)';
                resultEl.style.background = 'rgba(255,71,87,0.1)';
                const titleEl = resultEl.querySelector('.solver-result-title');
                if (titleEl) titleEl.textContent = 'No Match Found';
                if (resultBodyEl) resultBodyEl.textContent = 'No configuration met all constraints. Try looser targets.';
            }
            showUserWarning('No configuration met all constraints. Try looser targets.');
            return;
        }

        Object.entries(best.config).forEach(([key, value]) => {
            const el = document.getElementById(key);
            if (el) el.value = value;
        });

        syncSlidersToSelects();
        updateResults();
        droneCharts.updateCharts(getCurrentConfig(), getCompareMetric());

        if (resultEl && resultBodyEl) {
            resultEl.style.display = 'block';
            resultEl.style.borderColor = 'rgba(108,99,255,0.4)';
            resultEl.style.background = 'rgba(108,99,255,0.15)';
            const titleEl = resultEl.querySelector('.solver-result-title');
            if (titleEl) titleEl.textContent = 'Best Match Applied ✓';
            const m = best.metrics;
            const c = best.config;
            const frameLabel = calculator.droneType === 'fpv'
                ? `Frame: ${c.frameSize}`
                : `Wing: ${c.wingspan}mm (${c.wingType})`;
            const lines = [
                `${frameLabel}  |  Motor: ${c.motorKv}KV`,
                `Battery: ${c.batteryType}  ${c.batteryCapacity}mAh  |  VTX: ${c.vtxPower}mW`,
                `Flight Time: ${m.flightTime.toFixed(1)} min  |  Range: ${m.range.toFixed(0)} m`,
                `Weight: ${m.totalWeight.toFixed(0)} g  |  Payload: ${m.payloadCapacity.toFixed(0)} g`
            ];
            resultBodyEl.textContent = lines.join('\n');
        }

        showUserInfo(`Solver applied best match: ${best.metrics.flightTime.toFixed(1)} min, ${best.metrics.range.toFixed(0)} m.`);
    }
    
    // Enhanced function to update results with error handling
    function updateResults() {
        try {
            const config = getCurrentConfig();
            
            // Validate configuration
            if (!calculator.validateConfig(config)) {
                showUserWarning('Invalid configuration detected. Please check your settings.');
                return;
            }
            
            // Calculate metrics using calculator + environment/battery condition modifiers
            const rawMetrics = calculateDetailedMetrics(config);
            const adjustedMetrics = applyOperationalAdjustments(rawMetrics);
            const metrics = formatAdjustedMetrics(adjustedMetrics);
            
            // Use the existing analyzer instance that was properly initialized
            const analysisData = componentAnalyzer.analyzeConfiguration(config);
            
            // Update UI with calculations
            safelyUpdateElementText('heaviestComponent', analysisData.heaviestComponent);
            safelyUpdateElementText('limitingFactor', analysisData.limitingFactor);
            safelyUpdateElementText('suggestedImprovement', analysisData.suggestedImprovement);
            
            // Update overall score if element exists
            if (analysisData.overallScore !== undefined) {
                safelyUpdateElementText('overallScore', `${analysisData.overallScore}/100`);
            }
            
            // Update optimization suggestions
            if (analysisData.optimizationSuggestions && document.getElementById('optimizationSuggestions')) {
                const suggestionsElement = document.getElementById('optimizationSuggestions');
                suggestionsElement.innerHTML = analysisData.optimizationSuggestions
                    .map(suggestion => `<li>${suggestion}</li>`)
                    .join('');
            }
            
            // Update power system optimization details if these elements exist
            if (document.getElementById('optimalPowerBand')) {
                const powerSystemData = componentAnalyzer.getPowerSystemOptimization(config);
                document.getElementById('optimalPowerBand').textContent = 
                    `${powerSystemData.optimalPowerBand.min}W - ${powerSystemData.optimalPowerBand.max}W`;
            }
            
            if (document.getElementById('maxRPM')) {
                const motorKv = parseInt(config.motorKv);
                const batteryType = config.batteryType.split('-')[0];
                const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
                const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
                const batteryVoltage = cellCount * cellVoltage;
                const maxRPM = calculator.calculateMaxRPM(motorKv, batteryVoltage);
                document.getElementById('maxRPM').textContent = `${maxRPM.toFixed(0)} RPM`;
            }
            
            // Update basic metrics that are likely to exist
            safelyUpdateElementText('totalWeight', `${metrics.totalWeight}`);
            safelyUpdateElementText('flightTime', `${metrics.flightTime}`);
            safelyUpdateElementText('maxSpeed', `${metrics.maxSpeed}`);
            safelyUpdateElementText('powerToWeight', `${metrics.powerToWeight}`);
            safelyUpdateElementText('range', `${metrics.range}`);
            safelyUpdateElementText('payloadCapacity', `${metrics.payloadCapacity}`);
            safelyUpdateElementText('dischargeRate', `${metrics.dischargeRate}`);
            safelyUpdateElementText('hoverCurrent', `${metrics.hoverCurrent}`);
            
            // Update advanced metrics only if enabled in the UI
            if (document.querySelector('.advanced-metrics')) {
                updateAdvancedMetrics(config);
            }

            updateBomAndCost(config, adjustedMetrics);
            updateConfidenceBands(adjustedMetrics);
            updateSafetyChecks(config, adjustedMetrics);
            updateSensitivityChart(config, adjustedMetrics);
            
            // Charts are updated separately by callers using the compareBy metric
            // to avoid redundant double-updates
        } catch (error) {
            console.error('Error updating results:', error);
            showUserError('Error calculating results. Please check your configuration.');
        }
    }
    
    // Helper function to safely update element text only if element exists
    function safelyUpdateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }
    
    // Previous updateElementText function is now just for logging
    // (Removed - superseded by safelyUpdateElementText)
    
    // Function to update advanced metrics with null checks
    function updateAdvancedMetrics(config) {
        // Calculate motor RPM
        const rpm = calculator.calculateMotorRPM(config);
        safelyUpdateElementText('motorRPM', `${rpm.toFixed(2)} RPM`);
        
        // Calculate thrust
        const thrust = calculator.calculateThrust(config);
        safelyUpdateElementText('motorThrust', `${thrust.toFixed(2)}g`);
        
        // Calculate motor efficiency
        const efficiency = calculator.calculateMotorEfficiency(config);
        safelyUpdateElementText('motorEfficiency', `${efficiency.toFixed(2)}%`);
        
        // Calculate recommended PID values
        const pids = calculator.calculateRecommendedPIDValues(config);
        safelyUpdateElementText('recommendedP', pids.P.toFixed(2));
        safelyUpdateElementText('recommendedI', pids.I.toFixed(2));
        safelyUpdateElementText('recommendedD', pids.D.toFixed(2));
    }
    
    // Function to toggle between drone types
    function toggleDroneType() {
        const isFPV = !droneTypeToggle.checked;
        const fpvOnlyElements = document.querySelectorAll('.fpv-only');
        
        if (isFPV) {
            calculator.setDroneType('fpv');
            fixedWingOnlyElements.forEach(el => el.classList.add('hidden'));
            fpvOnlyElements.forEach(el => el.classList.remove('hidden'));
        } else {
            calculator.setDroneType('fixedWing');
            fixedWingOnlyElements.forEach(el => el.classList.remove('hidden'));
            fpvOnlyElements.forEach(el => el.classList.add('hidden'));
        }
        
        // Also update the analyzer's drone type if needed
        componentAnalyzer.setDroneType && componentAnalyzer.setDroneType(calculator.droneType);
        
        // Update sliders for the current drone type
        updateSlidersForDroneType();
        
        updateResults();
        droneCharts.updateCharts(getCurrentConfig(), getCompareMetric());
    }
    
    // REVISED chart initialization with pre-loading data for comparison charts
    function initializeChartsWithData() {
        try {
            console.log("Initializing charts with data...");
            // First initialize the charts
            droneCharts.initCharts();
            
            // Get current configuration
            const config = getCurrentConfig();
            
            // Force data generation for all comparison metrics
            const comparisonMetrics = ['batteryType', 'batteryCapacity', 'motorKv', 'frameSize', 'wingspan'];
            
            // Pre-generate the data for logging
            comparisonMetrics.forEach(metric => {
                const comparisonData = calculator.getComparisonData(config, metric);
                console.log(`Pre-generated data for ${metric} comparison: ${comparisonData ? comparisonData.length : 0} entries`);
            });
            
            // Now trigger the actual chart update
            console.log("Updating all charts with initial data");
            droneCharts.updateCharts(config, 'batteryCapacity');
            
            // Ensure specific graphs are properly initialized
            setTimeout(() => {
                console.log("Re-updating charts for completeness");
                droneCharts.updateCharts(config, null);
            }, 300);
            
            console.log("Charts initialized successfully");
        } catch (error) {
            console.error("Error initializing charts:", error);
        }
    }
    
    // Add a method to force redraw of all charts
    function forceChartRedraw() {
        // Resize all active Chart.js instances so they re-read their container
        // dimensions.  Do NOT toggle display:none — that collapses the container
        // and causes Chart.js to read 0-height, progressively shrinking charts.
        Object.values(droneCharts.charts).forEach(chart => {
            if (chart) {
                try { chart.resize(); } catch (_) { /* chart not attached */ }
            }
        });
        
        // Then update all charts with current config
        const config = getCurrentConfig();
        droneCharts.updateCharts(config, null);
    }
    
    // Add user notification functions
    function showUserError(message) {
        createNotification(message, 'error');
    }
    
    function showUserWarning(message) {
        createNotification(message, 'warning');
    }
    
    function showUserInfo(message) {
        createNotification(message, 'info');
    }
    
    function createNotification(message, type) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Event listeners for configuration changes
    configInputs.forEach(input => {
        input.addEventListener('change', function() {
            // Update the corresponding slider if it exists
            const slider = document.querySelector(`.config-slider[data-config="${this.id}"]`);
            if (slider) {
                const valueIndex = sliderConfigMap[this.id].indexOf(this.value);
                slider.value = valueIndex >= 0 ? valueIndex : 0;
            }
            
            updateResults();
            
            // Use the "Analyze Impact By" selector to determine comparison metric
            const metric = getCompareMetric();
            droneCharts.updateCharts(getCurrentConfig(), metric);
        });
    });

    // Advanced toolkit listeners
    document.querySelectorAll('.advanced-input').forEach(input => {
        input.addEventListener('input', function() {
            updateResults();
        });
    });

    const applyProfileBtn = document.getElementById('applyProfileBtn');
    if (applyProfileBtn) {
        applyProfileBtn.addEventListener('click', function() {
            const profile = document.getElementById('missionProfile')?.value;
            applyMissionProfile(profile);
        });
    }

    const solveConstraintsBtn = document.getElementById('solveConstraintsBtn');
    if (solveConstraintsBtn) {
        solveConstraintsBtn.addEventListener('click', solveConstraints);
    }

    const saveSnapshotBtn = document.getElementById('saveSnapshotBtn');
    if (saveSnapshotBtn) {
        saveSnapshotBtn.addEventListener('click', function() {
            const config = getCurrentConfig();
            const adjusted = applyOperationalAdjustments(calculateDetailedMetrics(config));
            saveSnapshot(config, adjusted);
            showUserInfo('Snapshot saved');
        });
    }

    const compareSnapshotsBtn = document.getElementById('compareSnapshotsBtn');
    if (compareSnapshotsBtn) {
        compareSnapshotsBtn.addEventListener('click', compareSnapshots);
    }

    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', function() {
            const config = getCurrentConfig();
            const adjusted = applyOperationalAdjustments(calculateDetailedMetrics(config));
            exportReport(config, adjusted);
            showUserInfo('JSON report exported');
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NEW FEATURES INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════

    // --- Instances ---
    const compatChecker = new CompatibilityChecker(calculator);
    const pidSimulator = new PIDSimulator();
    const flightEnvelope = new FlightEnvelope(calculator);

    // --- 1. Pre-Built Configurations Library ---
    function renderPrebuiltGrid() {
        const grid = document.getElementById('prebuiltGrid');
        if (!grid) return;

        const difficultyFilter = document.getElementById('prebuiltDifficulty')?.value || 'all';
        const builds = PreBuiltConfigs.filterByDifficulty(calculator.droneType, difficultyFilter);

        grid.innerHTML = builds.map(b => {
            const badgeClass = `badge-${b.difficulty.toLowerCase()}`;
            const tags = b.tags.map(t => `<span class="prebuilt-tag">${t}</span>`).join('');
            return `
                <div class="prebuilt-card" data-build-id="${b.id}">
                    <div class="prebuilt-card-header">
                        <span class="prebuilt-card-name">${b.name}</span>
                        <span class="prebuilt-card-badge ${badgeClass}">${b.difficulty}</span>
                    </div>
                    <div class="prebuilt-card-desc">${b.description}</div>
                    <div class="prebuilt-card-category">${b.category}</div>
                    <div class="prebuilt-card-tags">${tags}</div>
                </div>`;
        }).join('');

        // Click handler for each card
        grid.querySelectorAll('.prebuilt-card').forEach(card => {
            card.addEventListener('click', function() {
                const buildId = this.dataset.buildId;
                const build = PreBuiltConfigs.getById(buildId);
                if (!build) return;

                // If build requires a different drone type, toggle first
                const isFPV = PreBuiltConfigs.fpv.some(b => b.id === buildId);
                const shouldBeFixedWing = !isFPV;
                if (droneTypeToggle.checked !== shouldBeFixedWing) {
                    droneTypeToggle.checked = shouldBeFixedWing;
                    toggleDroneType();
                }

                // Apply config
                Object.entries(build.config).forEach(([key, value]) => {
                    const el = document.getElementById(key);
                    if (el) el.value = value;
                });

                syncSlidersToSelects();
                updateResults();
                droneCharts.updateCharts(getCurrentConfig(), getCompareMetric());
                showUserInfo(`Loaded: ${build.name}`);
            });
        });
    }

    // Difficulty filter
    const prebuiltDiffSelect = document.getElementById('prebuiltDifficulty');
    if (prebuiltDiffSelect) {
        prebuiltDiffSelect.addEventListener('change', renderPrebuiltGrid);
    }

    // Toggle visibility
    const togglePrebuiltBtn = document.getElementById('togglePrebuiltBtn');
    if (togglePrebuiltBtn) {
        togglePrebuiltBtn.addEventListener('click', function() {
            const grid = document.getElementById('prebuiltGrid');
            if (!grid) return;
            const collapsed = grid.classList.toggle('collapsed');
            this.textContent = collapsed ? 'Show Builds' : 'Hide Builds';
        });
    }

    // --- 2. Compatibility Checker ---
    function updateCompatibility() {
        const config = getCurrentConfig();
        const result = compatChecker.check(config);

        const statusEl = document.getElementById('compatStatus');
        const issuesEl = document.getElementById('compatIssues');
        if (!statusEl || !issuesEl) return;

        // Update status badge
        statusEl.className = `compat-status compat-${result.status}`;
        const badge = statusEl.querySelector('.compat-badge');
        const summary = statusEl.querySelector('.compat-summary');

        if (result.status === 'ok') {
            badge.innerHTML = '&#10003; All Clear';
            summary.textContent = 'No compatibility issues detected.';
        } else if (result.status === 'warning') {
            badge.innerHTML = `&#9888; ${result.warningCount} Warning${result.warningCount > 1 ? 's' : ''}`;
            summary.textContent = 'Review recommended before building.';
        } else {
            badge.innerHTML = `&#10007; ${result.errorCount} Error${result.errorCount > 1 ? 's' : ''}, ${result.warningCount} Warning${result.warningCount > 1 ? 's' : ''}`;
            summary.textContent = 'Critical incompatibilities found!';
        }

        // Render issues
        if (result.issues.length === 0) {
            issuesEl.innerHTML = '<li style="color: rgba(46,213,115,0.8);">All components are compatible.</li>';
        } else {
            issuesEl.innerHTML = result.issues.map(issue => {
                const cls = issue.severity === 'error' ? 'compat-issue-error' : 'compat-issue-warning';
                return `<li class="${cls}"><strong>${issue.component}:</strong> ${issue.message}</li>`;
            }).join('');
        }
    }

    // --- 3. Regulation Checker ---
    function updateRegulation() {
        const region = document.getElementById('regulationRegion')?.value || 'us';
        const config = getCurrentConfig();
        const totalWeight = calculator.droneType === 'fpv'
            ? calculator.calculateFPVDroneWeight(config)
            : calculator.calculateFixedWingWeight(config);

        const result = RegulationChecker.check(region, totalWeight);
        if (!result) return;

        const weightClassEl = document.getElementById('regWeightClass');
        const descEl = document.getElementById('regDescription');
        const marginEl = document.getElementById('regMargin');
        const remoteIdEl = document.getElementById('regRemoteId');
        const maxAltEl = document.getElementById('regMaxAlt');
        const licenseEl = document.getElementById('regLicense');

        if (weightClassEl) weightClassEl.textContent = `${result.weightClass} — ${result.region}`;
        if (descEl) descEl.textContent = result.description;
        if (marginEl) {
            if (result.isUnder250g) {
                marginEl.textContent = `${result.marginTo250g.toFixed(0)}g under 250g`;
                marginEl.className = 'reg-under250';
            } else {
                marginEl.textContent = `${Math.abs(result.marginTo250g).toFixed(0)}g OVER 250g`;
                marginEl.className = 'reg-over250';
            }
        }
        if (remoteIdEl) remoteIdEl.textContent = result.remoteId;
        if (maxAltEl) maxAltEl.textContent = result.maxAltitude;
        if (licenseEl) licenseEl.textContent = result.license;
    }

    const regionSelect = document.getElementById('regulationRegion');
    if (regionSelect) {
        regionSelect.addEventListener('change', updateRegulation);
    }

    // --- 4. BOM Export ---
    const exportBomCsvBtn = document.getElementById('exportBomCsvBtn');
    if (exportBomCsvBtn) {
        exportBomCsvBtn.addEventListener('click', function() {
            const config = getCurrentConfig();
            const totalWeight = calculator.droneType === 'fpv'
                ? calculator.calculateFPVDroneWeight(config)
                : calculator.calculateFixedWingWeight(config);
            const breakdown = getCostBreakdown(config);
            const csv = BOMExporter.generateCSV(breakdown.items, config, calculator.droneType, totalWeight);
            BOMExporter.downloadCSV(csv);
            showUserInfo('BOM exported as CSV');
        });
    }

    // --- 5. PID Tuning Simulator ---
    function updatePIDSimulator() {
        const P = parseFloat(document.getElementById('pidPSlider')?.value || '3.5');
        const I = parseFloat(document.getElementById('pidISlider')?.value || '0.035');
        const D = parseFloat(document.getElementById('pidDSlider')?.value || '30');

        // Update value labels
        const pVal = document.getElementById('pidPValue');
        const iVal = document.getElementById('pidIValue');
        const dVal = document.getElementById('pidDValue');
        if (pVal) pVal.textContent = P.toFixed(1);
        if (iVal) iVal.textContent = I.toFixed(3);
        if (dVal) dVal.textContent = D.toFixed(0);

        const metrics = pidSimulator.renderChart('pidChart', P, I, D);
        if (!metrics) return;

        const ovEl = document.getElementById('pidOvershoot');
        const rtEl = document.getElementById('pidRiseTime');
        const stEl = document.getElementById('pidSettling');
        const osEl = document.getElementById('pidOscillations');
        const stabEl = document.getElementById('pidStable');

        if (ovEl) ovEl.textContent = `${metrics.overshoot}%`;
        if (rtEl) rtEl.textContent = `${metrics.riseTime} ms`;
        if (stEl) stEl.textContent = `${metrics.settlingTime} ms`;
        if (osEl) osEl.textContent = metrics.oscillations;
        if (stabEl) {
            stabEl.textContent = metrics.stable ? 'Stable' : 'Unstable';
            stabEl.className = metrics.stable ? 'pid-stable-yes' : 'pid-stable-no';
        }
    }

    // PID slider listeners
    ['pidPSlider', 'pidISlider', 'pidDSlider'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updatePIDSimulator);
    });

    // PID preset buttons
    document.querySelectorAll('.pid-preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const presetId = this.dataset.preset;
            const preset = pidSimulator.presets[presetId];
            if (!preset) return;

            const pSlider = document.getElementById('pidPSlider');
            const iSlider = document.getElementById('pidISlider');
            const dSlider = document.getElementById('pidDSlider');
            if (pSlider) pSlider.value = preset.P;
            if (iSlider) iSlider.value = preset.I;
            if (dSlider) dSlider.value = preset.D;

            updatePIDSimulator();
        });
    });

    // --- 6. Flight Envelope ---
    function updateFlightEnvelope() {
        const config = getCurrentConfig();
        const data = flightEnvelope.renderChart('flightEnvelopeChart', config);
        if (!data) return;

        const maxSpeedEl = document.getElementById('envMaxSpeed');
        const auwEl = document.getElementById('envAUW');
        const stallEl = document.getElementById('envStall');
        const stallLabel = document.getElementById('envStallLabel');

        if (maxSpeedEl) maxSpeedEl.textContent = `${data.maxSpeedSea.toFixed(1)} km/h`;
        if (auwEl) auwEl.textContent = `${data.totalWeight.toFixed(0)}g`;

        if (data.stallSpeed !== null) {
            if (stallLabel) stallLabel.style.display = '';
            if (stallEl) stallEl.textContent = `${data.stallSpeed.toFixed(1)} km/h`;
        } else {
            if (stallLabel) stallLabel.style.display = 'none';
        }
    }

    // --- Centralized new-features update function ---
    function updateNewFeatures() {
        updateCompatibility();
        updateRegulation();
        updateFlightEnvelope();
    }

    // Patch the existing updateResults to also trigger new features
    const _originalUpdateResults = updateResults;
    updateResults = function() {
        _originalUpdateResults.call(this);
        try { updateNewFeatures(); } catch (e) { console.error('New features update error:', e); }
    };
    
    // Event listener for drone type toggle
    droneTypeToggle.addEventListener('change', toggleDroneType);
    
    // APC Propeller selection event listeners
    // (Event handlers registered inside setupAPCEventHandlers to avoid duplication)
    
    // APC Integration Functions
    async function initializeAPCIntegration() {
        try {
            console.log('Initializing APC Integration...');
            const success = await calculator.initializeAPC();
            
            if (success) {
                setupAPCEventHandlers();
                await updateAPCPropellerList();
                showAPCStatus(true);
                console.log('APC Integration ready');
                showUserInfo('Enhanced APC propeller calculations available');
                
                // Refresh metrics and charts with APC data
                updateResults();
                droneCharts.updateCharts(getCurrentConfig(), getCompareMetric());
            } else {
                showAPCStatus(false);
                console.warn('APC Integration failed to initialize');
            }
        } catch (error) {
            console.error('Error during APC initialization:', error);
            showAPCStatus(false);
        }
    }

    function setupAPCEventHandlers() {
        const propellerTypeSelect = document.getElementById('propellerType');
        const apcPropellerSelect = document.getElementById('apcPropeller');
        const apcPropSelection = document.getElementById('apcPropSelection');

        if (propellerTypeSelect) {
            propellerTypeSelect.addEventListener('change', function() {
                const isManual = this.value === 'manual';
                if (apcPropSelection) {
                    apcPropSelection.style.display = isManual ? 'block' : 'none';
                }
                
                // Update calculations when propeller selection mode changes
                updateResults();
                droneCharts.updateCharts(getCurrentConfig(), getCompareMetric());
            });
        }

        if (apcPropellerSelect) {
            apcPropellerSelect.addEventListener('change', function() {
                // Update calculations when specific propeller is selected
                updateResults();
                droneCharts.updateCharts(getCurrentConfig(), getCompareMetric());
            });
        }
    }

    async function updateAPCPropellerList() {
        const apcPropellerSelect = document.getElementById('apcPropeller');
        if (!apcPropellerSelect || !calculator.apcEnabled || !calculator.apcIntegration) {
            return;
        }

        try {
            const propellers = calculator.apcIntegration.database.getAllPropellers();
            apcPropellerSelect.innerHTML = '<option value="">Select Propeller...</option>';
            
            propellers.forEach(prop => {
                const option = document.createElement('option');
                option.value = prop.model;
                // More compact format for better sidebar fit
                option.textContent = `${prop.diameter}"×${prop.pitch}" ${prop.model}`;
                option.title = `${prop.diameter}" × ${prop.pitch}" - ${prop.model} (${prop.dataPointCount} data points)`; // Full info in tooltip
                apcPropellerSelect.appendChild(option);
            });
            
            console.log(`Loaded ${propellers.length} APC propellers`);
        } catch (error) {
            console.error('Error updating APC propeller list:', error);
            apcPropellerSelect.innerHTML = '<option value="">Error loading propellers</option>';
        }
    }

    function showAPCStatus(isEnabled) {
        const apcStatus = document.getElementById('apcStatus');
        if (apcStatus) {
            apcStatus.style.display = 'block';
            const statusText = apcStatus.querySelector('.status-text');
            const statusIcon = apcStatus.querySelector('.status-icon');
            
            if (isEnabled) {
                apcStatus.className = 'config-section apc-status-enabled';
                if (statusText) statusText.textContent = 'APC Database Active';
                if (statusIcon) statusIcon.textContent = '✅';
            } else {
                apcStatus.className = 'config-section apc-status-disabled';
                if (statusText) statusText.textContent = 'APC Database Offline';
                if (statusIcon) statusIcon.textContent = '❌';
            }
        }
    }
    
    // Enhanced initialization with better error handling
    try {
        // Initialize sliders
        initSliders();
        
        // Update sliders for current drone type
        updateSlidersForDroneType();
        
        // Initial update of metrics
        updateResults();

        // ─── Initialize new features ───
        renderPrebuiltGrid();
        updatePIDSimulator();

        // Re-render pre-built grid when drone type changes
        droneTypeToggle.addEventListener('change', function() {
            setTimeout(renderPrebuiltGrid, 50);
        });
        
        // Initialize APC Integration Framework
        initializeAPCIntegration().catch(() => {
            console.log('APC data not available - using simplified calculations');
        });
        
        // Try to load legacy calculator data if available
        // This is kept for backwards compatibility but APC integration is handled above
        
        // Initialize charts with data after a delay to ensure DOM is ready
        setTimeout(() => {
            try {
                initializeChartsWithData();
                
                // Add a second forced redraw to handle edge cases
                setTimeout(forceChartRedraw, 1000);
            } catch (chartError) {
                console.error('Chart initialization failed:', chartError);
                showUserWarning('Some charts may not display correctly');
            }
        }, 300);
        
        showUserInfo('Drone configuration tool loaded successfully');
        
    } catch (error) {
        console.error('Error during initialization:', error);
        showUserError('Application initialization failed. Some features may not work correctly.');
    }
    
    // Tab chart refresh is handled by DroneCharts.setupTabs() — no duplicate
    // listener needed here. A second listener was causing charts to be destroyed
    // and recreated twice per click, racing with Chart.js animation frames.
    
    // Also ensure graphs load when window is resized
    window.addEventListener('resize', function() {
        // Debounce the resize event
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(function() {
            console.log("Window resized, refreshing charts");
            forceChartRedraw();
        }, 500);
    });
});
