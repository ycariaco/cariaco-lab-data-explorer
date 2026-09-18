# Statistical methods and reference benchmark

**Application:** Cariaco Lab Data Explorer  
**Version:** 1.0.1  
**Updated:** 18 September 2026  
**Status:** Reproducible reference benchmark; not an independent, clinical, or regulated software validation.

## Intended use

The application supports exploratory visualization, data screening, and simple
statistical summaries. It does not determine the experimental unit, repair an
invalid study design, or replace a prespecified analysis plan and review in
specialist statistical software.

## Benchmark procedure

The application's TypeScript calculations were run on fixed datasets and
compared numerically with R 4.6.1. The R references used `stats`, `car` 3.1-5,
`nlme` 3.1-169, and `rstatix` 1.1.0. The fixtures include unequal sample sizes,
ties, paired observations, balanced and unbalanced factorial data, and complete
repeated measures.

The benchmark generated 97 numerical comparisons:

- 93 agreed with R within the declared numerical tolerance;
- 2 Shapiro–Wilk values differed modestly from R, although the interpretation
  was the same for the reference dataset; and
- 2 D'Agostino–Pearson K² values were not independently benchmarked because an
  equivalent installed R reference was unavailable.

The detailed machine-readable output is in
`validation/results/comparison.csv`. The benchmark scripts and fixed input data
are stored in `validation/` so the comparison can be rerun after each change.

## Method status

| Calculation | R reference | Benchmark status and assumptions |
| --- | --- | --- |
| Mean, sample variance, median | Base R | Matched. Calculated from finite complete observations. |
| Welch two-sample t-test | `stats::t.test` | Matched. Independent groups, two-sided; denominator df is displayed to one decimal. |
| Paired t-test | `stats::t.test` | Matched. Complete pairs, two-sided. |
| One-way ANOVA | `stats::aov` | Matched. Classical equal-variance ANOVA. |
| Pearson correlation and linear regression | `stats::cor.test`, `stats::lm` | Matched. Linear relationship and independent observations. |
| Spearman correlation | Ranked data with R's t approximation | Matched for the documented asymptotic calculation. |
| Mann–Whitney and Wilcoxon signed-rank tests | `stats::wilcox.test` | Matched. Two-sided normal approximation with tie and continuity corrections. |
| Kruskal–Wallis and Friedman tests | `stats::kruskal.test`, `stats::friedman.test` | Matched. Tie-corrected asymptotic tests. |
| Dunn post-tests with Holm adjustment | `rstatix::dunn_test` | Matched. Absolute z is compared because packages may reverse the sign convention for a labelled pair. |
| Holm, Bonferroni, Šidák, and Benjamini–Hochberg adjustments | `stats::p.adjust` or the defined Šidák formula | Matched. |
| Two-way ANOVA | `car::Anova(type = 3)` with sum contrasts | Matched for balanced and unbalanced fixed-factor fixtures. Requires estimable effects and appropriate residual assumptions. |
| Random-intercept model | `nlme::lme(..., method = "REML")` | Matched for the complete balanced repeated-measures fixture after correction in v1.0.1. The browser implementation supports only one random intercept and still uses approximate denominator df outside that design; confirm mixed models in R, SAS, SPSS, or equivalent software. |
| Shapiro–Wilk | `stats::shapiro.test` | Compared but not numerically identical. The app's WebAssembly library produced W differing by 0.000316 and p differing by 0.00203 on the reference dataset. Confirm results near the decision threshold in R. |
| D'Agostino–Pearson K² | No installed R equivalent | Not independently benchmarked. Treat as a secondary diagnostic. |
| IQR and MAD outlier flags | Formula-based | Flags observations only; values are never removed automatically. Not included in the R numerical benchmark. |

## Important interpretation rules

- Rows missing a selected analysis variable are excluded from that analysis.
- Reported tests are two-sided unless the interface explicitly states
  otherwise. The diagnostic interpretation uses α = 0.05.
- Normality tests are applied to available model residuals. A non-significant
  test is not proof of normality; graphical and design-based checks remain
  necessary.
- Non-parametric tests do not automatically test medians under all distribution
  shapes and study designs.
- Post-tests are displayed transparently even when the omnibus test is not
  significant. Their use should follow the prespecified analysis plan.
- Implemented post-tests are pairwise Welch tests after one- and two-factor
  analyses, Dunn tests after Kruskal–Wallis, paired Wilcoxon tests after
  Friedman, and paired t-tests after the random-intercept preview. These are
  simple comparisons rather than estimated-marginal-means contrasts.
- Heatmaps and volcano plots are visualizations. Volcano plots use p-values or
  FDR values supplied by the user; the application does not fit the upstream
  omics model.

## Reproducing the benchmark

From the project folder:

```bash
mkdir -p validation/results
pnpm validate:app
pnpm validate:r
pnpm validate:compare
```

Review every failed or unbenchmarked comparison before changing the public
benchmark statement or releasing a new version.
