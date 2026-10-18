---
version: 1
slug: "src-app-dashboard-page-tsx"
primary_target: "src/app/dashboard/page.tsx"
related_targets: []
---

## Surface

Route: `/dashboard`, the Overview and landing page for every session.
Mode: Operate. The visitor's job: see what moved across content, SEO, directories and press since they last looked, and jump to the channel that needs attention.

## Audience, job, and constraints

The Zedu in-house marketing team, checking in during their normal cadence. Job: compare this period with the last, spot the metric that changed, then open that channel. Constraints: real data only from the app's own tables (content items, SEO checks, press records); directory data is still mock. No external analytics connections yet. Pages migrate onto the new system one at a time, so the Overview is built first.

## Direction contract

THESIS: A FinSet-grade dashboard for Zedu's marketing: bold figures in rounded, hairline cards on a white workspace, framed by a deep Zedu-violet sidebar. It refuses the grey canvas of floating shadowed tiles, and the editorial hairline strip it replaces.

OWN-WORLD: White workspace; cards `rounded-[22px] border border-border`, no shadow; deep violet `#24145F` sidebar with a solid `#7D68F9` active pill; Manrope extrabold figures with faded decimals; delta chips tinted green or red; charts in `chart-1` violet and `chart-2` lavender on `chart-track`; Shopall-structured line chart with ringed points and a violet gradient area; table headers as a floating `bg-accent` pill bar.

STORY: Open the dashboard, read the greeting and period, scan four KPI cards and their deltas, see the weekly output chart and content mix, then follow an arrow button or a table row into the channel that needs work.

FIRST VIEWPORT: Header with "Welcome back, {name}!" left and the account pill right. Toolbar: period pill left, primary "Add content" pill right. A 4-up KPI row. Row 2: content-output bars (2/3) beside a content-mix donut (1/3). Content runs full width with 16px gaps.

FORM: User-pinned (FinSet primary, Shopall charts); no seed roll.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
