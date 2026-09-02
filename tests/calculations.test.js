#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const COMPONENT_DB = require(path.join(__dirname, '../js/componentData.js'));
global.COMPONENT_DB = COMPONENT_DB;
const DroneCalculator = require(path.join(__dirname, '../js/calculations.js'));

function fail(msg) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
}

function pass(msg) {
    console.log('ok:', msg);
}

const calc = new DroneCalculator();
calc.setDroneType('fpv');

const base = {
    frameSize: '5inch',
    motorKv: '2400',
    batteryType: 'lipo-4s',
    batteryCapacity: '1500',
    flightController: 'f4',
    camera: 'analog',
    vtxPower: '200',
    missionLoad: 'mixed',
    payloadMass: '0',
    auwOverride: '0'
};

assert.strictEqual(calc.validateConfig(base), true, 'default 5" config is valid');
pass('valid config accepted');

const invalid = { ...base, batteryType: 'nope' };
assert.strictEqual(calc.validateConfig(invalid), false, 'bad battery rejected');
assert.ok(calc.lastValidationErrors.length > 0);
pass('invalid config fails closed');

const weight = calc.calculateFPVDroneWeight(base);
assert.ok(weight && weight > 200 && weight < 900, `weight in range, got ${weight}`);
pass(`FPV AUW ${weight.toFixed(1)}g`);

const lipoTime = calc.calculateFlightTime(base, weight);
const liion = { ...base, batteryType: 'liion-4s' };
const liionWeight = calc.calculateFPVDroneWeight(liion);
const liionTime = calc.calculateFlightTime(liion, liionWeight);
assert.ok(lipoTime > 0 && liionTime > 0);
assert.ok(
    Math.abs(liionTime - lipoTime) / lipoTime < 0.35,
    `Li-Ion should not be ~30%+ longer from stacked fudge factors (lipo ${lipoTime}, liion ${liionTime})`
);
pass(`flight time lipo ${lipoTime} vs liion ${liionTime}`);

const hover = calc.calculateFlightTime({ ...base, missionLoad: 'hover' }, weight);
const race = calc.calculateFlightTime({ ...base, missionLoad: 'race' }, weight);
assert.ok(hover > race, `hover ${hover} should exceed race ${race}`);
pass('mission load changes flight time');

assert.strictEqual(calc.calculateFPVDroneWeight({ ...base, batteryType: '' }), null);
pass('missing battery does not invent 500g');

const tw = calc.calculateThrustToWeight(base, weight);
assert.ok(tw > 0.5 && tw < 20, `T/W ${tw} looks like a ratio, not W/kg/100`);
pass(`thrust-to-weight ${tw.toFixed(2)}:1`);

calc.setDroneType('fixedWing');
const fw = {
    wingspan: '1500',
    wingType: 'conventional',
    motorKv: '1100',
    batteryType: 'liion-4s',
    batteryCapacity: '4000',
    camera: 'digital',
    vtxPower: '200',
    missionLoad: 'cruise',
    payloadMass: '0',
    auwOverride: '0'
};
assert.strictEqual(calc.validateConfig(fw), true);
const fwWeight = calc.calculateFixedWingWeight(fw);
assert.ok(fwWeight && fwWeight > 400, `FW weight ${fwWeight}`);
const fwThrust = calc.calculateThrust(fw);
assert.ok(isFinite(fwThrust) && fwThrust > 0, `FW thrust ${fwThrust}`);
pass(`fixed-wing weight ${fwWeight.toFixed(0)}g thrust ${fwThrust.toFixed(0)}g`);

calc.setDroneType('fpv');
const pids = calc.calculateRecommendedPIDValues(base);
assert.ok(pids.P < 15, `PID P ${pids.P} should be Betaflight 4.x scale`);
pass(`recommended P=${pids.P.toFixed(2)} (${pids.firmware})`);

const fpvMotors = COMPONENT_DB.motorOptions('fpv');
const fwMotors = COMPONENT_DB.motorOptions('fixedWing');
assert.ok(fpvMotors.includes('2400'));
assert.ok(fwMotors.includes('1100'));
assert.ok(!fwMotors.includes('3000'));
pass('motor catalogs split FPV vs fixed-wing');

const breakdownFpv = COMPONENT_DB.fpvBreakdown(base);
const breakdownAgain = COMPONENT_DB.fpvBreakdown(base);
assert.deepStrictEqual(breakdownFpv, breakdownAgain);
pass('shared component DB is stable');

if (process.exitCode) {
    console.error('Some calculations tests failed');
    process.exit(1);
}
console.log('\nAll calculations tests passed.');
