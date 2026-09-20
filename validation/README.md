# Reproducible R benchmark

This folder contains the fixed datasets, application runner, R reference
runner, and comparison scripts used for version 1.2.0.

Run from the project root:

```bash
mkdir -p validation/results
pnpm validate:app
pnpm validate:r
pnpm validate:compare
```

The extended stress audit covers 18 deterministic datasets and includes
unbalanced factorial data, complete and incomplete repeated measures, ties,
unequal variances, and normality diagnostics:

```bash
pnpm audit:app
pnpm audit:r
PYTHONPATH=/path/to/scipy python3 validation/audit-scipy.py
pnpm audit:compare
```

Required R packages: `car`, `jsonlite`, `nlme`, and `rstatix`.
The optional normality reference requires SciPy 1.13.1.

The comparison tolerance is the larger of `1e-8` and one part per million of
the R value. Method-specific display conventions are normalized before
comparison: Welch denominator degrees of freedom are rounded to one decimal,
and Dunn z-statistics are compared by magnitude because labelled pair order can
reverse the sign without changing the two-sided inference.

The output files in `validation/results/` are retained as an auditable snapshot.
