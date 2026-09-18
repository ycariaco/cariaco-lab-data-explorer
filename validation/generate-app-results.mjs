import { readFile, writeFile } from 'node:fs/promises';

import * as statistics from '../lib/statistics.ts';

const data = JSON.parse(
  await readFile(new URL('./datasets.json', import.meta.url), 'utf8'),
);
const results = {};
const set = (key, value) => {
  results[key] = Number(value);
};
const addTest = (prefix, result) => {
  if (!result) return;
  set(`${prefix}.statistic`, result.statistic);
  set(`${prefix}.p`, result.p);
  if (result.degreesOfFreedom) {
    const degrees = String(result.degreesOfFreedom).split(',').map(Number);
    if (degrees.length === 1) set(`${prefix}.df`, degrees[0]);
    if (degrees.length === 2) {
      set(`${prefix}.df1`, degrees[0]);
      set(`${prefix}.df2`, degrees[1]);
    }
  }
};

set('descriptive.mean', statistics.average(data.welch.first));
set('descriptive.variance', statistics.sampleVariance(data.welch.first));
set('descriptive.median', statistics.median(data.welch.first));

addTest(
  'welch',
  statistics.welchTTest(data.welch.first, data.welch.second),
);
addTest(
  'paired_t',
  statistics.pairedTTest(
    data.paired.first.map((value, index) => [value, data.paired.second[index]]),
  ),
);

const oneWayGroups = Object.values(data.one_way);
addTest('one_way', statistics.oneWayAnova(oneWayGroups));
addTest(
  'pearson',
  statistics.pearsonCorrelation(
    data.pearson.x.map((value, index) => [value, data.pearson.y[index]]),
  ),
);
addTest(
  'spearman',
  statistics.spearmanCorrelation(
    data.spearman.x.map((value, index) => [value, data.spearman.y[index]]),
  ),
);
addTest(
  'mann_whitney',
  statistics.mannWhitneyUTest(
    data.mann_whitney.first,
    data.mann_whitney.second,
  ),
);
addTest(
  'wilcoxon',
  statistics.wilcoxonSignedRankTest(
    data.wilcoxon.first.map((value, index) => [
      value,
      data.wilcoxon.second[index],
    ]),
  ),
);

const rankGroupNames = Object.keys(data.rank_groups);
const rankGroups = Object.values(data.rank_groups);
addTest('kruskal_wallis', statistics.kruskalWallisTest(rankGroups));
for (const comparison of statistics.dunnPostHoc(
  rankGroupNames.map((name) => ({ name, values: data.rank_groups[name] })),
)) {
  const key = `dunn.${comparison.first}_${comparison.second}`;
  // Dunn implementations can reverse the z sign depending on the documented
  // group-order convention. The two-sided inference is based on |z|.
  set(`${key}.abs_z`, Math.abs(comparison.statistic));
  set(`${key}.p`, comparison.p);
  set(`${key}.p_holm`, comparison.adjustedP);
}
addTest('friedman', statistics.friedmanTest(data.friedman));

for (const datasetName of ['factorial_balanced', 'factorial_unbalanced']) {
  const dataset = data[datasetName];
  const prefix = datasetName.replace('factorial_', 'two_way_');
  for (const effect of statistics.factorialAnova(
    dataset.response,
    dataset.factor_a,
    dataset.factor_b,
  )) {
    const effectName =
      effect.effect === 'Factor A'
        ? 'factor_a'
        : effect.effect === 'Factor B'
          ? 'factor_b'
          : 'interaction';
    set(`${prefix}.${effectName}.F`, effect.f);
    set(`${prefix}.${effectName}.df1`, effect.df1);
    set(`${prefix}.${effectName}.df2`, effect.df2);
    set(`${prefix}.${effectName}.p`, effect.p);
  }
}

const mixed = statistics.randomInterceptModel(
  data.mixed.response,
  data.mixed.group,
  data.mixed.subject,
);
if (mixed) {
  addTest('mixed', mixed);
  set('mixed.icc', mixed.icc);
}

const regression = statistics.linearRegression(
  data.pearson.x.map((value, index) => [value, data.pearson.y[index]]),
);
if (regression) {
  set('linear_regression.slope', regression.slope);
  set('linear_regression.intercept', regression.intercept);
}

statistics
  .holmAdjustedPValues(data.adjustments)
  .forEach((value, index) => set(`adjustment.holm.${index + 1}`, value));
statistics
  .benjaminiHochbergAdjustedPValues(data.adjustments)
  .forEach((value, index) => set(`adjustment.bh.${index + 1}`, value));
data.adjustments.forEach((value, index, values) => {
  set(`adjustment.bonferroni.${index + 1}`, Math.min(1, value * values.length));
  set(`adjustment.sidak.${index + 1}`, 1 - (1 - value) ** values.length);
});

const anofox = await import('@sipemu/anofox-statistics');
const wasmBytes = await readFile(
  new URL(
    '../node_modules/@sipemu/anofox-statistics/anofox_statistics_js_bg.wasm',
    import.meta.url,
  ),
);
await anofox.default({ module_or_path: wasmBytes });
const normality = statistics.normalityTests(data.normality, {
  shapiroWilk: anofox.shapiroWilk,
  dagostinoKSquared: anofox.dagostinoKSquared,
});
for (const result of normality) {
  const prefix = result.name.startsWith('Shapiro')
    ? 'normality.shapiro'
    : 'normality.dagostino_k2';
  set(`${prefix}.statistic`, result.statistic);
  set(`${prefix}.p`, result.p);
}

await writeFile(
  new URL('./results/app-results.json', import.meta.url),
  `${JSON.stringify(results, null, 2)}\n`,
);
