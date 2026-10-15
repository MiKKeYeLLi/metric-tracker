---
version: 1
slug: "src-app-dashboard-page-tsx"
primary_target: "src/app/dashboard/page.tsx"
related_targets: []
---

## Surface

Route: `/dashboard` — the submissions overview, the landing page for every session.
Mode: Operate. The visitor's job: check what was submitted, to which directories, in what state.

## Audience, job, and constraints

In-house marketing team. Job: track directory submission status across multiple products and directories at a glance, and identify anything stuck in pending or review. Constraint: illustrative data only in v1; data connections are a later milestone.

## Direction contract

THESIS: A canon submission tracker at Attio + PostHog craft level. Strong sidebar organizing directories and products; a KPI strip at the top; a dense, clean submissions table as the primary working surface. The hero-metric tile with sparkline standing in for content is refused. The category default is executed at full fidelity, not as a fallback — convention becomes the commitment.

OWN-WORLD: Near-white surface (#FAFAF9), slightly warmer sidebar (#F3F1EE), white sheets, violet (#8E6AFA) marks the active sidebar item and primary actions. Manrope for all UI text. JetBrains Mono for every numeric value, ID, and monospace context. Status system: green=live, amber=pending, blue=in-review, red=rejected — semantic color with tinted pill backgrounds. Structural lines at 1px #E5E3DF. Active nav item: 2px violet inset left rule + violet-deep text, no filled pill. No card grid, no colored border-left > 1px, no decorative shadows.

STORY: Team opens the dashboard, sees their submission counts in the KPI strip, scans the table for anything pending or in-review, filters by directory from the sidebar, and adds a new submission from the top right.

FIRST VIEWPORT: Sticky header (56px) with page title "Submissions", date-range label, ghost filter button and solid violet "New Submission" button. Below: 4-column KPI strip (Directories / Products / Submissions / Traffic) as a horizontal data row with 1px separators — not card tiles. Below KPI: 2-column grid — left (~65%): submissions table (Product, Directory, Status, Submitted, Traffic, row action); right (~35%): directory breakdown panel with per-directory live/pending/rejected dot indicators and counts.

FORM: Canon. Position 0 after user selection. Seed key: c70debdc (degraded run).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
