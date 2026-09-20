# Cariaco Lab Data Explorer

Independent, static version of the Cariaco Lab Data Explorer. It does not use
ChatGPT, the OpenAI API, a database, or an application server. Uploaded and
pasted datasets are processed in the visitor's browser.

Version 1.1.5, updated 20 September 2026. See [VALIDATION.md](VALIDATION.md)
for the implemented-method assumptions, the reproducible R benchmark, and the
remaining limitations.

## Included visualization tools

- Column and grouped plots with individual observations, error bars, and selected post-test annotations
- Box-and-whisker and violin distribution plots
- Paired/repeated-measure trajectory plots
- XY plots with correlations and regression lines
- Exploratory four-parameter dose-response curves
- Standardized PCA score plots with loadings
- Correlation heatmaps with hierarchical row clustering
- Volcano plots with independent Up, Down, and NS colours and selected labels
- Venn diagrams for two or three sets and UpSet plots for larger intersections

## Local development

Requirements: Node.js 22 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

## Production build

```bash
pnpm build
```

The deployable static website is generated in `dist/`.

## Reproduce the statistical benchmark

The benchmark requires R 4.6.1 with `car`, `jsonlite`, `nlme`, and `rstatix`,
plus Python 3 for the comparison report.

```bash
mkdir -p validation/results
pnpm validate:app
pnpm validate:r
pnpm validate:compare
```

This is a reference benchmark, not an independent or regulated software
validation. Do not delete or weaken the method-specific cautions in the user
interface.

## Free deployment with Cloudflare Pages

1. Put the contents of this folder in a GitHub repository.
2. In Cloudflare, open **Workers & Pages** and create a **Pages** project.
3. Connect the GitHub repository.
4. Use production branch `main`, build command `pnpm build`, and output
   directory `dist`.
5. Deploy and test the generated `pages.dev` address.
6. Optionally add `data.cariacolab.com` under **Custom domains**.

## Add it to the main website

The preferred integration is a normal link:

```html
<a href="https://data.cariacolab.com" target="_blank" rel="noopener">
  Open Data Explorer
</a>
```

It can also be embedded:

```html
<iframe
  src="https://data.cariacolab.com"
  title="Cariaco Lab Data Explorer"
  style="width:100%; height:1100px; border:0; border-radius:16px;"
  loading="lazy"
></iframe>
```
