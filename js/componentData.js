/**
 * Single source of truth for catalogs, masses, prices, and chemistry.
 * Loaded before calculations.js / componentAnalysis.js / main.js.
 */
(function (root) {
    const BATTERY_WEIGHTS = {
        'lipo-3s':  { '1300': 150, '1500': 170, '2200': 230, '3000': 320, '4000': 410, '5000': 500 },
        'lipo-4s':  { '1300': 180, '1500': 200, '2200': 260, '3000': 350, '4000': 450, '5000': 550 },
        'lipo-6s':  { '1300': 230, '1500': 260, '2200': 320, '3000': 420, '4000': 530, '5000': 650 },
        'liion-3s': { '1300': 180, '1500': 210, '2200': 280, '3000': 380, '4000': 490, '5000': 600 },
        'liion-4s': { '1300': 220, '1500': 250, '2200': 320, '3000': 420, '4000': 540, '5000': 660 },
        'liion-6s': { '1300': 290, '1500': 330, '2200': 410, '3000': 520, '4000': 650, '5000': 780 }
    };

    const FPV_MOTORS = {
        '1400': { weight: 42, cost: 110, label: '1400KV' },
        '1700': { weight: 28, cost: 95,  label: '1700KV' },
        '1900': { weight: 30, cost: 90,  label: '1900KV' },
        '2200': { weight: 31, cost: 88,  label: '2200KV' },
        '2400': { weight: 32, cost: 85,  label: '2400KV' },
        '2700': { weight: 34, cost: 90,  label: '2700KV' },
        '3000': { weight: 36, cost: 100, label: '3000KV' }
    };

    const FW_MOTORS = {
        '700':  { weight: 95, cost: 120, label: '700KV' },
        '900':  { weight: 80, cost: 110, label: '900KV' },
        '1100': { weight: 68, cost: 100, label: '1100KV' },
        '1400': { weight: 58, cost: 95,  label: '1400KV' },
        '1700': { weight: 55, cost: 95,  label: '1700KV' }
    };

    const FRAME_WEIGHTS = { '3inch': 80, '5inch': 120, '7inch': 180, '10inch': 250 };
    const WINGSPAN_WEIGHTS = { '800': 250, '1000': 350, '1500': 650, '2000': 950 };
    const WING_TYPE_MULT = { conventional: 1.1, flying: 0.9, delta: 0.95 };

    const PRICES = {
        frameSize: { '3inch': 45, '5inch': 65, '7inch': 90, '10inch': 130 },
        wingspan: { '800': 120, '1000': 160, '1500': 240, '2000': 340 },
        flightController: { f4: 45, f7: 65, h7: 95 },
        camera: { analog: 35, digital: 120, digital4k: 180 },
        batteryType: { 'lipo-3s': 45, 'lipo-4s': 55, 'lipo-6s': 85, 'liion-3s': 60, 'liion-4s': 75, 'liion-6s': 110 },
        batteryCapacity: { '1300': 0, '1500': 8, '2200': 18, '3000': 28, '4000': 45, '5000': 62 },
        vtxPower: { '25': 25, '200': 40, '600': 65, '1000': 90 },
        wingType: { conventional: 0, flying: 25, delta: 35 },
        misc: 85
    };

    const MISSION_LOAD = {
        fpv: { hover: 1.0, mixed: 1.35, cinematic: 1.15, race: 1.8, cruise: 1.2 },
        fixedWing: { hover: 1.0, mixed: 1.1, cinematic: 1.05, race: 1.35, cruise: 1.0 }
    };

    const CONFIG_FIELDS = [
        'frameSize', 'motorKv', 'batteryType', 'batteryCapacity',
        'flightController', 'camera', 'vtxPower', 'propellerType',
        'apcPropeller', 'wingspan', 'wingType',
        'payloadMass', 'auwOverride', 'batteryCRating', 'escAmps',
        'customMotorKv', 'missionLoad'
    ];

    const ENV_FIELDS = ['envAltitude', 'envTemperature', 'envWind', 'batteryHealth', 'batteryCycles'];

    function parseChemistry(batteryType) {
        if (!batteryType || typeof batteryType !== 'string' || !batteryType.includes('-')) {
            return null;
        }
        const [chem, cellsRaw] = batteryType.split('-');
        const cells = parseInt(String(cellsRaw).replace('s', ''), 10);
        if (!cells || (chem !== 'lipo' && chem !== 'liion')) return null;
        return {
            chem,
            cells,
            nominalV: chem === 'lipo' ? 3.7 : 3.6,
            fullV: 4.2,
            usableFraction: 0.8,
            defaultCRating: chem === 'lipo' ? 60 : 10,
            maxSafeC: chem === 'lipo' ? 100 : 15
        };
    }

    function resolveKv(config) {
        const custom = parseFloat(config && config.customMotorKv);
        if (custom && custom > 0) return custom;
        return parseFloat(config && config.motorKv);
    }

    function nearestMotorMass(kv, droneType) {
        const table = droneType === 'fixedWing' ? FW_MOTORS : FPV_MOTORS;
        const key = String(Math.round(kv));
        if (table[key]) return table[key].weight;
        let best = null;
        let bestDist = Infinity;
        for (const [k, spec] of Object.entries(table)) {
            const dist = Math.abs(parseInt(k, 10) - kv);
            if (dist < bestDist) {
                bestDist = dist;
                best = spec.weight;
            }
        }
        return best || 32;
    }

    function nearestMotorCost(kv, droneType) {
        const table = droneType === 'fixedWing' ? FW_MOTORS : FPV_MOTORS;
        const key = String(Math.round(kv));
        if (table[key]) return table[key].cost;
        let best = 90;
        let bestDist = Infinity;
        for (const [k, spec] of Object.entries(table)) {
            const dist = Math.abs(parseInt(k, 10) - kv);
            if (dist < bestDist) {
                bestDist = dist;
                best = spec.cost;
            }
        }
        return best;
    }

    function batteryWeight(batteryType, capacity) {
        const row = BATTERY_WEIGHTS[batteryType];
        if (row && row[String(capacity)]) return row[String(capacity)];
        if (!row) return null;
        const cap = parseInt(capacity, 10);
        const keys = Object.keys(row).map(Number).sort((a, b) => a - b);
        if (!cap || keys.length === 0) return null;
        if (cap <= keys[0]) return row[String(keys[0])] * (cap / keys[0]);
        if (cap >= keys[keys.length - 1]) {
            const last = keys[keys.length - 1];
            return row[String(last)] * (cap / last);
        }
        for (let i = 0; i < keys.length - 1; i++) {
            if (cap >= keys[i] && cap <= keys[i + 1]) {
                const t = (cap - keys[i]) / (keys[i + 1] - keys[i]);
                return row[String(keys[i])] + t * (row[String(keys[i + 1])] - row[String(keys[i])]);
            }
        }
        return null;
    }

    function fcWeight(fc) {
        return fc === 'f4' ? 10 : (fc === 'f7' ? 12 : 14);
    }

    function cameraWeight(camera) {
        return camera === 'analog' ? 20 : (camera === 'digital' ? 35 : 45);
    }

    function vtxWeight(vtxPower) {
        return parseInt(vtxPower, 10) / 100 + 8;
    }

    function fpvBreakdown(config) {
        const frame = FRAME_WEIGHTS[config.frameSize];
        const kv = resolveKv(config);
        const batt = batteryWeight(config.batteryType, config.batteryCapacity);
        if (!frame || !kv || !batt) return null;
        const propEach = frame / 30;
        return {
            frame,
            motors: nearestMotorMass(kv, 'fpv') * 4,
            battery: batt,
            fc: fcWeight(config.flightController),
            esc: 15,
            camera: cameraWeight(config.camera),
            receiver: 5,
            vtx: vtxWeight(config.vtxPower),
            props: propEach * 4,
            wiring: 15,
            payload: parseFloat(config.payloadMass) || 0
        };
    }

    function fwBreakdown(config) {
        const base = WINGSPAN_WEIGHTS[config.wingspan];
        const wingMult = WING_TYPE_MULT[config.wingType];
        const kv = resolveKv(config);
        const batt = batteryWeight(config.batteryType, config.batteryCapacity);
        if (!base || !wingMult || !kv || !batt) return null;
        return {
            airframe: base * wingMult,
            motor: nearestMotorMass(kv, 'fixedWing'),
            battery: batt,
            electronics: 80,
            camera: cameraWeight(config.camera),
            vtx: vtxWeight(config.vtxPower),
            propeller: 15,
            payload: parseFloat(config.payloadMass) || 0
        };
    }

    function sumBreakdown(parts) {
        if (!parts) return null;
        return Object.values(parts).reduce((a, b) => a + (Number(b) || 0), 0);
    }

    function missionLoadFactor(missionLoad, droneType) {
        const table = MISSION_LOAD[droneType] || MISSION_LOAD.fpv;
        return table[missionLoad] || table.mixed;
    }

    function motorOptions(droneType) {
        const table = droneType === 'fixedWing' ? FW_MOTORS : FPV_MOTORS;
        return Object.keys(table).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    }

    const COMPONENT_DB = {
        BATTERY_WEIGHTS,
        FPV_MOTORS,
        FW_MOTORS,
        FRAME_WEIGHTS,
        WINGSPAN_WEIGHTS,
        WING_TYPE_MULT,
        PRICES,
        MISSION_LOAD,
        CONFIG_FIELDS,
        ENV_FIELDS,
        parseChemistry,
        resolveKv,
        nearestMotorMass,
        nearestMotorCost,
        batteryWeight,
        fpvBreakdown,
        fwBreakdown,
        sumBreakdown,
        missionLoadFactor,
        motorOptions,
        PRICE_NOTE: 'Indicative street prices for planning only — not a quote. Updated 2026-09.',
        REGS_REVIEWED: '2026-09'
    };

    root.COMPONENT_DB = COMPONENT_DB;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = COMPONENT_DB;
    }
})(typeof window !== 'undefined' ? window : globalThis);
