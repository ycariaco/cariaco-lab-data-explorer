import json
from pathlib import Path

from scipy import stats

base = Path(__file__).resolve().parent
data = json.loads((base / "results/audit-data.json").read_text())
results = {}

for fixture in data["cases"]:
    prefix = f"case_{fixture['id']:02d}.normality.dagostino"
    result = stats.normaltest(fixture["normalityValues"])
    results[f"{prefix}.statistic"] = float(result.statistic)
    results[f"{prefix}.p"] = float(result.pvalue)
    results[f"{prefix}.reject_0_05"] = int(result.pvalue < 0.05)

(base / "results/audit-scipy-results.json").write_text(
    json.dumps(results, indent=2) + "\n"
)
print(json.dumps({"scipy_metrics": len(results)}, indent=2))
