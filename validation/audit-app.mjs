import { mkdir, readFile, writeFile } from 'node:fs/promises';

import * as statistics from '../lib/statistics.ts';

const round = (value) => Number(value.toFixed(12));
const cases = Array.from({ length: 18 }, (_, caseIndex) => {
  const makeGroup = (groupIndex, length) =>
    Array.from({ length }, (_, itemIndex) => {
      const wave = Math.sin((itemIndex + 1) * (0.43 + caseIndex * 0.013) + groupIndex);
      const spread = 0.35 + groupIndex * 0.42 + (caseIndex % 4) * 0.11;
      const shift = groupIndex * (0.22 + (caseIndex % 3) * 0.31);
      return round(6 + shift + wave * spread + itemIndex * 0.017 * (groupIndex + 1));
    });
  const groups = [
    makeGroup(0, 5 + (caseIndex % 4)),
    makeGroup(1, 6 + ((caseIndex + 1) % 5)),
    makeGroup(2, 4 + ((caseIndex + 2) % 4)),
  ];
  const pairCount = 6 + (caseIndex % 6);
  const pairedFirst = Array.from({ length: pairCount }, (_, index) =>
    round(10 + index * 0.23 + Math.sin(index + caseIndex * 0.2) * 0.4),
  );
  const pairedSecond = pairedFirst.map((value, index) =>
    round(value - 0.15 - (caseIndex % 4) * 0.08 + Math.cos(index * 0.9 + caseIndex) * 0.18),
  );
  if (caseIndex % 3 === 0) pairedSecond[1] = pairedFirst[1];

  const x = Array.from({ length: 9 + (caseIndex % 5) }, (_, index) => index + 1);
  const y = x.map((value, index) =>
    round((caseIndex % 2 ? -0.7 : 0.7) * value + Math.sin(index * 1.3 + caseIndex) * 1.2),
  );
  const spearmanX = x.map((value) => Math.ceil(value / 2));
  const spearmanY = y.map((value) => Math.round(value));

  const blocks = Array.from({ length: 6 + (caseIndex % 5) }, (_, subjectIndex) => [
    round(8 + subjectIndex * 0.11 + Math.sin(subjectIndex + caseIndex) * 0.2),
    round(7.7 + subjectIndex * 0.12 + Math.cos(subjectIndex * 0.7 + caseIndex) * 0.2),
    round(7.2 + subjectIndex * 0.08 + Math.sin(subjectIndex * 0.4 + caseIndex) * 0.2),
  ]);
  if (caseIndex % 4 === 0) blocks[1][1] = blocks[1][0];

  const factorial = { response: [], factorA: [], factorB: [] };
  const levelsA = ['A1', 'A2'];
  const levelsB = ['B1', 'B2', 'B3'];
  levelsA.forEach((levelA, aIndex) => {
    levelsB.forEach((levelB, bIndex) => {
      const cellSize = 3 + ((caseIndex + aIndex + bIndex) % 3);
      for (let replicate = 0; replicate < cellSize; replicate += 1) {
        factorial.response.push(
          round(
            4 +
              aIndex * 0.8 +
              bIndex * 0.35 +
              aIndex * bIndex * (caseIndex % 2 ? 0.28 : -0.12) +
              Math.sin(replicate + aIndex * 2 + bIndex + caseIndex) * 0.22,
          ),
        );
        factorial.factorA.push(levelA);
        factorial.factorB.push(levelB);
      }
    });
  });

  const mixed = { response: [], group: [], subject: [] };
  const mixedIncomplete = { response: [], group: [], subject: [] };
  const mixedGroups = ['M0', 'M1', 'M2'];
  for (let subjectIndex = 0; subjectIndex < 7 + (caseIndex % 5); subjectIndex += 1) {
    const subjectEffect = Math.sin(subjectIndex * 0.7 + caseIndex) * 0.65;
    mixedGroups.forEach((groupName, groupIndex) => {
      const mixedValue = round(
          9 +
            subjectEffect +
            groupIndex * (0.35 + (caseIndex % 3) * 0.16) +
            Math.cos(subjectIndex + groupIndex * 1.7 + caseIndex) * 0.16,
        );
      mixed.response.push(mixedValue);
      mixed.group.push(groupName);
      mixed.subject.push(`S${subjectIndex + 1}`);
      const omit =
        (groupIndex === 2 && (subjectIndex + caseIndex) % 4 === 0) ||
        (groupIndex === 1 && (subjectIndex + caseIndex) % 7 === 0);
      if (!omit) {
        mixedIncomplete.response.push(mixedValue);
        mixedIncomplete.group.push(groupName);
        mixedIncomplete.subject.push(`S${subjectIndex + 1}`);
      }
    });
  }

  const normalityValues = Array.from({ length: 30 }, (_, index) => {
    if (caseIndex % 3 === 0) {
      return round(Math.sin(index * 0.73 + caseIndex) + Math.cos(index * 1.91) * 0.55);
    }
    if (caseIndex % 3 === 1) {
      return round(Math.log(index + 1) + Math.sin(index + caseIndex) * 0.04);
    }
    return round((index < 15 ? -1 : 1) + Math.sin(index * 0.8 + caseIndex) * 0.22);
  });

  return {
    id: caseIndex + 1,
    groups,
    pairedFirst,
    pairedSecond,
    x,
    y,
    spearmanX,
    spearmanY,
    blocks,
    factorial,
    mixed,
    mixedIncomplete,
    normalityValues,
  };
});

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

for (const fixture of cases) {
  const prefix = `case_${String(fixture.id).padStart(2, '0')}`;
  addTest(`${prefix}.welch_t`, statistics.welchTTest(fixture.groups[0], fixture.groups[1]));
  addTest(`${prefix}.one_way`, statistics.oneWayAnova(fixture.groups));
  addTest(`${prefix}.welch_one_way`, statistics.welchOneWayAnova(fixture.groups));
  addTest(
    `${prefix}.paired_t`,
    statistics.pairedTTest(
      fixture.pairedFirst.map((value, index) => [value, fixture.pairedSecond[index]]),
    ),
  );
  addTest(
    `${prefix}.wilcoxon`,
    statistics.wilcoxonSignedRankTest(
      fixture.pairedFirst.map((value, index) => [value, fixture.pairedSecond[index]]),
    ),
  );
  addTest(`${prefix}.mann_whitney`, statistics.mannWhitneyUTest(fixture.groups[0], fixture.groups[1]));
  addTest(`${prefix}.kruskal_wallis`, statistics.kruskalWallisTest(fixture.groups));
  addTest(`${prefix}.friedman`, statistics.friedmanTest(fixture.blocks));
  addTest(
    `${prefix}.pearson`,
    statistics.pearsonCorrelation(fixture.x.map((value, index) => [value, fixture.y[index]])),
  );
  addTest(
    `${prefix}.spearman`,
    statistics.spearmanCorrelation(
      fixture.spearmanX.map((value, index) => [value, fixture.spearmanY[index]]),
    ),
  );
  for (const effect of statistics.factorialAnova(
    fixture.factorial.response,
    fixture.factorial.factorA,
    fixture.factorial.factorB,
  )) {
    const effectName =
      effect.effect === 'Factor A'
        ? 'factor_a'
        : effect.effect === 'Factor B'
          ? 'factor_b'
          : 'interaction';
    set(`${prefix}.two_way.${effectName}.F`, effect.f);
    set(`${prefix}.two_way.${effectName}.df1`, effect.df1);
    set(`${prefix}.two_way.${effectName}.df2`, effect.df2);
    set(`${prefix}.two_way.${effectName}.p`, effect.p);
  }
  const mixed = statistics.randomInterceptModel(
    fixture.mixed.response,
    fixture.mixed.group,
    fixture.mixed.subject,
  );
  if (mixed) {
    addTest(`${prefix}.mixed`, mixed);
    set(`${prefix}.mixed.icc`, mixed.icc);
  }
  const mixedIncomplete = statistics.randomInterceptModel(
    fixture.mixedIncomplete.response,
    fixture.mixedIncomplete.group,
    fixture.mixedIncomplete.subject,
  );
  if (mixedIncomplete) {
    addTest(`${prefix}.mixed_incomplete`, mixedIncomplete);
    set(`${prefix}.mixed_incomplete.icc`, mixedIncomplete.icc);
  }
}

const anofox = await import('@sipemu/anofox-statistics');
const wasmBytes = await readFile(
  new URL(
    '../node_modules/@sipemu/anofox-statistics/anofox_statistics_js_bg.wasm',
    import.meta.url,
  ),
);
await anofox.default({ module_or_path: wasmBytes });
for (const fixture of cases) {
  const prefix = `case_${String(fixture.id).padStart(2, '0')}.normality`;
  const tests = statistics.normalityTests(fixture.normalityValues, {
    shapiroWilk: anofox.shapiroWilk,
    dagostinoKSquared: anofox.dagostinoKSquared,
  });
  const shapiro = tests.find((test) => test.name.startsWith('Shapiro'));
  if (shapiro) {
    set(`${prefix}.shapiro.statistic`, shapiro.statistic);
    set(`${prefix}.shapiro.p`, shapiro.p);
    set(`${prefix}.shapiro.reject_0_05`, shapiro.p < 0.05 ? 1 : 0);
  }
  const dagostino = tests.find((test) => test.name.startsWith("D'Agostino"));
  if (dagostino) {
    set(`${prefix}.dagostino.statistic`, dagostino.statistic);
    set(`${prefix}.dagostino.p`, dagostino.p);
    set(`${prefix}.dagostino.reject_0_05`, dagostino.p < 0.05 ? 1 : 0);
  }
}

const edgeChecks = {
  welch_rejects_singleton: statistics.welchTTest([1], [2, 3]) === null,
  paired_rejects_two_pairs: statistics.pairedTTest([[1, 2], [2, 3]]) === null,
  constant_welch_anova_rejected:
    statistics.welchOneWayAnova([[1, 1, 1], [2, 2, 2], [3, 3, 3]]) === null,
  constant_correlation_rejected:
    statistics.pearsonCorrelation([[1, 2], [1, 3], [1, 4]]) === null,
  incomplete_friedman_rejected:
    statistics.friedmanTest([[1, 2, 3], [2, 3]]) === null,
  no_repeated_subject_mixed_rejected:
    statistics.randomInterceptModel([1, 2, 3, 4, 5, 6, 7, 8], ['A', 'A', 'A', 'A', 'B', 'B', 'B', 'B'], ['1', '2', '3', '4', '5', '6', '7', '8']) === null,
  infinite_t_tail_is_zero: statistics.studentTTwoSidedP(Number.POSITIVE_INFINITY, 10) === 0,
  infinite_f_tail_is_zero: statistics.fRightTailP(Number.POSITIVE_INFINITY, 2, 12) === 0,
};

await mkdir(new URL('./results/', import.meta.url), { recursive: true });
await writeFile(
  new URL('./results/audit-data.json', import.meta.url),
  `${JSON.stringify({ cases }, null, 2)}\n`,
);
await writeFile(
  new URL('./results/audit-app-results.json', import.meta.url),
  `${JSON.stringify(results, null, 2)}\n`,
);
await writeFile(
  new URL('./results/audit-edge-checks.json', import.meta.url),
  `${JSON.stringify(edgeChecks, null, 2)}\n`,
);

const failedEdges = Object.entries(edgeChecks).filter(([, passed]) => !passed);
console.log(
  JSON.stringify(
    { fixtures: cases.length, numericalMetrics: Object.keys(results).length, edgeChecks, failedEdges },
    null,
    2,
  ),
);
if (failedEdges.length) process.exitCode = 1;
