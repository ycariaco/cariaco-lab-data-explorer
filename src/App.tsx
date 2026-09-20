import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  Grid3X3,
  Info,
  RefreshCcw,
  Settings2,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ErrorBar,
  Label,
  Legend,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AnovaEffect,
  NormalityEngine,
  PairwiseComparison,
  TestResult,
  average,
  benjaminiHochbergAdjustedPValues,
  detectOutliers,
  dunnPostHoc,
  factorialAnova,
  friedmanTest,
  holmAdjustedPValues,
  kruskalWallisTest,
  linearRegression,
  mannWhitneyUTest,
  median,
  normalityTests,
  oneWayAnova,
  pairedTTest,
  pairwiseWelchPostHoc,
  pearsonCorrelation,
  randomInterceptModel,
  sampleVariance,
  spearmanCorrelation,
  studentTCritical95,
  welchTTest,
  welchOneWayAnova,
  wilcoxonSignedRankTest,
} from "@/lib/statistics";

type DataRow = Record<string, string>;
type PlotType =
  | "columns"
  | "grouped"
  | "distribution"
  | "paired"
  | "xy"
  | "dose"
  | "pca"
  | "sets"
  | "heatmap"
  | "volcano";
type TestChoice =
  | "auto"
  | "welch"
  | "paired"
  | "mannwhitney"
  | "wilcoxon"
  | "oneway"
  | "welch-anova"
  | "kruskal"
  | "friedman"
  | "twoway"
  | "pearson"
  | "spearman"
  | "mixed"
  | "normality";
type OutlierMethod = "none" | "iqr" | "mad";
type ErrorType = "sem" | "sd" | "ci95";
type PointColorMode = "single" | "series";
type ExportFormat = "png" | "svg" | "emf";
type HeatmapLinkage = "none" | "average" | "complete" | "single" | "ward";
type HeatmapDistance = "correlation" | "euclidean" | "manhattan";
type VolcanoThresholdMetric = "p" | "bh-fdr" | "precomputed-fdr";
type PostHocAdjustment = "holm" | "bonferroni" | "sidak" | "bh-fdr" | "none";
type PostHocScope = "all" | "reference" | "selected";
type DistributionMode = "box" | "violin";
type SetPlotMode = "auto" | "venn" | "upset";
type HeatmapPalette =
  | "cariaco"
  | "blue-red"
  | "purple-green"
  | "teal-orange"
  | "magma"
  | "viridis"
  | "coolwarm"
  | "warm";

type GroupSummary = {
  group: string;
  n: number;
  mean: number;
  sd: number;
  sem: number;
  median: number;
  min: number;
  max: number;
  error: number;
};

type GroupedSummary = GroupSummary & {
  factor2: string;
};

type HeatmapClusterNode = {
  order: number[];
  distance: number;
  leaf?: number;
  left?: HeatmapClusterNode;
  right?: HeatmapClusterNode;
};

type DendrogramSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const demoRows: DataRow[] = [
  {
    sample_id: "P01",
    species: "Adelie",
    island: "Torgersen",
    sex: "male",
    bill_length_mm: "39.1",
    bill_depth_mm: "18.7",
    flipper_length_mm: "181",
    body_mass_g: "3750",
  },
  {
    sample_id: "P02",
    species: "Adelie",
    island: "Torgersen",
    sex: "female",
    bill_length_mm: "39.5",
    bill_depth_mm: "17.4",
    flipper_length_mm: "186",
    body_mass_g: "3800",
  },
  {
    sample_id: "P03",
    species: "Adelie",
    island: "Torgersen",
    sex: "female",
    bill_length_mm: "40.3",
    bill_depth_mm: "18.0",
    flipper_length_mm: "195",
    body_mass_g: "3250",
  },
  {
    sample_id: "P04",
    species: "Adelie",
    island: "Torgersen",
    sex: "female",
    bill_length_mm: "36.7",
    bill_depth_mm: "19.3",
    flipper_length_mm: "193",
    body_mass_g: "3450",
  },
  {
    sample_id: "P05",
    species: "Adelie",
    island: "Torgersen",
    sex: "male",
    bill_length_mm: "39.3",
    bill_depth_mm: "20.6",
    flipper_length_mm: "190",
    body_mass_g: "3650",
  },
  {
    sample_id: "P06",
    species: "Adelie",
    island: "Torgersen",
    sex: "female",
    bill_length_mm: "38.9",
    bill_depth_mm: "17.8",
    flipper_length_mm: "181",
    body_mass_g: "3625",
  },
  {
    sample_id: "P07",
    species: "Chinstrap",
    island: "Dream",
    sex: "female",
    bill_length_mm: "46.5",
    bill_depth_mm: "17.9",
    flipper_length_mm: "192",
    body_mass_g: "3500",
  },
  {
    sample_id: "P08",
    species: "Chinstrap",
    island: "Dream",
    sex: "male",
    bill_length_mm: "50.0",
    bill_depth_mm: "19.5",
    flipper_length_mm: "196",
    body_mass_g: "3900",
  },
  {
    sample_id: "P09",
    species: "Chinstrap",
    island: "Dream",
    sex: "male",
    bill_length_mm: "51.3",
    bill_depth_mm: "19.2",
    flipper_length_mm: "193",
    body_mass_g: "3650",
  },
  {
    sample_id: "P10",
    species: "Chinstrap",
    island: "Dream",
    sex: "female",
    bill_length_mm: "45.4",
    bill_depth_mm: "18.7",
    flipper_length_mm: "188",
    body_mass_g: "3525",
  },
  {
    sample_id: "P11",
    species: "Chinstrap",
    island: "Dream",
    sex: "male",
    bill_length_mm: "52.7",
    bill_depth_mm: "19.8",
    flipper_length_mm: "197",
    body_mass_g: "3725",
  },
  {
    sample_id: "P12",
    species: "Chinstrap",
    island: "Dream",
    sex: "female",
    bill_length_mm: "45.2",
    bill_depth_mm: "17.8",
    flipper_length_mm: "198",
    body_mass_g: "3950",
  },
  {
    sample_id: "P13",
    species: "Gentoo",
    island: "Biscoe",
    sex: "female",
    bill_length_mm: "46.1",
    bill_depth_mm: "13.2",
    flipper_length_mm: "211",
    body_mass_g: "4500",
  },
  {
    sample_id: "P14",
    species: "Gentoo",
    island: "Biscoe",
    sex: "male",
    bill_length_mm: "50.0",
    bill_depth_mm: "16.3",
    flipper_length_mm: "230",
    body_mass_g: "5700",
  },
  {
    sample_id: "P15",
    species: "Gentoo",
    island: "Biscoe",
    sex: "female",
    bill_length_mm: "48.7",
    bill_depth_mm: "14.1",
    flipper_length_mm: "210",
    body_mass_g: "4450",
  },
  {
    sample_id: "P16",
    species: "Gentoo",
    island: "Biscoe",
    sex: "male",
    bill_length_mm: "50.0",
    bill_depth_mm: "15.2",
    flipper_length_mm: "218",
    body_mass_g: "5700",
  },
  {
    sample_id: "P17",
    species: "Gentoo",
    island: "Biscoe",
    sex: "male",
    bill_length_mm: "47.6",
    bill_depth_mm: "14.5",
    flipper_length_mm: "215",
    body_mass_g: "5400",
  },
  {
    sample_id: "P18",
    species: "Gentoo",
    island: "Biscoe",
    sex: "female",
    bill_length_mm: "46.5",
    bill_depth_mm: "13.5",
    flipper_length_mm: "210",
    body_mass_g: "4550",
  },
];

const demoDatasetName = "Palmer Penguins example · Viridis palette";
const demoSeriesColorOverrides: Record<string, string> = {
  "columns:species\u0000Adelie": "#440154",
  "columns:species\u0000Chinstrap": "#21918c",
  "columns:species\u0000Gentoo": "#fde725",
  "xy:species\u0000Adelie": "#440154",
  "xy:species\u0000Chinstrap": "#21918c",
  "xy:species\u0000Gentoo": "#fde725",
  "grouped:species:sex\u0000female": "#440154",
  "grouped:species:sex\u0000male": "#5ec962",
};

const chartConfig = {
  observation: { label: "Observation", color: "#111827" },
  mean: { label: "Mean", color: "#f92080" },
} satisfies ChartConfig;

const fallbackPalette = ["#f92080", "#111827", "#526d82", "#9d6b8f", "#d97757", "#6f7f52"];

function parseDelimitedText(text: string): DataRow[] {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return [];
  const firstLine = clean.split(/\r?\n/, 1)[0];
  const delimiters = [",", "\t", ";"];
  const hasExplicitDelimiter = delimiters.some((candidate) => firstLine.includes(candidate));
  if (!hasExplicitDelimiter && /\s+/.test(firstLine.trim())) {
    const records = clean
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/));
    const headerCounts = new Map<string, number>();
    const headers =
      records[0]?.map((header, index) => {
        const base = header.trim() || `column_${index + 1}`;
        const count = (headerCounts.get(base) ?? 0) + 1;
        headerCounts.set(base, count);
        return count === 1 ? base : `${base}_${count}`;
      }) ?? [];
    if (headers.length < 2) return [];
    return records.slice(1).flatMap((record) => {
      if (!record.some(Boolean)) return [];
      return [
        Object.fromEntries(headers.map((header, index) => [header, record[index]?.trim() ?? ""])),
      ];
    });
  }
  const delimiter = delimiters.reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best,
  );
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < clean.length; index += 1) {
    const character = clean[index];
    const next = clean[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) records.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) records.push(row);
  if (records.length < 2) return [];
  const headerCounts = new Map<string, number>();
  const headers = records[0].map((header, index) => {
    const base = header || `column_${index + 1}`;
    const count = (headerCounts.get(base) ?? 0) + 1;
    headerCounts.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
  return records
    .slice(1)
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    );
}

function rowsToTabDelimited(rows: DataRow[]) {
  const headers = Object.keys(rows[0] ?? {});
  if (!headers.length) return "";
  const clean = (value: string) => value.replaceAll("\t", " ").replaceAll("\n", " ");
  return [
    headers.join("\t"),
    ...rows.map((row) => headers.map((header) => clean(row[header] ?? "")).join("\t")),
  ].join("\n");
}

function numericColumns(rows: DataRow[]) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).filter((column) => {
    const values = rows.map((row) => row[column]).filter((value) => value !== "");
    return (
      values.length > 0 &&
      values.filter((value) => Number.isFinite(Number(value))).length / values.length >= 0.8
    );
  });
}

function categoricalColumns(rows: DataRow[]) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).filter((column) => {
    const values = rows.map((row) => row[column]).filter(Boolean);
    const unique = new Set(values);
    return unique.size >= 2 && unique.size <= Math.min(20, Math.max(2, rows.length / 2));
  });
}

function likelySubjectColumn(columns: string[]) {
  return (
    columns.find((column) =>
      /(^|[_\s-])(subject|participant|patient|donor|animal|individual)([_\s-]|$)/i.test(
        column,
      ),
    ) ??
    columns.find((column) => /sample.*id|^id$/i.test(column)) ??
    ""
  );
}

function likelySetItemColumn(columns: string[]) {
  return (
    columns.find((column) => /^item([_\s-]?id)?$/i.test(column)) ??
    columns.find((column) =>
      /^(feature|gene|protein|metabolite|molecule)([_\s-]?id)?$/i.test(column),
    ) ??
    columns.find((column) => /item|feature|gene|protein|metabolite|molecule/i.test(column)) ??
    columns[0] ??
    ""
  );
}

function likelySetMembershipColumn(columns: string[], itemColumn: string) {
  return (
    columns.find(
      (column) =>
        column !== itemColumn && /(^|[_\s-])(set|list|membership)([_\s-]|$)/i.test(column),
    ) ??
    columns.find(
      (column) =>
        column !== itemColumn && /pathway|category|collection|signature/i.test(column),
    ) ??
    ""
  );
}

function formatNumber(value: number, digits = 3) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(2);
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function formatP(value: number) {
  if (!Number.isFinite(value)) return "not available";
  if (value < 0.0001) return "< 0.0001";
  if (value < 0.001) return "< 0.001";
  return `= ${value.toFixed(3)}`;
}

function applyHolmToComparisons(comparisons: Array<Omit<PairwiseComparison, "adjustedP">>) {
  const adjusted = holmAdjustedPValues(comparisons.map((comparison) => comparison.p));
  return comparisons.map((comparison, index) => ({
    ...comparison,
    adjustedP: adjusted[index],
  }));
}

function comparisonKey(comparison: PairwiseComparison) {
  const pair = [comparison.first, comparison.second].sort();
  return `${comparison.context ?? "overall"}\u0000${pair[0]}\u0000${pair[1]}`;
}

function adjustPairwiseComparisons(
  comparisons: PairwiseComparison[],
  adjustment: PostHocAdjustment,
) {
  const families = new Map<string, Array<{ index: number; p: number }>>();
  comparisons.forEach((comparison, index) => {
    const family = comparison.context ?? "overall";
    families.set(family, [...(families.get(family) ?? []), { index, p: comparison.p }]);
  });
  const adjusted = comparisons.map((comparison) => comparison.p);
  families.forEach((family) => {
    const pValues = family.map((item) => item.p);
    const familyAdjusted =
      adjustment === "holm"
        ? holmAdjustedPValues(pValues)
        : adjustment === "bonferroni"
          ? pValues.map((p) => Math.min(1, p * pValues.length))
          : adjustment === "sidak"
            ? pValues.map((p) => -Math.expm1(pValues.length * Math.log1p(-p)))
            : adjustment === "bh-fdr"
              ? benjaminiHochbergAdjustedPValues(pValues)
              : pValues;
    family.forEach((item, index) => {
      adjusted[item.index] = familyAdjusted[index];
    });
  });
  return comparisons.map((comparison, index) => ({
    ...comparison,
    adjustedP: adjusted[index],
  }));
}

function significanceLabel(p: number) {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.0001) return "****";
  if (p < 0.001) return "***";
  if (p < 0.01) return "**";
  if (p < 0.05) return "*";
  return "ns";
}

function testSummary(result: TestResult | null) {
  if (!result) return "The selected test cannot be calculated with the current variables.";
  const df = result.degreesOfFreedom ? `(${result.degreesOfFreedom})` : "";
  return `${result.statisticLabel}${df} = ${formatNumber(result.statistic)}; p ${formatP(result.p)}`;
}

const heatmapPalettes: Record<HeatmapPalette, { label: string; stops: string[] }> = {
  cariaco: {
    label: "Cariaco pink–navy",
    stops: ["#3f526d", "#ffffff", "#f92080"],
  },
  "blue-red": {
    label: "Blue–red",
    stops: ["#2563eb", "#ffffff", "#dc2626"],
  },
  "purple-green": {
    label: "Purple–green",
    stops: ["#7e22ce", "#ffffff", "#15803d"],
  },
  "teal-orange": {
    label: "Teal–orange",
    stops: ["#0f766e", "#ffffff", "#ea580c"],
  },
  magma: {
    label: "Magma",
    stops: ["#000004", "#51127c", "#b73779", "#fc8961", "#fcfdbf"],
  },
  viridis: {
    label: "Viridis",
    stops: ["#440154", "#31688e", "#35b779", "#fde725"],
  },
  coolwarm: {
    label: "Coolwarm",
    stops: ["#3b4cc0", "#f7f7f7", "#b40426"],
  },
  warm: {
    label: "Warm",
    stops: ["#fff7ec", "#fdbb84", "#e34a33", "#7f0000"],
  },
};

function interpolateHex(first: string, second: string, fraction: number) {
  const parse = (color: string) =>
    [1, 3, 5].map((position) => Number.parseInt(color.slice(position, position + 2), 16));
  const start = parse(first);
  const end = parse(second);
  return `#${start
    .map((channel, index) =>
      Math.round(channel + (end[index] - channel) * fraction)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function correlationColor(value: number, palette: HeatmapPalette) {
  if (!Number.isFinite(value)) return "#f1f3f5";
  const stops = heatmapPalettes[palette].stops;
  const scaled = Math.max(0, Math.min(1, (value + 1) / 2));
  const position = scaled * (stops.length - 1);
  const start = Math.min(stops.length - 2, Math.floor(position));
  return interpolateHex(stops[start], stops[start + 1], position - start);
}

function contrastingText(background: string) {
  const channels = [1, 3, 5].map(
    (position) => Number.parseInt(background.slice(position, position + 2), 16) / 255,
  );
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance < 0.52 ? "#ffffff" : "#111827";
}

function heatmapVectorDistance(first: number[], second: number[], method: HeatmapDistance) {
  const pairs = first.flatMap((value, index) =>
    Number.isFinite(value) && Number.isFinite(second[index])
      ? [[value, second[index]] as [number, number]]
      : [],
  );
  if (!pairs.length) return Number.POSITIVE_INFINITY;
  if (method === "manhattan") {
    return pairs.reduce((sum, [left, right]) => sum + Math.abs(left - right), 0) / pairs.length;
  }
  if (method === "correlation" && pairs.length >= 3) {
    const correlation = pearsonCorrelation(pairs)?.statistic;
    if (Number.isFinite(correlation)) return 1 - (correlation ?? 0);
  }
  return Math.sqrt(
    pairs.reduce((sum, [left, right]) => sum + (left - right) ** 2, 0) / pairs.length,
  );
}

function hierarchicalHeatmapClustering(
  matrix: number[][],
  linkage: Exclude<HeatmapLinkage, "none">,
  distanceMethod: HeatmapDistance,
) {
  if (matrix.length < 2) {
    const order = matrix.map((_, index) => index);
    return {
      order,
      root: order.length ? { order, distance: 0, leaf: order[0] } : null,
    };
  }
  let clusters: HeatmapClusterNode[] = matrix.map((_, index) => ({
    order: [index],
    distance: 0,
    leaf: index,
  }));

  const centroid = (indices: number[]) =>
    matrix[0].map((_, column) => {
      const values = indices.map((index) => matrix[index][column]).filter(Number.isFinite);
      return values.length ? average(values) : Number.NaN;
    });

  const clusterDistance = (first: HeatmapClusterNode, second: HeatmapClusterNode) => {
    if (linkage === "ward") {
      return (
        Math.sqrt(
          (first.order.length * second.order.length) /
            (first.order.length + second.order.length),
        ) * heatmapVectorDistance(centroid(first.order), centroid(second.order), "euclidean")
      );
    }
    const distances = first.order.flatMap((firstIndex) =>
      second.order.map((secondIndex) =>
        heatmapVectorDistance(matrix[firstIndex], matrix[secondIndex], distanceMethod),
      ),
    );
    if (linkage === "single") return Math.min(...distances);
    if (linkage === "complete") return Math.max(...distances);
    return average(distances);
  };

  const orientedMerge = (first: number[], second: number[]) => {
    const orientationDistance = linkage === "ward" ? "euclidean" : distanceMethod;
    const candidates = [
      [first, second],
      [[...first].reverse(), second],
      [first, [...second].reverse()],
      [[...first].reverse(), [...second].reverse()],
    ] as Array<[number[], number[]]>;
    const best = candidates.reduce((current, candidate) => {
      const currentDistance = heatmapVectorDistance(
        matrix[current[0].at(-1) ?? 0],
        matrix[current[1][0]],
        orientationDistance,
      );
      const candidateDistance = heatmapVectorDistance(
        matrix[candidate[0].at(-1) ?? 0],
        matrix[candidate[1][0]],
        orientationDistance,
      );
      return candidateDistance < currentDistance ? candidate : current;
    });
    return [...best[0], ...best[1]];
  };

  while (clusters.length > 1) {
    let bestFirst = 0;
    let bestSecond = 1;
    let bestDistance = clusterDistance(clusters[0], clusters[1]);
    for (let first = 0; first < clusters.length; first += 1) {
      for (let second = first + 1; second < clusters.length; second += 1) {
        const distance = clusterDistance(clusters[first], clusters[second]);
        if (distance < bestDistance) {
          bestFirst = first;
          bestSecond = second;
          bestDistance = distance;
        }
      }
    }
    const first = clusters[bestFirst];
    const second = clusters[bestSecond];
    const merged: HeatmapClusterNode = {
      order: orientedMerge(first.order, second.order),
      distance: Number.isFinite(bestDistance) ? bestDistance : 1,
      left: first,
      right: second,
    };
    clusters = clusters.filter((_, index) => index !== bestFirst && index !== bestSecond);
    clusters.push(merged);
  }
  return { order: clusters[0].order, root: clusters[0] };
}

function buildHeatmapDendrogram(
  root: HeatmapClusterNode | null,
  order: number[],
  width: number,
  cellSize: number,
  top: number,
) {
  if (!root || order.length < 2) return [];
  const segments: DendrogramSegment[] = [];
  const rowPositions = new Map(
    order.map((rowIndex, position) => [rowIndex, top + (position + 0.5) * cellSize]),
  );
  const maximumDistance =
    Number.isFinite(root.distance) && root.distance > 0 ? root.distance : 1;
  const xForDistance = (distance: number) => {
    const finiteDistance = Number.isFinite(distance) ? Math.max(0, distance) : maximumDistance;
    return width - (finiteDistance / maximumDistance) * (width - 8);
  };

  const visit = (node: HeatmapClusterNode): { x: number; y: number } => {
    if (node.leaf !== undefined) {
      return { x: width, y: rowPositions.get(node.leaf) ?? top };
    }
    if (!node.left || !node.right) return { x: width, y: top };
    const left = visit(node.left);
    const right = visit(node.right);
    const x = xForDistance(node.distance);
    segments.push(
      { x1: x, y1: left.y, x2: left.x, y2: left.y },
      { x1: x, y1: right.y, x2: right.x, y2: right.y },
      { x1: x, y1: left.y, x2: x, y2: right.y },
    );
    return { x, y: (left.y + right.y) / 2 };
  };

  visit(root);
  return segments;
}

function quantile(values: number[], probability: number) {
  if (!values.length) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function linearScale(domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  const span = domainMax - domainMin || 1;
  return (value: number) => rangeMin + ((value - domainMin) / span) * (rangeMax - rangeMin);
}

function chartExtent(values: number[], padding = 0.08) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = maximum - minimum || Math.max(1, Math.abs(maximum) * 0.1);
  return [minimum - span * padding, maximum + span * padding] as const;
}

function gaussianKernelDensity(values: number[], sampleValues: number[]) {
  const sd = Math.sqrt(sampleVariance(values));
  const range = Math.max(...values) - Math.min(...values);
  const bandwidth = Math.max(
    1e-9,
    Number.isFinite(sd) && sd > 0
      ? 1.06 * sd * Math.pow(Math.max(values.length, 2), -0.2)
      : Math.max(range / 8, 1),
  );
  const normalizer = values.length * bandwidth * Math.sqrt(2 * Math.PI);
  return sampleValues.map((sample) => ({
    value: sample,
    density:
      values.reduce((sum, value) => {
        const z = (sample - value) / bandwidth;
        return sum + Math.exp(-0.5 * z * z);
      }, 0) / normalizer,
  }));
}

function DistributionPlot({
  groups,
  mode,
  width,
  height,
  showPoints,
  pointSize,
  pointOpacity,
  xLabel,
  yLabel,
  tickFontSize,
  axisTitleFontSize,
}: {
  groups: Array<{ name: string; values: number[]; color: string }>;
  mode: DistributionMode;
  width: number;
  height: number;
  showPoints: boolean;
  pointSize: number;
  pointOpacity: number;
  xLabel: string;
  yLabel: string;
  tickFontSize: number;
  axisTitleFontSize: number;
}) {
  const allValues = groups.flatMap((group) => group.values);
  if (!groups.length || !allValues.length) {
    return <EmptyState text="Select an outcome and grouping variable with complete numeric observations." />;
  }
  const margin = { top: 24, right: 28, bottom: 78, left: 82 };
  const [minimum, maximum] = chartExtent(allValues);
  const y = linearScale(minimum, maximum, height - margin.bottom, margin.top);
  const plotWidth = width - margin.left - margin.right;
  const slotWidth = plotWidth / groups.length;
  const yTicks = Array.from({ length: 6 }, (_, index) => minimum + ((maximum - minimum) * index) / 5);

  return (
    <svg width={width} height={height} role="img" aria-label={`${mode} distribution plot`}>
      <rect width={width} height={height} fill="#ffffff" />
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="#e5e7eb"
            strokeDasharray="3 3"
          />
          <text
            x={margin.left - 10}
            y={y(tick)}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={tickFontSize}
            fill="#374151"
          >
            {formatNumber(tick)}
          </text>
        </g>
      ))}
      {groups.map((group, groupIndex) => {
        const center = margin.left + slotWidth * (groupIndex + 0.5);
        const q1 = quantile(group.values, 0.25);
        const med = quantile(group.values, 0.5);
        const q3 = quantile(group.values, 0.75);
        const min = Math.min(...group.values);
        const max = Math.max(...group.values);
        const halfWidth = Math.min(46, slotWidth * 0.34);
        const densityValues = Array.from(
          { length: 56 },
          (_, index) => min + ((max - min) * index) / 55,
        );
        const density = gaussianKernelDensity(group.values, densityValues);
        const densityMaximum = Math.max(...density.map((entry) => entry.density), 1e-12);
        const left = density.map(
          (entry) =>
            `${center - (entry.density / densityMaximum) * halfWidth},${y(entry.value)}`,
        );
        const right = [...density]
          .reverse()
          .map(
            (entry) =>
              `${center + (entry.density / densityMaximum) * halfWidth},${y(entry.value)}`,
          );
        return (
          <g key={group.name}>
            {mode === "violin" ? (
              <>
                <path
                  d={`M ${left.join(" L ")} L ${right.join(" L ")} Z`}
                  fill={group.color}
                  fillOpacity={0.28}
                  stroke={group.color}
                  strokeWidth={1.6}
                />
                <line x1={center - halfWidth * 0.58} x2={center + halfWidth * 0.58} y1={y(med)} y2={y(med)} stroke="#111827" strokeWidth={2} />
                <line x1={center - halfWidth * 0.42} x2={center + halfWidth * 0.42} y1={y(q1)} y2={y(q1)} stroke="#111827" strokeWidth={1} strokeDasharray="3 2" />
                <line x1={center - halfWidth * 0.42} x2={center + halfWidth * 0.42} y1={y(q3)} y2={y(q3)} stroke="#111827" strokeWidth={1} strokeDasharray="3 2" />
              </>
            ) : (
              <>
                <line x1={center} x2={center} y1={y(min)} y2={y(max)} stroke="#111827" strokeWidth={1.5} />
                <line x1={center - halfWidth * 0.5} x2={center + halfWidth * 0.5} y1={y(min)} y2={y(min)} stroke="#111827" strokeWidth={1.5} />
                <line x1={center - halfWidth * 0.5} x2={center + halfWidth * 0.5} y1={y(max)} y2={y(max)} stroke="#111827" strokeWidth={1.5} />
                <rect
                  x={center - halfWidth}
                  y={y(q3)}
                  width={halfWidth * 2}
                  height={Math.max(1, y(q1) - y(q3))}
                  fill={group.color}
                  fillOpacity={0.3}
                  stroke={group.color}
                  strokeWidth={1.8}
                />
                <line x1={center - halfWidth} x2={center + halfWidth} y1={y(med)} y2={y(med)} stroke="#111827" strokeWidth={2} />
              </>
            )}
            {showPoints
              ? group.values.map((value, index) => {
                  const jitter = ((((index + 1) * 37 + groupIndex * 13) % 19) - 9) * Math.min(2.2, slotWidth / 55);
                  return (
                    <circle
                      key={`${group.name}-${index}`}
                      cx={center + jitter}
                      cy={y(value)}
                      r={pointSize / 2}
                      fill={group.color}
                      fillOpacity={pointOpacity / 100}
                      stroke="#ffffff"
                      strokeWidth={0.8}
                    >
                      <title>{`${group.name}: ${formatNumber(value)}`}</title>
                    </circle>
                  );
                })
              : null}
            <text
              x={center}
              y={height - margin.bottom + 24}
              textAnchor="middle"
              fontSize={tickFontSize}
              fill="#374151"
            >
              {group.name}
            </text>
          </g>
        );
      })}
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#111827" />
      <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#111827" />
      <text x={(margin.left + width - margin.right) / 2} y={height - 18} textAnchor="middle" fontSize={axisTitleFontSize} fill="#111827">{xLabel}</text>
      <text transform={`translate(20 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize={axisTitleFontSize} fill="#111827">{yLabel}</text>
    </svg>
  );
}

function PairedTrajectoryPlot({
  groups,
  subjects,
  width,
  height,
  colors,
  pointSize,
  pointOpacity,
  xLabel,
  yLabel,
  tickFontSize,
  axisTitleFontSize,
}: {
  groups: string[];
  subjects: Array<{ subject: string; values: Record<string, number> }>;
  width: number;
  height: number;
  colors: Map<string, string>;
  pointSize: number;
  pointOpacity: number;
  xLabel: string;
  yLabel: string;
  tickFontSize: number;
  axisTitleFontSize: number;
}) {
  const allValues = subjects.flatMap((entry) => Object.values(entry.values));
  if (groups.length < 2) {
    return <EmptyState text="Choose the condition column under Repeated conditions. It must contain at least two conditions, such as Baseline and Post-treatment." />;
  }
  if (!subjects.length || !allValues.length) {
    return <EmptyState text="Choose the column containing the repeated subject IDs, such as subject_id." />;
  }
  if (!subjects.some((entry) => Object.keys(entry.values).length >= 2)) {
    return <EmptyState text="No subject ID occurs in at least two selected conditions. Each subject must have one row for every condition being connected." />;
  }
  const margin = { top: 30, right: 42, bottom: 78, left: 82 };
  const rawMinimum = Math.min(...allValues);
  const rawMaximum = Math.max(...allValues);
  const rawStep = (rawMaximum - rawMinimum || Math.max(1, Math.abs(rawMaximum) * 0.1)) / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalizedStep = rawStep / magnitude;
  const niceStep =
    (normalizedStep <= 1
      ? 1
      : normalizedStep <= 2
        ? 2
        : normalizedStep <= 2.5
          ? 2.5
          : normalizedStep <= 5
            ? 5
            : 10) * magnitude;
  const minimum = Math.floor(rawMinimum / niceStep) * niceStep;
  const maximum = Math.ceil(rawMaximum / niceStep) * niceStep;
  const y = linearScale(minimum, maximum, height - margin.bottom, margin.top);
  const availableWidth = width - margin.left - margin.right;
  const horizontalInset = Math.min(120, Math.max(56, availableWidth * 0.18));
  const x = (index: number) =>
    groups.length === 1
      ? width / 2
      : margin.left +
        horizontalInset +
        ((availableWidth - horizontalInset * 2) * index) / (groups.length - 1);
  const yTicks = Array.from(
    { length: Math.round((maximum - minimum) / niceStep) + 1 },
    (_, index) => minimum + niceStep * index,
  );
  const groupSummaries = groups.map((groupName) => {
    const values = subjects
      .map((entry) => entry.values[groupName])
      .filter((value) => Number.isFinite(value));
    const mean = average(values);
    const sem = values.length > 1 ? Math.sqrt(sampleVariance(values)) / Math.sqrt(values.length) : 0;
    return { groupName, mean, sem, n: values.length };
  });
  return (
    <svg width={width} height={height} role="img" aria-label="Paired subject trajectories">
      <rect width={width} height={height} fill="#ffffff" />
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="#e5e7eb" strokeDasharray="3 3" />
          <text x={margin.left - 10} y={y(tick)} textAnchor="end" dominantBaseline="central" fontSize={tickFontSize} fill="#374151">{formatNumber(tick)}</text>
        </g>
      ))}
      {subjects.map((entry) => {
        const points = groups.flatMap((groupName, groupIndex) =>
          Number.isFinite(entry.values[groupName])
            ? [{ x: x(groupIndex), y: y(entry.values[groupName]), groupName }]
            : [],
        );
        return (
          <g key={entry.subject}>
            {points.length > 1 ? (
              <polyline
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke="#94a3b8"
                strokeOpacity={0.55}
                strokeWidth={1.35}
              />
            ) : null}
            {points.map((point) => (
              <circle
                key={point.groupName}
                cx={point.x}
                cy={point.y}
                r={pointSize / 2}
                fill={colors.get(point.groupName) ?? "#f92080"}
                fillOpacity={pointOpacity / 100}
                stroke="#ffffff"
                strokeWidth={0.9}
              >
                <title>{`${entry.subject} · ${point.groupName}: ${formatNumber(entry.values[point.groupName])}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {groupSummaries.map((summary, index) => {
        const center = x(index);
        const color = colors.get(summary.groupName) ?? "#111827";
        return (
          <g key={`summary-${summary.groupName}`}>
            <line
              x1={center}
              x2={center}
              y1={y(summary.mean - summary.sem)}
              y2={y(summary.mean + summary.sem)}
              stroke={color}
              strokeWidth={2.2}
            />
            <line x1={center - 8} x2={center + 8} y1={y(summary.mean - summary.sem)} y2={y(summary.mean - summary.sem)} stroke={color} strokeWidth={2.2} />
            <line x1={center - 8} x2={center + 8} y1={y(summary.mean + summary.sem)} y2={y(summary.mean + summary.sem)} stroke={color} strokeWidth={2.2} />
            <line x1={center - 22} x2={center + 22} y1={y(summary.mean)} y2={y(summary.mean)} stroke={color} strokeWidth={3.2} />
            <title>{`${summary.groupName}: mean ${formatNumber(summary.mean)}, SEM ${formatNumber(summary.sem)}, n=${summary.n}`}</title>
          </g>
        );
      })}
      {groups.map((groupName, index) => (
        <text key={groupName} x={x(index)} y={height - margin.bottom + 24} textAnchor="middle" fontSize={tickFontSize} fill="#374151">{groupName}</text>
      ))}
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#111827" />
      <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#111827" />
      <text x={(margin.left + width - margin.right) / 2} y={height - 18} textAnchor="middle" fontSize={axisTitleFontSize} fill="#111827">{xLabel}</text>
      <text transform={`translate(20 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize={axisTitleFontSize} fill="#111827">{yLabel}</text>
    </svg>
  );
}

type DoseFit = {
  bottom: number;
  top: number;
  midpoint: number;
  hill: number;
  rSquared: number;
  predict: (x: number) => number;
};

function fourParameterLogistic(x: number, parameters: number[]) {
  const [bottom, top, midpoint, hill] = parameters;
  return bottom + (top - bottom) / (1 + Math.pow(10, (midpoint - x) * hill));
}

function fitFourParameterLogistic(points: Array<{ x: number; y: number }>): DoseFit | null {
  if (
    points.length < 5 ||
    new Set(points.map((point) => point.x)).size < 5 ||
    sampleVariance(points.map((point) => point.y)) <= 0
  ) return null;
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const xValues = sorted.map((point) => point.x);
  const yValues = sorted.map((point) => point.y);
  const xRange = Math.max(...xValues) - Math.min(...xValues) || 1;
  const yRange = Math.max(...yValues) - Math.min(...yValues) || 1;
  const lowMean = average(sorted.slice(0, Math.max(2, Math.ceil(sorted.length / 4))).map((point) => point.y));
  const highMean = average(sorted.slice(-Math.max(2, Math.ceil(sorted.length / 4))).map((point) => point.y));
  const start = [lowMean, highMean, quantile(xValues, 0.5), 1];
  const steps = [yRange * 0.18, yRange * 0.18, xRange * 0.12, 0.45];
  let simplex = [start, ...steps.map((step, index) => start.map((value, parameter) => value + (parameter === index ? step : 0)))];
  const objective = (parameters: number[]) => {
    const [bottom, top, midpoint, hill] = parameters;
    if (
      !parameters.every(Number.isFinite) ||
      Math.abs(hill) < 0.02 ||
      Math.abs(hill) > 12 ||
      midpoint < Math.min(...xValues) - xRange * 2 ||
      midpoint > Math.max(...xValues) + xRange * 2 ||
      bottom < Math.min(...yValues) - yRange * 4 ||
      bottom > Math.max(...yValues) + yRange * 4 ||
      top < Math.min(...yValues) - yRange * 4 ||
      top > Math.max(...yValues) + yRange * 4
    ) return 1e30;
    return points.reduce((sum, point) => {
      const residual = point.y - fourParameterLogistic(point.x, parameters);
      return sum + residual * residual;
    }, 0);
  };
  for (let iteration = 0; iteration < 240; iteration += 1) {
    simplex.sort((a, b) => objective(a) - objective(b));
    const best = simplex[0];
    const worst = simplex[simplex.length - 1];
    const centroid = best.map((_, parameter) =>
      average(simplex.slice(0, -1).map((vertex) => vertex[parameter])),
    );
    const reflected = centroid.map((value, parameter) => value + (value - worst[parameter]));
    if (objective(reflected) < objective(best)) {
      const expanded = centroid.map((value, parameter) => value + 2 * (reflected[parameter] - value));
      simplex[simplex.length - 1] = objective(expanded) < objective(reflected) ? expanded : reflected;
    } else if (objective(reflected) < objective(simplex[simplex.length - 2])) {
      simplex[simplex.length - 1] = reflected;
    } else {
      const contracted = centroid.map((value, parameter) => value + 0.5 * (worst[parameter] - value));
      if (objective(contracted) < objective(worst)) {
        simplex[simplex.length - 1] = contracted;
      } else {
        simplex = [best, ...simplex.slice(1).map((vertex) => vertex.map((value, parameter) => best[parameter] + 0.5 * (value - best[parameter])))];
      }
    }
  }
  simplex.sort((a, b) => objective(a) - objective(b));
  const [bottom, top, midpoint, hill] = simplex[0];
  const sse = objective(simplex[0]);
  const meanY = average(yValues);
  const total = yValues.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
  return {
    bottom,
    top,
    midpoint,
    hill,
    rSquared: total > 0 ? 1 - sse / total : Number.NaN,
    predict: (x) => fourParameterLogistic(x, simplex[0]),
  };
}

type PcaResult = {
  points: Array<{ pc1: number; pc2: number; label: string; group: string }>;
  explained1: number;
  explained2: number;
  loadings: Array<{ variable: string; pc1: number; pc2: number }>;
};

function vectorNorm(vector: number[]) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

function leadingEigen(matrix: number[][], seed: number) {
  let vector = matrix.map((_, index) => (index === seed % matrix.length ? 1 : 0.5 / Math.max(1, matrix.length - 1)));
  for (let iteration = 0; iteration < 160; iteration += 1) {
    const next = matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
    const norm = vectorNorm(next);
    if (!Number.isFinite(norm) || norm < 1e-12) break;
    vector = next.map((value) => value / norm);
  }
  const projected = matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
  const value = vector.reduce((sum, entry, index) => sum + entry * projected[index], 0);
  return { value, vector };
}

function calculatePca(
  rows: DataRow[],
  variables: string[],
  labelVariable: string,
  groupVariable: string,
): PcaResult | null {
  if (variables.length < 2) return null;
  const complete = rows.flatMap((row, index) => {
    const values = variables.map((variable) => Number(row[variable]));
    return values.every(Number.isFinite)
      ? [{ values, label: row[labelVariable] || row.sample_id || `Row ${index + 1}`, group: groupVariable === "__none__" ? "All samples" : row[groupVariable] || "Missing" }]
      : [];
  });
  if (complete.length < 3) return null;
  const means = variables.map((_, column) => average(complete.map((entry) => entry.values[column])));
  const sds = variables.map((_, column) => Math.sqrt(sampleVariance(complete.map((entry) => entry.values[column]))));
  if (sds.some((sd) => !Number.isFinite(sd) || sd <= 0)) return null;
  const standardized = complete.map((entry) => entry.values.map((value, column) => (value - means[column]) / sds[column]));
  const covariance = variables.map((_, first) =>
    variables.map((__, second) => standardized.reduce((sum, row) => sum + row[first] * row[second], 0) / Math.max(1, standardized.length - 1)),
  );
  const first = leadingEigen(covariance, 0);
  const deflated = covariance.map((row, rowIndex) => row.map((value, columnIndex) => value - first.value * first.vector[rowIndex] * first.vector[columnIndex]));
  const second = leadingEigen(deflated, 1);
  const totalVariance = covariance.reduce((sum, row, index) => sum + row[index], 0);
  return {
    points: standardized.map((values, index) => ({
      pc1: values.reduce((sum, value, column) => sum + value * first.vector[column], 0),
      pc2: values.reduce((sum, value, column) => sum + value * second.vector[column], 0),
      label: complete[index].label,
      group: complete[index].group,
    })),
    explained1: totalVariance > 0 ? first.value / totalVariance : Number.NaN,
    explained2: totalVariance > 0 ? second.value / totalVariance : Number.NaN,
    loadings: variables.map((variable, index) => ({ variable, pc1: first.vector[index], pc2: second.vector[index] })),
  };
}

function SetIntersectionPlot({
  rows,
  itemVariable,
  setVariable,
  mode,
  width,
  height,
  tickFontSize,
}: {
  rows: DataRow[];
  itemVariable: string;
  setVariable: string;
  mode: SetPlotMode;
  width: number;
  height: number;
  tickFontSize: number;
}) {
  const model = useMemo(() => {
    const memberships = new Map<string, Set<string>>();
    const setOrder: string[] = [];
    rows.forEach((row) => {
      const item = row[itemVariable]?.trim();
      const setName = row[setVariable]?.trim();
      if (!item || !setName) return;
      if (!setOrder.includes(setName)) setOrder.push(setName);
      const itemSets = memberships.get(item) ?? new Set<string>();
      itemSets.add(setName);
      memberships.set(item, itemSets);
    });
    const setNames = setOrder.slice(0, 8);
    const intersections = new Map<string, string[]>();
    memberships.forEach((sets, item) => {
      const included = setNames.filter((setName) => sets.has(setName));
      if (!included.length) return;
      const key = included.join("\u0000");
      intersections.set(key, [...(intersections.get(key) ?? []), item]);
    });
    return {
      setNames,
      setSizes: setNames.map((setName) => ({
        name: setName,
        count: [...memberships.values()].filter((sets) => sets.has(setName)).length,
      })),
      intersections: [...intersections.entries()]
        .map(([key, items]) => ({ sets: key.split("\u0000"), items, count: items.length }))
        .sort((a, b) => b.count - a.count || a.sets.length - b.sets.length),
      itemCount: memberships.size,
    };
  }, [itemVariable, rows, setVariable]);

  if (!itemVariable || !setVariable || model.setNames.length < 2 || !model.intersections.length) {
    return (
      <EmptyState text="Choose an item identifier and a set-membership column. Repeat an item on multiple rows when it belongs to multiple sets." />
    );
  }
  const activeMode = mode === "auto" ? (model.setNames.length <= 3 ? "venn" : "upset") : mode;
  if (activeMode === "venn" && model.setNames.length <= 3) {
    const countFor = (...sets: string[]) =>
      model.intersections.find(
        (intersection) =>
          intersection.sets.length === sets.length &&
          sets.every((setName) => intersection.sets.includes(setName)),
      )?.count ?? 0;
    const [a, b, c] = model.setNames;
    const radius = Math.min(width * 0.18, height * 0.22, 102);
    const centerY = height * 0.5;
    return (
      <svg width={width} height={height} role="img" aria-label="Venn diagram">
        <rect width={width} height={height} fill="#ffffff" />
        {model.setNames.length === 2 ? (
          <>
            <circle cx={width * 0.42} cy={centerY} r={radius} fill="#440154" fillOpacity={0.28} />
            <circle cx={width * 0.58} cy={centerY} r={radius} fill="#22a884" fillOpacity={0.28} />
            <text x={width * 0.34} y={centerY - radius - 18} textAnchor="middle" fontSize={tickFontSize + 1} fontWeight={700}>{a}</text>
            <text x={width * 0.66} y={centerY - radius - 18} textAnchor="middle" fontSize={tickFontSize + 1} fontWeight={700}>{b}</text>
            <text x={width * 0.35} y={centerY} textAnchor="middle" fontSize={tickFontSize + 4} fontWeight={700}>{countFor(a)}</text>
            <text x={width * 0.5} y={centerY} textAnchor="middle" fontSize={tickFontSize + 4} fontWeight={700}>{countFor(a, b)}</text>
            <text x={width * 0.65} y={centerY} textAnchor="middle" fontSize={tickFontSize + 4} fontWeight={700}>{countFor(b)}</text>
          </>
        ) : (
          <>
            <circle cx={width * 0.42} cy={height * 0.43} r={radius} fill="#440154" fillOpacity={0.28} />
            <circle cx={width * 0.58} cy={height * 0.43} r={radius} fill="#21918c" fillOpacity={0.28} />
            <circle cx={width * 0.5} cy={height * 0.61} r={radius} fill="#fde725" fillOpacity={0.28} />
            <text x={width * 0.32} y={height * 0.16} textAnchor="middle" fontSize={tickFontSize + 1} fontWeight={700}>{a}</text>
            <text x={width * 0.68} y={height * 0.16} textAnchor="middle" fontSize={tickFontSize + 1} fontWeight={700}>{b}</text>
            <text x={width * 0.5} y={height * 0.91} textAnchor="middle" fontSize={tickFontSize + 1} fontWeight={700}>{c}</text>
            <text x={width * 0.34} y={height * 0.4} textAnchor="middle" fontSize={tickFontSize + 2} fontWeight={700}>{countFor(a)}</text>
            <text x={width * 0.66} y={height * 0.4} textAnchor="middle" fontSize={tickFontSize + 2} fontWeight={700}>{countFor(b)}</text>
            <text x={width * 0.5} y={height * 0.74} textAnchor="middle" fontSize={tickFontSize + 2} fontWeight={700}>{countFor(c)}</text>
            <text x={width * 0.5} y={height * 0.36} textAnchor="middle" fontSize={tickFontSize + 2} fontWeight={700}>{countFor(a, b)}</text>
            <text x={width * 0.42} y={height * 0.57} textAnchor="middle" fontSize={tickFontSize + 2} fontWeight={700}>{countFor(a, c)}</text>
            <text x={width * 0.58} y={height * 0.57} textAnchor="middle" fontSize={tickFontSize + 2} fontWeight={700}>{countFor(b, c)}</text>
            <text x={width * 0.5} y={height * 0.5} textAnchor="middle" fontSize={tickFontSize + 3} fontWeight={800}>{countFor(a, b, c)}</text>
          </>
        )}
        <text x={width / 2} y={height - 12} textAnchor="middle" fontSize={tickFontSize} fill="#6b7280">{model.itemCount} unique items · exact region counts</text>
      </svg>
    );
  }

  const intersections = model.intersections.slice(0, 16);
  const setBarLeft = 22;
  const setBarRight = 188;
  const matrixLeft = 300;
  const columnWidth = 48;
  const upsetWidth = Math.max(width, matrixLeft + intersections.length * columnWidth + 28);
  const barTop = 28;
  const barBottom = Math.min(210, height * 0.47);
  const matrixTop = barBottom + 44;
  const rowHeight = 38;
  const chartHeight = Math.max(height, matrixTop + model.setNames.length * rowHeight + 86);
  const intersectionMaximum = Math.max(...intersections.map((entry) => entry.count), 1);
  const setMaximum = Math.max(...model.setSizes.map((entry) => entry.count), 1);
  const intersectionBarScale = linearScale(0, intersectionMaximum, barBottom, barTop);
  const setBarScale = linearScale(0, setMaximum, 0, setBarRight - setBarLeft);
  const setTicks = Array.from(new Set([0, Math.round(setMaximum / 2), setMaximum]));
  const intersectionTicks = Array.from(
    new Set(
      Array.from({ length: 4 }, (_, index) =>
        Math.round((intersectionMaximum * index) / 3),
      ),
    ),
  );
  return (
    <div className="overflow-x-auto">
      <svg
        width={upsetWidth}
        height={chartHeight}
        role="img"
        aria-label="UpSet intersection plot"
      >
        <rect width={upsetWidth} height={chartHeight} fill="#ffffff" />
        <text
          transform={`translate(${matrixLeft - 52} ${(barTop + barBottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={tickFontSize + 1}
          fontWeight={700}
          fill="#111827"
        >
          Items per intersection
        </text>
        {intersectionTicks.map((tick) => {
          const y = intersectionBarScale(tick);
          return (
            <g key={`intersection-tick-${tick}`}>
              <line
                x1={matrixLeft - 5}
                x2={upsetWidth - 18}
                y1={y}
                y2={y}
                stroke={tick === 0 ? "#111827" : "#e5e7eb"}
                strokeDasharray={tick === 0 ? undefined : "3 3"}
              />
              <text
                x={matrixLeft - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={tickFontSize - 1}
                fill="#374151"
              >
                {tick}
              </text>
            </g>
          );
        })}
        {model.setNames.map((setName, index) =>
          index % 2 === 0 ? (
            <rect
              key={`set-band-${setName}`}
              x={setBarLeft - 8}
              y={matrixTop + index * rowHeight - rowHeight / 2}
              width={upsetWidth - setBarLeft - 10}
              height={rowHeight}
              fill="#f7f7f8"
            />
          ) : null,
        )}
        {intersections.map((intersection, index) => {
          const x = matrixLeft + index * columnWidth + columnWidth / 2;
          const activeRows = model.setNames.flatMap((setName, rowIndex) => intersection.sets.includes(setName) ? [rowIndex] : []);
          return (
            <g key={intersection.sets.join("+")}>
              <rect
                x={x - 14}
                y={intersectionBarScale(intersection.count)}
                width={28}
                height={barBottom - intersectionBarScale(intersection.count)}
                rx={2}
                fill="#9333d4"
                fillOpacity={0.92}
              />
              <text
                x={x}
                y={intersectionBarScale(intersection.count) - 6}
                textAnchor="middle"
                fontSize={tickFontSize - 1}
                fontWeight={700}
                fill="#7e22ce"
              >
                {intersection.count}
              </text>
              {activeRows.length > 1 ? <line x1={x} x2={x} y1={matrixTop + Math.min(...activeRows) * rowHeight} y2={matrixTop + Math.max(...activeRows) * rowHeight} stroke="#111827" strokeWidth={2} /> : null}
              {model.setNames.map((setName, rowIndex) => (
                <circle key={setName} cx={x} cy={matrixTop + rowIndex * rowHeight} r={intersection.sets.includes(setName) ? 5.5 : 3.5} fill={intersection.sets.includes(setName) ? "#111827" : "#d1d5db"} />
              ))}
              <title>{`${intersection.sets.join(" ∩ ")}: ${intersection.count}\n${intersection.items.slice(0, 12).join(", ")}${intersection.items.length > 12 ? "…" : ""}`}</title>
            </g>
          );
        })}
        {model.setSizes.map((setSize, index) => {
          const y = matrixTop + index * rowHeight;
          const barWidth = setBarScale(setSize.count);
          return (
            <g key={setSize.name}>
              <rect
                x={setBarRight - barWidth}
                y={y - 11}
                width={barWidth}
                height={22}
                rx={2}
                fill="#a3e635"
                fillOpacity={0.9}
              />
              <text
                x={barWidth > 38 ? setBarRight - barWidth / 2 : setBarRight - barWidth - 6}
                y={y}
                textAnchor={barWidth > 38 ? "middle" : "end"}
                dominantBaseline="central"
                fontSize={tickFontSize - 1}
                fontWeight={700}
                fill="#111827"
              >
                {setSize.count}
              </text>
              <text
                x={matrixLeft - 16}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={tickFontSize}
                fontWeight={600}
              >
                {setSize.name}
              </text>
            </g>
          );
        })}
        <line x1={matrixLeft - 5} x2={upsetWidth - 18} y1={barBottom} y2={barBottom} stroke="#111827" />
        <line x1={setBarLeft} x2={setBarRight} y1={matrixTop + model.setNames.length * rowHeight - 8} y2={matrixTop + model.setNames.length * rowHeight - 8} stroke="#111827" />
        {setTicks.map((tick) => {
          const x = setBarRight - setBarScale(tick);
          const y = matrixTop + model.setNames.length * rowHeight - 8;
          return (
            <g key={`set-tick-${tick}`}>
              <line x1={x} x2={x} y1={y} y2={y + 5} stroke="#111827" />
              <text
                x={x}
                y={y + 16}
                textAnchor="middle"
                fontSize={tickFontSize - 2}
                fill="#374151"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <text
          x={(setBarLeft + setBarRight) / 2}
          y={matrixTop + model.setNames.length * rowHeight + 30}
          textAnchor="middle"
          fontSize={tickFontSize}
          fontWeight={700}
        >
          Items per set
        </text>
        <text
          x={(matrixLeft + upsetWidth - 18) / 2}
          y={matrixTop + model.setNames.length * rowHeight + 54}
          textAnchor="middle"
          fontSize={tickFontSize}
          fill="#6b7280"
        >
          Top {intersections.length} exact intersections · {model.itemCount} unique items
        </text>
      </svg>
    </div>
  );
}

function DoseResponsePlot({
  series,
  width,
  height,
  xLabel,
  yLabel,
  pointSize,
  pointOpacity,
  tickFontSize,
  axisTitleFontSize,
}: {
  series: Array<{ name: string; color: string; points: Array<{ x: number; y: number }>; fit: DoseFit | null }>;
  width: number;
  height: number;
  xLabel: string;
  yLabel: string;
  pointSize: number;
  pointOpacity: number;
  tickFontSize: number;
  axisTitleFontSize: number;
}) {
  const allPoints = series.flatMap((entry) => entry.points);
  if (!allPoints.length) return <EmptyState text="Select numeric dose and response columns with at least five complete observations." />;
  const margin = { top: 28, right: 30, bottom: 78, left: 82 };
  const [xMin, xMax] = chartExtent(allPoints.map((point) => point.x), 0.03);
  const [yMin, yMax] = chartExtent(allPoints.map((point) => point.y));
  const x = linearScale(xMin, xMax, margin.left, width - margin.right);
  const y = linearScale(yMin, yMax, height - margin.bottom, margin.top);
  const xTicks = Array.from({ length: 6 }, (_, index) => xMin + ((xMax - xMin) * index) / 5);
  const yTicks = Array.from({ length: 6 }, (_, index) => yMin + ((yMax - yMin) * index) / 5);
  return (
    <div>
      <svg width={width} height={height} role="img" aria-label="Four-parameter dose response curve">
        <rect width={width} height={height} fill="#ffffff" />
        <defs>
          <clipPath id="dose-response-plot-area">
            <rect
              x={margin.left}
              y={margin.top}
              width={width - margin.left - margin.right}
              height={height - margin.top - margin.bottom}
            />
          </clipPath>
        </defs>
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="#e5e7eb" strokeDasharray="3 3" />
            <text x={margin.left - 10} y={y(tick)} textAnchor="end" dominantBaseline="central" fontSize={tickFontSize}>{formatNumber(tick)}</text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text key={`x-${tick}`} x={x(tick)} y={height - margin.bottom + 24} textAnchor="middle" fontSize={tickFontSize}>{formatNumber(tick)}</text>
        ))}
        <g clipPath="url(#dose-response-plot-area)">
          {series.map((entry) => {
            const curve = entry.fit
              ? Array.from({ length: 100 }, (_, index) => {
                  const value = xMin + ((xMax - xMin) * index) / 99;
                  return `${x(value)},${y(entry.fit?.predict(value) ?? Number.NaN)}`;
                })
              : [];
            return (
              <g key={entry.name}>
                {curve.length ? (
                  <polyline
                    points={curve.join(" ")}
                    fill="none"
                    stroke={entry.color}
                    strokeWidth={2.4}
                  />
                ) : null}
                {entry.points.map((point, index) => (
                  <circle
                    key={index}
                    cx={x(point.x)}
                    cy={y(point.y)}
                    r={pointSize / 2}
                    fill={entry.color}
                    fillOpacity={pointOpacity / 100}
                    stroke="#ffffff"
                    strokeWidth={0.8}
                  >
                    <title>{`${entry.name}: ${formatNumber(point.x)}, ${formatNumber(point.y)}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </g>
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#111827" />
        <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#111827" />
        <text x={(margin.left + width - margin.right) / 2} y={height - 18} textAnchor="middle" fontSize={axisTitleFontSize}>{xLabel}</text>
        <text transform={`translate(20 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize={axisTitleFontSize}>{yLabel}</text>
      </svg>
      <div className="mt-3 overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Series</TableHead><TableHead>Bottom</TableHead><TableHead>Top</TableHead><TableHead>Midpoint</TableHead><TableHead>Hill slope</TableHead><TableHead>R²</TableHead></TableRow></TableHeader>
          <TableBody>
            {series.map((entry) => (
              <TableRow key={entry.name}><TableCell className="font-medium">{entry.name}</TableCell><TableCell>{entry.fit ? formatNumber(entry.fit.bottom) : "Need ≥5 distinct doses and variable responses"}</TableCell><TableCell>{entry.fit ? formatNumber(entry.fit.top) : "—"}</TableCell><TableCell>{entry.fit ? formatNumber(entry.fit.midpoint) : "—"}</TableCell><TableCell>{entry.fit ? formatNumber(entry.fit.hill) : "—"}</TableCell><TableCell>{entry.fit ? formatNumber(entry.fit.rSquared) : "—"}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PcaPlot({
  result,
  width,
  height,
  colors,
  pointSize,
  pointOpacity,
  tickFontSize,
  axisTitleFontSize,
}: {
  result: PcaResult | null;
  width: number;
  height: number;
  colors: Map<string, string>;
  pointSize: number;
  pointOpacity: number;
  tickFontSize: number;
  axisTitleFontSize: number;
}) {
  if (!result?.points.length) return <EmptyState text="Select at least two numeric variables with complete data and non-zero variance." />;
  const margin = { top: 26, right: 34, bottom: 78, left: 82 };
  const [xMin, xMax] = chartExtent(result.points.map((point) => point.pc1), 0.12);
  const [yMin, yMax] = chartExtent(result.points.map((point) => point.pc2), 0.12);
  const x = linearScale(xMin, xMax, margin.left, width - margin.right);
  const y = linearScale(yMin, yMax, height - margin.bottom, margin.top);
  const xTicks = Array.from(
    { length: 6 },
    (_, index) => xMin + ((xMax - xMin) * index) / 5,
  );
  const yTicks = Array.from(
    { length: 6 },
    (_, index) => yMin + ((yMax - yMin) * index) / 5,
  );
  return (
    <div>
      <svg width={width} height={height} role="img" aria-label="PCA score plot">
        <rect width={width} height={height} fill="#ffffff" />
        {xTicks.map((tick) => (
          <g key={`pca-x-${tick}`}>
            <line
              x1={x(tick)}
              x2={x(tick)}
              y1={height - margin.bottom}
              y2={height - margin.bottom + 5}
              stroke="#111827"
            />
            <text
              x={x(tick)}
              y={height - margin.bottom + 22}
              textAnchor="middle"
              fontSize={tickFontSize}
              fill="#374151"
            >
              {formatNumber(tick, 2)}
            </text>
          </g>
        ))}
        {yTicks.map((tick) => (
          <g key={`pca-y-${tick}`}>
            <line
              x1={margin.left - 5}
              x2={margin.left}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#111827"
            />
            <text
              x={margin.left - 10}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={tickFontSize}
              fill="#374151"
            >
              {formatNumber(tick, 2)}
            </text>
          </g>
        ))}
        <line x1={margin.left} x2={width - margin.right} y1={y(0)} y2={y(0)} stroke="#d1d5db" strokeDasharray="4 4" />
        <line x1={x(0)} x2={x(0)} y1={margin.top} y2={height - margin.bottom} stroke="#d1d5db" strokeDasharray="4 4" />
        {result.points.map((point, index) => (
          <circle key={`${point.label}-${index}`} cx={x(point.pc1)} cy={y(point.pc2)} r={pointSize / 2 + 1} fill={colors.get(point.group) ?? "#f92080"} fillOpacity={pointOpacity / 100} stroke="#ffffff" strokeWidth={1}>
            <title>{`${point.label} · ${point.group}\nPC1 ${formatNumber(point.pc1)}, PC2 ${formatNumber(point.pc2)}`}</title>
          </circle>
        ))}
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#111827" />
        <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#111827" />
        <text x={(margin.left + width - margin.right) / 2} y={height - 18} textAnchor="middle" fontSize={axisTitleFontSize}>PC1 ({formatNumber(result.explained1 * 100, 1)}%)</text>
        <text transform={`translate(20 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize={axisTitleFontSize}>PC2 ({formatNumber(result.explained2 * 100, 1)}%)</text>
        {[...colors.entries()].map(([name, color], index) => (
          <g key={name}><circle cx={width - margin.right - 110} cy={margin.top + index * 18} r={4} fill={color} /><text x={width - margin.right - 100} y={margin.top + index * 18} dominantBaseline="central" fontSize={tickFontSize}>{name}</text></g>
        ))}
      </svg>
      <div className="mt-3 overflow-x-auto">
        <Table><TableHeader><TableRow><TableHead>Variable</TableHead><TableHead>PC1 loading</TableHead><TableHead>PC2 loading</TableHead></TableRow></TableHeader><TableBody>{result.loadings.map((loading) => <TableRow key={loading.variable}><TableCell className="font-medium">{loading.variable}</TableCell><TableCell>{formatNumber(loading.pc1)}</TableCell><TableCell>{formatNumber(loading.pc2)}</TableCell></TableRow>)}</TableBody></Table>
      </div>
    </div>
  );
}

function ComparisonOverlay({
  comparisons,
  groups,
  width,
  fontSize,
  showNonSignificant,
}: {
  comparisons: PairwiseComparison[];
  groups: string[];
  width: number;
  fontSize: number;
  showNonSignificant: boolean;
}) {
  const visible = comparisons
    .filter(
      (comparison) =>
        groups.includes(comparison.first) &&
        groups.includes(comparison.second) &&
        (showNonSignificant || comparison.adjustedP < 0.05),
    )
    .sort(
      (first, second) =>
        Math.abs(groups.indexOf(first.second) - groups.indexOf(first.first)) -
        Math.abs(groups.indexOf(second.second) - groups.indexOf(second.first)),
    )
    .slice(0, 4);
  if (!visible.length || groups.length < 2) return null;
  const left = 96;
  const right = 24;
  const slot = (width - left - right) / groups.length;
  const center = (name: string) => left + (groups.indexOf(name) + 0.5) * slot;
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0" width={width} height={88} aria-hidden="true">
      {visible.map((comparison, index) => {
        const x1 = center(comparison.first);
        const x2 = center(comparison.second);
        const y = 18 + index * 18;
        const label = significanceLabel(comparison.adjustedP);
        return (
          <g key={comparisonKey(comparison)}>
            <path
              d={`M ${x1} ${y + 5} V ${y} H ${x2} V ${y + 5}`}
              fill="none"
              stroke="#111827"
              strokeWidth={1.15}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x={(x1 + x2) / 2 - Math.max(12, label.length * 4.3)}
              y={y - 10}
              width={Math.max(24, label.length * 8.6)}
              height={14}
              rx={3}
              fill="#ffffff"
            />
            <text
              x={(x1 + x2) / 2}
              y={y - 1}
              textAnchor="middle"
              fontSize={Math.max(9, fontSize - 1)}
              fontWeight={700}
              fill="#111827"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GroupedComparisonOverlay({
  comparisons,
  groups,
  series,
  groupVariable,
  seriesVariable,
  width,
  fontSize,
  showNonSignificant,
}: {
  comparisons: PairwiseComparison[];
  groups: string[];
  series: string[];
  groupVariable: string;
  seriesVariable: string;
  width: number;
  fontSize: number;
  showNonSignificant: boolean;
}) {
  const left = 96;
  const right = 24;
  const categoryWidth = (width - left - right) / Math.max(1, groups.length);
  const seriesSpacing = Math.min(34, 86 / Math.max(1, series.length));
  const categoryCenter = (name: string) =>
    left + (groups.indexOf(name) + 0.5) * categoryWidth;
  const seriesOffset = (name: string) =>
    (series.indexOf(name) - (series.length - 1) / 2) * seriesSpacing;

  const positioned = comparisons.flatMap((comparison) => {
    if (!showNonSignificant && comparison.adjustedP >= 0.05) return [];
    const context = comparison.context ?? "";
    if (context.startsWith(`${groupVariable}: `)) {
      const groupName = context.slice(groupVariable.length + 2);
      if (
        !groups.includes(groupName) ||
        !series.includes(comparison.first) ||
        !series.includes(comparison.second)
      ) return [];
      return [
        {
          comparison,
          x1: categoryCenter(groupName) + seriesOffset(comparison.first),
          x2: categoryCenter(groupName) + seriesOffset(comparison.second),
        },
      ];
    }
    if (context.startsWith(`${seriesVariable}: `)) {
      const seriesName = context.slice(seriesVariable.length + 2);
      if (
        !series.includes(seriesName) ||
        !groups.includes(comparison.first) ||
        !groups.includes(comparison.second)
      ) return [];
      const offset = seriesOffset(seriesName);
      return [
        {
          comparison,
          x1: categoryCenter(comparison.first) + offset,
          x2: categoryCenter(comparison.second) + offset,
        },
      ];
    }
    return [];
  });

  const visible = positioned
    .sort((first, second) => Math.abs(first.x2 - first.x1) - Math.abs(second.x2 - second.x1))
    .slice(0, 5);
  if (!visible.length) return null;

  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0" width={width} height={96} aria-hidden="true">
      {visible.map(({ comparison, x1, x2 }, index) => {
        const y = 17 + index * 16;
        const label = significanceLabel(comparison.adjustedP);
        return (
          <g key={`${comparisonKey(comparison)}-${index}`}>
            <path
              d={`M ${x1} ${y + 4} V ${y} H ${x2} V ${y + 4}`}
              fill="none"
              stroke="#111827"
              strokeWidth={1.05}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x={(x1 + x2) / 2 - Math.max(11, label.length * 4)}
              y={y - 9}
              width={Math.max(22, label.length * 8)}
              height={13}
              rx={3}
              fill="#ffffff"
            />
            <text
              x={(x1 + x2) / 2}
              y={y - 1}
              textAnchor="middle"
              fontSize={Math.max(8, fontSize - 2)}
              fontWeight={700}
              fill="#111827"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Home() {
  const [rows, setRows] = useState<DataRow[]>(demoRows);
  const [fileName, setFileName] = useState(demoDatasetName);
  const [dataText, setDataText] = useState(() => rowsToTabDelimited(demoRows));
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [plotType, setPlotType] = useState<PlotType>("columns");
  const [outcome, setOutcome] = useState("body_mass_g");
  const [group, setGroup] = useState("species");
  const [factor2, setFactor2] = useState("__none__");
  const [subject, setSubject] = useState("__none__");
  const [xVariable, setXVariable] = useState("flipper_length_mm");
  const [effectVariable, setEffectVariable] = useState("bill_length_mm");
  const [pVariable, setPVariable] = useState("");
  const [labelVariable, setLabelVariable] = useState("sample_id");
  const [heatmapColumns, setHeatmapColumns] = useState<string[]>([
    "bill_length_mm",
    "bill_depth_mm",
    "flipper_length_mm",
    "body_mass_g",
  ]);
  const [pcaColumns, setPcaColumns] = useState<string[]>([
    "bill_length_mm",
    "bill_depth_mm",
    "flipper_length_mm",
    "body_mass_g",
  ]);
  const [distributionMode, setDistributionMode] = useState<DistributionMode>("violin");
  const [setItemVariable, setSetItemVariable] = useState("sample_id");
  const [setMembershipVariable, setSetMembershipVariable] = useState("species");
  const [setPlotMode, setSetPlotMode] = useState<SetPlotMode>("auto");
  const [doseLogX, setDoseLogX] = useState(true);
  const [testChoice, setTestChoice] = useState<TestChoice>("auto");
  const [outlierMethod, setOutlierMethod] = useState<OutlierMethod>("mad");
  const [errorType, setErrorType] = useState<ErrorType>("sem");
  const [plotTitle, setPlotTitle] = useState("");
  const [xLabel, setXLabel] = useState("");
  const [yLabel, setYLabel] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f92080");
  const [secondaryColor, setSecondaryColor] = useState("#111827");
  const [volcanoDownColor, setVolcanoDownColor] = useState("#3f526d");
  const [volcanoNsColor, setVolcanoNsColor] = useState("#b9bdc5");
  const [seriesColorOverrides, setSeriesColorOverrides] =
    useState<Record<string, string>>(demoSeriesColorOverrides);
  const [pointColorMode, setPointColorMode] = useState<PointColorMode>("series");
  const [heatmapPalette, setHeatmapPalette] = useState<HeatmapPalette>("viridis");
  const [heatmapLinkage, setHeatmapLinkage] = useState<HeatmapLinkage>("average");
  const [heatmapDistance, setHeatmapDistance] = useState<HeatmapDistance>("correlation");
  const [showHeatmapValues, setShowHeatmapValues] = useState(false);
  const [pointSize, setPointSize] = useState(7);
  const [pointOpacity, setPointOpacity] = useState(78);
  const [titleFontSize, setTitleFontSize] = useState(18);
  const [axisTitleFontSize, setAxisTitleFontSize] = useState(13);
  const [tickFontSize, setTickFontSize] = useState(12);
  const [legendFontSize, setLegendFontSize] = useState(11);
  const [axisLineWidth, setAxisLineWidth] = useState(1);
  const [plotWidth, setPlotWidth] = useState(700);
  const [plotHeight, setPlotHeight] = useState(440);
  const [exportDpi, setExportDpi] = useState<300 | 600>(300);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportMessage, setExportMessage] = useState("");
  const [showGrid, setShowGrid] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showErrorBars, setShowErrorBars] = useState(true);
  const [showComparisonAnnotations, setShowComparisonAnnotations] = useState(true);
  const [showNonSignificantAnnotations, setShowNonSignificantAnnotations] = useState(false);
  const [volcanoLabelList, setVolcanoLabelList] = useState("");
  const [postHocEnabled, setPostHocEnabled] = useState(true);
  const [postHocAdjustment, setPostHocAdjustment] = useState<PostHocAdjustment>("holm");
  const [postHocScope, setPostHocScope] = useState<PostHocScope>("all");
  const [postHocReference, setPostHocReference] = useState("");
  const [selectedPostHocComparisons, setSelectedPostHocComparisons] = useState<string[]>([]);
  const [logY, setLogY] = useState(false);
  const [foldThreshold, setFoldThreshold] = useState(1);
  const [pThreshold, setPThreshold] = useState(0.05);
  const [useFoldThreshold, setUseFoldThreshold] = useState(true);
  const [useSignificanceThreshold, setUseSignificanceThreshold] = useState(true);
  const [volcanoThresholdMetric, setVolcanoThresholdMetric] = useState<VolcanoThresholdMetric>("p");
  const [error, setError] = useState("");
  const [normalityEngine, setNormalityEngine] = useState<NormalityEngine | null>(null);
  const [normalityLoadState, setNormalityLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);

  const allColumns = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);
  const numbers = useMemo(() => numericColumns(rows), [rows]);
  const categories = useMemo(() => categoricalColumns(rows), [rows]);

  useEffect(() => {
    if (pVariable && numbers.includes(pVariable)) return;
    setPVariable(
      numbers.find((column) => /(^p$|p[_-]?value|pval|adj.*p|fdr|q[_-]?value)/i.test(column)) ?? "",
    );
  }, [numbers, pVariable]);

  useEffect(() => {
    let active = true;
    void import("@sipemu/anofox-statistics")
      .then(async (statistics) => {
        await statistics.default();
        if (!active) return;
        setNormalityEngine({
          shapiroWilk: statistics.shapiroWilk,
          dagostinoKSquared: statistics.dagostinoKSquared,
        });
        setNormalityLoadState("ready");
      })
      .catch(() => {
        if (active) setNormalityLoadState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const completeEntries = useMemo(
    () =>
      rows.flatMap((row, index) => {
        const value = Number(row[outcome]);
        if (!Number.isFinite(value)) return [];
        return [
          {
            index,
            value,
            group: group === "__none__" ? "All samples" : row[group] || "Missing",
            factor2: factor2 === "__none__" ? "" : row[factor2] || "Missing",
            subject: subject === "__none__" ? "" : row[subject] || "",
            sample: row.sample_id || row[labelVariable] || `Row ${index + 1}`,
          },
        ];
      }),
    [rows, outcome, group, factor2, subject, labelVariable],
  );

  const summaries = useMemo<GroupSummary[]>(() => {
    const grouped = new Map<string, number[]>();
    completeEntries.forEach((entry) =>
      grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), entry.value]),
    );
    return [...grouped.entries()].map(([key, values]) => {
      const sd = values.length > 1 ? Math.sqrt(sampleVariance(values)) : Number.NaN;
      const sem = values.length > 1 ? sd / Math.sqrt(values.length) : Number.NaN;
      const errorValue =
        errorType === "sd"
          ? sd
          : errorType === "ci95"
            ? studentTCritical95(values.length - 1) * sem
            : sem;
      return {
        group: key,
        n: values.length,
        mean: average(values),
        sd,
        sem,
        median: median(values),
        min: Math.min(...values),
        max: Math.max(...values),
        error: Number.isFinite(errorValue) ? errorValue : 0,
      };
    });
  }, [completeEntries, errorType]);

  const groupedSummaries = useMemo<GroupedSummary[]>(() => {
    const cells = new Map<string, number[]>();
    completeEntries.forEach((entry) => {
      if (!entry.factor2) return;
      const key = `${entry.group}\u0000${entry.factor2}`;
      cells.set(key, [...(cells.get(key) ?? []), entry.value]);
    });
    return [...cells.entries()].map(([key, values]) => {
      const [groupName, factorName] = key.split("\u0000");
      const sd = values.length > 1 ? Math.sqrt(sampleVariance(values)) : Number.NaN;
      const sem = values.length > 1 ? sd / Math.sqrt(values.length) : Number.NaN;
      const errorValue =
        errorType === "sd"
          ? sd
          : errorType === "ci95"
            ? studentTCritical95(values.length - 1) * sem
            : sem;
      return {
        group: groupName,
        factor2: factorName,
        n: values.length,
        mean: average(values),
        sd,
        sem,
        median: median(values),
        min: Math.min(...values),
        max: Math.max(...values),
        error: Number.isFinite(errorValue) ? errorValue : 0,
      };
    });
  }, [completeEntries, errorType]);

  const groupedLevels = useMemo(
    () => [...new Set(completeEntries.map((entry) => entry.group))],
    [completeEntries],
  );

  const factor2Levels = useMemo(
    () => [...new Set(completeEntries.map((entry) => entry.factor2).filter(Boolean))],
    [completeEntries],
  );

  const groupedChartData = useMemo(
    () =>
      groupedLevels.map((groupName) => {
        const result: Record<string, string | number | null> = {
          group: groupName,
        };
        factor2Levels.forEach((factorName, index) => {
          const summary = groupedSummaries.find(
            (item) => item.group === groupName && item.factor2 === factorName,
          );
          result[`mean_${index}`] = summary?.mean ?? null;
          result[`error_${index}`] = summary?.error ?? null;
        });
        return result;
      }),
    [groupedLevels, factor2Levels, groupedSummaries],
  );

  const relationshipPoints = useMemo(
    () =>
      rows.flatMap((row, index) => {
        const x = Number(row[xVariable]);
        const y = Number(row[outcome]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
        return [
          {
            index,
            x,
            y,
            group: group === "__none__" ? "All samples" : row[group] || "Missing",
            sample: row.sample_id || row[labelVariable] || `Row ${index + 1}`,
          },
        ];
      }),
    [rows, xVariable, outcome, group, labelVariable],
  );

  const regression = useMemo(
    () => linearRegression(relationshipPoints.map((point) => [point.x, point.y])),
    [relationshipPoints],
  );

  const residuals = useMemo(() => {
    if (plotType === "xy" && regression) return regression.residuals;
    if (plotType === "columns" || plotType === "grouped" || plotType === "paired") {
      if (subject !== "__none__" && factor2 === "__none__") {
        const bySubject = new Map<string, Map<string, number[]>>();
        completeEntries.forEach((entry) => {
          if (!entry.subject) return;
          const byGroup = bySubject.get(entry.subject) ?? new Map<string, number[]>();
          byGroup.set(entry.group, [...(byGroup.get(entry.group) ?? []), entry.value]);
          bySubject.set(entry.subject, byGroup);
        });
        const repeatedAcrossGroups = [...bySubject.values()].some(
          (byGroup) => byGroup.size > 1,
        );
        if (repeatedAcrossGroups && summaries.length === 2) {
          const [firstGroup, secondGroup] = summaries.map((summary) => summary.group);
          return [...bySubject.values()].flatMap((byGroup) => {
            const first = byGroup.get(firstGroup);
            const second = byGroup.get(secondGroup);
            return first?.length && second?.length
              ? [average(first) - average(second)]
              : [];
          });
        }
        if (repeatedAcrossGroups && summaries.length > 2) {
          const usable = completeEntries.filter((entry) => entry.subject);
          const grandMean = usable.length
            ? average(usable.map((entry) => entry.value))
            : 0;
          const subjectValues = new Map<string, number[]>();
          usable.forEach((entry) =>
            subjectValues.set(entry.subject, [
              ...(subjectValues.get(entry.subject) ?? []),
              entry.value,
            ]),
          );
          const groupMeans = new Map(
            summaries.map((summary) => [summary.group, summary.mean]),
          );
          return usable.map(
            (entry) =>
              entry.value -
              average(subjectValues.get(entry.subject) ?? [entry.value]) -
              (groupMeans.get(entry.group) ?? grandMean) +
              grandMean,
          );
        }
      }
      const means = new Map(
        (plotType === "grouped" ? groupedSummaries : summaries).map((summary) => [
          "factor2" in summary ? `${summary.group}\u0000${summary.factor2}` : summary.group,
          summary.mean,
        ]),
      );
      return completeEntries.map(
        (entry) =>
          entry.value -
          (means.get(
            plotType === "grouped" ? `${entry.group}\u0000${entry.factor2}` : entry.group,
          ) ?? 0),
      );
    }
    const values = completeEntries.map((entry) => entry.value);
    const center = values.length ? average(values) : 0;
    return values.map((value) => value - center);
  }, [plotType, regression, summaries, groupedSummaries, completeEntries, subject, factor2]);

  const diagnostics = useMemo(
    () => normalityTests(residuals, normalityEngine),
    [residuals, normalityEngine],
  );

  const normalityDiagnosis = useMemo(() => {
    if (normalityLoadState === "loading") {
      return {
        title: "Loading normality tests",
        detail: "The diagnostic engine will be ready in a moment.",
        className: "border-border bg-muted/60 text-foreground",
      };
    }
    if (normalityLoadState === "error") {
      return {
        title: "Normality diagnosis unavailable",
        detail: "The tests could not be loaded. Try refreshing the page.",
        className: "border-red-200 bg-red-50 text-red-900",
      };
    }
    if (!diagnostics.length) {
      return {
        title: "Not enough information",
        detail:
          residuals.length < 3
            ? "At least three residuals are required for Shapiro–Wilk."
            : "Normality cannot be assessed when the residuals have no variation.",
        className: "border-border bg-muted/60 text-foreground",
      };
    }

    const rejected = diagnostics.filter((test) => test.p < 0.05).length;
    if (rejected === 0) {
      return {
        title: "Compatible with a normal distribution",
        detail:
          "No available test was significant at α = 0.05. The residuals show no clear evidence against normality, although this does not prove perfect normality.",
        className: "border-emerald-200 bg-emerald-50 text-emerald-950",
      };
    }
    if (rejected === diagnostics.length) {
      return {
        title: "Not normally distributed",
        detail:
          "The available normality test(s) were significant at α = 0.05, indicating that the residuals depart from a normal distribution.",
        className: "border-red-200 bg-red-50 text-red-950",
      };
    }
    return {
      title: "Mixed result — do not assume normality",
      detail:
        "The tests disagree at α = 0.05. Inspect the data and consider a robust or non-parametric sensitivity analysis.",
      className: "border-amber-200 bg-amber-50 text-amber-950",
    };
  }, [diagnostics, normalityLoadState, residuals.length]);

  const outlierEntries = useMemo(() => {
    if (plotType === "xy" && regression) {
      return relationshipPoints.map((point, index) => ({
        index: point.index,
        value: regression.residuals[index],
        group: "Regression residuals",
      }));
    }
    return completeEntries.map((entry) => ({
      index: entry.index,
      value: entry.value,
      group: plotType === "grouped" ? `${entry.group} / ${entry.factor2}` : entry.group,
    }));
  }, [plotType, regression, relationshipPoints, completeEntries]);
  const outliers = useMemo(
    () => detectOutliers(outlierEntries, outlierMethod),
    [outlierEntries, outlierMethod],
  );

  const hasRepeatedSubjects = useMemo(() => {
    if (subject === "__none__") return false;
    const counts = new Map<string, Set<string>>();
    completeEntries.forEach((entry) => {
      if (!entry.subject) return;
      const groups = counts.get(entry.subject) ?? new Set<string>();
      groups.add(entry.group);
      counts.set(entry.subject, groups);
    });
    return [...counts.values()].some((groups) => groups.size > 1);
  }, [subject, completeEntries]);

  const suggestion = useMemo(() => {
    const nonNormal = diagnostics.some((test) => test.p < 0.05);
    const caution =
      nonNormal || outliers.size > 0
        ? " Diagnostics indicate non-normality or potential outliers; inspect the data and consider a robust or non-parametric sensitivity analysis."
        : diagnostics.length
          ? " Residual diagnostics do not show a clear normality problem."
          : " Normality could not be assessed from these data; choose the final method using the study design, prior knowledge, and graphical checks.";
    if (plotType === "sets") {
      return {
        test: "auto" as TestChoice,
        title: "Descriptive set intersections",
        reason:
          "Venn and UpSet views summarize exact membership combinations; they do not perform a hypothesis test.",
      };
    }
    if (plotType === "pca") {
      return {
        test: "auto" as TestChoice,
        title: "Exploratory PCA",
        reason:
          "Variables are standardized before PCA. Inspect explained variance, scores, and loadings; PCA does not test group differences.",
      };
    }
    if (plotType === "dose") {
      return {
        test: "auto" as TestChoice,
        title: "Four-parameter logistic fit",
        reason:
          "The exploratory 4PL fit estimates bottom, top, midpoint, Hill slope, and R². Confirm final parameter confidence intervals in validated curve-fitting software.",
      };
    }
    if (plotType === "xy") {
      return nonNormal
        ? {
            test: "spearman" as TestChoice,
            title: "Spearman correlation",
            reason: `Two continuous variables with distributional concerns.${caution}`,
          }
        : {
            test: "pearson" as TestChoice,
            title: "Pearson correlation",
            reason: `Pearson correlation is appropriate if the scatter is approximately linear and residual variance is reasonably stable.${caution}`,
          };
    }
    if (plotType === "heatmap") {
      return {
        test: "pearson" as TestChoice,
        title: "Correlation matrix",
        reason: "The heatmap reports pairwise Pearson correlations using complete pairs.",
      };
    }
    if (plotType === "volcano") {
      return {
        test: "auto" as TestChoice,
        title: "Precomputed differential results",
        reason:
          "A volcano plot expects an effect-size column and a p-value column from an upstream statistical model.",
      };
    }
    if (plotType === "grouped" && factor2 === "__none__") {
      return {
        test: "auto" as TestChoice,
        title: "Select a second factor",
        reason:
          "A grouped plot needs an X-axis grouping variable and a second categorical variable for the side-by-side datasets.",
      };
    }
    if (factor2 !== "__none__" && hasRepeatedSubjects) {
      return {
        test: "auto" as TestChoice,
        title: "Repeated two-factor model not available",
        reason:
          "Subject IDs repeat across factor combinations. A standard two-way ANOVA would treat these observations as independent. Fit a repeated-measures or mixed-effects factorial model in R, SAS, SPSS, Prism, or equivalent software.",
      };
    }
    if (factor2 !== "__none__") {
      return {
        test: "twoway" as TestChoice,
        title: "Two-way ANOVA",
        reason: `Two categorical factors are selected, including their interaction.${caution} For a non-parametric two-factor analysis, confirm an aligned-rank or permutation model in specialist software.`,
      };
    }
    if (summaries.length === 2 && hasRepeatedSubjects) {
      return nonNormal
        ? {
            test: "wilcoxon" as TestChoice,
            title: "Wilcoxon signed-rank test",
            reason: `Two paired groups with distributional concerns.${caution}`,
          }
        : {
            test: "paired" as TestChoice,
            title: "Paired t-test",
            reason: `The same subject IDs occur in both groups.${caution}`,
          };
    }
    if (summaries.length > 2 && hasRepeatedSubjects) {
      return nonNormal
        ? {
            test: "friedman" as TestChoice,
            title: "Friedman test",
            reason: `More than two repeated conditions with distributional concerns.${caution}`,
          }
        : {
            test: "mixed" as TestChoice,
            title: "Random-intercept mixed model",
            reason: `Repeated observations are identified within subjects.${caution}`,
          };
    }
    if (summaries.length === 2) {
      return nonNormal
        ? {
            test: "mannwhitney" as TestChoice,
            title: "Mann–Whitney U test",
            reason: `Two independent groups with distributional concerns.${caution}`,
          }
        : {
            test: "welch" as TestChoice,
            title: "Welch's t-test",
            reason: `Two independent groups are selected; Welch's version does not require equal variances.${caution}`,
          };
    }
    return nonNormal
      ? {
          test: "kruskal" as TestChoice,
          title: "Kruskal–Wallis test",
          reason: `More than two independent groups with distributional concerns.${caution}`,
        }
      : {
          test: "welch-anova" as TestChoice,
          title: "Welch's one-way ANOVA",
          reason: `More than two independent groups are selected. Welch's version does not require equal group variances.${caution}`,
        };
  }, [diagnostics, outliers, plotType, summaries.length, hasRepeatedSubjects, factor2]);

  const selectedTest = testChoice === "auto" ? suggestion.test : testChoice;

  const analysis = useMemo(() => {
    let result: TestResult | null = null;
    let effects: AnovaEffect[] = [];
    let postHoc: PairwiseComparison[] = [];
    const grouped = new Map<string, number[]>();
    completeEntries.forEach((entry) =>
      grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), entry.value]),
    );
    const groups = [...grouped.entries()];
    const pairedBySubject = new Map<string, Map<string, number[]>>();
    if (subject !== "__none__") {
      completeEntries.forEach((entry) => {
        if (!entry.subject) return;
        const byGroup = pairedBySubject.get(entry.subject) ?? new Map<string, number[]>();
        byGroup.set(entry.group, [...(byGroup.get(entry.group) ?? []), entry.value]);
        pairedBySubject.set(entry.subject, byGroup);
      });
    }
    const pairs =
      groups.length === 2
        ? [...pairedBySubject.values()].flatMap((byGroup) => {
            const first = byGroup.get(groups[0][0]);
            const second = byGroup.get(groups[1][0]);
            return first?.length && second?.length
              ? [[average(first), average(second)] as [number, number]]
              : [];
          })
        : [];
    const repeatedBlocks = [...pairedBySubject.values()].flatMap((byGroup) => {
      const block = groups.map(([name]) => byGroup.get(name));
      return block.every((values) => values?.length)
        ? [block.map((values) => average(values ?? []))]
        : [];
    });

    const pairedPostHoc = (method: "paired" | "wilcoxon") => {
      const comparisons: Array<Omit<PairwiseComparison, "adjustedP">> = [];
      for (let first = 0; first < groups.length; first += 1) {
        for (let second = first + 1; second < groups.length; second += 1) {
          const firstName = groups[first][0];
          const secondName = groups[second][0];
          const comparisonPairs = [...pairedBySubject.values()].flatMap((byGroup) => {
            const firstValues = byGroup.get(firstName);
            const secondValues = byGroup.get(secondName);
            return firstValues?.length && secondValues?.length
              ? [[average(firstValues), average(secondValues)] as [number, number]]
              : [];
          });
          const comparisonResult =
            method === "wilcoxon"
              ? wilcoxonSignedRankTest(comparisonPairs)
              : pairedTTest(comparisonPairs);
          if (!comparisonResult) continue;
          const differences = comparisonPairs.map(
            ([firstValue, secondValue]) => firstValue - secondValue,
          );
          comparisons.push({
            first: firstName,
            second: secondName,
            method:
              method === "wilcoxon"
                ? "Pairwise Wilcoxon signed-rank test"
                : "Pairwise paired t-test",
            estimate: method === "wilcoxon" ? median(differences) : average(differences),
            estimateLabel:
              method === "wilcoxon" ? "Median paired difference" : "Mean paired difference",
            statisticLabel: comparisonResult.statisticLabel,
            statistic: comparisonResult.statistic,
            p: comparisonResult.p,
            n: String(comparisonPairs.length),
          });
        }
      }
      return applyHolmToComparisons(comparisons);
    };

    if (selectedTest === "welch" && groups.length === 2) {
      result = welchTTest(groups[0][1], groups[1][1]);
    } else if (selectedTest === "mannwhitney" && groups.length === 2) {
      result = mannWhitneyUTest(groups[0][1], groups[1][1]);
    } else if (selectedTest === "paired" && groups.length === 2 && subject !== "__none__") {
      result = pairedTTest(pairs);
    } else if (selectedTest === "wilcoxon" && groups.length === 2 && subject !== "__none__") {
      result = wilcoxonSignedRankTest(pairs);
    } else if (selectedTest === "oneway") {
      result = oneWayAnova(groups.map(([, values]) => values));
      if (postHocEnabled && groups.length > 2) {
        postHoc = pairwiseWelchPostHoc(groups.map(([name, values]) => ({ name, values })));
      }
    } else if (selectedTest === "welch-anova") {
      result = welchOneWayAnova(groups.map(([, values]) => values));
      if (postHocEnabled && groups.length > 2) {
        postHoc = pairwiseWelchPostHoc(groups.map(([name, values]) => ({ name, values })));
      }
    } else if (selectedTest === "kruskal") {
      result = kruskalWallisTest(groups.map(([, values]) => values));
      if (postHocEnabled && groups.length > 2) {
        postHoc = dunnPostHoc(groups.map(([name, values]) => ({ name, values })));
      }
    } else if (selectedTest === "friedman" && subject !== "__none__") {
      result = friedmanTest(repeatedBlocks);
      if (postHocEnabled && groups.length > 2) postHoc = pairedPostHoc("wilcoxon");
    } else if (selectedTest === "twoway" && factor2 !== "__none__") {
      const usable = completeEntries.filter((entry) => entry.factor2);
      effects = factorialAnova(
        usable.map((entry) => entry.value),
        usable.map((entry) => entry.group),
        usable.map((entry) => entry.factor2),
      ).map((effect) => ({
        ...effect,
        effect:
          effect.effect === "Factor A"
            ? group
            : effect.effect === "Factor B"
              ? factor2
              : `${group} × ${factor2}`,
      }));
      postHoc = postHocEnabled
        ? [
            ...factor2Levels.flatMap((factorName) => {
              const withinLevel = completeEntries.filter((entry) => entry.factor2 === factorName);
              return pairwiseWelchPostHoc(
                groupedLevels.map((groupName) => ({
                  name: groupName,
                  values: withinLevel
                    .filter((entry) => entry.group === groupName)
                    .map((entry) => entry.value),
                })),
                `${factor2}: ${factorName}`,
              );
            }),
            ...groupedLevels.flatMap((groupName) => {
              const withinLevel = completeEntries.filter((entry) => entry.group === groupName);
              return pairwiseWelchPostHoc(
                factor2Levels.map((factorName) => ({
                  name: factorName,
                  values: withinLevel
                    .filter((entry) => entry.factor2 === factorName)
                    .map((entry) => entry.value),
                })),
                `${group}: ${groupName}`,
              );
            }),
          ]
        : [];
    } else if (selectedTest === "pearson") {
      result = pearsonCorrelation(relationshipPoints.map((point) => [point.x, point.y]));
    } else if (selectedTest === "spearman") {
      result = spearmanCorrelation(relationshipPoints.map((point) => [point.x, point.y]));
    } else if (selectedTest === "mixed" && subject !== "__none__") {
      const repeatedEntries = completeEntries.filter((entry) => entry.subject);
      result = randomInterceptModel(
        repeatedEntries.map((entry) => entry.value),
        repeatedEntries.map((entry) => entry.group),
        repeatedEntries.map((entry) => entry.subject),
      );
      if (postHocEnabled && groups.length > 2) postHoc = pairedPostHoc("paired");
    }

    const allPostHoc = postHoc;
    const reference =
      postHocReference || allPostHoc.find((comparison) => comparison.first)?.first || "";
    const selectedKeys = new Set(selectedPostHocComparisons);
    const requestedPostHoc = allPostHoc.filter((comparison) => {
      if (postHocScope === "all") return true;
      if (postHocScope === "reference") {
        return comparison.first === reference || comparison.second === reference;
      }
      return selectedKeys.has(comparisonKey(comparison));
    });
    postHoc = adjustPairwiseComparisons(requestedPostHoc, postHocAdjustment);

    return { result, effects, postHoc, allPostHoc };
  }, [
    selectedTest,
    completeEntries,
    relationshipPoints,
    subject,
    factor2,
    group,
    factor2Levels,
    groupedLevels,
    postHocEnabled,
    postHocAdjustment,
    postHocScope,
    postHocReference,
    selectedPostHocComparisons,
  ]);

  const postHocReferenceOptions = useMemo(
    () => [
      ...new Set(
        analysis.allPostHoc.flatMap((comparison) => [comparison.first, comparison.second]),
      ),
    ],
    [analysis.allPostHoc],
  );
  const activePostHocReference = postHocReference || postHocReferenceOptions[0] || "";
  useEffect(() => {
    if (postHocReference && !postHocReferenceOptions.includes(postHocReference)) {
      setPostHocReference("");
    }
  }, [postHocReference, postHocReferenceOptions]);
  const postHocAdjustmentLabel =
    postHocAdjustment === "holm"
      ? "Holm"
      : postHocAdjustment === "bonferroni"
        ? "Bonferroni"
        : postHocAdjustment === "sidak"
          ? "Šidák"
          : postHocAdjustment === "bh-fdr"
            ? "Benjamini–Hochberg FDR"
            : "No multiplicity";

  const groupPoints = useMemo(
    () =>
      completeEntries.map((entry, index) => ({
        group: entry.group,
        value: entry.value,
        sample: entry.sample,
        index: entry.index,
        jitter: (((index * 37) % 19) - 9) * 1.2,
        flagged: outliers.has(entry.index),
      })),
    [completeEntries, outliers],
  );

  const groupedPointsByFactor = useMemo(
    () =>
      factor2Levels.map((factorName, seriesIndex) => ({
        factorName,
        seriesIndex,
        points: completeEntries
          .filter((entry) => entry.factor2 === factorName)
          .map((entry, index) => ({
            group: entry.group,
            factor2: entry.factor2,
            value: entry.value,
            sample: entry.sample,
            index: entry.index,
            jitter: (((index * 37 + seriesIndex * 11) % 17) - 8) * 0.75,
            flagged: outliers.has(entry.index),
          })),
      })),
    [completeEntries, factor2Levels, outliers],
  );

  const relationshipGroups = useMemo(() => {
    const grouped = new Map<string, typeof relationshipPoints>();
    relationshipPoints.forEach((point) =>
      grouped.set(point.group, [...(grouped.get(point.group) ?? []), point]),
    );
    return [...grouped.entries()];
  }, [relationshipPoints]);

  const activeHeatmapColumns = useMemo(
    () => heatmapColumns.filter((column) => numbers.includes(column)).slice(0, 12),
    [heatmapColumns, numbers],
  );

  const heatmap = useMemo(
    () =>
      activeHeatmapColumns.map((rowColumn) =>
        activeHeatmapColumns.map((column) => {
          const points = rows.flatMap((row) => {
            const x = Number(row[rowColumn]);
            const y = Number(row[column]);
            return Number.isFinite(x) && Number.isFinite(y) ? [[x, y] as [number, number]] : [];
          });
          return pearsonCorrelation(points)?.statistic ?? Number.NaN;
        }),
      ),
    [activeHeatmapColumns, rows],
  );

  const heatmapClustering = useMemo(
    () =>
      heatmapLinkage === "none"
        ? { order: heatmap.map((_, index) => index), root: null }
        : hierarchicalHeatmapClustering(heatmap, heatmapLinkage, heatmapDistance),
    [heatmap, heatmapLinkage, heatmapDistance],
  );
  const heatmapRowOrder = heatmapClustering.order;
  const heatmapCellSize = Math.max(
    24,
    Math.min(
      64,
      Math.floor((plotWidth - 250) / Math.max(1, heatmap.length)),
      Math.floor((plotHeight - 150) / Math.max(1, heatmap.length)),
    ),
  );
  const heatmapDendrogramWidth = heatmapLinkage === "none" ? 0 : 96;
  const heatmapMatrixTop = 12;
  const heatmapMatrixSize = heatmapCellSize * heatmap.length;
  const heatmapRowLabelWidth = 190;
  const heatmapColumnLabelHeight = 170;
  const heatmapSvgWidth = heatmapDendrogramWidth + heatmapMatrixSize + heatmapRowLabelWidth;
  const heatmapSvgHeight = heatmapMatrixTop + heatmapMatrixSize + heatmapColumnLabelHeight;
  const heatmapDendrogramSegments = useMemo(
    () =>
      buildHeatmapDendrogram(
        heatmapClustering.root,
        heatmapRowOrder,
        heatmapDendrogramWidth,
        heatmapCellSize,
        heatmapMatrixTop,
      ),
    [
      heatmapClustering.root,
      heatmapRowOrder,
      heatmapDendrogramWidth,
      heatmapCellSize,
    ],
  );

  const volcanoPoints = useMemo(() => {
    const preliminary = rows.flatMap((row, index) => {
      const effect = Number(row[effectVariable]);
      const p = Number(row[pVariable]);
      if (!Number.isFinite(effect) || !Number.isFinite(p) || p < 0 || p > 1) return [];
      return [
        {
          x: effect,
          p,
          label: row[labelVariable] || row.sample_id || `Row ${index + 1}`,
        },
      ];
    });
    const calculatedFdr = benjaminiHochbergAdjustedPValues(preliminary.map((point) => point.p));
    return preliminary.map((point, index) => {
      const fdr = volcanoThresholdMetric === "precomputed-fdr" ? point.p : calculatedFdr[index];
      const thresholdValue = volcanoThresholdMetric === "p" ? point.p : fdr;
      const passesEffect = !useFoldThreshold || Math.abs(point.x) >= foldThreshold;
      const passesSignificance = !useSignificanceThreshold || thresholdValue <= pThreshold;
      const classified = passesEffect && passesSignificance && point.x !== 0;
      return {
        ...point,
        fdr,
        thresholdValue,
        y: -Math.log10(Math.max(thresholdValue, 1e-300)),
        direction: classified ? (point.x > 0 ? "Up" : "Down") : "NS",
      };
    });
  }, [
    rows,
    effectVariable,
    pVariable,
    labelVariable,
    volcanoThresholdMetric,
    useFoldThreshold,
    foldThreshold,
    useSignificanceThreshold,
    pThreshold,
  ]);

  const requestedVolcanoLabels = useMemo(
    () =>
      new Set(
        volcanoLabelList
          .split(/[\n,;]+/)
          .map((label) => label.trim().toLocaleLowerCase())
          .filter(Boolean),
      ),
    [volcanoLabelList],
  );

  const matchedVolcanoLabelCount = useMemo(
    () =>
      new Set(
        volcanoPoints
          .map((point) => point.label.trim().toLocaleLowerCase())
          .filter((label) => requestedVolcanoLabels.has(label)),
      ).size,
    [requestedVolcanoLabels, volcanoPoints],
  );

  const volcanoGroups = useMemo(
    () =>
      ["Up", "Down", "NS"].map((direction) => ({
        direction,
        points: volcanoPoints.filter((point) => point.direction === direction),
      })),
    [volcanoPoints],
  );

  const volcanoXDomain = useMemo<[number, number]>(() => {
    if (!volcanoPoints.length) return [-1, 1];
    return [...chartExtent(volcanoPoints.map((point) => point.x), 0.1)];
  }, [volcanoPoints]);

  const volcanoYDomain = useMemo<[number, number]>(() => {
    if (!volcanoPoints.length) return [0, 1];
    const maximum = Math.max(...volcanoPoints.map((point) => point.y), 0);
    return [0, maximum > 0 ? maximum * 1.14 : 1];
  }, [volcanoPoints]);

  const distributionGroups = useMemo(() => {
    const grouped = new Map<string, number[]>();
    completeEntries.forEach((entry) =>
      grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), entry.value]),
    );
    return [...grouped.entries()].map(([name, values]) => ({ name, values }));
  }, [completeEntries]);

  const pairedSubjects = useMemo(() => {
    if (subject === "__none__") return [];
    const bySubject = new Map<string, Map<string, number[]>>();
    completeEntries.forEach((entry) => {
      if (!entry.subject) return;
      const byGroup = bySubject.get(entry.subject) ?? new Map<string, number[]>();
      byGroup.set(entry.group, [...(byGroup.get(entry.group) ?? []), entry.value]);
      bySubject.set(entry.subject, byGroup);
    });
    return [...bySubject.entries()].map(([subjectName, byGroup]) => ({
      subject: subjectName,
      values: Object.fromEntries(
        [...byGroup.entries()].map(([groupName, values]) => [groupName, average(values)]),
      ),
    }));
  }, [completeEntries, subject]);

  const doseSeries = useMemo(() => {
    const grouped = new Map<string, Array<{ x: number; y: number }>>();
    rows.forEach((row) => {
      const rawX = Number(row[xVariable]);
      const y = Number(row[outcome]);
      if (!Number.isFinite(rawX) || !Number.isFinite(y) || (doseLogX && rawX <= 0)) return;
      const x = doseLogX ? Math.log10(rawX) : rawX;
      const name = group === "__none__" ? "All samples" : row[group] || "Missing";
      grouped.set(name, [...(grouped.get(name) ?? []), { x, y }]);
    });
    return [...grouped.entries()].map(([name, points]) => ({
      name,
      points,
      fit: fitFourParameterLogistic(points),
    }));
  }, [doseLogX, group, outcome, rows, xVariable]);

  const pcaResult = useMemo(
    () => calculatePca(rows, pcaColumns.filter((column) => numbers.includes(column)), labelVariable, group),
    [group, labelVariable, numbers, pcaColumns, rows],
  );

  const pcaGroups = useMemo(
    () => [...new Set(pcaResult?.points.map((point) => point.group) ?? [])],
    [pcaResult],
  );

  const colourSeries =
    plotType === "columns" || plotType === "distribution" || plotType === "paired"
      ? summaries.map((summary) => summary.group)
      : plotType === "grouped"
        ? factor2Levels
        : plotType === "xy"
          ? relationshipGroups.map(([name]) => name)
          : plotType === "dose"
            ? doseSeries.map((entry) => entry.name)
            : plotType === "pca"
              ? pcaGroups
              : [];
  const colourContext =
    plotType === "grouped" ? `grouped:${group}:${factor2}` : `${plotType}:${group}`;
  const seriesColourKey = (name: string) => `${colourContext}\u0000${name}`;
  const seriesColor = (index: number, name = colourSeries[index] ?? "") =>
    seriesColorOverrides[seriesColourKey(name)] ??
    (index === 0 ? primaryColor : fallbackPalette[(index + 1) % fallbackPalette.length]);
  const setSeriesColor = (name: string, color: string) =>
    setSeriesColorOverrides((current) => ({
      ...current,
      [seriesColourKey(name)]: color,
    }));
  const resetSeriesColors = () =>
    setSeriesColorOverrides((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key]) => !key.startsWith(`${colourContext}\u0000`)),
      ),
    );

  const pointColor = (index: number, name?: string) =>
    pointColorMode === "series" ? seriesColor(index, name) : secondaryColor;

  const canUseLogY =
    completeEntries.length > 0 && completeEntries.every((entry) => entry.value > 0);
  const displayTitle =
    plotTitle ||
    (plotType === "columns"
      ? `${outcome} by ${group === "__none__" ? "sample" : group}`
      : plotType === "grouped"
        ? `${outcome} by ${group} and ${factor2 === "__none__" ? "second factor" : factor2}`
        : plotType === "distribution"
          ? `${outcome} distributions by ${group === "__none__" ? "sample" : group}`
          : plotType === "paired"
            ? `${outcome} paired trajectories by ${group}`
        : plotType === "xy"
          ? `${outcome} versus ${xVariable}`
          : plotType === "dose"
            ? `${outcome} dose–response by ${group === "__none__" ? "series" : group}`
            : plotType === "pca"
              ? "Principal component analysis"
              : plotType === "sets"
                ? "Set intersections"
          : plotType === "heatmap"
            ? "Correlation heatmap"
            : "Volcano plot");
  const displayXLabel =
    xLabel ||
    (plotType === "xy"
      ? xVariable
      : plotType === "dose"
        ? doseLogX
          ? `log₁₀(${xVariable})`
          : xVariable
        : plotType === "volcano"
          ? effectVariable
          : plotType === "pca"
            ? "PC1"
            : plotType === "sets"
              ? "Intersections"
              : group);
  const volcanoMetricLabel = volcanoThresholdMetric === "p" ? "p" : "FDR";
  const displayYLabel =
    yLabel ||
    (plotType === "volcano"
      ? `−log10(${volcanoMetricLabel})`
      : plotType === "pca"
        ? "PC2"
        : plotType === "sets"
          ? "Intersection size"
          : outcome);
  const descriptiveSummaries: Array<GroupSummary & { factor2?: string }> =
    plotType === "grouped" ? groupedSummaries : summaries;
  const axisLineStyle = { stroke: "#111827", strokeWidth: axisLineWidth };
  const tickLineStyle = {
    stroke: "#111827",
    strokeWidth: Math.max(0.75, axisLineWidth),
  };
  const tickStyle = { fontSize: tickFontSize, fill: "#374151" };
  const axisLabelStyle = {
    fontSize: axisTitleFontSize,
    fill: "#111827",
    textAnchor: "middle" as const,
  };

  function updateDataset(nextRows: DataRow[], nextName: string, syncEditor = true) {
    const nextNumbers = numericColumns(nextRows);
    const nextCategories = categoricalColumns(nextRows);
    const nextColumns = Object.keys(nextRows[0] ?? {});
    if (!nextRows.length || !nextNumbers.length) {
      setError("The file needs a header row and at least one numeric column.");
      return;
    }
    const likelyOutcome =
      nextNumbers.find((column) => !/dose|time|id/i.test(column)) ?? nextNumbers[0];
    const likelyP =
      nextNumbers.find((column) =>
        /(^p$|p[_-]?value|pval|adj.*p|fdr|q[_-]?value)/i.test(column),
      ) ?? "";
    const likelyEffect =
      nextNumbers.find((column) => /log2|effect|fold/i.test(column)) ?? nextNumbers[0];
    const likelyLabel =
      nextColumns.find((column) => /gene|protein|metabolite|feature|molecule/i.test(column)) ??
      nextColumns.find((column) => /sample|name|id/i.test(column)) ??
      nextColumns[0];
    const likelySubject = likelySubjectColumn(nextColumns);
    const likelyGroup =
      nextCategories.find((column) =>
        /condition|treatment|time|visit|period|stage|group|phase/i.test(column),
      ) ??
      nextCategories.find((column) => column !== likelySubject) ??
      nextCategories[0] ??
      "__none__";
    const likelySetItem = likelySetItemColumn(nextColumns);
    const likelySetMembership =
      likelySetMembershipColumn(nextColumns, likelySetItem) ||
      (likelyGroup === likelySetItem ? "" : likelyGroup);
    setRows(nextRows);
    setFileName(nextName);
    if (syncEditor) setDataText(rowsToTabDelimited(nextRows));
    setOutcome(likelyOutcome);
    setXVariable(nextNumbers.find((column) => column !== likelyOutcome) ?? likelyOutcome);
    setGroup(likelyGroup);
    setFactor2("__none__");
    setSubject(likelySubject || "__none__");
    setEffectVariable(likelyEffect);
    setPVariable(likelyP);
    setLabelVariable(likelyLabel);
    setHeatmapColumns(nextNumbers.slice(0, 8));
    setPcaColumns(nextNumbers.slice(0, 8));
    setSetItemVariable(likelySetItem);
    setSetMembershipVariable(likelySetMembership === "__none__" ? "" : likelySetMembership);
    setPlotTitle("");
    setXLabel("");
    setYLabel("");
    setVolcanoLabelList("");
    setError("");
  }

  function handleDataText(nextText: string) {
    setDataText(nextText);
    const parsed = parseDelimitedText(nextText);
    const nextNumbers = numericColumns(parsed);
    if (!parsed.length || !nextNumbers.length) {
      setError("Paste a header row and at least one complete data row.");
      return;
    }
    const nextCategories = categoricalColumns(parsed);
    const nextColumns = Object.keys(parsed[0]);
    const headersChanged = nextColumns.join("\u0000") !== allColumns.join("\u0000");
    const firstLivePaste = fileName !== "Live pasted data";
    const likelyOutcome =
      nextNumbers.find((column) => !/dose|time|id/i.test(column)) ?? nextNumbers[0];
    const likelyP =
      nextNumbers.find((column) =>
        /(^p$|p[_-]?value|pval|adj.*p|fdr|q[_-]?value)/i.test(column),
      ) ?? "";
    const likelyEffect =
      nextNumbers.find((column) => /log2|log_?2|effect|fold|estimate/i.test(column)) ??
      nextNumbers[0];
    const likelyLabel =
      nextColumns.find((column) => /gene|protein|metabolite|feature|molecule/i.test(column)) ??
      nextColumns.find((column) => /sample|name|id/i.test(column)) ??
      nextColumns[0];
    const likelySubject = likelySubjectColumn(nextColumns);
    const likelyGroup =
      nextCategories.find((column) =>
        /condition|treatment|time|visit|period|stage|group|phase/i.test(column),
      ) ??
      nextCategories.find((column) => column !== likelySubject) ??
      nextCategories[0] ??
      "__none__";
    const likelySetItem = likelySetItemColumn(nextColumns);
    const likelySetMembership =
      likelySetMembershipColumn(nextColumns, likelySetItem) ||
      (likelyGroup === likelySetItem ? "" : likelyGroup);
    setRows(parsed);
    setFileName("Live pasted data");
    setOutcome((current) => (nextNumbers.includes(current) ? current : likelyOutcome));
    setXVariable((current) =>
      nextNumbers.includes(current)
        ? current
        : (nextNumbers.find((column) => column !== likelyOutcome) ?? likelyOutcome),
    );
    setGroup((current) => {
      if (
        nextCategories.includes(current) &&
        !(plotType === "paired" && current === likelySubject)
      ) return current;
      return likelyGroup;
    });
    setFactor2((current) =>
      current === "__none__" || nextCategories.includes(current) ? current : "__none__",
    );
    setSubject((current) =>
      current !== "__none__" && nextColumns.includes(current)
        ? current
        : (likelySubject || "__none__"),
    );
    setEffectVariable((current) =>
      firstLivePaste || headersChanged || !nextNumbers.includes(current) ? likelyEffect : current,
    );
    setPVariable((current) =>
      !firstLivePaste && !headersChanged && nextNumbers.includes(current)
        ? current
        : likelyP,
    );
    setLabelVariable((current) =>
      firstLivePaste || headersChanged || !nextColumns.includes(current) ? likelyLabel : current,
    );
    setHeatmapColumns((current) => {
      const retained = current.filter((column) => nextNumbers.includes(column));
      return retained.length >= 2 ? retained : nextNumbers.slice(0, 8);
    });
    setPcaColumns((current) => {
      const retained = current.filter((column) => nextNumbers.includes(column));
      return retained.length >= 2 ? retained : nextNumbers.slice(0, 8);
    });
    setSetItemVariable((current) =>
      firstLivePaste || headersChanged || !nextColumns.includes(current)
        ? likelySetItem
        : current,
    );
    setSetMembershipVariable((current) =>
      !firstLivePaste && !headersChanged && nextColumns.includes(current)
        ? current
        : likelySetMembership,
    );
    setError("");
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        updateDataset(parseDelimitedText(String(reader.result ?? "")), file.name);
      } catch {
        setError("This file could not be read. Please try a CSV or tab-delimited file.");
      }
    };
    reader.readAsText(file);
  }

  function loadDemo() {
    updateDataset(demoRows, demoDatasetName);
    setOutcome("body_mass_g");
    setXVariable("flipper_length_mm");
    setGroup("species");
    setLabelVariable("sample_id");
    setHeatmapColumns(["bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g"]);
    setPcaColumns(["bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g"]);
    setSetItemVariable("sample_id");
    setSetMembershipVariable("species");
    setHeatmapPalette("viridis");
    setHeatmapLinkage("average");
    setHeatmapDistance("correlation");
    setShowHeatmapValues(false);
    setPointColorMode("series");
    setSeriesColorOverrides(demoSeriesColorOverrides);
    if (fileInput.current) fileInput.current.value = "";
  }

  function choosePlot(nextPlot: PlotType) {
    setPlotType(nextPlot);
    if (nextPlot === "grouped" && factor2 === "__none__") {
      const suggestedSecondFactor =
        categories.find(
          (column) => column !== group && /sex|condition|time|genotype|batch/i.test(column),
        ) ?? categories.find((column) => column !== group);
      if (suggestedSecondFactor) setFactor2(suggestedSecondFactor);
    }
    if (nextPlot === "paired") {
      const suggestedSubject =
        likelySubjectColumn(allColumns) || categories.find((column) => column !== group);
      const suggestedCondition =
        categories.find((column) =>
          /condition|treatment|time|visit|period|stage|group|phase/i.test(column),
        ) ?? categories.find((column) => column !== suggestedSubject);
      if (suggestedSubject && (subject === "__none__" || !allColumns.includes(subject))) {
        setSubject(suggestedSubject);
      }
      if (
        suggestedCondition &&
        (group === "__none__" || group === suggestedSubject || !categories.includes(group))
      ) {
        setGroup(suggestedCondition);
      }
    }
    if (nextPlot === "dose") {
      const suggestedDose = numbers.find((column) => /dose|concentration|conc|time/i.test(column));
      if (suggestedDose) setXVariable(suggestedDose);
    }
    if (nextPlot === "sets") {
      const suggestedItem = likelySetItemColumn(allColumns);
      const suggestedMembership = likelySetMembershipColumn(allColumns, suggestedItem);
      if (!allColumns.includes(setItemVariable) || suggestedItem !== allColumns[0]) {
        setSetItemVariable(suggestedItem || labelVariable);
      }
      if (!allColumns.includes(setMembershipVariable) || suggestedMembership) {
        setSetMembershipVariable(
          suggestedMembership || categories.find((column) => column !== suggestedItem) || "",
        );
      }
    }
  }

  function downloadSummary() {
    const isGrouped = plotType === "grouped";
    const header = isGrouped
      ? "x_group,dataset,n,mean,sd,sem,median,min,max"
      : "group,n,mean,sd,sem,median,min,max";
    const content = descriptiveSummaries
      .map((summary) => {
        const values = [
          `"${summary.group.replaceAll('"', '""')}"`,
          ...(summary.factor2 ? [`"${summary.factor2.replaceAll('"', '""')}"`] : []),
          summary.n,
          summary.mean,
          summary.sd,
          summary.sem,
          summary.median,
          summary.min,
          summary.max,
        ];
        return values.join(",");
      })
      .join("\n");
    const url = URL.createObjectURL(new Blob([`${header}\n${content}`], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${outcome || "analysis"}-summary.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadFigureFile(contents: string | Uint8Array, mimeType: string, extension: string) {
    const blobPart = typeof contents === "string" ? contents : new Uint8Array(contents).buffer;
    const url = URL.createObjectURL(new Blob([blobPart], { type: mimeType }));
    const anchor = document.createElement("a");
    const baseName = (plotTitle || `${plotType}-${outcome}`)
      .trim()
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    anchor.href = url;
    anchor.download = `${baseName || "cariaco-lab-figure"}.${extension}`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportFigure(format: ExportFormat) {
    const root = figureRef.current;
    if (!root) return;
    setExporting(format);
    setExportMessage("Preparing figure…");
    const excluded = [...root.querySelectorAll<HTMLElement>("[data-export-exclude]")];
    const previousDisplay = excluded.map((element) => element.style.display);
    excluded.forEach((element) => {
      element.style.display = "none";
    });
    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      const bounds = root.getBoundingClientRect();
      const width = Math.max(1, Math.ceil(bounds.width));
      const height = Math.max(1, Math.ceil(bounds.height));
      const { EMFWriter, ImageWriter, SVGWriter, extractIR, renderIR } =
        await import("@node-projects/layout2vector");
      const nodes = await extractIR(root, {
        includeImages: true,
        includeText: true,
        includePseudoElements: true,
        svgToVector: true,
      });
      if (format === "png") {
        const image = await renderIR(
          nodes,
          new ImageWriter({
            width,
            height,
            scale: exportDpi / 96,
            backgroundColor: "#ffffff",
          }),
        );
        await image.finalize();
        downloadFigureFile(image.toBytes("image/png"), "image/png", "png");
        setExportMessage(
          `Downloaded ${Math.round(width * (exportDpi / 96))} × ${Math.round(height * (exportDpi / 96))} px PNG.`,
        );
      } else if (format === "svg") {
        const svg = await renderIR(nodes, new SVGWriter({ width, height }));
        downloadFigureFile(svg, "image/svg+xml;charset=utf-8", "svg");
        setExportMessage("Downloaded editable vector SVG.");
      } else {
        const emf = await renderIR(nodes, new EMFWriter({ width, height }));
        downloadFigureFile(emf, "image/emf", "emf");
        setExportMessage("Downloaded vector EMF for Word and PowerPoint.");
      }
    } catch (exportError) {
      console.error(exportError);
      setExportMessage(
        "The figure could not be exported. Try SVG, or use a Chromium-based browser for EMF.",
      );
    } finally {
      excluded.forEach((element, index) => {
        element.style.display = previousDisplay[index];
      });
      setExporting(null);
    }
  }

  const plotButtons: Array<{
    type: PlotType;
    label: string;
    icon: typeof BarChart3;
  }> = [
    { type: "columns", label: "Column", icon: BarChart3 },
    { type: "grouped", label: "Grouped", icon: BarChart3 },
    { type: "distribution", label: "Box / violin", icon: BarChart3 },
    { type: "paired", label: "Paired", icon: Activity },
    { type: "xy", label: "XY & correlation", icon: Activity },
    { type: "dose", label: "Dose–response", icon: Activity },
    { type: "pca", label: "PCA", icon: Sparkles },
    { type: "sets", label: "Venn / UpSet", icon: Grid3X3 },
    { type: "heatmap", label: "Heatmap", icon: Grid3X3 },
    { type: "volcano", label: "Volcano", icon: Sparkles },
  ];

  const pcaColourMap = new Map(
    pcaGroups.map((name, index) => [name, seriesColor(index, name)]),
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <img
              src="/cariaco-lab-logo.jpeg"
              alt="Cariaco Lab"
              width={920}
              height={194}
              className="h-10 w-auto max-w-[52vw] object-contain sm:h-12 sm:max-w-[250px]"
            />
            <div className="hidden h-10 w-px bg-black/10 sm:block" />
            <div className="shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Research tool
              </p>
              <h1 className="text-base font-semibold tracking-tight sm:text-xl">Data Explorer</h1>
            </div>
          </div>
          <p className="hidden max-w-md text-right text-xs leading-relaxed text-muted-foreground sm:block">
            Interactive visualization and exploratory statistics. Your data remain in this browser.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1540px] gap-5 px-5 py-6 xl:grid-cols-[310px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <Card className="border-0 bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Dataset</CardTitle>
              <CardDescription className="truncate" title={fileName}>
                {fileName}
              </CardDescription>
              {fileName === demoDatasetName ? (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Curated from the Palmer Penguins dataset (Gorman et al., 2014).
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInput}
                className="sr-only"
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                onChange={handleFile}
              />
              <Button
                className="w-full justify-start"
                size="lg"
                onClick={() => fileInput.current?.click()}
              >
                <Upload aria-hidden="true" /> Upload CSV
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={loadDemo}>
                <RefreshCcw aria-hidden="true" /> Load penguin example
              </Button>
              <Button
                className="w-full justify-start"
                variant={showDataEditor ? "secondary" : "outline"}
                onClick={() => setShowDataEditor((current) => !current)}
              >
                <ClipboardPaste aria-hidden="true" />
                {showDataEditor ? "Hide data editor" : "Paste or type data"}
              </Button>
              {showDataEditor ? (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-2.5">
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Paste directly from Excel or Google Sheets, including the header row. Plots and
                    results update with every edit.
                  </p>
                  <Textarea
                    aria-label="Live tabular data editor"
                    className="min-h-56 resize-y bg-white font-mono text-[11px] leading-5"
                    spellCheck={false}
                    value={dataText}
                    onChange={(event) => handleDataText(event.target.value)}
                  />
                </div>
              ) : null}
              <details className="group rounded-lg border border-primary/15 bg-primary/[0.025]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-foreground">
                  Dataset help
                  <span className="text-primary transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <div className="space-y-3 border-t border-primary/10 px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground">General table format</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>Place column names in the first row.</li>
                      <li>For most plots, use one observation or sample per row.</li>
                      <li>Use plain numbers in numeric columns; leave missing values blank.</li>
                      <li>
                        Upload or paste tab-, comma-, or semicolon-separated data. Simple
                        space-separated data are also accepted when names contain no spaces.
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Special layouts</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      <li>
                        <strong>Grouped:</strong> include separate columns for the X-axis group and
                        second factor.
                      </li>
                      <li>
                        <strong>Paired:</strong> repeat the same subject ID for every condition.
                      </li>
                      <li>
                        <strong>Volcano:</strong> include feature label, effect size, and p-value or
                        FDR columns.
                      </li>
                      <li>
                        <strong>Venn/UpSet:</strong> use an item-ID column and a set-name column,
                        with one item–set membership per row. Repeat the item ID for membership in
                        several sets.
                      </li>
                    </ul>
                  </div>
                  <div className="rounded bg-white px-2 py-2">
                    <p className="font-semibold text-foreground">Reading an UpSet plot</p>
                    <p className="mt-1">
                      Purple bars show items in each exact intersection. Filled dots show which
                      sets form that intersection, and connected dots indicate membership across
                      multiple sets. Green horizontal bars show the total number of items in each
                      set.
                    </p>
                  </div>
                </div>
              </details>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
                <div className="rounded-lg bg-muted/70 px-3 py-2">
                  <strong className="block text-base text-foreground">{rows.length}</strong>
                  rows
                </div>
                <div className="rounded-lg bg-muted/70 px-3 py-2">
                  <strong className="block text-base text-foreground">{numbers.length}</strong>
                  numeric fields
                </div>
              </div>
              {error ? (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive"
                >
                  {error}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-0 bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
              <CardDescription>Select a plot and map your columns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {plotButtons.map(({ type, label, icon: Icon }) => (
                  <Button
                    key={type}
                    variant={plotType === type ? "default" : "outline"}
                    className="h-auto min-h-14 flex-col whitespace-normal px-2 py-2 text-center text-xs"
                    onClick={() => choosePlot(type)}
                  >
                    <Icon aria-hidden="true" /> {label}
                  </Button>
                ))}
              </div>

              {!["heatmap", "volcano", "sets", "pca"].includes(plotType) ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  Outcome
                  <NativeSelect
                    className="w-full"
                    value={outcome}
                    onChange={(event) => setOutcome(event.target.value)}
                  >
                    {numbers.map((column) => (
                      <NativeSelectOption key={column} value={column}>
                        {column}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
              ) : null}
              {plotType === "xy" || plotType === "dose" ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  {plotType === "dose" ? "Dose / concentration" : "X variable"}
                  <NativeSelect
                    className="w-full"
                    value={xVariable}
                    onChange={(event) => setXVariable(event.target.value)}
                  >
                    {numbers.map((column) => (
                      <NativeSelectOption key={column} value={column}>
                        {column}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
              ) : null}
              {["columns", "grouped", "distribution", "paired", "xy", "dose", "pca"].includes(
                plotType,
              ) ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  {plotType === "grouped"
                    ? "X-axis groups"
                    : plotType === "columns"
                      ? "Column groups"
                      : plotType === "paired"
                        ? "Repeated conditions"
                      : "Group or colour"}
                  <NativeSelect
                    className="w-full"
                    value={group}
                    onChange={(event) => setGroup(event.target.value)}
                  >
                    <NativeSelectOption value="__none__">No grouping</NativeSelectOption>
                    {categories.map((column) => (
                      <NativeSelectOption key={column} value={column}>
                        {column}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
              ) : null}
              {plotType === "grouped" ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  Datasets / second factor
                  <NativeSelect
                    className="w-full"
                    value={factor2}
                    onChange={(event) => setFactor2(event.target.value)}
                  >
                    <NativeSelectOption value="__none__">Select a second factor</NativeSelectOption>
                    {categories
                      .filter((column) => column !== group)
                      .map((column) => (
                        <NativeSelectOption key={column} value={column}>
                          {column}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                </label>
              ) : null}
              {plotType === "distribution" ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  Distribution style
                  <NativeSelect
                    className="w-full"
                    value={distributionMode}
                    onChange={(event) =>
                      setDistributionMode(event.target.value as DistributionMode)
                    }
                  >
                    <NativeSelectOption value="violin">Violin with median and quartiles</NativeSelectOption>
                    <NativeSelectOption value="box">Box and whiskers</NativeSelectOption>
                  </NativeSelect>
                </label>
              ) : null}
              {plotType === "paired" ? (
                <div className="grid gap-2">
                  <label className="grid gap-1.5 text-xs font-medium">
                    Subject / repeated-measure ID
                    <NativeSelect
                      className="w-full"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                    >
                      <NativeSelectOption value="__none__">Select a subject ID</NativeSelectOption>
                      {allColumns
                        .filter((column) => column !== outcome && column !== group)
                        .map((column) => (
                          <NativeSelectOption key={column} value={column}>
                            {column}
                          </NativeSelectOption>
                        ))}
                    </NativeSelect>
                  </label>
                  {subject !== "__none__" && group !== "__none__" ? (
                    <p className="rounded-md bg-muted/60 px-2 py-1.5 text-[10px] leading-relaxed text-muted-foreground">
                      Connecting repeated <strong>{subject}</strong> values across the conditions in
                      <strong> {group}</strong>.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {plotType === "dose" ? (
                <label className="flex items-center gap-2 text-xs font-medium">
                  <Checkbox
                    checked={doseLogX}
                    onCheckedChange={(checked) => setDoseLogX(Boolean(checked))}
                  />
                  Fit using log₁₀ dose values
                </label>
              ) : null}
              {plotType === "pca" ? (
                <>
                  <label className="grid gap-1.5 text-xs font-medium">
                    PCA variables (2–12)
                    <select
                      multiple
                      className="min-h-32 rounded-lg border border-input bg-transparent p-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      value={pcaColumns}
                      onChange={(event) =>
                        setPcaColumns(
                          [...event.target.selectedOptions]
                            .map((option) => option.value)
                            .slice(0, 12),
                        )
                      }
                    >
                      {numbers.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Sample label
                    <NativeSelect
                      className="w-full"
                      value={labelVariable}
                      onChange={(event) => setLabelVariable(event.target.value)}
                    >
                      {allColumns.map((column) => (
                        <NativeSelectOption key={column} value={column}>
                          {column}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </label>
                </>
              ) : null}
              {plotType === "sets" ? (
                <>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Item / feature identifier
                    <NativeSelect
                      className="w-full"
                      value={setItemVariable}
                      onChange={(event) => setSetItemVariable(event.target.value)}
                    >
                      {allColumns.map((column) => (
                        <NativeSelectOption key={column} value={column}>
                          {column}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Set-membership column
                    <NativeSelect
                      className="w-full"
                      value={setMembershipVariable}
                      onChange={(event) => setSetMembershipVariable(event.target.value)}
                    >
                      {allColumns
                        .filter((column) => column !== setItemVariable)
                        .map((column) => (
                          <NativeSelectOption key={column} value={column}>
                            {column}
                          </NativeSelectOption>
                        ))}
                    </NativeSelect>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Intersection view
                    <NativeSelect
                      className="w-full"
                      value={setPlotMode}
                      onChange={(event) => setSetPlotMode(event.target.value as SetPlotMode)}
                    >
                      <NativeSelectOption value="auto">Automatic — Venn up to 3 sets</NativeSelectOption>
                      <NativeSelectOption value="venn">Venn diagram</NativeSelectOption>
                      <NativeSelectOption value="upset">UpSet plot</NativeSelectOption>
                    </NativeSelect>
                  </label>
                </>
              ) : null}
              {plotType === "volcano" ? (
                <>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Effect / log₂ fold change
                    <NativeSelect
                      className="w-full"
                      value={effectVariable}
                      onChange={(event) => setEffectVariable(event.target.value)}
                    >
                      {numbers.map((column) => (
                        <NativeSelectOption key={column} value={column}>
                          {column}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    P-value / FDR column
                    <NativeSelect
                      className="w-full"
                      value={pVariable}
                      onChange={(event) => setPVariable(event.target.value)}
                    >
                      <NativeSelectOption value="">Select a significance column</NativeSelectOption>
                      {numbers.map((column) => (
                        <NativeSelectOption key={column} value={column}>
                          {column}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Significance values
                    <NativeSelect
                      className="w-full"
                      value={volcanoThresholdMetric}
                      onChange={(event) =>
                        setVolcanoThresholdMetric(event.target.value as VolcanoThresholdMetric)
                      }
                    >
                      <NativeSelectOption value="p">Raw p-values</NativeSelectOption>
                      <NativeSelectOption value="bh-fdr">
                        Calculate FDR (Benjamini–Hochberg)
                      </NativeSelectOption>
                      <NativeSelectOption value="precomputed-fdr">
                        Selected column is FDR / q-value
                      </NativeSelectOption>
                    </NativeSelect>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Feature label
                    <NativeSelect
                      className="w-full"
                      value={labelVariable}
                      onChange={(event) => setLabelVariable(event.target.value)}
                    >
                      {allColumns.map((column) => (
                        <NativeSelectOption key={column} value={column}>
                          {column}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </label>
                </>
              ) : null}
              {plotType === "heatmap" ? (
                <>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Variables (up to 12)
                    <select
                      multiple
                      className="min-h-32 rounded-lg border border-input bg-transparent p-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      value={heatmapColumns}
                      onChange={(event) =>
                        setHeatmapColumns(
                          [...event.target.selectedOptions].map((option) => option.value),
                        )
                      }
                    >
                      {numbers.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Heatmap colour pattern
                    <NativeSelect
                      className="w-full"
                      value={heatmapPalette}
                      onChange={(event) => setHeatmapPalette(event.target.value as HeatmapPalette)}
                    >
                      {Object.entries(heatmapPalettes).map(([value, palette]) => (
                        <NativeSelectOption key={value} value={value}>
                          {palette.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <Checkbox
                      checked={showHeatmapValues}
                      onCheckedChange={(checked) => setShowHeatmapValues(Boolean(checked))}
                    />
                    Show correlation values in cells
                  </label>
                </>
              ) : null}
            </CardContent>
          </Card>

          {plotType === "heatmap" ? (
            <Card className="border border-primary/30 bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" /> Heatmap row clustering
                </CardTitle>
                <CardDescription>
                  Reorder rows so variables with similar profiles appear together.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="grid gap-1.5 text-xs font-medium">
                  Clustering method
                  <NativeSelect
                    className="w-full"
                    value={heatmapLinkage}
                    onChange={(event) => setHeatmapLinkage(event.target.value as HeatmapLinkage)}
                  >
                    <NativeSelectOption value="none">
                      Off — preserve original row order
                    </NativeSelectOption>
                    <NativeSelectOption value="average">Average linkage</NativeSelectOption>
                    <NativeSelectOption value="complete">Complete linkage</NativeSelectOption>
                    <NativeSelectOption value="single">Single linkage</NativeSelectOption>
                    <NativeSelectOption value="ward">Ward linkage</NativeSelectOption>
                  </NativeSelect>
                </label>
                <label className="grid gap-1.5 text-xs font-medium">
                  Distance metric
                  <NativeSelect
                    className="w-full"
                    value={heatmapLinkage === "ward" ? "euclidean" : heatmapDistance}
                    disabled={heatmapLinkage === "none" || heatmapLinkage === "ward"}
                    onChange={(event) => setHeatmapDistance(event.target.value as HeatmapDistance)}
                  >
                    <NativeSelectOption value="correlation">
                      Correlation distance
                    </NativeSelectOption>
                    <NativeSelectOption value="euclidean">Euclidean distance</NativeSelectOption>
                    <NativeSelectOption value="manhattan">Manhattan distance</NativeSelectOption>
                  </NativeSelect>
                </label>
                <p className="rounded-md bg-background px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
                  {heatmapLinkage === "none"
                    ? "Clustering is off. Choose a linkage method to reorder the heatmap rows."
                    : heatmapLinkage === "ward"
                      ? "Ward linkage is active and uses Euclidean distance."
                      : `${heatmapLinkage[0].toUpperCase()}${heatmapLinkage.slice(1)} linkage is active with ${heatmapDistance} distance.`}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-0 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="size-4 text-primary" /> Plot settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="grid gap-1.5 text-xs font-medium">
                Plot title
                <Input
                  value={plotTitle}
                  placeholder={displayTitle}
                  onChange={(event) => setPlotTitle(event.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1.5 text-xs font-medium">
                  X-axis label
                  <Input
                    value={xLabel}
                    placeholder={displayXLabel}
                    onChange={(event) => setXLabel(event.target.value)}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-medium">
                  Y-axis label
                  <Input
                    value={yLabel}
                    placeholder={displayYLabel}
                    onChange={(event) => setYLabel(event.target.value)}
                  />
                </label>
              </div>
              {colourSeries.length ? (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">
                      {plotType === "columns"
                        ? "Bar colours"
                        : plotType === "grouped"
                          ? "Dataset colours"
                          : "Series colours"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={resetSeriesColors}
                    >
                      Reset palette
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {colourSeries.map((name, index) => (
                      <label key={name} className="grid min-w-0 gap-1.5 text-xs font-medium">
                        <span className="truncate" title={name}>
                          {name}
                        </span>
                        <Input
                          type="color"
                          aria-label={`${name} colour`}
                          className="h-9 w-full p-1"
                          value={seriesColor(index, name)}
                          onChange={(event) => setSeriesColor(name, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Each swatch controls one displayed{" "}
                    {plotType === "columns"
                      ? "bar."
                      : plotType === "grouped"
                        ? "dataset across all X-axis groups."
                        : "data series."}
                  </p>
                </div>
              ) : plotType === "volcano" ? (
                <div className="grid grid-cols-3 gap-2">
                  <label className="grid gap-1.5 text-xs font-medium">
                    Up colour
                    <Input
                      type="color"
                      aria-label="Up-regulated point colour"
                      className="h-9 w-full p-1"
                      value={primaryColor}
                      onChange={(event) => setPrimaryColor(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Down colour
                    <Input
                      type="color"
                      aria-label="Down-regulated point colour"
                      className="h-9 w-full p-1"
                      value={volcanoDownColor}
                      onChange={(event) => setVolcanoDownColor(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    NS colour
                    <Input
                      type="color"
                      aria-label="Non-significant point colour"
                      className="h-9 w-full p-1"
                      value={volcanoNsColor}
                      onChange={(event) => setVolcanoNsColor(event.target.value)}
                    />
                  </label>
                </div>
              ) : null}
              {plotType === "xy" ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  Regression line colour
                  <Input
                    type="color"
                    className="h-9 p-1"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                  />
                </label>
              ) : null}
              {plotType === "columns" || plotType === "grouped" || plotType === "xy" ? (
                <div className="grid gap-3">
                  <label className="grid gap-1.5 text-xs font-medium">
                    Dot colouring
                    <NativeSelect
                      className="w-full"
                      value={pointColorMode}
                      onChange={(event) => setPointColorMode(event.target.value as PointColorMode)}
                    >
                      <NativeSelectOption value="single">Use one dot colour</NativeSelectOption>
                      <NativeSelectOption value="series">
                        Match each bar / data series
                      </NativeSelectOption>
                    </NativeSelect>
                  </label>
                  {pointColorMode === "single" ? (
                    <label className="grid gap-1.5 text-xs font-medium">
                      Shared dot colour
                      <Input
                        type="color"
                        className="h-9 p-1"
                        value={secondaryColor}
                        onChange={(event) => setSecondaryColor(event.target.value)}
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}
              {plotType !== "heatmap" ? (
                <>
                  <label className="grid gap-2 text-xs font-medium">
                    Point size{" "}
                    <span className="font-normal text-muted-foreground">{pointSize}px</span>
                    <Slider
                      value={[pointSize]}
                      min={3}
                      max={13}
                      step={1}
                      onValueChange={(value) =>
                        setPointSize(typeof value === "number" ? value : value[0])
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-medium">
                    Point opacity{" "}
                    <span className="font-normal text-muted-foreground">{pointOpacity}%</span>
                    <Slider
                      value={[pointOpacity]}
                      min={25}
                      max={100}
                      step={5}
                      onValueChange={(value) =>
                        setPointOpacity(typeof value === "number" ? value : value[0])
                      }
                    />
                  </label>
                </>
              ) : null}
              <div className="grid gap-2.5 text-xs">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={showGrid}
                    onCheckedChange={(checked) => setShowGrid(Boolean(checked))}
                  />{" "}
                  Show grid
                </label>
                {["columns", "grouped", "distribution"].includes(plotType) ? (
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={showPoints}
                      onCheckedChange={(checked) => setShowPoints(Boolean(checked))}
                    />{" "}
                    Show individual observations
                  </label>
                ) : null}
                {["columns", "grouped"].includes(plotType) && analysis.postHoc.length ? (
                  <div className="grid gap-2 rounded-lg border border-primary/15 bg-primary/[0.025] p-2.5">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={showComparisonAnnotations}
                        onCheckedChange={(checked) =>
                          setShowComparisonAnnotations(Boolean(checked))
                        }
                      />{" "}
                      Show selected post-tests on graph
                    </label>
                    {showComparisonAnnotations ? (
                      <label className="flex items-center gap-2 pl-6 text-muted-foreground">
                        <Checkbox
                          checked={showNonSignificantAnnotations}
                          onCheckedChange={(checked) =>
                            setShowNonSignificantAnnotations(Boolean(checked))
                          }
                        />{" "}
                        Include non-significant comparisons
                      </label>
                    ) : null}
                    <p className="pl-6 text-[10px] leading-relaxed text-muted-foreground">
                      Only the first few selected comparisons are shown to keep the figure readable.
                    </p>
                  </div>
                ) : null}
                {plotType === "columns" || plotType === "grouped" ? (
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={showErrorBars}
                      onCheckedChange={(checked) => setShowErrorBars(Boolean(checked))}
                    />{" "}
                    Show error bars
                  </label>
                ) : null}
                {plotType === "volcano" ? (
                  <div className="grid gap-3 rounded-xl border border-primary/15 bg-primary/[0.025] p-3">
                    <label className="grid gap-1.5 text-xs font-medium">
                      Label specific features or molecules
                      <Textarea
                        className="min-h-24 resize-y bg-white text-xs"
                        placeholder={"CYP19A1, HSD3B1, SOD1\nSeparate names with commas or new lines"}
                        value={volcanoLabelList}
                        onChange={(event) => setVolcanoLabelList(event.target.value)}
                      />
                      <span className="font-normal leading-relaxed text-muted-foreground">
                        Uses case-insensitive exact matches from the selected feature-label column.
                        {requestedVolcanoLabels.size
                          ? ` ${matchedVolcanoLabelCount} of ${requestedVolcanoLabels.size} requested labels found.`
                          : ""}
                      </span>
                    </label>
                  </div>
                ) : null}
                {["columns", "grouped", "xy"].includes(plotType) ? (
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={logY && canUseLogY}
                      disabled={!canUseLogY}
                      onCheckedChange={(checked) => setLogY(Boolean(checked))}
                    />{" "}
                    Logarithmic Y-axis
                  </label>
                ) : null}
              </div>
              {plotType === "columns" || plotType === "grouped" ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  Error bars
                  <NativeSelect
                    className="w-full"
                    value={errorType}
                    onChange={(event) => setErrorType(event.target.value as ErrorType)}
                  >
                    <NativeSelectOption value="sem">SEM</NativeSelectOption>
                    <NativeSelectOption value="sd">SD</NativeSelectOption>
                  <NativeSelectOption value="ci95">95% CI (t distribution)</NativeSelectOption>
                  </NativeSelect>
                </label>
              ) : null}
              {plotType === "volcano" ? (
                <div className="space-y-3 rounded-lg border bg-muted/25 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Volcano thresholds
                  </p>
                  <div className="grid gap-2 text-xs">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={useFoldThreshold}
                        onCheckedChange={(checked) => setUseFoldThreshold(Boolean(checked))}
                      />
                      Use absolute effect threshold
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={useSignificanceThreshold}
                        onCheckedChange={(checked) => setUseSignificanceThreshold(Boolean(checked))}
                      />
                      Use {volcanoMetricLabel} threshold
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1.5 text-xs font-medium">
                      |Effect| threshold
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        disabled={!useFoldThreshold}
                        value={foldThreshold}
                        onChange={(event) => setFoldThreshold(Number(event.target.value))}
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-medium">
                      {volcanoMetricLabel} threshold
                      <Input
                        type="number"
                        min="0.000001"
                        max="1"
                        step="0.01"
                        disabled={!useSignificanceThreshold}
                        value={pThreshold}
                        onChange={(event) => setPThreshold(Number(event.target.value))}
                      />
                    </label>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border border-primary/25 bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Figure size and fonts</CardTitle>
              <CardDescription>
                Changes are applied immediately to the plot and exported file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Plot dimensions
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "Small", width: 480, height: 360 },
                    { label: "Medium", width: 700, height: 440 },
                    { label: "Large", width: 1000, height: 560 },
                  ].map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      size="sm"
                      variant={
                        plotWidth === preset.width && plotHeight === preset.height
                          ? "default"
                          : "outline"
                      }
                      className="px-2 text-xs"
                      onClick={() => {
                        setPlotWidth(preset.width);
                        setPlotHeight(preset.height);
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1.5 text-xs font-medium">
                    Width (px)
                    <Input
                      type="number"
                      min={320}
                      max={2400}
                      step={20}
                      value={plotWidth}
                      onChange={(event) => setPlotWidth(Number(event.target.value))}
                      onBlur={() =>
                        setPlotWidth((value) => Math.max(320, Math.min(2400, value || 700)))
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Height (px)
                    <Input
                      type="number"
                      min={240}
                      max={1600}
                      step={20}
                      value={plotHeight}
                      onChange={(event) => setPlotHeight(Number(event.target.value))}
                      onBlur={() =>
                        setPlotHeight((value) => Math.max(240, Math.min(1600, value || 440)))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Font sizes
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1.5 text-xs font-medium">
                    Plot title (px)
                    <Input
                      type="number"
                      min={10}
                      max={40}
                      value={titleFontSize}
                      onChange={(event) => setTitleFontSize(Number(event.target.value))}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Axis labels / titles (px)
                    <Input
                      type="number"
                      min={8}
                      max={32}
                      value={axisTitleFontSize}
                      onChange={(event) => setAxisTitleFontSize(Number(event.target.value))}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Axis numbers / categories (px)
                    <Input
                      type="number"
                      min={7}
                      max={28}
                      value={tickFontSize}
                      onChange={(event) => setTickFontSize(Number(event.target.value))}
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Legend (px)
                    <Input
                      type="number"
                      min={7}
                      max={28}
                      value={legendFontSize}
                      onChange={(event) => setLegendFontSize(Number(event.target.value))}
                    />
                  </label>
                  <label className="col-span-2 grid gap-1.5 text-xs font-medium">
                    Axis line thickness (px)
                    <Input
                      type="number"
                      min={0.5}
                      max={5}
                      step={0.25}
                      value={axisLineWidth}
                      onChange={(event) => setAxisLineWidth(Number(event.target.value))}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Figure export</CardTitle>
              <CardDescription>
                Download publication-ready raster or editable vector files.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="grid gap-1.5 text-xs font-medium">
                PNG resolution
                <NativeSelect
                  className="w-full"
                  value={String(exportDpi)}
                  onChange={(event) => setExportDpi(Number(event.target.value) as 300 | 600)}
                >
                  <NativeSelectOption value="300">300 DPI — publication</NativeSelectOption>
                  <NativeSelectOption value="600">600 DPI — high resolution</NativeSelectOption>
                </NativeSelect>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["png", "svg", "emf"] as ExportFormat[]).map((format) => (
                  <Button
                    key={format}
                    variant={format === "png" ? "default" : "outline"}
                    className="px-2 uppercase"
                    disabled={Boolean(exporting)}
                    onClick={() => void exportFigure(format)}
                  >
                    <Download aria-hidden="true" />
                    {exporting === format ? "Wait" : format}
                  </Button>
                ))}
              </div>
              <p
                role="status"
                className="min-h-8 text-[11px] leading-relaxed text-muted-foreground"
              >
                {exportMessage ||
                  "SVG and EMF stay sharp when resized. PNG exports at the selected resolution."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Statistical settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="grid gap-1.5 text-xs font-medium">
                Test
                <NativeSelect
                  className="w-full"
                  value={testChoice}
                  onChange={(event) => setTestChoice(event.target.value as TestChoice)}
                >
                  <NativeSelectOption value="auto">Auto — suggest a test</NativeSelectOption>
                  <NativeSelectOption value="welch">Welch&apos;s t-test</NativeSelectOption>
                  <NativeSelectOption value="paired">Paired t-test</NativeSelectOption>
                  <NativeSelectOption value="mannwhitney">
                    Mann–Whitney U (non-parametric)
                  </NativeSelectOption>
                  <NativeSelectOption value="wilcoxon">
                    Wilcoxon paired (non-parametric)
                  </NativeSelectOption>
                  <NativeSelectOption value="oneway">One-way ANOVA</NativeSelectOption>
                  <NativeSelectOption value="welch-anova">
                    Welch&apos;s one-way ANOVA
                  </NativeSelectOption>
                  <NativeSelectOption value="kruskal">
                    Kruskal–Wallis (non-parametric)
                  </NativeSelectOption>
                  <NativeSelectOption value="friedman">
                    Friedman repeated (non-parametric)
                  </NativeSelectOption>
                  <NativeSelectOption value="twoway">Two-way ANOVA</NativeSelectOption>
                  <NativeSelectOption value="pearson">Pearson correlation</NativeSelectOption>
                  <NativeSelectOption value="spearman">Spearman correlation</NativeSelectOption>
                  <NativeSelectOption value="mixed">
                    Random-intercept mixed model
                  </NativeSelectOption>
                  <NativeSelectOption value="normality">
                    Normality diagnostics only
                  </NativeSelectOption>
                </NativeSelect>
              </label>
              {plotType === "columns" || plotType === "grouped" ? (
                <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Post-tests and comparisons
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Choose the comparisons to calculate and how their p-values are corrected.
                    </p>
                  </div>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Post-tests
                    <NativeSelect
                      className="w-full"
                      value={postHocEnabled ? "on" : "off"}
                      onChange={(event) => setPostHocEnabled(event.target.value === "on")}
                    >
                      <NativeSelectOption value="on">On</NativeSelectOption>
                      <NativeSelectOption value="off">Off — omnibus test only</NativeSelectOption>
                    </NativeSelect>
                  </label>
                  {postHocEnabled ? (
                    <>
                      <label className="grid gap-1.5 text-xs font-medium">
                        Multiple-comparison correction
                        <NativeSelect
                          className="w-full"
                          value={postHocAdjustment}
                          onChange={(event) =>
                            setPostHocAdjustment(event.target.value as PostHocAdjustment)
                          }
                        >
                          <NativeSelectOption value="holm">
                            Holm (safe general default)
                          </NativeSelectOption>
                          <NativeSelectOption value="bonferroni">Bonferroni</NativeSelectOption>
                          <NativeSelectOption value="sidak">Šidák</NativeSelectOption>
                          <NativeSelectOption value="bh-fdr">
                            Benjamini–Hochberg FDR
                          </NativeSelectOption>
                          <NativeSelectOption value="none">None — raw p-values</NativeSelectOption>
                        </NativeSelect>
                      </label>
                      <label className="grid gap-1.5 text-xs font-medium">
                        Comparisons to calculate
                        <NativeSelect
                          className="w-full"
                          value={postHocScope}
                          onChange={(event) => setPostHocScope(event.target.value as PostHocScope)}
                        >
                          <NativeSelectOption value="all">
                            All pairwise comparisons
                          </NativeSelectOption>
                          <NativeSelectOption value="reference">
                            Each group versus a reference
                          </NativeSelectOption>
                          <NativeSelectOption value="selected">
                            Only selected comparisons
                          </NativeSelectOption>
                        </NativeSelect>
                      </label>
                      {postHocScope === "reference" ? (
                        <label className="grid gap-1.5 text-xs font-medium">
                          Reference / control group
                          <NativeSelect
                            className="w-full"
                            value={activePostHocReference}
                            onChange={(event) => setPostHocReference(event.target.value)}
                          >
                            {!postHocReferenceOptions.length ? (
                              <NativeSelectOption value="">
                                No valid groups available
                              </NativeSelectOption>
                            ) : null}
                            {postHocReferenceOptions.map((option) => (
                              <NativeSelectOption key={option} value={option}>
                                {option}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </label>
                      ) : null}
                      {postHocScope === "selected" ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium">Select group pairs</p>
                          <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border bg-background p-2.5">
                            {analysis.allPostHoc.length ? (
                              analysis.allPostHoc.map((comparison) => {
                                const key = comparisonKey(comparison);
                                return (
                                  <label key={key} className="flex items-start gap-2 text-xs">
                                    <Checkbox
                                      checked={selectedPostHocComparisons.includes(key)}
                                      onCheckedChange={(checked) =>
                                        setSelectedPostHocComparisons((current) =>
                                          checked
                                            ? [...new Set([...current, key])]
                                            : current.filter((item) => item !== key),
                                        )
                                      }
                                    />
                                    <span className="leading-relaxed">
                                      {comparison.first} vs {comparison.second}
                                      {comparison.context ? (
                                        <span className="block text-[10px] text-muted-foreground">
                                          {comparison.context}
                                        </span>
                                      ) : null}
                                    </span>
                                  </label>
                                );
                              })
                            ) : (
                              <p className="text-[11px] text-muted-foreground">
                                Select an analysis with at least three valid groups to list pairwise
                                comparisons.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {selectedTest === "kruskal"
                          ? "Dunn's tests follow the Kruskal–Wallis analysis."
                          : selectedTest === "friedman"
                            ? "Paired Wilcoxon tests follow the Friedman analysis."
                            : selectedTest === "mixed"
                              ? "Paired t-tests compare repeated conditions."
                              : selectedTest === "oneway"
                                ? "Pairwise Welch tests are shown, but classical ANOVA itself assumes equal variances."
                                : "Pairwise Welch tests compare independent groups."}{" "}
                        Results use {postHocAdjustmentLabel} adjustment.
                      </p>
                    </>
                  ) : null}
                </div>
              ) : null}
              {plotType !== "grouped" ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  Second factor
                  <NativeSelect
                    className="w-full"
                    value={factor2}
                    onChange={(event) => setFactor2(event.target.value)}
                  >
                    <NativeSelectOption value="__none__">None</NativeSelectOption>
                    {categories
                      .filter((column) => column !== group)
                      .map((column) => (
                        <NativeSelectOption key={column} value={column}>
                          {column}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                </label>
              ) : null}
              {plotType !== "paired" ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  Subject / repeated-measure ID
                  <NativeSelect
                    className="w-full"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                  >
                    <NativeSelectOption value="__none__">
                      None / independent samples
                    </NativeSelectOption>
                    {allColumns
                      .filter(
                        (column) =>
                          column !== outcome && column !== group && column !== factor2,
                      )
                      .map((column) => (
                        <NativeSelectOption key={column} value={column}>
                          {column}
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                </label>
              ) : null}
              <label className="grid gap-1.5 text-xs font-medium">
                Outlier flagging
                <NativeSelect
                  className="w-full"
                  value={outlierMethod}
                  onChange={(event) => setOutlierMethod(event.target.value as OutlierMethod)}
                >
                  <NativeSelectOption value="none">Off</NativeSelectOption>
                  <NativeSelectOption value="mad">Robust MAD (|z| &gt; 3.5)</NativeSelectOption>
                  <NativeSelectOption value="iqr">1.5 × IQR rule</NativeSelectOption>
                </NativeSelect>
              </label>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="overflow-x-auto pb-1">
            <Card
              ref={figureRef}
              className="border-0 bg-card shadow-sm"
              style={{ width: plotWidth + 48 }}
            >
              <CardHeader className="border-b">
                <div>
                  <CardTitle style={{ fontSize: titleFontSize }}>{displayTitle}</CardTitle>
                  <CardDescription>
                    {plotType === "columns" &&
                      `${completeEntries.length} complete observations across ${summaries.length} groups`}
                    {plotType === "grouped" &&
                      `${completeEntries.length} observations across ${groupedLevels.length} X-axis groups and ${factor2Levels.length} datasets`}
                    {plotType === "distribution" &&
                      `${completeEntries.length} complete observations across ${distributionGroups.length} distributions`}
                    {plotType === "paired" &&
                      `${pairedSubjects.length} subjects across ${summaries.length} repeated conditions`}
                    {plotType === "xy" && `${relationshipPoints.length} complete XY pairs`}
                    {plotType === "dose" &&
                      `${doseSeries.reduce((sum, entry) => sum + entry.points.length, 0)} observations across ${doseSeries.length} dose–response series`}
                    {plotType === "pca" &&
                      `${pcaResult?.points.length ?? 0} complete samples across ${pcaColumns.length} selected variables`}
                    {plotType === "sets" && `Exact item overlaps from ${setMembershipVariable}`}
                    {plotType === "heatmap" &&
                      `${activeHeatmapColumns.length} numeric variables${heatmapLinkage === "none" ? "" : ` · ${heatmapLinkage} row clustering`}`}
                    {plotType === "volcano" &&
                      `${volcanoPoints.length} valid effect–${volcanoMetricLabel} pairs`}
                  </CardDescription>
                </div>
                <div
                  data-export-exclude
                  className="max-w-xl rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                    <Sparkles className="size-3" /> Suggested: {suggestion.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {suggestion.reason}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {plotType === "columns" ? (
                  <div
                    className="relative mx-auto shrink-0"
                    style={{ width: plotWidth, height: plotHeight }}
                  >
                    <ChartContainer
                      config={chartConfig}
                      className="h-full w-full shrink-0 aspect-auto"
                    >
                      <ComposedChart
                        data={summaries}
                        margin={{
                          top:
                            showComparisonAnnotations &&
                            analysis.postHoc.some(
                              (comparison) =>
                                showNonSignificantAnnotations || comparison.adjustedP < 0.05,
                            )
                              ? 92
                              : 22,
                          right: 24,
                          bottom: 52,
                          left: 24,
                        }}
                      >
                      {showGrid ? <CartesianGrid strokeDasharray="3 3" vertical={false} /> : null}
                      <XAxis
                        dataKey="group"
                        allowDuplicatedCategory={false}
                        interval={0}
                        tick={tickStyle}
                        axisLine={axisLineStyle}
                        tickLine={tickLineStyle}
                      >
                        <Label
                          value={displayXLabel}
                          position="bottom"
                          offset={30}
                          style={axisLabelStyle}
                        />
                      </XAxis>
                      <YAxis
                        width={72}
                        tick={tickStyle}
                        axisLine={axisLineStyle}
                        tickLine={tickLineStyle}
                        scale={logY && canUseLogY ? "log" : "auto"}
                        domain={logY && canUseLogY ? ["auto", "auto"] : [0, "auto"]}
                      >
                        <Label
                          value={displayYLabel}
                          angle={-90}
                          position="insideLeft"
                          style={axisLabelStyle}
                        />
                      </YAxis>
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const selected =
                            payload.find((item) => item.payload?.sample) ?? payload[0];
                          return (
                            <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
                              <strong>{selected.payload?.sample ?? label}</strong>
                              <p className="mt-1 text-muted-foreground">
                                {selected.payload?.group ?? label}:{" "}
                                {formatNumber(selected.payload?.value ?? selected.payload?.mean)}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        name={`Mean${showErrorBars ? ` ± ${errorType.toUpperCase()}` : ""}`}
                        dataKey="mean"
                        fill={primaryColor}
                        fillOpacity={0.82}
                        radius={[5, 5, 0, 0]}
                        maxBarSize={110}
                      >
                        {summaries.map((summary, index) => (
                          <Cell key={summary.group} fill={seriesColor(index, summary.group)} />
                        ))}
                        {showErrorBars ? (
                          <ErrorBar dataKey="error" width={10} stroke="#111827" strokeWidth={1.6} />
                        ) : null}
                      </Bar>
                      {showPoints ? (
                        <Scatter
                          name="Individual observations"
                          data={groupPoints}
                          dataKey="value"
                          fill={pointColor(0, summaries[0]?.group)}
                          fillOpacity={pointOpacity / 100}
                          shape={(props) => {
                            const payload = props.payload as (typeof groupPoints)[number];
                            const seriesIndex = summaries.findIndex(
                              (summary) => summary.group === payload.group,
                            );
                            const dotColor = pointColor(Math.max(0, seriesIndex), payload.group);
                            return (
                              <circle
                                cx={Number(props.cx) + payload.jitter}
                                cy={Number(props.cy)}
                                r={pointSize / 2}
                                fill={payload.flagged ? "#ffffff" : dotColor}
                                fillOpacity={pointOpacity / 100}
                                stroke={payload.flagged ? dotColor : "#ffffff"}
                                strokeWidth={payload.flagged ? 2.5 : 0.8}
                              />
                            );
                          }}
                        />
                      ) : null}
                      </ComposedChart>
                    </ChartContainer>
                    {showComparisonAnnotations ? (
                      <ComparisonOverlay
                        comparisons={analysis.postHoc}
                        groups={summaries.map((summary) => summary.group)}
                        width={plotWidth}
                        fontSize={tickFontSize}
                        showNonSignificant={showNonSignificantAnnotations}
                      />
                    ) : null}
                  </div>
                ) : null}

                {plotType === "grouped" ? (
                  factor2 !== "__none__" && factor2Levels.length ? (
                    <div
                      className="relative mx-auto shrink-0"
                      style={{ width: plotWidth, height: plotHeight }}
                    >
                      <ChartContainer
                        config={chartConfig}
                        className="h-full w-full shrink-0 aspect-auto"
                      >
                        <ComposedChart
                          data={groupedChartData}
                          barCategoryGap="20%"
                          barGap={3}
                          margin={{
                            top:
                              showComparisonAnnotations &&
                              analysis.postHoc.some(
                                (comparison) =>
                                  showNonSignificantAnnotations || comparison.adjustedP < 0.05,
                              )
                                ? 100
                                : 22,
                            right: 24,
                            bottom: 52,
                            left: 24,
                          }}
                        >
                        {showGrid ? <CartesianGrid strokeDasharray="3 3" vertical={false} /> : null}
                        <XAxis
                          dataKey="group"
                          allowDuplicatedCategory={false}
                          interval={0}
                          tick={tickStyle}
                          axisLine={axisLineStyle}
                          tickLine={tickLineStyle}
                        >
                          <Label
                            value={displayXLabel}
                            position="bottom"
                            offset={30}
                            style={axisLabelStyle}
                          />
                        </XAxis>
                        <YAxis
                          width={72}
                          tick={tickStyle}
                          axisLine={axisLineStyle}
                          tickLine={tickLineStyle}
                          scale={logY && canUseLogY ? "log" : "auto"}
                          domain={logY && canUseLogY ? ["auto", "auto"] : [0, "auto"]}
                        >
                          <Label
                            value={displayYLabel}
                            angle={-90}
                            position="insideLeft"
                            style={axisLabelStyle}
                          />
                        </YAxis>
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const selected =
                              payload.find((item) => item.payload?.sample) ?? payload[0];
                            return (
                              <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
                                <strong>{selected.payload?.sample ?? String(label)}</strong>
                                <p className="mt-1 text-muted-foreground">
                                  {selected.payload?.factor2 ?? selected.name}:{" "}
                                  {formatNumber(selected.payload?.value ?? selected.value)}
                                </p>
                              </div>
                            );
                          }}
                        />
                        {factor2Levels.map((factorName, index) => (
                          <Bar
                            key={factorName}
                            name={factorName}
                            dataKey={`mean_${index}`}
                            fill={seriesColor(index, factorName)}
                            fillOpacity={0.82}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={72}
                          >
                            {showErrorBars ? (
                              <ErrorBar
                                dataKey={`error_${index}`}
                                width={8}
                                stroke="#111827"
                                strokeWidth={1.5}
                              />
                            ) : null}
                          </Bar>
                        ))}
                        {showPoints
                          ? groupedPointsByFactor.map(({ factorName, seriesIndex, points }) => {
                              const spacing = Math.min(34, 86 / Math.max(1, factor2Levels.length));
                              const seriesOffset =
                                (seriesIndex - (factor2Levels.length - 1) / 2) * spacing;
                              return (
                                <Scatter
                                  key={`${factorName}-points`}
                                  name={`${factorName} observations`}
                                  legendType="none"
                                  data={points}
                                  dataKey="value"
                                  fill={pointColor(seriesIndex, factorName)}
                                  fillOpacity={pointOpacity / 100}
                                  shape={(props) => {
                                    const payload = props.payload as (typeof points)[number];
                                    const dotColor = pointColor(seriesIndex, factorName);
                                    return (
                                      <circle
                                        cx={Number(props.cx) + seriesOffset + payload.jitter}
                                        cy={Number(props.cy)}
                                        r={pointSize / 2}
                                        fill={payload.flagged ? "#ffffff" : dotColor}
                                        fillOpacity={pointOpacity / 100}
                                        stroke={payload.flagged ? dotColor : "#ffffff"}
                                        strokeWidth={payload.flagged ? 2.5 : 0.8}
                                      />
                                    );
                                  }}
                                />
                              );
                            })
                          : null}
                        <Legend
                          verticalAlign="top"
                          align="right"
                          wrapperStyle={{ fontSize: legendFontSize }}
                        />
                        </ComposedChart>
                      </ChartContainer>
                      {showComparisonAnnotations ? (
                        <GroupedComparisonOverlay
                          comparisons={analysis.postHoc}
                          groups={groupedLevels}
                          series={factor2Levels}
                          groupVariable={group}
                          seriesVariable={factor2}
                          width={plotWidth}
                          fontSize={tickFontSize}
                          showNonSignificant={showNonSignificantAnnotations}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <EmptyState text="Choose a second categorical factor to create side-by-side grouped datasets." />
                  )
                ) : null}

                {plotType === "distribution" ? (
                  <DistributionPlot
                    groups={distributionGroups.map((entry, index) => ({
                      ...entry,
                      color: seriesColor(index, entry.name),
                    }))}
                    mode={distributionMode}
                    width={plotWidth}
                    height={plotHeight}
                    showPoints={showPoints}
                    pointSize={pointSize}
                    pointOpacity={pointOpacity}
                    xLabel={displayXLabel}
                    yLabel={displayYLabel}
                    tickFontSize={tickFontSize}
                    axisTitleFontSize={axisTitleFontSize}
                  />
                ) : null}

                {plotType === "paired" ? (
                  <PairedTrajectoryPlot
                    groups={summaries.map((summary) => summary.group)}
                    subjects={pairedSubjects}
                    width={plotWidth}
                    height={plotHeight}
                    colors={new Map(
                      summaries.map((summary, index) => [
                        summary.group,
                        seriesColor(index, summary.group),
                      ]),
                    )}
                    pointSize={pointSize}
                    pointOpacity={pointOpacity}
                    xLabel={displayXLabel}
                    yLabel={displayYLabel}
                    tickFontSize={tickFontSize}
                    axisTitleFontSize={axisTitleFontSize}
                  />
                ) : null}

                {plotType === "xy" ? (
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto shrink-0 aspect-auto"
                    style={{ width: plotWidth, height: plotHeight }}
                  >
                    <ScatterChart margin={{ top: 22, right: 24, bottom: 52, left: 24 }}>
                      {showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
                      <XAxis
                        type="number"
                        dataKey="x"
                        domain={["auto", "auto"]}
                        tick={tickStyle}
                        axisLine={axisLineStyle}
                        tickLine={tickLineStyle}
                      >
                        <Label
                          value={displayXLabel}
                          position="bottom"
                          offset={30}
                          style={axisLabelStyle}
                        />
                      </XAxis>
                      <YAxis
                        type="number"
                        dataKey="y"
                        width={72}
                        tick={tickStyle}
                        axisLine={axisLineStyle}
                        tickLine={tickLineStyle}
                        scale={logY && canUseLogY ? "log" : "auto"}
                        domain={["auto", "auto"]}
                      >
                        <Label
                          value={displayYLabel}
                          angle={-90}
                          position="insideLeft"
                          style={axisLabelStyle}
                        />
                      </YAxis>
                      <Tooltip
                        content={({ active, payload }) => {
                          const point = payload?.[0]?.payload;
                          if (!active || !point) return null;
                          return (
                            <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
                              <strong>{point.sample}</strong>
                              <p className="mt-1 text-muted-foreground">
                                {displayXLabel}: {formatNumber(point.x)}
                                <br />
                                {displayYLabel}: {formatNumber(point.y)}
                              </p>
                            </div>
                          );
                        }}
                      />
                      {relationshipGroups.map(([name, points], index) => (
                        <Scatter
                          key={name}
                          name={name}
                          data={points}
                          fill={pointColor(index, name)}
                          fillOpacity={pointOpacity / 100}
                          shape={(props) => {
                            const payload = props.payload as (typeof relationshipPoints)[number];
                            const flagged = outliers.has(payload.index);
                            return (
                              <circle
                                cx={Number(props.cx)}
                                cy={Number(props.cy)}
                                r={pointSize / 2}
                                fill={flagged ? "#ffffff" : pointColor(index, name)}
                                stroke={flagged ? pointColor(index, name) : "#ffffff"}
                                strokeWidth={flagged ? 2.5 : 0.8}
                              />
                            );
                          }}
                        />
                      ))}
                      {regression ? (
                        <ReferenceLine
                          segment={[
                            {
                              x: regression.minX,
                              y: regression.intercept + regression.slope * regression.minX,
                            },
                            {
                              x: regression.maxX,
                              y: regression.intercept + regression.slope * regression.maxX,
                            },
                          ]}
                          stroke={primaryColor}
                          strokeDasharray="6 5"
                          strokeWidth={1.8}
                        />
                      ) : null}
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ fontSize: legendFontSize }}
                      />
                    </ScatterChart>
                  </ChartContainer>
                ) : null}

                {plotType === "dose" ? (
                  <DoseResponsePlot
                    series={doseSeries.map((entry, index) => ({
                      ...entry,
                      color: seriesColor(index, entry.name),
                    }))}
                    width={plotWidth}
                    height={plotHeight}
                    pointSize={pointSize}
                    pointOpacity={pointOpacity}
                    xLabel={displayXLabel}
                    yLabel={displayYLabel}
                    tickFontSize={tickFontSize}
                    axisTitleFontSize={axisTitleFontSize}
                  />
                ) : null}

                {plotType === "pca" ? (
                  <PcaPlot
                    result={pcaResult}
                    width={plotWidth}
                    height={plotHeight}
                    colors={pcaColourMap}
                    pointSize={pointSize}
                    pointOpacity={pointOpacity}
                    tickFontSize={tickFontSize}
                    axisTitleFontSize={axisTitleFontSize}
                  />
                ) : null}

                {plotType === "sets" ? (
                  <SetIntersectionPlot
                    rows={rows}
                    itemVariable={setItemVariable}
                    setVariable={setMembershipVariable}
                    mode={setPlotMode}
                    width={plotWidth}
                    height={plotHeight}
                    tickFontSize={tickFontSize}
                  />
                ) : null}

                {plotType === "heatmap" ? (
                  heatmap.length ? (
                    <div className="overflow-x-auto pb-3">
                      <svg
                        className="mx-auto block shrink-0"
                        width={heatmapSvgWidth}
                        height={heatmapSvgHeight}
                        viewBox={`0 0 ${heatmapSvgWidth} ${heatmapSvgHeight}`}
                        role="img"
                        aria-label="Clustered correlation heatmap"
                      >
                        <rect
                          width={heatmapSvgWidth}
                          height={heatmapSvgHeight}
                          fill="#ffffff"
                        />
                        {heatmapDendrogramSegments.map((segment, index) => (
                          <line
                            key={`dendrogram-${index}`}
                            x1={segment.x1}
                            y1={segment.y1}
                            x2={segment.x2}
                            y2={segment.y2}
                            stroke="#111827"
                            strokeWidth={Math.max(1, axisLineWidth)}
                            vectorEffect="non-scaling-stroke"
                          />
                        ))}
                        {heatmapRowOrder.map((rowIndex, rowPosition) => {
                          const row = heatmap[rowIndex];
                          return (
                            <g key={`row-${rowIndex}`}>
                              {row.map((value, columnIndex) => (
                                <g
                                  key={`${rowIndex}-${columnIndex}`}
                                >
                                  <rect
                                    x={heatmapDendrogramWidth + columnIndex * heatmapCellSize}
                                    y={heatmapMatrixTop + rowPosition * heatmapCellSize}
                                    width={heatmapCellSize}
                                    height={heatmapCellSize}
                                    fill={correlationColor(value, heatmapPalette)}
                                    stroke="#ffffff"
                                    strokeWidth={0.8}
                                    shapeRendering="crispEdges"
                                  >
                                    <title>{`${activeHeatmapColumns[rowIndex]} × ${activeHeatmapColumns[columnIndex]}: r = ${formatNumber(value)}`}</title>
                                  </rect>
                                  {showHeatmapValues ? (
                                    <text
                                      x={
                                        heatmapDendrogramWidth +
                                        (columnIndex + 0.5) * heatmapCellSize
                                      }
                                      y={
                                        heatmapMatrixTop +
                                        (rowPosition + 0.5) * heatmapCellSize
                                      }
                                      fill={contrastingText(
                                        correlationColor(value, heatmapPalette),
                                      )}
                                      fontSize={Math.min(tickFontSize, heatmapCellSize * 0.27)}
                                      fontWeight={650}
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                      pointerEvents="none"
                                    >
                                      {formatNumber(value, 2)}
                                    </text>
                                  ) : null}
                                </g>
                              ))}
                              <text
                                x={heatmapDendrogramWidth + heatmapMatrixSize + 10}
                                y={
                                  heatmapMatrixTop + (rowPosition + 0.5) * heatmapCellSize
                                }
                                fill="#111827"
                                fontSize={tickFontSize}
                                fontWeight={600}
                                dominantBaseline="central"
                              >
                                {activeHeatmapColumns[rowIndex]}
                              </text>
                            </g>
                          );
                        })}
                        {activeHeatmapColumns.map((column, columnIndex) => {
                          const x =
                            heatmapDendrogramWidth + (columnIndex + 0.5) * heatmapCellSize;
                          const y = heatmapMatrixTop + heatmapMatrixSize + 9;
                          return (
                            <text
                              key={`column-${column}`}
                              x={x}
                              y={y}
                              fill="#111827"
                              fontSize={tickFontSize}
                              fontWeight={600}
                              textAnchor="start"
                              transform={`rotate(90 ${x} ${y})`}
                            >
                              {column}
                            </text>
                          );
                        })}
                      </svg>
                      <div
                        className="mx-auto mt-4 flex max-w-md items-center gap-3 text-xs text-muted-foreground"
                        style={{ fontSize: tickFontSize }}
                      >
                        <span>−1</span>
                        <div
                          className="h-2 flex-1 rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${heatmapPalettes[heatmapPalette].stops.join(", ")})`,
                          }}
                        />
                        <span>+1</span>
                      </div>
                    </div>
                  ) : (
                    <EmptyState text="Select at least two numeric variables for the heatmap." />
                  )
                ) : null}

                {plotType === "volcano" ? (
                  volcanoPoints.length ? (
                    <ChartContainer
                      config={chartConfig}
                      className="mx-auto shrink-0 aspect-auto"
                      style={{ width: plotWidth, height: plotHeight }}
                    >
                      <ScatterChart margin={{ top: 22, right: 28, bottom: 52, left: 24 }}>
                        {showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
                        <XAxis
                          type="number"
                          dataKey="x"
                          domain={volcanoXDomain}
                          tick={tickStyle}
                          axisLine={axisLineStyle}
                          tickLine={tickLineStyle}
                        >
                          <Label
                            value={displayXLabel}
                            position="bottom"
                            offset={30}
                            style={axisLabelStyle}
                          />
                        </XAxis>
                        <YAxis
                          type="number"
                          dataKey="y"
                          width={72}
                          domain={volcanoYDomain}
                          tick={tickStyle}
                          axisLine={axisLineStyle}
                          tickLine={tickLineStyle}
                        >
                          <Label
                            value={displayYLabel}
                            angle={-90}
                            position="insideLeft"
                            style={axisLabelStyle}
                          />
                        </YAxis>
                        <Tooltip
                          content={({ active, payload }) => {
                            const point = payload?.[0]?.payload;
                            if (!active || !point) return null;
                            return (
                              <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
                                <strong>{point.label}</strong>
                                <p className="mt-1 text-muted-foreground">
                                  Effect: {formatNumber(point.x)}
                                  {volcanoThresholdMetric === "precomputed-fdr" ? (
                                    <>
                                      <br />
                                      FDR/q = {point.fdr.toExponential(2)}
                                    </>
                                  ) : (
                                    <>
                                      <br />p = {point.p.toExponential(2)}
                                      <br />
                                      FDR = {point.fdr.toExponential(2)}
                                    </>
                                  )}
                                </p>
                              </div>
                            );
                          }}
                        />
                        {volcanoGroups.map(({ direction, points }) => (
                          <Scatter
                            key={direction}
                            name={direction}
                            data={points}
                            fill={
                              direction === "Up"
                                ? primaryColor
                                : direction === "Down"
                                  ? volcanoDownColor
                                  : volcanoNsColor
                            }
                            fillOpacity={direction === "NS" ? 0.48 : pointOpacity / 100}
                            shape={(props) => {
                              const payload = props.payload as (typeof volcanoPoints)[number];
                              const color =
                                payload.direction === "Up"
                                  ? primaryColor
                                  : payload.direction === "Down"
                                    ? volcanoDownColor
                                    : volcanoNsColor;
                              const specificallyRequested = requestedVolcanoLabels.has(
                                payload.label.trim().toLocaleLowerCase(),
                              );
                              return (
                                <g>
                                  <circle
                                    cx={Number(props.cx)}
                                    cy={Number(props.cy)}
                                    r={pointSize / 2}
                                    fill={color}
                                    stroke={specificallyRequested ? "#111827" : "none"}
                                    strokeWidth={specificallyRequested ? 1.5 : 0}
                                  />
                                  {specificallyRequested ? (
                                    <text
                                      x={
                                        Number(props.cx) +
                                        (payload.x > (volcanoXDomain[0] + volcanoXDomain[1]) / 2
                                          ? -6
                                          : 6)
                                      }
                                      y={Number(props.cy) < 24 ? Number(props.cy) + 14 : Number(props.cy) - 6}
                                      textAnchor={
                                        payload.x > (volcanoXDomain[0] + volcanoXDomain[1]) / 2
                                          ? "end"
                                          : "start"
                                      }
                                      fontSize={Math.max(9, tickFontSize - 2)}
                                      fill="#111827"
                                      fontWeight={specificallyRequested ? 700 : 400}
                                    >
                                      {payload.label}
                                    </text>
                                  ) : null}
                                </g>
                              );
                            }}
                          />
                        ))}
                        {useFoldThreshold ? (
                          <>
                            <ReferenceLine
                              x={foldThreshold}
                              stroke="#111827"
                              strokeDasharray="4 4"
                            />
                            <ReferenceLine
                              x={-foldThreshold}
                              stroke="#111827"
                              strokeDasharray="4 4"
                            />
                          </>
                        ) : null}
                        {useSignificanceThreshold ? (
                          <ReferenceLine
                            y={-Math.log10(Math.max(pThreshold, 1e-300))}
                            stroke="#111827"
                            strokeDasharray="4 4"
                          />
                        ) : null}
                        <Legend
                          verticalAlign="top"
                          align="right"
                          wrapperStyle={{ fontSize: legendFontSize }}
                        />
                      </ScatterChart>
                    </ChartContainer>
                  ) : (
                    <EmptyState text="Choose an effect-size column and a p-value or FDR column containing values between 0 and 1." />
                  )
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {!(["heatmap", "volcano", "sets", "pca", "dose"] as PlotType[]).includes(
              plotType,
            ) ? (
              <>
              <Card className="border-0 bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Statistical result</CardTitle>
                <CardDescription>
                  {testChoice === "auto"
                    ? `Automatically selected: ${suggestion.title}`
                    : "Manually selected analysis"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.effects.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Effect</TableHead>
                        <TableHead>df</TableHead>
                        <TableHead>F</TableHead>
                        <TableHead>p</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.effects.map((effect) => (
                        <TableRow key={effect.effect}>
                          <TableCell className="font-medium">{effect.effect}</TableCell>
                          <TableCell>
                            {effect.df1}, {effect.df2}
                          </TableCell>
                          <TableCell>{formatNumber(effect.f)}</TableCell>
                          <TableCell>{formatP(effect.p)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : selectedTest === "normality" ? (
                  <p className="text-sm text-muted-foreground">
                    Normality results and their interpretation are shown under Diagnostics.
                  </p>
                ) : ["heatmap", "volcano", "sets", "pca", "dose"].includes(plotType) ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {suggestion.reason}
                  </p>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-primary">
                      {analysis.result?.name ?? suggestion.title}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {testSummary(analysis.result)}
                    </p>
                    {analysis.result?.detail ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {analysis.result.detail}
                      </p>
                    ) : null}
                    {"icc" in (analysis.result ?? {}) ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estimated intraclass correlation:{" "}
                        {formatNumber((analysis.result as TestResult & { icc: number }).icc)}
                      </p>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Diagnostics</CardTitle>
                <CardDescription>
                  Shapiro–Wilk and, when n ≥ 20, D&apos;Agostino–Pearson K² use model residuals.
                  Outliers are flagged, not removed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`rounded-lg border px-3 py-3 ${normalityDiagnosis.className}`}>
                  <p className="text-sm font-semibold">{normalityDiagnosis.title}</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-80">
                    {normalityDiagnosis.detail}
                  </p>
                </div>
                {diagnostics.length
                  ? diagnostics.map((test) => (
                      <div
                        key={test.name}
                        className="flex flex-col gap-1 border-b border-border/70 pb-2 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div>
                          <span>{test.name}</span>
                          <p className="text-xs text-muted-foreground">{test.detail}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <span className="font-medium">
                            {test.statisticLabel} = {formatNumber(test.statistic)}; p{" "}
                            {formatP(test.p)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              test.p < 0.05
                                ? "bg-red-100 text-red-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {test.p < 0.05
                              ? "Evidence of non-normality"
                              : "Compatible with normality"}
                          </span>
                        </div>
                      </div>
                    ))
                  : null}
                <div className="flex items-center justify-between rounded-lg bg-muted/70 px-3 py-2 text-sm">
                  <span>Potential outliers</span>
                  <strong>{outliers.size}</strong>
                </div>
              </CardContent>
              </Card>
              </>
            ) : null}
          </div>

          {analysis.postHoc.length ? (
            <Card className="border-0 bg-card shadow-sm">
              <CardHeader>
                <div>
                  <CardTitle>Pairwise post-tests</CardTitle>
                  <CardDescription>
                    Showing the requested comparisons with {postHocAdjustmentLabel.toLowerCase()}{" "}
                    adjustment. Differences are calculated as the first group minus the second
                    group. For two-factor analyses, multiplicity is handled within each
                    simple-comparison family.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {analysis.postHoc.some((comparison) => comparison.context) ? (
                          <TableHead>Comparison context</TableHead>
                        ) : null}
                        <TableHead>Groups</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>n</TableHead>
                        <TableHead>Difference</TableHead>
                        <TableHead>Statistic</TableHead>
                        <TableHead>Raw p</TableHead>
                        <TableHead>
                          {postHocAdjustment === "none" ? "Reported p" : "Adjusted p"}
                        </TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.postHoc.map((comparison, index) => (
                        <TableRow
                          key={`${comparison.context ?? "overall"}-${comparison.first}-${comparison.second}-${index}`}
                        >
                          {analysis.postHoc.some((item) => item.context) ? (
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {comparison.context ?? "Overall"}
                            </TableCell>
                          ) : null}
                          <TableCell className="whitespace-nowrap font-medium">
                            {comparison.first} vs {comparison.second}
                          </TableCell>
                          <TableCell className="min-w-44 text-xs text-muted-foreground">
                            {comparison.method}
                          </TableCell>
                          <TableCell>{comparison.n ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap" title={comparison.estimateLabel}>
                            {formatNumber(comparison.estimate)}
                            <span className="block text-[10px] text-muted-foreground">
                              {comparison.estimateLabel}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {comparison.statisticLabel} = {formatNumber(comparison.statistic)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatP(comparison.p)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-semibold">
                            {formatP(comparison.adjustedP)}
                          </TableCell>
                          <TableCell
                            className={
                              comparison.adjustedP < 0.05
                                ? "whitespace-nowrap font-semibold text-primary"
                                : "whitespace-nowrap text-muted-foreground"
                            }
                          >
                            {significanceLabel(comparison.adjustedP)} ·{" "}
                            {comparison.adjustedP < 0.05 ? "Significant" : "Not significant"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Post-tests are displayed whether or not the omnibus result is significant so the
                  comparison output remains transparent. Interpret them according to the
                  prespecified analysis plan.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {["columns", "grouped", "distribution", "paired"].includes(plotType) ? (
            <Card className="border-0 bg-card shadow-sm">
              <CardHeader>
                <div>
                  <CardTitle>Descriptive statistics</CardTitle>
                  <CardDescription>
                    Calculated from complete observations for the selected outcome.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={downloadSummary}>
                  <Download aria-hidden="true" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      {plotType === "grouped" ? <TableHead>Dataset</TableHead> : null}
                      <TableHead>n</TableHead>
                      <TableHead>Mean</TableHead>
                      <TableHead>SD</TableHead>
                      <TableHead>SEM</TableHead>
                      <TableHead>Median</TableHead>
                      <TableHead>Range</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {descriptiveSummaries.map((summary) => (
                      <TableRow key={`${summary.group}-${summary.factor2 ?? ""}`}>
                        <TableCell className="font-medium">{summary.group}</TableCell>
                        {plotType === "grouped" && summary.factor2 ? (
                          <TableCell>{summary.factor2}</TableCell>
                        ) : null}
                        <TableCell>{summary.n}</TableCell>
                        <TableCell>{formatNumber(summary.mean)}</TableCell>
                        <TableCell>{formatNumber(summary.sd)}</TableCell>
                        <TableCell>{formatNumber(summary.sem)}</TableCell>
                        <TableCell>{formatNumber(summary.median)}</TableCell>
                        <TableCell>
                          {formatNumber(summary.min)}–{formatNumber(summary.max)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-white/70 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-1.5">
              <p>
                <strong className="text-foreground">Exploratory use:</strong> automated
                suggestions cannot determine the experimental unit or replace a prespecified
                analysis plan. Key calculations were benchmarked against R 4.6.1 on fixed
                reference datasets; method-specific limitations still apply.
              </p>
              <p>
                Version 1.2.0 · Updated 20 September 2026 ·{" "}
                <a
                  className="font-medium text-primary underline"
                  href="https://cariacolab.com/contact/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Report an error
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/35 px-6 text-center">
      <FileSpreadsheet className="size-8 text-primary" aria-hidden="true" />
      <p className="max-w-md text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
