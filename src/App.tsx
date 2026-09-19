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
  welchTTest,
  wilcoxonSignedRankTest,
} from "@/lib/statistics";

type DataRow = Record<string, string>;
type PlotType = "columns" | "grouped" | "xy" | "heatmap" | "volcano";
type TestChoice =
  | "auto"
  | "welch"
  | "paired"
  | "mannwhitney"
  | "wilcoxon"
  | "oneway"
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
  const headers = records[0].map((header, index) => header || `column_${index + 1}`);
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
            ? pValues.map((p) => 1 - (1 - p) ** pValues.length)
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
      distance: bestDistance,
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
  const maximumDistance = root.distance || 1;
  const xForDistance = (distance: number) =>
    width - (Math.max(0, distance) / maximumDistance) * (width - 8);

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
  const [testChoice, setTestChoice] = useState<TestChoice>("auto");
  const [outlierMethod, setOutlierMethod] = useState<OutlierMethod>("mad");
  const [errorType, setErrorType] = useState<ErrorType>("sem");
  const [plotTitle, setPlotTitle] = useState("");
  const [xLabel, setXLabel] = useState("");
  const [yLabel, setYLabel] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#f92080");
  const [secondaryColor, setSecondaryColor] = useState("#111827");
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
  const [showLabels, setShowLabels] = useState(false);
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
      const sd = Math.sqrt(sampleVariance(values));
      const sem = sd / Math.sqrt(values.length);
      const errorValue = errorType === "sd" ? sd : errorType === "ci95" ? 1.96 * sem : sem;
      return {
        group: key,
        n: values.length,
        mean: average(values),
        sd,
        sem,
        median: median(values),
        min: Math.min(...values),
        max: Math.max(...values),
        error: errorValue,
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
      const sd = Math.sqrt(sampleVariance(values));
      const sem = sd / Math.sqrt(values.length);
      const errorValue = errorType === "sd" ? sd : errorType === "ci95" ? 1.96 * sem : sem;
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
        error: errorValue,
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
    if (plotType === "columns" || plotType === "grouped") {
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
  }, [plotType, regression, summaries, groupedSummaries, completeEntries]);

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
        : " Residual diagnostics do not show a clear normality problem.";
    if (plotType === "xy") {
      return nonNormal || outliers.size
        ? {
            test: "spearman" as TestChoice,
            title: "Spearman correlation",
            reason: `Two continuous variables with distributional concerns.${caution}`,
          }
        : {
            test: "pearson" as TestChoice,
            title: "Pearson correlation",
            reason: `Two continuous variables with an approximately linear relationship.${caution}`,
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
    if (factor2 !== "__none__") {
      return {
        test: "twoway" as TestChoice,
        title: "Two-way ANOVA",
        reason: `Two categorical factors are selected, including their interaction.${caution} For a non-parametric two-factor analysis, confirm an aligned-rank or permutation model in specialist software.`,
      };
    }
    if (summaries.length === 2 && hasRepeatedSubjects) {
      return nonNormal || outliers.size
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
      return nonNormal || outliers.size
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
      return nonNormal || outliers.size
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
    return nonNormal || outliers.size
      ? {
          test: "kruskal" as TestChoice,
          title: "Kruskal–Wallis test",
          reason: `More than two independent groups with distributional concerns.${caution}`,
        }
      : {
          test: "oneway" as TestChoice,
          title: "One-way ANOVA",
          reason: `More than two independent groups are selected.${caution}`,
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
      result = randomInterceptModel(
        completeEntries.map((entry) => entry.value),
        completeEntries.map((entry) => entry.group),
        completeEntries.map((entry) => entry.subject),
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

  const colourSeries =
    plotType === "columns"
      ? summaries.map((summary) => summary.group)
      : plotType === "grouped"
        ? factor2Levels
        : plotType === "xy"
          ? relationshipGroups.map(([name]) => name)
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
        : plotType === "xy"
          ? `${outcome} versus ${xVariable}`
          : plotType === "heatmap"
            ? "Correlation heatmap"
            : "Volcano plot");
  const displayXLabel =
    xLabel || (plotType === "xy" ? xVariable : plotType === "volcano" ? effectVariable : group);
  const volcanoMetricLabel = volcanoThresholdMetric === "p" ? "p" : "FDR";
  const displayYLabel =
    yLabel || (plotType === "volcano" ? `−log10(${volcanoMetricLabel})` : outcome);
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
    if (!nextRows.length || !nextNumbers.length) {
      setError("The file needs a header row and at least one numeric column.");
      return;
    }
    const likelyOutcome =
      nextNumbers.find((column) => !/dose|time|id/i.test(column)) ?? nextNumbers[0];
    const likelyP =
      nextNumbers.find((column) => /(^p$|p[_-]?value|pval|adj.*p)/i.test(column)) ?? "";
    const likelyEffect =
      nextNumbers.find((column) => /log2|effect|fold/i.test(column)) ?? nextNumbers[0];
    const likelyLabel =
      Object.keys(nextRows[0]).find((column) =>
        /gene|protein|metabolite|feature|sample|name|id/i.test(column),
      ) ?? Object.keys(nextRows[0])[0];
    setRows(nextRows);
    setFileName(nextName);
    if (syncEditor) setDataText(rowsToTabDelimited(nextRows));
    setOutcome(likelyOutcome);
    setXVariable(nextNumbers.find((column) => column !== likelyOutcome) ?? likelyOutcome);
    setGroup(nextCategories[0] ?? "__none__");
    setFactor2("__none__");
    setSubject("__none__");
    setEffectVariable(likelyEffect);
    setPVariable(likelyP);
    setLabelVariable(likelyLabel);
    setHeatmapColumns(nextNumbers.slice(0, 8));
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
    const likelyOutcome =
      nextNumbers.find((column) => !/dose|time|id/i.test(column)) ?? nextNumbers[0];
    setRows(parsed);
    setFileName("Live pasted data");
    setOutcome((current) => (nextNumbers.includes(current) ? current : likelyOutcome));
    setXVariable((current) =>
      nextNumbers.includes(current)
        ? current
        : (nextNumbers.find((column) => column !== likelyOutcome) ?? likelyOutcome),
    );
    setGroup((current) =>
      current === "__none__" || nextCategories.includes(current)
        ? current
        : (nextCategories[0] ?? "__none__"),
    );
    setFactor2((current) =>
      current === "__none__" || nextCategories.includes(current) ? current : "__none__",
    );
    setSubject((current) =>
      current === "__none__" || nextCategories.includes(current) ? current : "__none__",
    );
    setEffectVariable((current) => (nextNumbers.includes(current) ? current : nextNumbers[0]));
    setPVariable((current) =>
      nextNumbers.includes(current)
        ? current
        : (nextNumbers.find((column) => /(^p$|p[_-]?value|pval|adj.*p)/i.test(column)) ?? ""),
    );
    setLabelVariable((current) => (nextColumns.includes(current) ? current : nextColumns[0]));
    setHeatmapColumns((current) => {
      const retained = current.filter((column) => nextNumbers.includes(column));
      return retained.length >= 2 ? retained : nextNumbers.slice(0, 8);
    });
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
    { type: "xy", label: "XY & correlation", icon: Activity },
    { type: "heatmap", label: "Heatmap", icon: Grid3X3 },
    { type: "volcano", label: "Volcano", icon: Sparkles },
  ];

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

              {plotType !== "heatmap" && plotType !== "volcano" ? (
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
              {plotType === "xy" ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  X variable
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
              {plotType === "columns" || plotType === "grouped" || plotType === "xy" ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  {plotType === "grouped"
                    ? "X-axis groups"
                    : plotType === "columns"
                      ? "Column groups"
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
                <label className="grid gap-1.5 text-xs font-medium">
                  Up / highlight colour
                  <Input
                    type="color"
                    className="h-9 p-1"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                  />
                </label>
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
                {plotType === "columns" || plotType === "grouped" ? (
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={showPoints}
                      onCheckedChange={(checked) => setShowPoints(Boolean(checked))}
                    />{" "}
                    Show individual observations
                  </label>
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
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={showLabels}
                      onCheckedChange={(checked) => setShowLabels(Boolean(checked))}
                    />{" "}
                    Label significant features
                  </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={showLabels}
                        onCheckedChange={(checked) => setShowLabels(Boolean(checked))}
                      />{" "}
                      Label all significant features
                    </label>
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
                {plotType !== "heatmap" && plotType !== "volcano" ? (
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
                    <NativeSelectOption value="ci95">Approx. 95% CI</NativeSelectOption>
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
                          <NativeSelectOption value="holm">Holm (recommended)</NativeSelectOption>
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
                  {categories
                    .filter((column) => column !== group && column !== factor2)
                    .map((column) => (
                      <NativeSelectOption key={column} value={column}>
                        {column}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
              </label>
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
                    {plotType === "xy" && `${relationshipPoints.length} complete XY pairs`}
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
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto shrink-0 aspect-auto"
                    style={{ width: plotWidth, height: plotHeight }}
                  >
                    <ComposedChart
                      data={summaries}
                      margin={{ top: 22, right: 24, bottom: 52, left: 24 }}
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
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ fontSize: legendFontSize }}
                      />
                    </ComposedChart>
                  </ChartContainer>
                ) : null}

                {plotType === "grouped" ? (
                  factor2 !== "__none__" && factor2Levels.length ? (
                    <ChartContainer
                      config={chartConfig}
                      className="mx-auto shrink-0 aspect-auto"
                      style={{ width: plotWidth, height: plotHeight }}
                    >
                      <ComposedChart
                        data={groupedChartData}
                        barCategoryGap="20%"
                        barGap={3}
                        margin={{ top: 22, right: 24, bottom: 52, left: 24 }}
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
                  ) : (
                    <EmptyState text="Choose a second categorical factor to create side-by-side grouped datasets." />
                  )
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
                          domain={[0, "auto"]}
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
                                  ? "#3f526d"
                                  : "#b9bdc5"
                            }
                            fillOpacity={direction === "NS" ? 0.48 : pointOpacity / 100}
                            shape={(props) => {
                              const payload = props.payload as (typeof volcanoPoints)[number];
                              const color =
                                payload.direction === "Up"
                                  ? primaryColor
                                  : payload.direction === "Down"
                                    ? "#3f526d"
                                    : "#b9bdc5";
                              const specificallyRequested = requestedVolcanoLabels.has(
                                payload.label.trim().toLocaleLowerCase(),
                              );
                              const shouldShowLabel =
                                specificallyRequested ||
                                (showLabels && payload.direction !== "NS");
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
                                  {showLabels && payload.direction !== "NS" ? (
                                  {shouldShowLabel ? (
                                    <text
                                      x={Number(props.cx) + 5}
                                      y={Number(props.cy) - 5}
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
                ) : plotType === "heatmap" || plotType === "volcano" ? (
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
                  Shapiro–Wilk and, when n ≥ 8, D&apos;Agostino–Pearson K² use model residuals.
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

          {plotType === "columns" || plotType === "grouped" ? (
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
                Version 1.0.1 · Updated 18 September 2026 ·{" "}
                <a className="font-medium text-primary underline" href="/validation.html">
                  Methods and benchmark
                </a>{" "}
                ·{" "}
                Version 1.0.2 · Updated 19 September 2026 ·{" "}
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
