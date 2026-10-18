"use client";

import { Fragment, useState, useTransition, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_LABELS, CATEGORY_ORDER, IMPORTANCE_LABEL, scoreLabel } from "@/lib/seo/config";
import { todoList } from "@/lib/seo/scoring";
import type { CategoryId, Outcome, Severity } from "@/lib/seo/types";
import { cn } from "@/lib/utils";
import { openCheck, runCheck, type ActionResult } from "./actions";
import type { SeoView } from "./data";

const card = "rounded-2xl bg-card p-5 shadow-[0_1px_2px_rgb(21_21_31/0.04)] ring-1 ring-border sm:p-6";
const h2 = "m-0 text-[15px] font-bold tracking-[-0.02em]";
const hint = "text-xs text-muted-foreground";

const TONE = { ok: "text-success", warn: "text-warning", err: "text-destructive", tip: "text-primary-deep" };

const OUTCOME: Record<Outcome, { text: string; cls: string }> = {
  pass: { text: "✓ Pass", cls: TONE.ok },
  warn: { text: "▲ Needs work", cls: TONE.warn },
  fail: { text: "✕ Fail", cls: TONE.err },
};
const SEVERITY: Record<Severity, { text: string; cls: string }> = {
  error: { text: "✕ Error", cls: TONE.err },
  warning: { text: "▲ Warning", cls: TONE.warn },
  tip: { text: "● Tip", cls: TONE.tip },
};

const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function SeoChecker({ initial }: { initial: SeoView | null }) {
  const [view, setView] = useState<SeoView | null>(initial);
  const [url, setUrl] = useState(initial?.check.url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState<CategoryId>("meta");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  function apply(r: ActionResult, done: string) {
    if (r.ok) {
      setView(r.view);
      setUrl(r.view.check.url);
      setError(null);
      setOpen(new Set());
      setStatus(done);
    } else {
      setError(r.error);
      setStatus("");
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("Running check…");
    setError(null);
    start(async () => apply(await runCheck({ url }), "Check complete."));
  }

  function toggle(id: string) {
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const c = view?.check;
  const todo = c ? todoList(c.results) : [];
  const rows = c ? c.results.filter((r) => r.category === filter) : [];
  const delta = c && view?.previous ? c.score - view.previous.score : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <form onSubmit={submit} className={cn(card, "flex flex-wrap items-end gap-3")}>
        <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
          <Label htmlFor="seo-url">Page address</Label>
          <Input
            id="seo-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "seo-error" : undefined}
          />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Spinner aria-hidden="true" />}
          {pending ? "Checking…" : "Run check"}
        </Button>
      </form>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {error && (
        <Alert variant="destructive" id="seo-error">
          <AlertDescription>✕ {error}</AlertDescription>
        </Alert>
      )}

      {!c && !error && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No checks yet</EmptyTitle>
            <EmptyDescription>
              Enter a page address above and press “Run check”. You’ll get a score, a prioritised to-do list and a full list of checks. Each check is saved, so you can see whether the page improves.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {c && view && (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className={card} aria-labelledby="score-h">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h2 id="score-h" className={h2}>On-page score</h2>
                <span className={hint}>Checked {date(c.createdAt)} · {c.errorCount} {c.errorCount === 1 ? "error" : "errors"} found</span>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-5">
                <div
                  className="flex size-36 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(var(--primary) 0 ${c.score}%, var(--chart-track) 0)` }}
                >
                  <div className="flex size-26 flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-3xl leading-none font-bold tracking-[-0.03em] tabular-nums">{c.score}%</span>
                    <span className={cn("mt-1 text-xs font-semibold", c.score >= 80 ? TONE.ok : c.score >= 50 ? TONE.warn : TONE.err)}>
                      {scoreLabel(c.score)}
                    </span>
                  </div>
                </div>
                <div className="flex min-w-[240px] flex-1 flex-col gap-2.5 text-[13px]">
                  {delta !== null && view.previous && (
                    <p className={cn("m-0 text-xs font-medium", delta > 0 ? TONE.ok : delta < 0 ? TONE.warn : "text-muted-foreground")}>
                      {delta > 0 ? `▲ ${delta} points` : delta < 0 ? `▼ ${-delta} points` : "No change"} since the check on {date(view.previous.createdAt)}
                    </p>
                  )}
                  {CATEGORY_ORDER.map((k) => (
                    <div key={k} className="grid grid-cols-[110px_1fr_40px] items-center gap-3">
                      <span>{CATEGORY_LABELS[k]}</span>
                      <div className="h-2.5 rounded-full bg-chart-track" aria-hidden="true">
                        <div className="h-2.5 rounded-full bg-primary" style={{ width: `${c.categoryScores[k] ?? 0}%` }} />
                      </div>
                      <span className="text-right font-semibold tabular-nums">{c.categoryScores[k] === null ? "—" : `${c.categoryScores[k]}%`}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[110px_1fr] items-center gap-3">
                    <span>External factors</span>
                    <span className={hint}>Not included in version one</span>
                  </div>
                </div>
              </div>
            </section>

            <aside className={card} aria-labelledby="hist-h">
              <h2 id="hist-h" className={h2}>Score history</h2>
              <p className={cn(hint, "mt-1")}>Saved checks of this page</p>
              <ul className="mt-3 m-0 flex list-none flex-col gap-0.5 p-0">
                {view.history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      aria-current={h.id === c.id ? "true" : undefined}
                      onClick={() => start(async () => apply(await openCheck(h.id), `Showing the check from ${date(h.createdAt)}.`))}
                      className="grid min-h-9 w-full cursor-pointer grid-cols-[52px_1fr_40px] items-center gap-3 rounded-lg px-2 text-left text-[13px] outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=true]:bg-accent"
                    >
                      <span className="text-muted-foreground">{date(h.createdAt)}</span>
                      <span className="h-2.5 rounded-full bg-chart-track" aria-hidden="true">
                        <span className="block h-2.5 rounded-full bg-primary/50" style={{ width: `${h.score}%` }} />
                      </span>
                      <span className="text-right font-semibold tabular-nums">{h.score}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>

          <section className={card} aria-labelledby="snap-h">
            <h2 id="snap-h" className={h2}>Page snapshot</h2>
            <dl className="m-0 mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Meta title", c.snapshot.title ?? "None found"],
                ["Meta description", c.snapshot.description ?? "None found"],
                ["URL", c.snapshot.finalUrl],
                ["Status code", String(c.snapshot.statusCode)],
                ["Indexable", c.snapshot.indexable ? "Yes" : "No"],
                ["Language", c.snapshot.language ?? "Not set"],
                ["Response time", `${(c.snapshot.responseTimeMs / 1000).toFixed(2)} sec`],
                ["File size", `${Math.round(c.snapshot.sizeBytes / 1000)} kB`],
                ["Word count", String(c.snapshot.wordCount)],
                ["Links", `${c.snapshot.internalLinks} internal, ${c.snapshot.externalLinks} external`],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className={hint}>{k}</dt>
                  <dd className="m-0 mt-0.5 text-[13px] font-medium break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={card} aria-labelledby="todo-h">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h2 id="todo-h" className={h2}>To-do list</h2>
              <span className={hint}>Sorted by priority</span>
            </div>
            {todo.length === 0 ? (
              <p className={cn("mt-4 mb-0 text-[13px] font-medium", TONE.ok)}>✓ Nothing to fix. Every check passed.</p>
            ) : (
              <Table className="mt-2 min-w-[520px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-0 text-xs text-muted-foreground">To do</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Importance</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todo.map((t) => (
                    <Fragment key={t.id}>
                      <TableRow>
                        <TableCell className="py-3 pl-0 text-[13px] whitespace-normal">{t.label}</TableCell>
                        <TableCell className={cn("text-xs font-semibold", SEVERITY[t.severity].cls)}>{SEVERITY[t.severity].text}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            aria-expanded={open.has(t.id)}
                            aria-controls={`todo-${t.id}`}
                            onClick={() => toggle(t.id)}
                            className="px-0 text-primary-deep"
                          >
                            {open.has(t.id) ? "Hide details" : "More details"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {open.has(t.id) && (
                        <TableRow id={`todo-${t.id}`} className="bg-muted/60 hover:bg-muted/60">
                          <TableCell colSpan={3} className="px-4 py-3 text-[13px] leading-relaxed whitespace-normal">
                            <strong>What we found:</strong> {t.detail}
                            <br />
                            <strong>How to fix it:</strong> {t.fix}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section className={card} aria-labelledby="checks-h">
            <h2 id="checks-h" className={h2}>Detailed checks</h2>
            <div className="mt-3 mb-2 flex flex-wrap gap-2" role="group" aria-label="Filter checks by area">
              {CATEGORY_ORDER.map((k) => (
                <Button
                  key={k}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={filter === k}
                  onClick={() => setFilter(k)}
                  className="rounded-full aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-primary-deep"
                >
                  {CATEGORY_LABELS[k]}
                </Button>
              ))}
            </div>
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-0 text-xs text-muted-foreground">Check</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Result</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Importance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="py-3 pl-0 align-top text-[13px] whitespace-normal">
                      {r.label}
                      <div className={cn(hint, "mt-0.5")}>{r.detail}</div>
                    </TableCell>
                    <TableCell className={cn("align-top text-xs font-semibold", OUTCOME[r.outcome].cls)}>{OUTCOME[r.outcome].text}</TableCell>
                    <TableCell className={cn("align-top", hint)}>{IMPORTANCE_LABEL[r.severity]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </>
      )}
    </div>
  );
}
