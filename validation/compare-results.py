import csv
import json
import math
from pathlib import Path

base = Path(__file__).resolve().parent
app = json.loads((base / "results/app-results.json").read_text())
reference = json.loads((base / "results/r-results.json").read_text())

rows = []
for metric in sorted(app):
    app_value = float(app[metric])
    if metric not in reference:
        rows.append([metric, app_value, "", "", "NOT BENCHMARKED"])
        continue
    reference_value = float(reference[metric])
    difference = abs(app_value - reference_value)
    tolerance = max(1e-8, abs(reference_value) * 1e-6)
    status = "PASS" if math.isfinite(difference) and difference <= tolerance else "FAIL"
    rows.append([metric, app_value, reference_value, difference, status])

output = base / "results/comparison.csv"
with output.open("w", newline="") as handle:
    writer = csv.writer(handle)
    writer.writerow(["metric", "application", "R_reference", "absolute_difference", "status"])
    writer.writerows(rows)

counts = {status: sum(row[-1] == status for row in rows) for status in ["PASS", "FAIL", "NOT BENCHMARKED"]}
print(json.dumps(counts, indent=2))
if counts["FAIL"]:
    print("\nFailed comparisons:")
    for row in rows:
        if row[-1] == "FAIL":
            print(row)
