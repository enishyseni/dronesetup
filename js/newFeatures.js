// ============================================================================
// NEW FEATURES MODULE
// Pre-Built Configs, Compatibility Checker, Regulation Checker,
// BOM Export, PID Tuning Simulator, Flight Envelope
// ============================================================================

// ─── 1. PRE-BUILT CONFIGURATIONS LIBRARY ────────────────────────────────────

const PreBuiltConfigs = {
    fpv: [
        {
            id: 'race_5inch',
            name: '5" Race Build',
            description: 'Lightweight 5-inch racing quad. High KV, small battery, maximum agility.',
            category: 'Racing',
            difficulty: 'Advanced',
            config: { frameSize: '5inch', motorKv: '2700', batteryType: 'lipo-6s', batteryCapacity: '1300', flightController: 'f7', camera: 'digital', vtxPower: '600' },
            tags: ['racing', 'competitive', 'lightweight']
        },
        {
            id: 'freestyle_5inch',
            name: '5" Freestyle',
            description: 'Versatile freestyle build. Balanced power and flight time for tricks and proximity flying.',
            category: 'Freestyle',
            difficulty: 'Intermediate',
            config: { frameSize: '5inch', motorKv: '2400', batteryType: 'lipo-6s', batteryCapacity: '1500', flightController: 'f7', camera: 'digital', vtxPower: '600' },
            tags: ['freestyle', 'all-around', 'tricks']
        },
        {
            id: 'cinematic_5inch',
            name: '5" Cinematic',
            description: 'Smooth cinematic quad with 4K camera. Optimized for stable footage and longer flights.',
            category: 'Cinematic',
            difficulty: 'Intermediate',
            config: { frameSize: '5inch', motorKv: '2400', batteryType: 'lipo-4s', batteryCapacity: '2200', flightController: 'h7', camera: 'digital4k', vtxPower: '200' },
            tags: ['cinematic', 'smooth', '4k', 'video']
        },
        {
            id: 'longrange_7inch',
            name: '7" Long Range Explorer',
            description: 'Extended range build using 7-inch props and Li-Ion battery for maximum endurance.',
            category: 'Long Range',
            difficulty: 'Advanced',
            config: { frameSize: '7inch', motorKv: '1700', batteryType: 'liion-6s', batteryCapacity: '4000', flightController: 'f7', camera: 'digital', vtxPower: '1000' },
            tags: ['long-range', 'endurance', 'explorer']
        },
        {
            id: 'tiny_3inch',
            name: '3" Toothpick / Micro',
            description: 'Ultra-light indoor/outdoor micro build. Great for parks and tight spaces.',
            category: 'Micro',
            difficulty: 'Beginner',
            config: { frameSize: '3inch', motorKv: '3000', batteryType: 'lipo-3s', batteryCapacity: '1300', flightController: 'f4', camera: 'analog', vtxPower: '25' },
            tags: ['micro', 'toothpick', 'indoor', 'beginner']
        },
        {
            id: 'trainer_5inch',
            name: '5" Trainer / Beginner',
            description: 'Forgiving trainer build. Lower KV, 4S LiPo, analog system — affordable and easy to fly.',
            category: 'Trainer',
            difficulty: 'Beginner',
            config: { frameSize: '5inch', motorKv: '2400', batteryType: 'lipo-4s', batteryCapacity: '1500', flightController: 'f4', camera: 'analog', vtxPower: '200' },
            tags: ['trainer', 'beginner', 'budget']
        },
        {
            id: 'heavy_lift_10inch',
            name: '10" Heavy Lifter',
            description: 'Large payload carrier. 10-inch props, low KV, big battery for heavy camera rigs.',
            category: 'Heavy Lift',
            difficulty: 'Expert',
            config: { frameSize: '10inch', motorKv: '1700', batteryType: 'lipo-6s', batteryCapacity: '5000', flightController: 'h7', camera: 'digital4k', vtxPower: '1000' },
            tags: ['heavy-lift', 'payload', 'professional']
        },
        {
            id: 'budget_analog',
            name: 'Budget Analog Build',
            description: 'Cheapest possible flyable build. Analog, 4S, basic FC — under $200 total.',
            category: 'Budget',
            difficulty: 'Beginner',
            config: { frameSize: '5inch', motorKv: '2400', batteryType: 'lipo-4s', batteryCapacity: '1300', flightController: 'f4', camera: 'analog', vtxPower: '25' },
            tags: ['budget', 'cheap', 'analog', 'entry']
        }
    ],
    fixedWing: [
        {
            id: 'fw_cruiser',
            name: 'Efficient Cruiser',
            description: 'Long-range conventional plane with Li-Ion for maximum endurance mapping missions.',
            category: 'Endurance',
            difficulty: 'Intermediate',
            config: { wingspan: '1500', wingType: 'conventional', motorKv: '1700', batteryType: 'liion-6s', batteryCapacity: '5000', flightController: 'f7', camera: 'digital', vtxPower: '200' },
            tags: ['endurance', 'mapping', 'survey']
        },
        {
            id: 'fw_speed_delta',
            name: 'Speed Delta',
            description: 'Fast delta wing for speed runs and wind penetration. High KV, 6S LiPo.',
            category: 'Speed',
            difficulty: 'Advanced',
            config: { wingspan: '1000', wingType: 'delta', motorKv: '3000', batteryType: 'lipo-6s', batteryCapacity: '2200', flightController: 'h7', camera: 'digital', vtxPower: '600' },
            tags: ['speed', 'delta', 'fast']
        },
        {
            id: 'fw_fpv_wing',
            name: 'FPV Flying Wing',
            description: 'Classic flying wing for FPV cruising. Efficient, easy to build from foam.',
            category: 'FPV Wing',
            difficulty: 'Beginner',
            config: { wingspan: '1000', wingType: 'flying', motorKv: '2400', batteryType: 'lipo-4s', batteryCapacity: '2200', flightController: 'f4', camera: 'analog', vtxPower: '200' },
            tags: ['fpv', 'flying-wing', 'foam', 'beginner']
        },
        {
            id: 'fw_large_survey',
            name: 'Large Survey Platform',
            description: '2m wingspan conventional for aerial survey/mapping. High endurance, stable platform.',
            category: 'Survey',
            difficulty: 'Expert',
            config: { wingspan: '2000', wingType: 'conventional', motorKv: '1700', batteryType: 'liion-6s', batteryCapacity: '5000', flightController: 'h7', camera: 'digital4k', vtxPower: '1000' },
            tags: ['survey', 'mapping', 'professional', 'large']
        }
    ],

    getByType(droneType) {
        return droneType === 'fpv' ? this.fpv : this.fixedWing;
    },

    getById(id) {
        return [...this.fpv, ...this.fixedWing].find(c => c.id === id) || null;
    },

    filterByCategory(droneType, category) {
        const list = this.getByType(droneType);
        if (!category || category === 'all') return list;
        return list.filter(c => c.category.toLowerCase() === category.toLowerCase());
    },

    filterByDifficulty(droneType, difficulty) {
        const list = this.getByType(droneType);
        if (!difficulty || difficulty === 'all') return list;
        return list.filter(c => c.difficulty.toLowerCase() === difficulty.toLowerCase());
    }
};

// ─── 2. COMPONENT COMPATIBILITY CHECKER ─────────────────────────────────────

class CompatibilityChecker {
    constructor(calculator) {
        this.calculator = calculator;
    }

    check(config) {
        const issues = [];
        const droneType = this.calculator.droneType;

        // --- Extract common values ---
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const capacityMah = parseInt(config.batteryCapacity);
        const motorKv = parseInt(config.motorKv);
        const vtxPower = parseInt(config.vtxPower);
        const cellVoltage = batteryType === 'lipo' ? 4.2 : 4.2; // max voltage
        const voltage = cellCount * cellVoltage;

        // ----- PROPULSION CHECKS -----

        if (droneType === 'fpv') {
            const frameSize = parseInt(config.frameSize.replace('inch', ''));

            // Prop too large for frame
            if (frameSize === 3 && motorKv < 2000) {
                issues.push({ severity: 'warning', component: 'Motor', message: `KV ${motorKv} is low for a 3" build. Recommend ≥2400KV for responsive flight.` });
            }
            if (frameSize === 10 && motorKv > 2400) {
                issues.push({ severity: 'error', component: 'Motor', message: `KV ${motorKv} is too high for 10" props — risk of motor overheating and excessive current draw.` });
            }
            if (frameSize === 7 && motorKv > 2700) {
                issues.push({ severity: 'warning', component: 'Motor', message: `KV ${motorKv} combined with 7" props draws very high current; ensure ESC rating ≥50A.` });
            }
            if (frameSize === 3 && cellCount >= 6) {
                issues.push({ severity: 'warning', component: 'Battery', message: '6S on a 3" micro is unusual — voltage may exceed motor/ESC rating. Verify component specs.' });
            }

            // Estimate burst current per motor
            const burstPerMotor = motorKv / 1000 * frameSize * cellCount * 0.6;
            const totalBurst = burstPerMotor * 4;

            // Battery C-rating check
            const capacityAh = capacityMah / 1000;
            const requiredC = totalBurst / capacityAh;
            const maxSafeC = batteryType === 'lipo' ? 100 : 15;
            if (requiredC > maxSafeC) {
                issues.push({
                    severity: 'error',
                    component: 'Battery',
                    message: `Required burst C-rate (~${Math.round(requiredC)}C) exceeds ${batteryType.toUpperCase()} safe limit (${maxSafeC}C). Use higher capacity or LiPo chemistry.`
                });
            } else if (requiredC > maxSafeC * 0.8) {
                issues.push({
                    severity: 'warning',
                    component: 'Battery',
                    message: `C-rate demand (~${Math.round(requiredC)}C) is close to ${batteryType.toUpperCase()} limit (${maxSafeC}C). Consider uprating battery capacity.`
                });
            }

            // Li-Ion + high KV/big props = bad combo
            if (batteryType === 'liion' && motorKv >= 2700 && frameSize >= 5) {
                issues.push({ severity: 'error', component: 'Battery', message: 'Li-Ion cannot supply the burst current needed by high-KV motors on 5"+ frames. Switch to LiPo.' });
            }

        } else {
            // Fixed wing checks
            const wingspan = parseInt(config.wingspan);
            const wingType = config.wingType;

            if (wingspan >= 2000 && motorKv >= 3000) {
                issues.push({ severity: 'warning', component: 'Motor', message: 'Very high KV on a 2m wing may over-speed the prop and reduce efficiency. Consider ≤2400KV.' });
            }
            if (wingspan <= 800 && capacityMah >= 4000) {
                issues.push({ severity: 'warning', component: 'Battery', message: 'Large battery on a small wingspan leads to high wing loading and poor handling.' });
            }
        }

        // ----- VTX / ELECTRONICS CHECKS -----

        if (vtxPower >= 1000 && config.flightController === 'f4') {
            issues.push({ severity: 'warning', component: 'VTX', message: '1W VTX draws significant current from the FC regulator. F4 boards may overheat — F7 or H7 recommended.' });
        }

        // Camera match check
        if (config.camera === 'digital4k' && vtxPower <= 25) {
            issues.push({ severity: 'warning', component: 'Camera', message: '4K camera paired with 25mW VTX limits live-view range and quality. Consider higher VTX power.' });
        }

        // Weight feasibility
        const totalWeight = droneType === 'fpv'
            ? this.calculator.calculateFPVDroneWeight(config)
            : this.calculator.calculateFixedWingWeight(config);
        const payload = this.calculator.calculatePayloadCapacity(config, totalWeight);

        if (payload < 0) {
            issues.push({ severity: 'error', component: 'Weight', message: `Build is overweight by ${Math.abs(payload).toFixed(0)}g — it cannot maintain safe flight. Reduce battery or components.` });
        } else if (payload < 50) {
            issues.push({ severity: 'warning', component: 'Weight', message: `Only ${payload.toFixed(0)}g payload margin — any add-on (GPS, action cam) will push it over limit.` });
        }

        // ----- GENERATE SUMMARY -----
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;

        let status, statusLabel;
        if (errorCount > 0) {
            status = 'error';
            statusLabel = 'Incompatible';
        } else if (warningCount > 0) {
            status = 'warning';
            statusLabel = 'Caution';
        } else {
            status = 'ok';
            statusLabel = 'All Clear';
        }

        return { status, statusLabel, issues, errorCount, warningCount };
    }
}

// ─── 3. REGULATION / COMPLIANCE CHECKER ─────────────────────────────────────

const RegulationChecker = {
    regions: {
        'us': {
            name: 'United States (FAA)',
            rules: [
                { threshold: 250, label: 'Under 250g', description: 'No registration required for recreational use. Remote ID may still be needed after 2024 rule.' },
                { threshold: 25000, label: '250g – 25kg', description: 'Registration required ($5). Part 107 for commercial use. Remote ID required.' },
                { threshold: Infinity, label: 'Over 25kg', description: 'Special airworthiness certificate required.' }
            ],
            remoteId: 'Required for all drones ≥250g (FAA rule effective March 2024)',
            maxAltitude: '400 ft (120m) AGL',
            license: 'Part 107 certificate required for commercial operations'
        },
        'eu': {
            name: 'European Union (EASA)',
            rules: [
                { threshold: 250, label: 'C0 (Under 250g)', description: 'Open category A1. Fly over uninvolved people. No registration needed in some states.' },
                { threshold: 900, label: 'C1 (250g – 900g)', description: 'Open category A1. Operator registration required. Do not intentionally fly over crowds.' },
                { threshold: 4000, label: 'C2 (900g – 4kg)', description: 'Open category A2. Must keep 30m from uninvolved people (5m in low-speed mode). Operator + pilot registration.' },
                { threshold: 25000, label: 'C3/C4 (4kg – 25kg)', description: 'Open category A3. Fly far from people and residential areas. Registration required.' },
                { threshold: Infinity, label: 'Over 25kg', description: 'Specific or Certified category — requires risk assessment and authorization.' }
            ],
            remoteId: 'Required for all drones in Open/Specific category from Jan 2024',
            maxAltitude: '120m AGL',
            license: 'Online competency test (A1/A3) or exam (A2) required'
        },
        'uk': {
            name: 'United Kingdom (CAA)',
            rules: [
                { threshold: 250, label: 'Under 250g', description: 'No registration required. Must follow Drone Code.' },
                { threshold: 20000, label: '250g – 20kg', description: 'Registration as operator (£10/year) and Flyer ID (free online test).' },
                { threshold: Infinity, label: 'Over 20kg', description: 'CAA permission required.' }
            ],
            remoteId: 'Not required yet but planned',
            maxAltitude: '400 ft (120m) AGL',
            license: 'Flyer ID (free test) for ≥250g; GVC or A2 CofC for commercial'
        },
        'canada': {
            name: 'Canada (Transport Canada)',
            rules: [
                { threshold: 250, label: 'Under 250g (Micro)', description: 'No registration or certificate needed. Follow basic safety guidelines.' },
                { threshold: 25000, label: '250g – 25kg (Small)', description: 'Must register drone and get Basic or Advanced pilot certificate.' },
                { threshold: Infinity, label: 'Over 25kg', description: 'Special Flight Operations Certificate (SFOC) needed.' }
            ],
            remoteId: 'Not currently required but under review',
            maxAltitude: '400 ft (122m) AGL',
            license: 'Basic or Advanced Pilot Certificate (exam)'
        },
        'australia': {
            name: 'Australia (CASA)',
            rules: [
                { threshold: 250, label: 'Under 250g (Micro)', description: 'No registration required for recreational use. Follow standard rules.' },
                { threshold: 2000, label: '250g – 2kg', description: 'Registration required. Follow standard operating conditions.' },
                { threshold: 25000, label: '2kg – 25kg', description: 'Registration required. Must fly in visual line of sight.' },
                { threshold: Infinity, label: 'Over 25kg', description: 'Requires ReOC and RePL (commercial certification).' }
            ],
            remoteId: 'Under development',
            maxAltitude: '120m AGL',
            license: 'RePL for commercial operations over 2kg'
        }
    },

    check(region, totalWeightGrams) {
        const reg = this.regions[region];
        if (!reg) return null;

        const applicable = reg.rules.find(r => totalWeightGrams < r.threshold);
        const isUnder250 = totalWeightGrams < 250;
        const marginTo250 = 250 - totalWeightGrams;

        return {
            region: reg.name,
            weightClass: applicable ? applicable.label : 'Unknown',
            description: applicable ? applicable.description : '',
            isUnder250g: isUnder250,
            marginTo250g: marginTo250,
            remoteId: reg.remoteId,
            maxAltitude: reg.maxAltitude,
            license: reg.license,
            allRules: reg.rules
        };
    }
};

// ─── 4. MANUFACTURING BOM EXPORT ─────────────────────────────────────────────

const BOMExporter = {
    suppliers: {
        'Frame Kit':      { supplier: 'GetFPV / RaceDayQuads', url: 'https://www.getfpv.com/frames.html' },
        'Airframe Kit':   { supplier: 'HobbyKing / MotionRC', url: 'https://hobbyking.com' },
        'Motors':         { supplier: 'GetFPV / Pyrodrone', url: 'https://www.getfpv.com/motors.html' },
        'Flight Controller': { supplier: 'GetFPV / RaceDayQuads', url: 'https://www.getfpv.com/flight-controllers.html' },
        'Camera System':  { supplier: 'GetFPV / Caddx', url: 'https://www.getfpv.com/fpv-cameras.html' },
        'Battery Pack':   { supplier: 'CNHL / Tattu / GetFPV', url: 'https://www.getfpv.com/batteries.html' },
        'VTX/Link':       { supplier: 'GetFPV / TBS', url: 'https://www.getfpv.com/video-transmitters.html' },
        'ESC + Receiver + Misc': { supplier: 'GetFPV / Pyrodrone', url: 'https://www.getfpv.com/escs.html' }
    },

    generateCSV(bomItems, config, droneType, totalWeight) {
        const headers = ['Component', 'Unit Cost ($)', 'Qty per Build', 'Line Total ($)', 'Supplier', 'Supplier URL', 'Lead Time', 'Notes'];
        const rows = bomItems.map(item => {
            const info = this.suppliers[item.label] || { supplier: '-', url: '-' };
            const qty = item.label === 'Motors' && droneType === 'fpv' ? 4 : 1;
            const perUnit = qty > 1 ? (item.cost / qty).toFixed(2) : item.cost.toFixed(2);
            return [
                item.label,
                perUnit,
                qty,
                item.cost.toFixed(2),
                info.supplier,
                info.url,
                '3-7 days',
                ''
            ];
        });

        // Add batch pricing rows
        const unitTotal = bomItems.reduce((s, i) => s + i.cost, 0);
        rows.push([]);
        rows.push(['--- BATCH PRICING ---', '', '', '', '', '', '', '']);
        rows.push(['1 unit', '', '', unitTotal.toFixed(2), '', '', '', '']);
        rows.push(['10 units (5% discount)', '', '', (unitTotal * 10 * 0.95).toFixed(2), '', '', '', `$${(unitTotal * 0.95).toFixed(2)} each`]);
        rows.push(['50 units (12% discount)', '', '', (unitTotal * 50 * 0.88).toFixed(2), '', '', '', `$${(unitTotal * 0.88).toFixed(2)} each`]);
        rows.push(['100 units (18% discount)', '', '', (unitTotal * 100 * 0.82).toFixed(2), '', '', '', `$${(unitTotal * 0.82).toFixed(2)} each`]);
        rows.push([]);
        rows.push(['Total Weight:', `${totalWeight.toFixed(0)}g`, '', '', '', '', '', '']);

        const csvContent = [headers, ...rows].map(row =>
            row.map ? row.map(cell => `"${cell}"`).join(',') : ''
        ).join('\n');

        return csvContent;
    },

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `drone-bom-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
};

// ─── 5. PID TUNING SIMULATOR ─────────────────────────────────────────────────

class PIDSimulator {
    constructor() {
        this.chart = null;
        this.presets = {
            racing:    { P: 4.5, I: 0.04, D: 28, label: 'Racing — snappy, slight overshoot OK' },
            freestyle: { P: 3.8, I: 0.035, D: 32, label: 'Freestyle — balanced feel' },
            cinematic: { P: 2.5, I: 0.03,  D: 38, label: 'Cinematic — smooth, no oscillation' },
            default:   { P: 3.5, I: 0.035, D: 30, label: 'Betaflight Default' }
        };
    }

    /**
     * Simulate a discrete second-order step response with PID control.
     * Returns arrays of time and response values.
     */
    simulate(P, I, D, durationMs, dtMs) {
        durationMs = durationMs || 600;
        dtMs = dtMs || 2;
        const steps = Math.floor(durationMs / dtMs);
        const dt = dtMs / 1000;

        const time = [];
        const response = [];
        const setpoint = 1.0; // step to 1.0

        let position = 0;
        let velocity = 0;
        let integral = 0;
        let prevError = setpoint; // at t=0 error is full

        // Simple plant model: second-order with damping
        // Represents gyro angle response to motor commands
        const naturalFreq = 50;  // rad/s — stiff multirotor
        const dampingRatio = 0.15; // underdamped airframe

        for (let i = 0; i < steps; i++) {
            const t = i * dt;
            const error = setpoint - position;
            integral += error * dt;
            const derivative = (error - prevError) / dt;

            // PID output → force/torque input
            const pidOutput = P * error + I * integral + D * derivative / 100;

            // Plant dynamics: x'' = w_n^2 * (u - x) - 2*zeta*w_n*x'
            const accel = naturalFreq * naturalFreq * (pidOutput - position) - 2 * dampingRatio * naturalFreq * velocity;
            velocity += accel * dt;
            position += velocity * dt;

            prevError = error;
            time.push(t * 1000); // ms
            response.push(position);
        }

        // Calculate performance metrics
        const maxOvershoot = Math.max(0, (Math.max(...response) - setpoint) / setpoint * 100);
        const settlingIdx = this._findSettlingIndex(response, setpoint, 0.02);
        const settlingTime = settlingIdx >= 0 ? time[settlingIdx] : durationMs;
        const riseIdx = response.findIndex(v => v >= 0.9 * setpoint);
        const riseTime = riseIdx >= 0 ? time[riseIdx] : durationMs;

        // Oscillation detection
        let oscillations = 0;
        for (let i = 2; i < response.length; i++) {
            if ((response[i] - response[i - 1]) * (response[i - 1] - response[i - 2]) < 0) oscillations++;
        }

        return {
            time,
            response,
            metrics: {
                overshoot: maxOvershoot.toFixed(1),
                settlingTime: settlingTime.toFixed(0),
                riseTime: riseTime.toFixed(0),
                oscillations: Math.floor(oscillations / 2),
                stable: maxOvershoot < 50 && settlingTime < durationMs * 0.9
            }
        };
    }

    _findSettlingIndex(response, setpoint, threshold) {
        for (let i = response.length - 1; i >= 0; i--) {
            if (Math.abs(response[i] - setpoint) > threshold * setpoint) {
                return Math.min(i + 1, response.length - 1);
            }
        }
        return 0;
    }

    renderChart(canvasId, P, I, D) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        const sim = this.simulate(P, I, D);

        if (this.chart) this.chart.destroy();

        // Setpoint line
        const setpointData = sim.time.map(() => 1.0);

        this.chart = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: sim.time.map(t => t.toFixed(0)),
                datasets: [
                    {
                        label: 'Response',
                        data: sim.response,
                        borderColor: 'rgba(108, 99, 255, 1)',
                        backgroundColor: 'rgba(108, 99, 255, 0.1)',
                        fill: true,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.2
                    },
                    {
                        label: 'Setpoint',
                        data: setpointData,
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        borderDash: [6, 4],
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: {
                    legend: { display: true, labels: { color: 'rgba(255,255,255,0.8)', boxWidth: 12, font: { size: 11 } } },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Time (ms)', color: 'rgba(255,255,255,0.7)' },
                        ticks: { color: 'rgba(255,255,255,0.5)', maxTicksLimit: 10 },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    },
                    y: {
                        title: { display: true, text: 'Amplitude', color: 'rgba(255,255,255,0.7)' },
                        ticks: { color: 'rgba(255,255,255,0.5)' },
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        suggestedMin: -0.2,
                        suggestedMax: 1.6
                    }
                }
            }
        });

        return sim.metrics;
    }
}

// ─── 6. FLIGHT ENVELOPE ─────────────────────────────────────────────────────

class FlightEnvelope {
    constructor(calculator) {
        this.calculator = calculator;
        this.chart = null;
    }

    /**
     * Generate flight envelope data for the current configuration.
     * Returns points for: speed vs altitude, max climb rate, turn radius bounds.
     */
    compute(config) {
        const droneType = this.calculator.droneType;
        const totalWeight = droneType === 'fpv'
            ? this.calculator.calculateFPVDroneWeight(config)
            : this.calculator.calculateFixedWingWeight(config);
        const maxSpeedSea = this.calculator.calculateMaxSpeed(config);
        const batteryType = config.batteryType.split('-')[0];
        const cellCount = parseInt(config.batteryType.split('-')[1].replace('s', ''));
        const cellVoltage = batteryType === 'lipo' ? 3.7 : 3.6;
        const voltage = cellCount * cellVoltage;
        const motorKv = parseInt(config.motorKv);
        const weightKg = totalWeight / 1000;
        const g = 9.81;

        // Altitude range in meters
        const altitudes = [0, 200, 500, 1000, 1500, 2000, 3000, 4000, 5000];
        const speedVsAlt = [];
        const climbVsAlt = [];

        altitudes.forEach(alt => {
            const rhoFactor = Math.exp(-alt / 8500);

            // Max speed decreases with altitude (less air density → less thrust)
            const speed = maxSpeedSea * Math.pow(rhoFactor, 0.25);

            // Climb rate: excess thrust * velocity  / weight
            // Simplified: at sea level a typical quad can climb 10-25 m/s
            let maxClimb;
            if (droneType === 'fpv') {
                const thrustToWeight = this.calculator.calculatePayloadCapacity(config, totalWeight) / totalWeight + 1;
                maxClimb = (thrustToWeight - 1) * g * rhoFactor * 1.5; // m/s
            } else {
                maxClimb = (speed / 3.6) * 0.15 * rhoFactor; // shallow climb for fixed wing
            }

            speedVsAlt.push({ altitude: alt, speed: Math.max(0, speed) });
            climbVsAlt.push({ altitude: alt, climbRate: Math.max(0, maxClimb) });
        });

        // Turn radius at different speeds (for current altitude = sea level)
        const speeds = [];
        for (let s = 10; s <= maxSpeedSea; s += Math.max(5, maxSpeedSea / 15)) {
            speeds.push(s);
        }
        const turnRadius = speeds.map(s => {
            const v = s / 3.6; // m/s
            // Bank angle limited turn: r = v^2 / (g * tan(bankAngle))
            const maxBank = droneType === 'fpv' ? 70 : 45; // degrees
            const r = (v * v) / (g * Math.tan(maxBank * Math.PI / 180));
            return { speed: s, radius: r };
        });

        // Stall speed (fixed wing only)
        let stallSpeed = null;
        if (droneType === 'fixedWing') {
            const wingspan = parseInt(config.wingspan) / 1000;
            const wingArea = wingspan * wingspan / 3; // rough AR ~6
            const Cl_max = 1.3;
            const rho = 1.225;
            stallSpeed = Math.sqrt((2 * weightKg * g) / (rho * wingArea * Cl_max)) * 3.6; // km/h
        }

        return { speedVsAlt, climbVsAlt, turnRadius, stallSpeed, maxSpeedSea, totalWeight };
    }

    renderChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        const data = this.compute(config);

        if (this.chart) this.chart.destroy();

        const datasets = [
            {
                label: 'Max Speed (km/h)',
                data: data.speedVsAlt.map(p => ({ x: p.speed, y: p.altitude })),
                borderColor: 'rgba(108, 99, 255, 1)',
                backgroundColor: 'rgba(108, 99, 255, 0.15)',
                fill: true,
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.3
            },
            {
                label: 'Max Climb (m/s × 50)',
                data: data.climbVsAlt.map(p => ({ x: p.climbRate * 50, y: p.altitude })),
                borderColor: 'rgba(46, 213, 115, 1)',
                backgroundColor: 'rgba(46, 213, 115, 0.1)',
                fill: false,
                borderWidth: 2,
                pointRadius: 3,
                borderDash: [5, 3],
                tension: 0.3
            }
        ];

        if (data.stallSpeed) {
            // Add stall speed vertical line
            datasets.push({
                label: `Stall Speed (${data.stallSpeed.toFixed(0)} km/h)`,
                data: data.speedVsAlt.map(p => ({ x: data.stallSpeed, y: p.altitude })),
                borderColor: 'rgba(255, 71, 87, 0.8)',
                borderWidth: 2,
                borderDash: [8, 4],
                pointRadius: 0,
                fill: false
            });
        }

        this.chart = new Chart(canvas.getContext('2d'), {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                    legend: { display: true, labels: { color: 'rgba(255,255,255,0.8)', boxWidth: 12, font: { size: 10 } } },
                    title: { display: true, text: 'Flight Envelope — Speed & Climb vs Altitude', color: 'rgba(255,255,255,0.85)', font: { size: 12 } }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Speed (km/h) / Climb Rate (scaled)', color: 'rgba(255,255,255,0.7)' },
                        ticks: { color: 'rgba(255,255,255,0.5)' },
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        min: 0
                    },
                    y: {
                        title: { display: true, text: 'Altitude (m)', color: 'rgba(255,255,255,0.7)' },
                        ticks: { color: 'rgba(255,255,255,0.5)' },
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        min: 0
                    }
                }
            }
        });

        return data;
    }
}
