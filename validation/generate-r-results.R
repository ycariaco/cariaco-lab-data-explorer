library(jsonlite)
library(car)
library(nlme)
library(rstatix)

args <- commandArgs(trailingOnly = TRUE)
base_dir <- if (length(args)) args[[1]] else "validation"
data <- fromJSON(file.path(base_dir, "datasets.json"), simplifyVector = TRUE)
results <- list()
put <- function(key, value) results[[key]] <<- as.numeric(value)

put("descriptive.mean", mean(data$welch$first))
put("descriptive.variance", var(data$welch$first))
put("descriptive.median", median(data$welch$first))

welch <- t.test(data$welch$first, data$welch$second, var.equal = FALSE)
put("welch.statistic", unname(welch$statistic))
# The application intentionally displays Welch's denominator df to one decimal.
put("welch.df", round(unname(welch$parameter), 1))
put("welch.p", welch$p.value)

paired <- t.test(data$paired$first, data$paired$second, paired = TRUE)
put("paired_t.statistic", unname(paired$statistic))
put("paired_t.df", unname(paired$parameter))
put("paired_t.p", paired$p.value)

one_way <- stack(data$one_way)
one_way_fit <- aov(values ~ ind, data = one_way)
one_way_table <- summary(one_way_fit)[[1]]
put("one_way.statistic", one_way_table["ind", "F value"])
put("one_way.df1", one_way_table["ind", "Df"])
put("one_way.df2", one_way_table["Residuals", "Df"])
put("one_way.p", one_way_table["ind", "Pr(>F)"])

pearson <- cor.test(data$pearson$x, data$pearson$y, method = "pearson")
put("pearson.statistic", unname(pearson$estimate))
put("pearson.df", unname(pearson$parameter))
put("pearson.p", pearson$p.value)

rho <- cor(data$spearman$x, data$spearman$y, method = "spearman")
rho_t <- abs(rho) * sqrt((length(data$spearman$x) - 2) / (1 - rho^2))
put("spearman.statistic", rho)
put("spearman.df", length(data$spearman$x) - 2)
put("spearman.p", 2 * pt(-rho_t, df = length(data$spearman$x) - 2))

mann <- wilcox.test(
  data$mann_whitney$first,
  data$mann_whitney$second,
  exact = FALSE,
  correct = TRUE
)
mann_u1 <- unname(mann$statistic)
mann_u2 <- length(data$mann_whitney$first) * length(data$mann_whitney$second) - mann_u1
put("mann_whitney.statistic", min(mann_u1, mann_u2))
put("mann_whitney.p", mann$p.value)

wilcoxon <- wilcox.test(
  data$wilcoxon$first,
  data$wilcoxon$second,
  paired = TRUE,
  exact = FALSE,
  correct = TRUE
)
differences <- data$wilcoxon$first - data$wilcoxon$second
differences <- differences[differences != 0]
difference_ranks <- rank(abs(differences))
positive <- sum(difference_ranks[differences > 0])
negative <- sum(difference_ranks[differences < 0])
put("wilcoxon.statistic", min(positive, negative))
put("wilcoxon.p", wilcoxon$p.value)

rank_data <- stack(data$rank_groups)
kruskal <- kruskal.test(values ~ ind, data = rank_data)
put("kruskal_wallis.statistic", unname(kruskal$statistic))
put("kruskal_wallis.df", unname(kruskal$parameter))
put("kruskal_wallis.p", kruskal$p.value)

dunn <- dunn_test(rank_data, values ~ ind, p.adjust.method = "holm")
for (row in seq_len(nrow(dunn))) {
  key <- paste0("dunn.", dunn$group1[[row]], "_", dunn$group2[[row]])
  # Compare the magnitude because software can define the pairwise direction
  # in the opposite order while returning the same two-sided inference.
  put(paste0(key, ".abs_z"), abs(dunn$statistic[[row]]))
  put(paste0(key, ".p"), dunn$p[[row]])
  put(paste0(key, ".p_holm"), dunn$p.adj[[row]])
}

friedman_matrix <- as.matrix(data$friedman)
friedman <- friedman.test(friedman_matrix)
put("friedman.statistic", unname(friedman$statistic))
put("friedman.df", unname(friedman$parameter))
put("friedman.p", friedman$p.value)

validate_factorial <- function(dataset, prefix) {
  frame <- data.frame(
    response = dataset$response,
    factor_a = factor(dataset$factor_a),
    factor_b = factor(dataset$factor_b)
  )
  contrasts(frame$factor_a) <- contr.sum(nlevels(frame$factor_a))
  contrasts(frame$factor_b) <- contr.sum(nlevels(frame$factor_b))
  fit <- lm(response ~ factor_a * factor_b, data = frame)
  table <- Anova(fit, type = 3)
  mappings <- c(
    factor_a = "factor_a",
    factor_b = "factor_b",
    `factor_a:factor_b` = "interaction"
  )
  for (row_name in names(mappings)) {
    effect <- mappings[[row_name]]
    put(paste0(prefix, ".", effect, ".F"), table[row_name, "F value"])
    put(paste0(prefix, ".", effect, ".df1"), table[row_name, "Df"])
    put(paste0(prefix, ".", effect, ".df2"), df.residual(fit))
    put(paste0(prefix, ".", effect, ".p"), table[row_name, "Pr(>F)"])
  }
}

validate_factorial(data$factorial_balanced, "two_way_balanced")
validate_factorial(data$factorial_unbalanced, "two_way_unbalanced")

mixed_frame <- data.frame(
  response = data$mixed$response,
  group = factor(data$mixed$group),
  subject = factor(data$mixed$subject)
)
mixed_fit <- lme(
  response ~ group,
  random = ~1 | subject,
  data = mixed_frame,
  method = "REML"
)
mixed_table <- anova(mixed_fit)
variance_table <- VarCorr(mixed_fit)
random_variance <- as.numeric(variance_table[1, "Variance"])
residual_variance <- as.numeric(variance_table[nrow(variance_table), "Variance"])
put("mixed.statistic", mixed_table["group", "F-value"])
put("mixed.df1", mixed_table["group", "numDF"])
put("mixed.df2", mixed_table["group", "denDF"])
put("mixed.p", mixed_table["group", "p-value"])
put("mixed.icc", random_variance / (random_variance + residual_variance))

linear <- lm(data$pearson$y ~ data$pearson$x)
put("linear_regression.slope", coef(linear)[[2]])
put("linear_regression.intercept", coef(linear)[[1]])

holm <- p.adjust(data$adjustments, method = "holm")
bh <- p.adjust(data$adjustments, method = "BH")
bonferroni <- p.adjust(data$adjustments, method = "bonferroni")
sidak <- 1 - (1 - data$adjustments)^length(data$adjustments)
for (index in seq_along(holm)) {
  put(paste0("adjustment.holm.", index), holm[[index]])
  put(paste0("adjustment.bh.", index), bh[[index]])
  put(paste0("adjustment.bonferroni.", index), bonferroni[[index]])
  put(paste0("adjustment.sidak.", index), sidak[[index]])
}

shapiro <- shapiro.test(data$normality)
put("normality.shapiro.statistic", unname(shapiro$statistic))
put("normality.shapiro.p", shapiro$p.value)

write_json(
  results,
  file.path(base_dir, "results", "r-results.json"),
  auto_unbox = TRUE,
  pretty = TRUE,
  digits = 16
)
