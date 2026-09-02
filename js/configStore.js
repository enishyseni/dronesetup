/**
 * Whitelisted config read/write, URL hash share, localStorage snapshots.
 */
(function (root) {
    const STORAGE_SNAPSHOTS = 'dronesetup.snapshots.v1';
    const STORAGE_LAST = 'dronesetup.lastConfig.v1';

    function db() {
        return root.COMPONENT_DB;
    }

    function getFieldValue(id) {
        const el = document.getElementById(id);
        if (!el) return undefined;
        return el.value;
    }

    function setFieldValue(id, value) {
        const el = document.getElementById(id);
        if (!el || value === undefined || value === null) return;
        el.value = String(value);
    }

    function getCurrentConfig() {
        const config = {};
        const fields = (db() && db().CONFIG_FIELDS) || [];
        fields.forEach((id) => {
            const value = getFieldValue(id);
            if (value !== undefined) config[id] = value;
        });
        return config;
    }

    function getEnvironmentState() {
        return {
            altitude: parseFloat(getFieldValue('envAltitude') || '0'),
            temperature: parseFloat(getFieldValue('envTemperature') || '20'),
            wind: parseFloat(getFieldValue('envWind') || '0'),
            batteryHealth: parseFloat(getFieldValue('batteryHealth') || '100'),
            batteryCycles: parseFloat(getFieldValue('batteryCycles') || '0')
        };
    }

    function applyEnvironment(env) {
        if (!env) return;
        if (env.altitude != null) setFieldValue('envAltitude', env.altitude);
        if (env.temperature != null) setFieldValue('envTemperature', env.temperature);
        if (env.wind != null) setFieldValue('envWind', env.wind);
        if (env.batteryHealth != null) setFieldValue('batteryHealth', env.batteryHealth);
        if (env.batteryCycles != null) setFieldValue('batteryCycles', env.batteryCycles);
    }

    function applyConfig(config) {
        if (!config) return;
        Object.keys(config).forEach((id) => {
            if (db() && db().CONFIG_FIELDS && db().CONFIG_FIELDS.indexOf(id) === -1) return;
            setFieldValue(id, config[id]);
        });
    }

    function snapshotState(droneType, extra) {
        return {
            v: 1,
            droneType: droneType || 'fpv',
            config: getCurrentConfig(),
            environment: getEnvironmentState(),
            ...(extra || {})
        };
    }

    function encodeShare(state) {
        return '#c=' + encodeURIComponent(JSON.stringify(state));
    }

    function parseShare(hash) {
        const raw = hash || (typeof location !== 'undefined' ? location.hash : '');
        if (!raw || raw.indexOf('#c=') !== 0) return null;
        try {
            return JSON.parse(decodeURIComponent(raw.slice(3)));
        } catch (err) {
            console.warn('Could not parse shared config', err);
            return null;
        }
    }

    function writeShareToLocation(state) {
        if (typeof history === 'undefined' || typeof location === 'undefined') return;
        const url = encodeShare(state);
        history.replaceState(null, '', location.pathname + location.search + url);
    }

    function loadSnapshots() {
        try {
            const raw = localStorage.getItem(STORAGE_SNAPSHOTS);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            return [];
        }
    }

    function saveSnapshots(list) {
        try {
            localStorage.setItem(STORAGE_SNAPSHOTS, JSON.stringify(list.slice(0, 40)));
        } catch (err) {
            console.warn('Could not persist snapshots', err);
        }
    }

    function saveLast(state) {
        try {
            localStorage.setItem(STORAGE_LAST, JSON.stringify(state));
        } catch (err) { /* ignore quota */ }
    }

    function loadLast() {
        try {
            const raw = localStorage.getItem(STORAGE_LAST);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            return null;
        }
    }

    function escapeText(value) {
        return String(value == null ? '' : value);
    }

    function fillSelect(selectEl, items, selected) {
        if (!selectEl) return;
        const current = selected != null ? String(selected) : selectEl.value;
        selectEl.textContent = '';
        items.forEach((item) => {
            const opt = document.createElement('option');
            opt.value = item.value;
            opt.textContent = item.label;
            selectEl.appendChild(opt);
        });
        if ([].some.call(selectEl.options, (o) => o.value === current)) {
            selectEl.value = current;
        }
    }

    root.ConfigStore = {
        getCurrentConfig,
        getEnvironmentState,
        applyEnvironment,
        applyConfig,
        snapshotState,
        encodeShare,
        parseShare,
        writeShareToLocation,
        loadSnapshots,
        saveSnapshots,
        saveLast,
        loadLast,
        escapeText,
        fillSelect,
        STORAGE_SNAPSHOTS,
        STORAGE_LAST
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = root.ConfigStore;
    }
})(typeof window !== 'undefined' ? window : globalThis);
