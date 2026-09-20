library(jsonlite)
library(car)
library(nlme)

args <- commandArgs(trailingOnly = TRUE)
base_dir <- if (length(args)) args[[1]] else "validation"
data <- fromJSON(
  file.path(base_dir, "results", "audit-data.json"),
  simplifyVector = FALSE
)
results <- list()
put <- function(key, value) results[[key]] <<- as.numeric(value)
add_test <- function(prefix, result, statistic_name = "statistic") {
  put(paste0(prefix, ".statistic"), unname(result$statistic))
  put(paste0(prefix, ".p"), result$p.value)
  if (!is.null(result$parameter)) {
    parameters <- unname(result$parameter)
    if (length(parameters) == 1) put(paste0(prefix, ".df"), parameters[[1]])
    if (length(parameters) == 2) {
      put(paste0(prefix, ".df1"), parameters[[1]])
      put(paste0(prefix, ".df2"), round(parameters[[2]], 1))
    }
  }
}

for (fixture in data$cases) {
  prefix <- sprintf("case_%02d", fixture$id)
  groups <- lapply(fixture$groups, unlist)
  group_frame <- data.frame(
    response = unlist(groups),
    group = factor(rep(seq_along(groups), lengths(groups)))
  )

  welch_t <- t.test(groups[[1]], groups[[2]], var.equal = FALSE)
  put(paste0(prefix, ".welch_t.statistic"), unname(welch_t$statistic))
  put(paste0(prefix, ".welch_t.df"), round(unname(welch_t$parameter), 1))
  put(paste0(prefix, ".welch_t.p"), welch_t$p.value)
  one_way <- summary(aov(response ~ group, data = group_frame))[[1]]
  put(paste0(prefix, ".one_way.statistic"), one_way["group", "F value"])
  put(paste0(prefix, ".one_way.df1"), one_way["group", "Df"])
  put(paste0(prefix, ".one_way.df2"), one_way["Residuals", "Df"])
  put(paste0(prefix, ".one_way.p"), one_way["group", "Pr(>F)"])
  add_test(
    paste0(prefix, ".welch_one_way"),
    oneway.test(response ~ group, data = group_frame, var.equal = FALSE)
  )

  paired_first <- unlist(fixture$pairedFirst)
  paired_second <- unlist(fixture$pairedSecond)
  add_test(
    paste0(prefix, ".paired_t"),
    t.test(paired_first, paired_second, paired = TRUE)
  )
  wilcoxon <- wilcox.test(
    paired_first,
    paired_second,
    paired = TRUE,
    exact = FALSE,
    correct = TRUE
  )
  differences <- paired_first - paired_second
  differences <- differences[differences != 0]
  difference_ranks <- rank(abs(differences))
  positive <- sum(difference_ranks[differences > 0])
  negative <- sum(difference_ranks[differences < 0])
  put(paste0(prefix, ".wilcoxon.statistic"), min(positive, negative))
  put(paste0(prefix, ".wilcoxon.p"), wilcoxon$p.value)

  mann <- wilcox.test(groups[[1]], groups[[2]], exact = FALSE, correct = TRUE)
  mann_u1 <- unname(mann$statistic)
  mann_u2 <- length(groups[[1]]) * length(groups[[2]]) - mann_u1
  put(paste0(prefix, ".mann_whitney.statistic"), min(mann_u1, mann_u2))
  put(paste0(prefix, ".mann_whitney.p"), mann$p.value)

  kruskal <- kruskal.test(response ~ group, data = group_frame)
  add_test(paste0(prefix, ".kruskal_wallis"), kruskal)
  friedman_matrix <- do.call(rbind, lapply(fixture$blocks, unlist))
  add_test(paste0(prefix, ".friedman"), friedman.test(friedman_matrix))

  x <- unlist(fixture$x)
  y <- unlist(fixture$y)
  pearson <- cor.test(x, y, method = "pearson")
  put(paste0(prefix, ".pearson.statistic"), unname(pearson$estimate))
  put(paste0(prefix, ".pearson.df"), unname(pearson$parameter))
  put(paste0(prefix, ".pearson.p"), pearson$p.value)
  spearman_x <- unlist(fixture$spearmanX)
  spearman_y <- unlist(fixture$spearmanY)
  rho <- cor(spearman_x, spearman_y, method = "spearman")
  rho_t <- abs(rho) * sqrt((length(spearman_x) - 2) / (1 - rho^2))
  put(paste0(prefix, ".spearman.statistic"), rho)
  put(paste0(prefix, ".spearman.df"), length(spearman_x) - 2)
  put(paste0(prefix, ".spearman.p"), 2 * pt(-rho_t, df = length(spearman_x) - 2))

  factorial <- data.frame(
    response = unlist(fixture$factorial$response),
    factor_a = factor(unlist(fixture$factorial$factorA)),
    factor_b = factor(unlist(fixture$factorial$factorB))
  )
  contrasts(factorial$factor_a) <- contr.sum(nlevels(factorial$factor_a))
  contrasts(factorial$factor_b) <- contr.sum(nlevels(factorial$factor_b))
  factorial_fit <- lm(response ~ factor_a * factor_b, data = factorial)
  factorial_table <- Anova(factorial_fit, type = 3)
  mappings <- c(
    factor_a = "factor_a",
    factor_b = "factor_b",
    `factor_a:factor_b` = "interaction"
  )
  for (row_name in names(mappings)) {
    effect <- mappings[[row_name]]
    put(paste0(prefix, ".two_way.", effect, ".F"), factorial_table[row_name, "F value"])
    put(paste0(prefix, ".two_way.", effect, ".df1"), factorial_table[row_name, "Df"])
    put(paste0(prefix, ".two_way.", effect, ".df2"), df.residual(factorial_fit))
    put(paste0(prefix, ".two_way.", effect, ".p"), factorial_table[row_name, "Pr(>F)"])
  }

  mixed <- data.frame(
    response = unlist(fixture$mixed$response),
    group = factor(unlist(fixture$mixed$group)),
    subject = factor(unlist(fixture$mixed$subject))
  )
  mixed_fit <- lme(response ~ group, random = ~1 | subject, data = mixed, method = "REML")
  mixed_table <- anova(mixed_fit)
  variance_table <- VarCorr(mixed_fit)
  random_variance <- as.numeric(variance_table[1, "Variance"])
  residual_variance <- as.numeric(variance_table[nrow(variance_table), "Variance"])
  put(paste0(prefix, ".mixed.statistic"), mixed_table["group", "F-value"])
  put(paste0(prefix, ".mixed.df1"), mixed_table["group", "numDF"])
  put(paste0(prefix, ".mixed.df2"), mixed_table["group", "denDF"])
  put(paste0(prefix, ".mixed.p"), mixed_table["group", "p-value"])
  put(
    paste0(prefix, ".mixed.icc"),
    random_variance / (random_variance + residual_variance)
  )

  mixed_incomplete <- data.frame(
    response = unlist(fixture$mixedIncomplete$response),
    group = factor(unlist(fixture$mixedIncomplete$group)),
    subject = factor(unlist(fixture$mixedIncomplete$subject))
  )
  mixed_incomplete_fit <- lme(
    response ~ group,
    random = ~1 | subject,
    data = mixed_incomplete,
    method = "REML"
  )
  mixed_incomplete_table <- anova(mixed_incomplete_fit)
  mixed_incomplete_variance <- VarCorr(mixed_incomplete_fit)
  incomplete_random_variance <- as.numeric(mixed_incomplete_variance[1, "Variance"])
  incomplete_residual_variance <- as.numeric(
    mixed_incomplete_variance[nrow(mixed_incomplete_variance), "Variance"]
  )
  put(
    paste0(prefix, ".mixed_incomplete.statistic"),
    mixed_incomplete_table["group", "F-value"]
  )
  put(
    paste0(prefix, ".mixed_incomplete.df1"),
    mixed_incomplete_table["group", "numDF"]
  )
  put(
    paste0(prefix, ".mixed_incomplete.df2"),
    mixed_incomplete_table["group", "denDF"]
  )
  put(
    paste0(prefix, ".mixed_incomplete.p"),
    mixed_incomplete_table["group", "p-value"]
  )
  put(
    paste0(prefix, ".mixed_incomplete.icc"),
    incomplete_random_variance /
      (incomplete_random_variance + incomplete_residual_variance)
  )

  normality_values <- unlist(fixture$normalityValues)
  shapiro <- shapiro.test(normality_values)
  put(
    paste0(prefix, ".normality.shapiro.statistic"),
    unname(shapiro$statistic)
  )
  put(paste0(prefix, ".normality.shapiro.p"), shapiro$p.value)
  put(
    paste0(prefix, ".normality.shapiro.reject_0_05"),
    ifelse(shapiro$p.value < 0.05, 1, 0)
  )
}

write_json(
  results,
  file.path(base_dir, "results", "audit-r-results.json"),
  auto_unbox = TRUE,
  pretty = TRUE,
  digits = 16
)
