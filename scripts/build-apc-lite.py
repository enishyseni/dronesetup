#!/usr/bin/env python3
"""Build a trimmed APC propeller JSON from APC-Prop-DB.csv."""
import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "APC-Prop-DB.csv"
OUT_PATH = ROOT / "data" / "apc-lite.json"

PREFERRED_DIAMETERS = {3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14}
MIN_D, MAX_D = 2.5, 14.5
MAX_PROPS = 180
MAX_POINTS = 24


def parse_float(value):
    if value is None:
        return None
    text = str(value).strip().replace(",", ".")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def main():
    groups = defaultdict(lambda: {"diameter": None, "pitch": None, "points": []})
    with CSV_PATH.open(newline="", encoding="utf-8", errors="replace") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            prop_id = (row.get("PROP") or "").strip()
            if not prop_id:
                continue
            diameter = parse_float(row.get("DIAM"))
            pitch = parse_float(row.get("PITCH"))
            rpm = parse_float(row.get("RPM"))
            velocity = parse_float(row.get("V_ms"))
            thrust = parse_float(row.get("Thrust_N"))
            power = parse_float(row.get("PWR_W"))
            if None in (diameter, pitch, rpm, thrust, power):
                continue
            if diameter < MIN_D or diameter > MAX_D:
                continue
            # Prefer static / near-static points for hover-dominant estimates
            if velocity is None or velocity > 3.5:
                continue
            bucket = groups[prop_id]
            bucket["diameter"] = diameter
            bucket["pitch"] = pitch
            bucket["points"].append((rpm, velocity or 0.0, thrust, power))

    scored = []
    for prop_id, data in groups.items():
        if len(data["points"]) < 4:
            continue
        diameter = data["diameter"]
        prefer = 0 if round(diameter) in PREFERRED_DIAMETERS else 1
        scored.append((prefer, abs(diameter - 7.0), -len(data["points"]), prop_id, data))

    scored.sort()
    selected = scored[:MAX_PROPS]

    props = {}
    for _, _, _, prop_id, data in selected:
        points = sorted(data["points"], key=lambda p: (p[0], p[1]))
        if len(points) > MAX_POINTS:
            step = max(1, len(points) // MAX_POINTS)
            reduced = points[::step][:MAX_POINTS]
            if reduced[-1] != points[-1]:
                reduced[-1] = points[-1]
            points = reduced
        props[prop_id] = {
            "diameter": round(data["diameter"], 3),
            "pitch": round(data["pitch"], 3),
            "points": [
                [round(rpm, 1), round(vel, 3), round(thrust, 4), round(power, 3)]
                for rpm, vel, thrust, power in points
            ],
        }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": "APC-Prop-DB.csv (static-thrust subset)",
        "propCount": len(props),
        "diameterRangeIn": [MIN_D, MAX_D],
        "props": props,
    }
    OUT_PATH.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"Wrote {OUT_PATH} ({len(props)} props, {size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
