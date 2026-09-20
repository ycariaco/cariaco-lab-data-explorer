# Statistical methods and reference benchmark

**Application:** Cariaco Lab Data Explorer  
**Version:** 1.2.0  
**Updated:** 20 September 2026  
**Status:** Reproducible reference benchmark; not an independent, clinical, or regulated software validation.

## Intended use

The application supports exploratory visualization, data screening, and simple
statistical summaries. It does not determine the experimental unit, repair an
invalid study design, or replace a prespecified analysis plan and review in
specialist statistical software.

## Benchmark procedure and result

The TypeScript calculations were run on fixed datasets and compared with R
4.6.1. The R references used `stats`, `car` 3.1-5, `nlme` 3.1-169, and
`rstatix` 1.1.0. D'Agostino–Pearson normality results were additionally
compared with SciPy 1.13.1.

The extended audit used 18 deterministic datasets containing unequal group
sizes and variances, tied ranks, paired observations, balanced and unbalanced
factorial designs, and complete and incomplete repeated measures. All **1,044
numerical comparisons passed** their declared tolerances, and all eight invalid
or degenerate edge cases were rejected as intended.

Shapiro–Wilk uses a WebAssembly implementation and is not bit-for-bit identical
to R. Across the 18 stress datasets, the largest absolute differences were
0.000651 for W and 0.010109 for p; every α = 0.05 reject/not-reject decision
matched R. D'Agostino–Pearson results matched SciPy to numerical precision on
the same datasets.

The smaller historical benchmark produced 107 comparisons: 103 met its strict
general numerical tolerance, two Shapiro–Wilk values showed the documented
implementation difference, and two D'Agostino–Pearson values had no R reference
in that suite. The extended R/SciPy audit resolves the latter reference gap.

Machine-readable results are retained in `validation/results/`, including
`comparison.csv` and `audit-comparison.csv`. The generators and fixed inputs
are stored in `validation/` so the checks can be repeated after changes.

## Method status

| Calculation | Reference | Benchmark status and assumptions |
| --- | --- | --- |
| Mean, sample variance, median | Base R | Matched. Calculated from finite complete observations. |
| Welch two-sample t-test | `stats::t.test` | Matched. Independent groups and two-sided inference. |
| Paired t-test | `stats::t.test` | Matched. Uses complete subject pairs and tests paired differences. |
| Classical and Welch one-way ANOVA | `stats::aov`, `stats::oneway.test` | Matched. Classical ANOVA assumes equal variances; Welch ANOVA does not. |
| Pearson correlation and linear regression | `stats::cor.test`, `stats::lm` | Matched. Linear relationship and independent observations are required. |
| Spearman correlation | Ranked data with R's t approximation | Matched for the documented asymptotic calculation. |
| Mann–Whitney and Wilcoxon signed-rank tests | `stats::wilcox.test` | Matched. Two-sided normal approximation with tie and continuity corrections. |
| Kruskal–Wallis and Friedman tests | `stats::kruskal.test`, `stats::friedman.test` | Matched. Tie-corrected asymptotic tests; Friedman requires complete blocks. |
| Dunn post-tests with Holm adjustment | `rstatix::dunn_test` | Matched. Absolute z is compared because packages may reverse the sign convention for a labelled pair. |
| Holm, Bonferroni, Šidák, and Benjamini–Hochberg adjustments | `stats::p.adjust` or defined Šidák formula | Matched. The correction family must reflect the analysis plan. |
| Two-way ANOVA | `car::Anova(type = 3)` with sum contrasts | Matched in 216 stress comparisons for balanced and unbalanced fixed-factor fixtures. Requires estimable effects and appropriate residual assumptions. |
| Random-intercept model | `nlme::lme(..., method = "REML")` | Matched in 180 stress comparisons for complete and incomplete repeated-measure fixtures. The app supports one random intercept only and uses approximate denominator degrees of freedom; confirm mixed models in specialist software. |
| Shapiro–Wilk | `stats::shapiro.test` | Same α = 0.05 decisions in all 18 stress datasets; small implementation-level numerical differences remain. |
| D'Agostino–Pearson K² | `scipy.stats.normaltest` | Matched in 54 comparisons across 18 datasets. Used only as a secondary diagnostic when n ≥ 20. |
| IQR and MAD outlier flags | Formula-based | Flags observations only; values are never removed automatically. |
| Four-parameter logistic fit | Internal nonlinear optimizer | Exploratory fit only, not independently benchmarked for parameter confidence intervals. Requires at least five distinct doses and variable responses. Confirm final dose-response estimates in validated curve-fitting software. |

## Important interpretation rules

- Rows missing a selected analysis variable are excluded from that analysis.
- Reported tests are two-sided unless the interface explicitly states
  otherwise. Diagnostic interpretation uses α = 0.05.
- Normality is assessed on model residuals; paired analyses use within-subject
  differences. A non-significant test is not proof of normality, and an outlier
  flag alone does not automatically select a non-parametric test.
- When duplicate observations exist for the same subject and condition, their
  mean is used for paired and repeated-measure comparisons.
- The automatic recommendation is guidance only. It cannot identify the true
  experimental unit, pseudoreplication, confounding, batch effects, or the
  scientific meaning of the study design.
- Non-parametric tests do not automatically test medians under every
  distribution shape and study design.
- Post-tests are displayed transparently even when the omnibus test is not
  significant. Their use should follow the prespecified analysis plan.
- Implemented post-tests are pairwise Welch tests after one- and two-factor
  analyses, Dunn tests after Kruskal–Wallis, paired Wilcoxon tests after
  Friedman, and paired t-tests after the random-intercept preview. These are
  simple comparisons rather than estimated-marginal-means contrasts.
- A repeated two-factor design is detected and blocked from ordinary two-way
  ANOVA. Such data require a repeated-measures or mixed factorial model in
  specialist software.
- Heatmaps, PCA, set plots, and volcano plots are exploratory visualizations.
  Volcano plots use effect sizes and p/FDR values supplied by the user; the app
  does not fit the upstream omics model.

## Reproducing the benchmark

From the project folder:

```bash
mkdir -p validation/results
pnpm validate:app
pnpm validate:r
pnpm validate:compare

pnpm audit:app
pnpm audit:r
PYTHONPATH=/path/to/scipy python3 validation/audit-scipy.py
pnpm audit:compare
```

Review every failed or unbenchmarked comparison before changing the public
benchmark statement or releasing a new version.
