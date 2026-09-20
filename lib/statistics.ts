export type TestResult = {
  name: string;
  statisticLabel: string;
  statistic: number;
  degreesOfFreedom?: string;
  p: number;
  detail?: string;
};

export type NormalityEngine = {
  shapiroWilk: (values: Float64Array) => {
    statistic: number;
    p_value: number;
  };
  dagostinoKSquared: (values: Float64Array) => {
    k2_statistic: number;
    p_value: number;
  };
};

export type AnovaEffect = {
  effect: string;
  df1: number;
  df2: number;
  f: number;
  p: number;
};

export type PairwiseComparison = {
  first: string;
  second: string;
  context?: string;
  method: string;
  estimate: number;
  estimateLabel: string;
  statisticLabel: string;
  statistic: number;
  p: number;
  adjustedP: number;
  n?: string;
};

export function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sampleVariance(values: number[]) {
  if (values.length < 2) return 0;
  const center = average(values);
  return (
    values.reduce((sum, value) => sum + (value - center) ** 2, 0) /
    (values.length - 1)
  );
}

export function quantile(values: number[], probability: number) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return Number.NaN;
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower + 1] === undefined
    ? sorted[lower]
    : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
}

export function median(values: number[]) {
  return quantile(values, 0.5);
}

export function holmAdjustedPValues(pValues: number[]) {
  const finite = pValues
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => Number.isFinite(p))
    .sort((first, second) => first.p - second.p);
  const adjusted = pValues.map(() => Number.NaN);
  let previous = 0;
  finite.forEach(({ p, index }, rank) => {
    const value = Math.min(1, Math.max(previous, p * (finite.length - rank)));
    adjusted[index] = value;
    previous = value;
  });
  return adjusted;
}

export function benjaminiHochbergAdjustedPValues(pValues: number[]) {
  const finite = pValues
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => Number.isFinite(p))
    .sort((first, second) => first.p - second.p);
  const adjusted = pValues.map(() => Number.NaN);
  let next = 1;
  for (let rank = finite.length - 1; rank >= 0; rank -= 1) {
    const { p, index } = finite[rank];
    const value = Math.min(next, (p * finite.length) / (rank + 1), 1);
    adjusted[index] = value;
    next = value;
  }
  return adjusted;
}

function applyHolmAdjustment(
  comparisons: Array<Omit<PairwiseComparison, 'adjustedP'>>,
) {
  const adjusted = holmAdjustedPValues(
    comparisons.map((comparison) => comparison.p),
  );
  return comparisons.map((comparison, index) => ({
    ...comparison,
    adjustedP: adjusted[index],
  }));
}

function logGamma(value: number): number {
  const coefficients = [
    676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (value < 0.5) {
    return (
      Math.log(Math.PI) -
      Math.log(Math.sin(Math.PI * value)) -
      logGamma(1 - value)
    );
  }
  let x = 0.9999999999998099;
  const adjusted = value - 1;
  coefficients.forEach((coefficient, index) => {
    x += coefficient / (adjusted + index + 1);
  });
  const t = adjusted + coefficients.length - 0.5;
  return (
    0.5 * Math.log(2 * Math.PI) +
    (adjusted + 0.5) * Math.log(t) -
    t +
    Math.log(x)
  );
}

function betaFraction(a: number, b: number, x: number) {
  const maxIterations = 250;
  const epsilon = 3e-12;
  const tiny = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let result = d;
  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const m2 = 2 * iteration;
    let aa = (iteration * (b - iteration) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    result *= d * c;
    aa = (-(a + iteration) * (qab + iteration) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    result *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return result;
}

function regularizedBeta(x: number, a: number, b: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );
  return x < (a + 1) / (a + b + 2)
    ? (front * betaFraction(a, b, x)) / a
    : 1 - (front * betaFraction(b, a, 1 - x)) / b;
}

export function studentTTwoSidedP(t: number, degreesOfFreedom: number) {
  if (Number.isNaN(t) || degreesOfFreedom <= 0) return Number.NaN;
  if (!Number.isFinite(t)) return 0;
  const x = degreesOfFreedom / (degreesOfFreedom + t * t);
  return regularizedBeta(x, degreesOfFreedom / 2, 0.5);
}

export function studentTCritical95(degreesOfFreedom: number) {
  if (!Number.isFinite(degreesOfFreedom) || degreesOfFreedom <= 0) {
    return Number.NaN;
  }
  let lower = 0;
  let upper = 16;
  while (studentTTwoSidedP(upper, degreesOfFreedom) > 0.05) upper *= 2;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    if (studentTTwoSidedP(midpoint, degreesOfFreedom) > 0.05) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }
  return (lower + upper) / 2;
}

export function fRightTailP(f: number, df1: number, df2: number) {
  if (Number.isNaN(f) || f < 0 || df1 <= 0 || df2 <= 0) {
    return Number.NaN;
  }
  if (!Number.isFinite(f)) return 0;
  const x = df2 / (df2 + df1 * f);
  return regularizedBeta(x, df2 / 2, df1 / 2);
}

export function welchTTest(
  first: number[],
  second: number[],
): TestResult | null {
  if (first.length < 2 || second.length < 2) return null;
  const firstVariance = sampleVariance(first);
  const secondVariance = sampleVariance(second);
  const standardErrorSquared =
    firstVariance / first.length + secondVariance / second.length;
  if (standardErrorSquared <= 0) return null;
  const t =
    (average(first) - average(second)) / Math.sqrt(standardErrorSquared);
  const df =
    standardErrorSquared ** 2 /
    (firstVariance ** 2 / (first.length ** 2 * (first.length - 1)) +
      secondVariance ** 2 / (second.length ** 2 * (second.length - 1)));
  return {
    name: "Welch's two-sample t-test",
    statisticLabel: 't',
    statistic: t,
    degreesOfFreedom: df.toFixed(1),
    p: studentTTwoSidedP(Math.abs(t), df),
    detail: `Mean difference: ${(average(first) - average(second)).toPrecision(4)}`,
  };
}

export function pairwiseWelchPostHoc(
  groups: Array<{ name: string; values: number[] }>,
  context?: string,
): PairwiseComparison[] {
  const comparisons: Array<Omit<PairwiseComparison, 'adjustedP'>> = [];
  for (let first = 0; first < groups.length; first += 1) {
    for (let second = first + 1; second < groups.length; second += 1) {
      const firstGroup = groups[first];
      const secondGroup = groups[second];
      const result = welchTTest(firstGroup.values, secondGroup.values);
      if (!result) continue;
      comparisons.push({
        first: firstGroup.name,
        second: secondGroup.name,
        context,
        method: 'Pairwise Welch t-test',
        estimate: average(firstGroup.values) - average(secondGroup.values),
        estimateLabel: 'Mean difference',
        statisticLabel: result.statisticLabel,
        statistic: result.statistic,
        p: result.p,
        n: `${firstGroup.values.length}, ${secondGroup.values.length}`,
      });
    }
  }
  return applyHolmAdjustment(comparisons);
}

export function pairedTTest(pairs: Array<[number, number]>): TestResult | null {
  if (pairs.length < 3) return null;
  const differences = pairs.map(([first, second]) => first - second);
  const center = average(differences);
  const standardError = Math.sqrt(
    sampleVariance(differences) / differences.length,
  );
  if (standardError === 0) return null;
  const t = center / standardError;
  return {
    name: 'Paired t-test',
    statisticLabel: 't',
    statistic: t,
    degreesOfFreedom: String(differences.length - 1),
    p: studentTTwoSidedP(Math.abs(t), differences.length - 1),
    detail: `${pairs.length} complete pairs; mean paired difference: ${center.toPrecision(4)}`,
  };
}

export function oneWayAnova(groups: number[][]): TestResult | null {
  const valid = groups.filter((values) => values.length >= 2);
  if (valid.length < 2) return null;
  const totalN = valid.reduce((sum, values) => sum + values.length, 0);
  const grandMean =
    valid.reduce((sum, values) => sum + average(values) * values.length, 0) /
    totalN;
  const between = valid.reduce(
    (sum, values) => sum + values.length * (average(values) - grandMean) ** 2,
    0,
  );
  const within = valid.reduce(
    (sum, values) =>
      sum +
      values.reduce(
        (subtotal, value) => subtotal + (value - average(values)) ** 2,
        0,
      ),
    0,
  );
  const df1 = valid.length - 1;
  const df2 = totalN - valid.length;
  const f = between / df1 / (within / df2);
  return {
    name: 'One-way ANOVA',
    statisticLabel: 'F',
    statistic: f,
    degreesOfFreedom: `${df1}, ${df2}`,
    p: fRightTailP(f, df1, df2),
    detail: `${valid.length} groups; ${totalN} complete observations`,
  };
}

export function welchOneWayAnova(groups: number[][]): TestResult | null {
  const valid = groups.filter((values) => values.length >= 2);
  if (valid.length < 2) return null;
  const variances = valid.map(sampleVariance);
  if (variances.some((variance) => !Number.isFinite(variance) || variance <= 0)) {
    return null;
  }
  const weights = valid.map(
    (values, index) => values.length / variances[index],
  );
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  if (!Number.isFinite(weightTotal) || weightTotal <= 0) return null;
  const weightedMean = valid.reduce(
    (sum, values, index) => sum + weights[index] * average(values),
    0,
  ) / weightTotal;
  const groupCount = valid.length;
  const numerator = valid.reduce(
    (sum, values, index) =>
      sum + weights[index] * (average(values) - weightedMean) ** 2,
    0,
  ) / (groupCount - 1);
  const correctionTerm = valid.reduce(
    (sum, values, index) =>
      sum + (1 - weights[index] / weightTotal) ** 2 / (values.length - 1),
    0,
  );
  if (!Number.isFinite(correctionTerm) || correctionTerm <= 0) return null;
  const correction =
    1 + (2 * (groupCount - 2) * correctionTerm) / (groupCount ** 2 - 1);
  const f = numerator / correction;
  const df1 = groupCount - 1;
  const df2 = (groupCount ** 2 - 1) / (3 * correctionTerm);
  return {
    name: "Welch's one-way ANOVA",
    statisticLabel: 'F',
    statistic: f,
    degreesOfFreedom: `${df1}, ${df2.toFixed(1)}`,
    p: fRightTailP(f, df1, df2),
    detail: `${groupCount} groups; unequal variances are allowed.`,
  };
}

export function pearsonCorrelation(
  points: Array<[number, number]>,
): TestResult | null {
  if (points.length < 3) return null;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const xMean = average(xs);
  const yMean = average(ys);
  const numerator = points.reduce(
    (sum, [x, y]) => sum + (x - xMean) * (y - yMean),
    0,
  );
  const denominator = Math.sqrt(
    xs.reduce((sum, value) => sum + (value - xMean) ** 2, 0) *
      ys.reduce((sum, value) => sum + (value - yMean) ** 2, 0),
  );
  if (!denominator) return null;
  const r = numerator / denominator;
  const t =
    Math.abs(r) * Math.sqrt((points.length - 2) / Math.max(1e-12, 1 - r ** 2));
  return {
    name: 'Pearson correlation',
    statisticLabel: 'r',
    statistic: r,
    degreesOfFreedom: String(points.length - 2),
    p: studentTTwoSidedP(t, points.length - 2),
    detail: `${points.length} complete pairs`,
  };
}

function ranks(values: number[]) {
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((first, second) => first.value - second.value);
  const output = new Array(values.length).fill(0);
  let start = 0;
  while (start < indexed.length) {
    let end = start;
    while (
      end + 1 < indexed.length &&
      indexed[end + 1].value === indexed[start].value
    ) {
      end += 1;
    }
    const rank = (start + end + 2) / 2;
    for (let position = start; position <= end; position += 1) {
      output[indexed[position].index] = rank;
    }
    start = end + 1;
  }
  return output;
}

export function spearmanCorrelation(
  points: Array<[number, number]>,
): TestResult | null {
  if (points.length < 4) return null;
  const xRanks = ranks(points.map(([x]) => x));
  const yRanks = ranks(points.map(([, y]) => y));
  const result = pearsonCorrelation(
    xRanks.map((x, index) => [x, yRanks[index]]),
  );
  return result
    ? { ...result, name: 'Spearman rank correlation', statisticLabel: 'ρ' }
    : null;
}

function normalCdf(value: number) {
  if (!Number.isFinite(value)) return value < 0 ? 0 : 1;
  if (value === 0) return 0.5;
  const probability = regularizedGammaP(0.5, (value * value) / 2);
  return value < 0
    ? 0.5 * (1 - probability)
    : 0.5 * (1 + probability);
}

function regularizedGammaP(shape: number, value: number) {
  if (shape <= 0 || value < 0) return Number.NaN;
  if (value === 0) return 0;
  const epsilon = 1e-12;
  const tiny = 1e-30;
  if (value < shape + 1) {
    let term = 1 / shape;
    let sum = term;
    let nextShape = shape;
    for (let iteration = 1; iteration <= 250; iteration += 1) {
      nextShape += 1;
      term *= value / nextShape;
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * epsilon) break;
    }
    return Math.min(
      1,
      sum * Math.exp(-value + shape * Math.log(value) - logGamma(shape)),
    );
  }
  let b = value + 1 - shape;
  let c = 1 / tiny;
  let d = 1 / b;
  let fraction = d;
  for (let iteration = 1; iteration <= 250; iteration += 1) {
    const coefficient = -iteration * (iteration - shape);
    b += 2;
    d = coefficient * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + coefficient / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    fraction *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  const upper =
    Math.exp(-value + shape * Math.log(value) - logGamma(shape)) * fraction;
  return Math.max(0, Math.min(1, 1 - upper));
}

function chiSquareRightTailP(statistic: number, degreesOfFreedom: number) {
  if (statistic < 0 || degreesOfFreedom <= 0) return Number.NaN;
  return 1 - regularizedGammaP(degreesOfFreedom / 2, statistic / 2);
}

function tieCounts(values: number[]) {
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.values()].filter((count) => count > 1);
}

export function mannWhitneyUTest(
  first: number[],
  second: number[],
): TestResult | null {
  if (first.length < 2 || second.length < 2) return null;
  const combined = [...first, ...second];
  const combinedRanks = ranks(combined);
  const firstRankSum = combinedRanks
    .slice(0, first.length)
    .reduce((sum, rank) => sum + rank, 0);
  const firstU = firstRankSum - (first.length * (first.length + 1)) / 2;
  const secondU = first.length * second.length - firstU;
  const u = Math.min(firstU, secondU);
  const total = combined.length;
  const tieAdjustment = tieCounts(combined).reduce(
    (sum, count) => sum + count ** 3 - count,
    0,
  );
  const variance =
    (first.length *
      second.length *
      (total + 1 - tieAdjustment / (total * (total - 1)))) /
    12;
  if (variance <= 0) return null;
  const expected = (first.length * second.length) / 2;
  const z = Math.max(0, Math.abs(u - expected) - 0.5) / Math.sqrt(variance);
  return {
    name: 'Mann–Whitney U test',
    statisticLabel: 'U',
    statistic: u,
    p: Math.min(1, 2 * (1 - normalCdf(z))),
    detail: `${first.length} and ${second.length} observations; two-sided normal approximation with tie and continuity corrections.`,
  };
}

export function wilcoxonSignedRankTest(
  pairs: Array<[number, number]>,
): TestResult | null {
  const differences = pairs
    .map(([first, second]) => first - second)
    .filter((difference) => difference !== 0);
  if (differences.length < 3) return null;
  const absolute = differences.map(Math.abs);
  const differenceRanks = ranks(absolute);
  const positive = differences.reduce(
    (sum, difference, index) =>
      difference > 0 ? sum + differenceRanks[index] : sum,
    0,
  );
  const negative = differences.reduce(
    (sum, difference, index) =>
      difference < 0 ? sum + differenceRanks[index] : sum,
    0,
  );
  const w = Math.min(positive, negative);
  const n = differences.length;
  const expected = (n * (n + 1)) / 4;
  const tieAdjustment = tieCounts(absolute).reduce(
    (sum, count) => sum + count ** 3 - count,
    0,
  );
  const variance = (n * (n + 1) * (2 * n + 1)) / 24 - tieAdjustment / 48;
  if (variance <= 0) return null;
  const z =
    Math.max(0, Math.abs(positive - expected) - 0.5) / Math.sqrt(variance);
  return {
    name: 'Wilcoxon matched-pairs signed-rank test',
    statisticLabel: 'W',
    statistic: w,
    p: Math.min(1, 2 * (1 - normalCdf(z))),
    detail: `${n} non-zero complete pairs; two-sided normal approximation with tie and continuity corrections.`,
  };
}

export function kruskalWallisTest(groups: number[][]): TestResult | null {
  const valid = groups.filter((values) => values.length >= 2);
  if (valid.length < 2) return null;
  const combined = valid.flat();
  const combinedRanks = ranks(combined);
  let cursor = 0;
  const rankSums = valid.map((values) => {
    const sum = combinedRanks
      .slice(cursor, cursor + values.length)
      .reduce((subtotal, rank) => subtotal + rank, 0);
    cursor += values.length;
    return sum;
  });
  const total = combined.length;
  let h =
    (12 / (total * (total + 1))) *
      rankSums.reduce(
        (sum, rankSum, index) => sum + rankSum ** 2 / valid[index].length,
        0,
      ) -
    3 * (total + 1);
  const tieAdjustment = tieCounts(combined).reduce(
    (sum, count) => sum + count ** 3 - count,
    0,
  );
  const correction = 1 - tieAdjustment / (total ** 3 - total);
  if (correction <= 0) return null;
  h /= correction;
  const df = valid.length - 1;
  return {
    name: 'Kruskal–Wallis test',
    statisticLabel: 'H',
    statistic: h,
    degreesOfFreedom: String(df),
    p: chiSquareRightTailP(h, df),
    detail: `${valid.length} independent groups; ${total} observations; tie-corrected rank test.`,
  };
}

export function dunnPostHoc(
  groups: Array<{ name: string; values: number[] }>,
): PairwiseComparison[] {
  const valid = groups.filter((group) => group.values.length >= 2);
  if (valid.length < 2) return [];
  const combined = valid.flatMap((group) => group.values);
  const combinedRanks = ranks(combined);
  let cursor = 0;
  const ranked = valid.map((group) => {
    const groupRanks = combinedRanks.slice(
      cursor,
      cursor + group.values.length,
    );
    cursor += group.values.length;
    return {
      ...group,
      meanRank: average(groupRanks),
    };
  });
  const total = combined.length;
  const tieAdjustment = tieCounts(combined).reduce(
    (sum, count) => sum + count ** 3 - count,
    0,
  );
  const varianceBase =
    (total * (total + 1)) / 12 - tieAdjustment / (12 * (total - 1));
  if (varianceBase <= 0) return [];
  const comparisons: Array<Omit<PairwiseComparison, 'adjustedP'>> = [];
  for (let first = 0; first < ranked.length; first += 1) {
    for (let second = first + 1; second < ranked.length; second += 1) {
      const firstGroup = ranked[first];
      const secondGroup = ranked[second];
      const standardError = Math.sqrt(
        varianceBase *
          (1 / firstGroup.values.length + 1 / secondGroup.values.length),
      );
      if (!standardError) continue;
      const z = (firstGroup.meanRank - secondGroup.meanRank) / standardError;
      comparisons.push({
        first: firstGroup.name,
        second: secondGroup.name,
        method: "Dunn's test",
        estimate: median(firstGroup.values) - median(secondGroup.values),
        estimateLabel: 'Median difference',
        statisticLabel: 'z',
        statistic: z,
        p: Math.min(1, 2 * (1 - normalCdf(Math.abs(z)))),
        n: `${firstGroup.values.length}, ${secondGroup.values.length}`,
      });
    }
  }
  return applyHolmAdjustment(comparisons);
}

export function friedmanTest(blocks: number[][]): TestResult | null {
  if (blocks.length < 3 || blocks[0]?.length < 3) return null;
  const treatments = blocks[0].length;
  if (blocks.some((block) => block.length !== treatments)) return null;
  const rankSums = new Array(treatments).fill(0);
  let tieAdjustment = 0;
  blocks.forEach((block) => {
    const blockRanks = ranks(block);
    blockRanks.forEach((rank, index) => {
      rankSums[index] += rank;
    });
    tieAdjustment += tieCounts(block).reduce(
      (sum, count) => sum + count ** 3 - count,
      0,
    );
  });
  const subjects = blocks.length;
  let statistic =
    (12 / (subjects * treatments * (treatments + 1))) *
      rankSums.reduce((sum, rankSum) => sum + rankSum ** 2, 0) -
    3 * subjects * (treatments + 1);
  const correction =
    1 - tieAdjustment / (subjects * treatments * (treatments ** 2 - 1));
  if (correction <= 0) return null;
  statistic /= correction;
  const df = treatments - 1;
  return {
    name: 'Friedman test',
    statisticLabel: 'Q',
    statistic,
    degreesOfFreedom: String(df),
    p: chiSquareRightTailP(statistic, df),
    detail: `${subjects} complete subjects across ${treatments} repeated conditions; tie-corrected rank test.`,
  };
}

export function normalityTests(
  values: number[],
  engine: NormalityEngine | null,
) {
  const finite = values.filter(Number.isFinite);
  if (!engine || finite.length < 3 || sampleVariance(finite) === 0) return [];

  const sample = new Float64Array(finite);
  const results: TestResult[] = [];

  if (finite.length <= 5000) {
    try {
      const result = engine.shapiroWilk(sample);
      if (
        Number.isFinite(result.statistic) &&
        Number.isFinite(result.p_value)
      ) {
        results.push({
          name: 'Shapiro–Wilk',
          statisticLabel: 'W',
          statistic: result.statistic,
          p: result.p_value,
          detail: `Primary normality test; ${finite.length} model residuals.`,
        });
      }
    } catch {
      // Keep the second normality test available if this sample is unsupported.
    }
  }

  if (finite.length >= 20) {
    try {
      const result = engine.dagostinoKSquared(sample);
      if (
        Number.isFinite(result.k2_statistic) &&
        Number.isFinite(result.p_value)
      ) {
        results.push({
          name: "D'Agostino–Pearson K²",
          statisticLabel: 'K²',
          statistic: result.k2_statistic,
          degreesOfFreedom: '2',
          p: result.p_value,
          detail: `Secondary omnibus skewness and kurtosis test; ${finite.length} model residuals.`,
        });
      }
    } catch {
      // Small or degenerate samples can be unsupported by the omnibus test.
    }
  }

  return results;
}

export function detectOutliers(
  entries: Array<{ index: number; value: number; group: string }>,
  method: 'none' | 'iqr' | 'mad',
) {
  const flagged = new Set<number>();
  if (method === 'none') return flagged;
  const grouped = new Map<string, typeof entries>();
  entries.forEach((entry) =>
    grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), entry]),
  );
  grouped.forEach((items) => {
    const values = items.map((item) => item.value);
    if (values.length < 4) return;
    if (method === 'iqr') {
      const q1 = quantile(values, 0.25);
      const q3 = quantile(values, 0.75);
      const spread = q3 - q1;
      items.forEach((item) => {
        if (item.value < q1 - 1.5 * spread || item.value > q3 + 1.5 * spread) {
          flagged.add(item.index);
        }
      });
    } else {
      const center = median(values);
      const mad = median(values.map((value) => Math.abs(value - center)));
      if (!mad) return;
      items.forEach((item) => {
        const robustZ = (0.6745 * Math.abs(item.value - center)) / mad;
        if (robustZ > 3.5) flagged.add(item.index);
      });
    }
  });
  return flagged;
}

type Matrix = number[][];

function transpose(matrix: Matrix): Matrix {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function multiply(first: Matrix, second: Matrix): Matrix {
  const transposed = transpose(second);
  return first.map((row) =>
    transposed.map((column) =>
      row.reduce((sum, value, index) => sum + value * column[index], 0),
    ),
  );
}

function multiplyVector(matrix: Matrix, vector: number[]) {
  return matrix.map((row) =>
    row.reduce((sum, value, index) => sum + value * vector[index], 0),
  );
}

function inverse(matrix: Matrix): Matrix | null {
  const size = matrix.length;
  const augmented = matrix.map((row, index) => [
    ...row,
    ...Array.from({ length: size }, (_, column) => (index === column ? 1 : 0)),
  ]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (
        Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])
      ) {
        pivot = row;
      }
    }
    if (Math.abs(augmented[pivot][column]) < 1e-10) return null;
    [augmented[column], augmented[pivot]] = [
      augmented[pivot],
      augmented[column],
    ];
    const divisor = augmented[column][column];
    augmented[column] = augmented[column].map((value) => value / divisor);
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map(
        (value, index) => value - factor * augmented[column][index],
      );
    }
  }
  return augmented.map((row) => row.slice(size));
}

function logDeterminant(matrix: Matrix) {
  const work = matrix.map((row) => [...row]);
  let log = 0;
  for (let column = 0; column < work.length; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < work.length; row += 1) {
      if (Math.abs(work[row][column]) > Math.abs(work[pivot][column]))
        pivot = row;
    }
    if (Math.abs(work[pivot][column]) < 1e-12) return Number.NEGATIVE_INFINITY;
    if (pivot !== column)
      [work[column], work[pivot]] = [work[pivot], work[column]];
    const value = Math.abs(work[column][column]);
    log += Math.log(value);
    for (let row = column + 1; row < work.length; row += 1) {
      const factor = work[row][column] / work[column][column];
      for (let next = column; next < work.length; next += 1) {
        work[row][next] -= factor * work[column][next];
      }
    }
  }
  return log;
}

function fitOls(design: Matrix, response: number[]) {
  if (!design.length || design.length <= design[0].length) return null;
  const xt = transpose(design);
  const xtx = multiply(xt, design);
  const xtxInverse = inverse(xtx);
  if (!xtxInverse) return null;
  const beta = multiplyVector(xtxInverse, multiplyVector(xt, response));
  const fitted = multiplyVector(design, beta);
  const rss = response.reduce(
    (sum, value, index) => sum + (value - fitted[index]) ** 2,
    0,
  );
  return { beta, fitted, rss, covarianceBase: xtxInverse, p: design[0].length };
}

function effectCoding(values: string[]) {
  const levels = [...new Set(values)];
  const columns = levels
    .slice(0, -1)
    .map((level) =>
      values.map((value) =>
        value === level ? 1 : value === levels.at(-1) ? -1 : 0,
      ),
    );
  return { levels, columns };
}

export function factorialAnova(
  response: number[],
  factorA: string[],
  factorB: string[],
) {
  if (
    response.length < 8 ||
    response.length !== factorA.length ||
    response.length !== factorB.length
  ) {
    return [];
  }
  const a = effectCoding(factorA);
  const b = effectCoding(factorB);
  if (a.levels.length < 2 || b.levels.length < 2) return [];
  const columns: number[][] = [
    response.map(() => 1),
    ...a.columns,
    ...b.columns,
  ];
  const aIndices = a.columns.map((_, index) => index + 1);
  const bIndices = b.columns.map((_, index) => index + 1 + a.columns.length);
  const interactionIndices: number[] = [];
  a.columns.forEach((aColumn) => {
    b.columns.forEach((bColumn) => {
      interactionIndices.push(columns.length);
      columns.push(aColumn.map((value, index) => value * bColumn[index]));
    });
  });
  const design = response.map((_, row) => columns.map((column) => column[row]));
  const full = fitOls(design, response);
  if (!full) return [];
  const df2 = response.length - full.p;

  const testEffect = (
    effect: string,
    indices: number[],
  ): AnovaEffect | null => {
    const keep = columns
      .map((_, index) => index)
      .filter((index) => !indices.includes(index));
    const reduced = fitOls(
      response.map((_, row) => keep.map((index) => columns[index][row])),
      response,
    );
    if (!reduced) return null;
    const df1 = full.p - reduced.p;
    const extraSumOfSquares = Math.max(0, reduced.rss - full.rss);
    const f = extraSumOfSquares / df1 / (full.rss / df2);
    return { effect, df1, df2, f, p: fRightTailP(f, df1, df2) };
  };

  return [
    testEffect('Factor A', aIndices),
    testEffect('Factor B', bIndices),
    testEffect('A × B', interactionIndices),
  ].filter((effect): effect is AnovaEffect => Boolean(effect));
}

function applyRandomInterceptWeight(
  values: number[],
  subjectIndices: Map<string, number[]>,
  lambda: number,
) {
  const output = [...values];
  subjectIndices.forEach((indices) => {
    const adjustment = lambda / (1 + lambda * indices.length);
    const total = indices.reduce((sum, index) => sum + values[index], 0);
    indices.forEach((index) => {
      output[index] = values[index] - adjustment * total;
    });
  });
  return output;
}

export function randomInterceptModel(
  response: number[],
  groups: string[],
  subjects: string[],
): (TestResult & { icc: number }) | null {
  if (
    response.length < 8 ||
    response.length !== groups.length ||
    response.length !== subjects.length
  ) {
    return null;
  }
  const coding = effectCoding(groups);
  if (coding.levels.length < 2) return null;
  const design = response.map((_, row) => [
    1,
    ...coding.columns.map((column) => column[row]),
  ]);
  const subjectIndices = new Map<string, number[]>();
  subjects.forEach((subject, index) =>
    subjectIndices.set(subject, [
      ...(subjectIndices.get(subject) ?? []),
      index,
    ]),
  );
  if (![...subjectIndices.values()].some((indices) => indices.length > 1))
    return null;
  const p = design[0].length;
  let best:
    | {
        lambda: number;
        beta: number[];
        xtwxInverse: Matrix;
        rss: number;
        objective: number;
      }
    | undefined;

  const evaluate = (lambda: number) => {
    const weightedColumns = transpose(design).map((column) =>
      applyRandomInterceptWeight(column, subjectIndices, lambda),
    );
    const weightedResponse = applyRandomInterceptWeight(
      response,
      subjectIndices,
      lambda,
    );
    const xtwx = multiply(transpose(design), transpose(weightedColumns));
    const xtwxInverse = inverse(xtwx);
    if (!xtwxInverse) return null;
    const beta = multiplyVector(
      xtwxInverse,
      multiplyVector(transpose(design), weightedResponse),
    );
    const fitted = multiplyVector(design, beta);
    const residuals = response.map((value, index) => value - fitted[index]);
    const weightedResiduals = applyRandomInterceptWeight(
      residuals,
      subjectIndices,
      lambda,
    );
    const rss = residuals.reduce(
      (sum, value, index) => sum + value * weightedResiduals[index],
      0,
    );
    const logDetV = [...subjectIndices.values()].reduce(
      (sum, indices) => sum + Math.log(1 + lambda * indices.length),
      0,
    );
    const objective =
      (response.length - p) * Math.log(rss / (response.length - p)) +
      logDetV +
      logDeterminant(xtwx);
    return { lambda, beta, xtwxInverse, rss, objective };
  };

  // Profile the REML objective over log(lambda), where lambda is the random-
  // intercept variance divided by the residual variance. A continuous search
  // avoids the material rounding introduced by the earlier coarse grid.
  const zeroCandidate = evaluate(0);
  if (zeroCandidate) best = zeroCandidate;
  const goldenRatio = (Math.sqrt(5) - 1) / 2;
  let lower = -12;
  let upper = 12;
  let firstPoint = upper - goldenRatio * (upper - lower);
  let secondPoint = lower + goldenRatio * (upper - lower);
  let firstCandidate = evaluate(Math.exp(firstPoint));
  let secondCandidate = evaluate(Math.exp(secondPoint));
  for (let iteration = 0; iteration < 100; iteration += 1) {
    if (!firstCandidate || !secondCandidate) break;
    if (firstCandidate.objective < secondCandidate.objective) {
      upper = secondPoint;
      secondPoint = firstPoint;
      secondCandidate = firstCandidate;
      firstPoint = upper - goldenRatio * (upper - lower);
      firstCandidate = evaluate(Math.exp(firstPoint));
    } else {
      lower = firstPoint;
      firstPoint = secondPoint;
      firstCandidate = secondCandidate;
      secondPoint = lower + goldenRatio * (upper - lower);
      secondCandidate = evaluate(Math.exp(secondPoint));
    }
  }
  for (const candidate of [firstCandidate, secondCandidate]) {
    if (candidate && (!best || candidate.objective < best.objective)) {
      best = candidate;
    }
  }
  if (!best) return null;
  const residualDf = response.length - p;
  const denominatorDf = Math.max(
    1,
    response.length - subjectIndices.size - (coding.levels.length - 1),
  );
  const sigmaSquared = best.rss / residualDf;
  const coefficientIndices = Array.from(
    { length: p - 1 },
    (_, index) => index + 1,
  );
  const beta = coefficientIndices.map((index) => best.beta[index]);
  const covariance = coefficientIndices.map((row) =>
    coefficientIndices.map(
      (column) => best.xtwxInverse[row][column] * sigmaSquared,
    ),
  );
  const covarianceInverse = inverse(covariance);
  if (!covarianceInverse) return null;
  const wald = beta.reduce(
    (sum, value, row) =>
      sum +
      value *
        covarianceInverse[row].reduce(
          (subtotal, coefficient, column) =>
            subtotal + coefficient * beta[column],
          0,
        ),
    0,
  );
  const df1 = beta.length;
  const f = wald / df1;
  return {
    name: 'Random-intercept mixed model',
    statisticLabel: 'F',
    statistic: f,
    degreesOfFreedom: `${df1}, ${denominatorDf}`,
    p: fRightTailP(f, df1, denominatorDf),
    icc: best.lambda / (1 + best.lambda),
    detail: `Outcome ~ group + (1 | subject); ${subjectIndices.size} subjects. Approximate denominator degrees of freedom.`,
  };
}

export function linearRegression(points: Array<[number, number]>) {
  const result = pearsonCorrelation(points);
  if (!result) return null;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const xCenter = average(xs);
  const yCenter = average(ys);
  const slope =
    points.reduce((sum, [x, y]) => sum + (x - xCenter) * (y - yCenter), 0) /
    xs.reduce((sum, value) => sum + (value - xCenter) ** 2, 0);
  return {
    slope,
    intercept: yCenter - slope * xCenter,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    residuals: points.map(
      ([x, y]) => y - (yCenter - slope * xCenter + slope * x),
    ),
  };
}
