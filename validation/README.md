# Reproducible R benchmark

This folder contains the fixed datasets, application runner, R reference
runner, and comparison script used for version 1.0.1.

Run from the project root:

```bash
mkdir -p validation/results
pnpm validate:app
pnpm validate:r
pnpm validate:compare
```

Required R packages: `car`, `jsonlite`, `nlme`, and `rstatix`.

The comparison tolerance is the larger of `1e-8` and one part per million of
the R value. Method-specific display conventions are normalized before
comparison: Welch denominator degrees of freedom are rounded to one decimal,
and Dunn z-statistics are compared by magnitude because labelled pair order can
reverse the sign without changing the two-sided inference.

The output files in `validation/results/` are retained as an auditable snapshot.
