import csv
import json
import math
from pathlib import Path

base = Path(__file__).resolve().parent
app = json.loads((base / "results/audit-app-results.json").read_text())
reference = json.loads((base / "results/audit-r-results.json").read_text())
scipy_reference = base / "results/audit-scipy-results.json"
if scipy_reference.exists():
    reference.update(json.loads(scipy_reference.read_text()))

rows = []
for metric in sorted(app):
    app_value = float(app[metric])
    if metric not in reference:
        rows.append([metric, app_value, "", "", "NOT BENCHMARKED"])
        continue
    reference_value = float(reference[metric])
    difference = abs(app_value - reference_value)
    if ".normality.shapiro.p" in metric:
        tolerance = 0.015
    elif ".normality.shapiro.statistic" in metric:
        tolerance = 0.002
    else:
        tolerance = max(1e-8, abs(reference_value) * 2e-6)
    status = "PASS" if math.isfinite(difference) and difference <= tolerance else "FAIL"
    rows.append([metric, app_value, reference_value, difference, status])

for metric in sorted(set(reference) - set(app)):
    rows.append([metric, "", reference[metric], "", "MISSING IN APP"])

output = base / "results/audit-comparison.csv"
with output.open("w", newline="") as handle:
    writer = csv.writer(handle)
    writer.writerow(["metric", "application", "reference", "absolute_difference", "status"])
    writer.writerows(rows)

statuses = ["PASS", "FAIL", "NOT BENCHMARKED", "MISSING IN APP"]
counts = {status: sum(row[-1] == status for row in rows) for status in statuses}
print(json.dumps(counts, indent=2))
if counts["FAIL"] or counts["MISSING IN APP"]:
    print("\nFailed or missing comparisons:")
    for row in rows:
        if row[-1] in {"FAIL", "MISSING IN APP"}:
            print(row)
    raise SystemExit(1)
