import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  ArrowUpRightIcon,
  CircleCheckIcon,
  FileTextIcon,
  NewspaperIcon,
  ScanSearchIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { ChartLegend, GroupedWeeklyBars, countPerWeek, lastWeeks } from "@/components/charts/WeeklyCharts";
import { KpiCard, KpiGrid } from "@/components/KpiCard";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todoList } from "@/lib/seo/scoring";
import type { CheckResult } from "@/lib/seo/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const WEEKS = 8;
const CLOSED_SUBMISSION = ["Published", "Rejected", "Withdrawn"] as const;

const shortDate = (value: Date) =>
  value.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

type AttentionItem = {
  id: string;
  channel: "Press" | "SEO" | "Content";
  tone: "warning" | "destructive";
  title: string;
  detail: string;
  href: string;
  rank: number;
};

const CHANNEL_ICON: Record<AttentionItem["channel"], LucideIcon> = {
  Press: NewspaperIcon,
  SEO: ScanSearchIcon,
  Content: FileTextIcon,
};

type UpcomingItem = {
  id: string;
  date: Date;
  title: string;
  meta: string;
  overdue: boolean;
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? "";
  const firstName = session?.user?.name?.split(" ")[0];

  const [content, latestCheck, coverage, featuredPitches, openSubmissions, pitchStatuses] = await Promise.all([
    prisma.contentItem.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        type: true,
        platform: true,
        status: true,
        createdDate: true,
        publishDate: true,
        updatedAt: true,
      },
      orderBy: [{ createdDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.seoCheck.findFirst({
      orderBy: { createdAt: "desc" },
      select: { score: true, url: true, normalizedUrl: true, createdAt: true, results: true },
    }),
    prisma.pressCoverage.findMany({ select: { outlet: true, publicationDate: true } }),
    // Older pitches marked Published without their own coverage record still count as features.
    prisma.pressSubmission.findMany({ where: { status: "Published", coverageId: null }, select: { outlet: true } }),
    prisma.pressSubmission.findMany({
      where: { status: { notIn: [...CLOSED_SUBMISSION] } },
      select: { id: true, title: true, outlet: true, status: true, followUpDate: true },
    }),
    prisma.pressSubmission.groupBy({ by: ["status"], where: { coverageId: null }, _count: { _all: true } }),
  ]);

  const previousCheck = latestCheck
    ? await prisma.seoCheck.findFirst({
        where: { normalizedUrl: latestCheck.normalizedUrl, createdAt: { lt: latestCheck.createdAt } },
        orderBy: { createdAt: "desc" },
        select: { score: true },
      })
    : null;

  const today = startOfUtcDay(new Date());
  const monthAgo = new Date(today.getTime() - 30 * DAY);
  const published = content.filter((item) => item.status === "Published");
  const publishedThisMonth = published.filter((item) => item.publishDate && item.publishDate >= monthAgo).length;
  const inPipeline = content.filter((item) => item.status === "Draft" || item.status === "Scheduled").length;
  const scheduledAhead = content.filter(
    (item) => item.status === "Scheduled" && item.publishDate && item.publishDate >= today
  ).length;
  const outletsFeatured = new Set(
    [...coverage, ...featuredPitches].map((item) => item.outlet.trim().toLocaleLowerCase()).filter(Boolean)
  ).size;
  const piecesOfCoverage = coverage.length + featuredPitches.length;
  const scoreChange = latestCheck && previousCheck ? latestCheck.score - previousCheck.score : null;

  const pitchCount = (...statuses: string[]) =>
    pitchStatuses.filter((group) => statuses.includes(group.status)).reduce((sum, group) => sum + group._count._all, 0);
  const funnel = [
    { stage: "Targets", hint: "Not pitched yet", count: pitchCount("Draft"), bar: "bg-chart-2" },
    {
      stage: "Pitched",
      hint: "Waiting on the outlet",
      count: pitchCount("Submitted", "UnderReview", "ChangesRequested", "Accepted"),
      bar: "bg-primary/60",
    },
    { stage: "Featured", hint: "Published", count: piecesOfCoverage, bar: "bg-primary" },
  ];
  const funnelMax = Math.max(1, ...funnel.map((step) => step.count));
  const closedPitches = pitchCount("Rejected", "Withdrawn");
  const followUpsDue = openSubmissions.filter((item) => item.followUpDate && item.followUpDate <= today).length;

  const weeks = lastWeeks(WEEKS, today);
  const createdInRange = countPerWeek(weeks, content.map((item) => item.createdDate)).reduce((sum, n) => sum + n, 0);
  const publishedPerWeek = countPerWeek(
    weeks,
    published.flatMap((item) => (item.publishDate ? [item.publishDate] : []))
  );
  const coveragePerWeek = countPerWeek(
    weeks,
    coverage.flatMap((item) => (item.publicationDate ? [item.publicationDate] : []))
  );
  const shippedInRange = publishedPerWeek.reduce((sum, n) => sum + n, 0);
  const coverageInRange = coveragePerWeek.reduce((sum, n) => sum + n, 0);

  const upcoming: UpcomingItem[] = [
    ...content
      .filter((item) => item.publishDate && item.publishDate >= today && item.status !== "Published")
      .map((item) => ({
        id: `content-${item.id}`,
        date: item.publishDate as Date,
        title: item.title || "Untitled",
        meta: `Publish · ${item.platform || item.type || "content"}`,
        overdue: false,
      })),
    ...openSubmissions
      .filter((item) => item.followUpDate)
      .map((item) => ({
        id: `press-${item.id}`,
        date: item.followUpDate as Date,
        title: item.title,
        meta: `Follow up · ${item.outlet}`,
        overdue: (item.followUpDate as Date) < today,
      })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  const seoHost = latestCheck ? hostOf(latestCheck.url) : null;

  const daysSince = (date: Date) => Math.floor((today.getTime() - startOfUtcDay(date).getTime()) / DAY);
  const attention: AttentionItem[] = [];
  for (const pitch of openSubmissions) {
    if (pitch.status !== "Draft" && pitch.followUpDate && pitch.followUpDate < today) {
      const late = daysSince(pitch.followUpDate);
      attention.push({
        id: `follow-up-${pitch.id}`,
        channel: "Press",
        tone: "warning",
        title: `Follow up with ${pitch.outlet}`,
        detail: `${pitch.title || "Pitch"} · ${late} ${late === 1 ? "day" : "days"} overdue`,
        href: "/dashboard/media",
        rank: 0,
      });
    }
    if (pitch.status === "ChangesRequested") {
      attention.push({
        id: `changes-${pitch.id}`,
        channel: "Press",
        tone: "warning",
        title: `${pitch.outlet} asked for changes`,
        detail: pitch.title || "Pitch",
        href: "/dashboard/media",
        rank: 1,
      });
    }
  }
  if (latestCheck && seoHost) {
    const errors = todoList(latestCheck.results as unknown as CheckResult[]).filter(
      (result) => result.severity === "error" && result.outcome === "fail"
    );
    errors.slice(0, 2).forEach((result, index) =>
      attention.push({
        id: `seo-${result.id}`,
        channel: "SEO",
        tone: "destructive",
        title: result.label,
        detail: `${seoHost} · SEO error ${index + 1} of ${errors.length}`,
        href: "/dashboard/seo",
        rank: 0,
      })
    );
    const age = daysSince(latestCheck.createdAt);
    if (age >= 7) {
      attention.push({
        id: "seo-stale",
        channel: "SEO",
        tone: "warning",
        title: `SEO check is ${age} days old`,
        detail: `Run a fresh check of ${seoHost}`,
        href: "/dashboard/seo",
        rank: 2,
      });
    }
  }
  for (const item of content) {
    if (item.status === "Scheduled" && item.publishDate && item.publishDate < today) {
      attention.push({
        id: `missed-${item.id}`,
        channel: "Content",
        tone: "destructive",
        title: `Missed publish date: ${item.title || "Untitled"}`,
        detail: `Was scheduled for ${shortDate(item.publishDate)}`,
        href: "/dashboard/content",
        rank: 0,
      });
    }
    const idle = daysSince(item.updatedAt);
    if (item.status === "Draft" && idle >= 30) {
      attention.push({
        id: `stale-${item.id}`,
        channel: "Content",
        tone: "warning",
        title: `Draft untouched for ${idle} days`,
        detail: item.title || "Untitled",
        href: "/dashboard/content",
        rank: 2,
      });
    }
  }
  attention.sort((a, b) => a.rank - b.rank);
  const attentionShown = attention.slice(0, 8);

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Overview"}
        description="Content, SEO, directories and press for Zedu at a glance."
        actions={
          <Button aria-disabled="true" title="AI summaries are coming soon">
            <SparklesIcon data-icon="inline-start" aria-hidden="true" />
            Generate AI summary
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px] font-semibold">Soon</span>
          </Button>
        }
      />

      <PageContent>
        <KpiGrid>
          <KpiCard
            title="Content published"
            value={published.length.toLocaleString()}
            delta={{
              label: `+${publishedThisMonth}`,
              direction: publishedThisMonth > 0 ? "up" : "flat",
              favorable: true,
            }}
            comparison="in the last 30 days"
            action={{ label: "Open content", href: "/dashboard/content" }}
          />
          <KpiCard
            title="Content in progress"
            value={inPipeline.toLocaleString()}
            context={
              scheduledAhead > 0
                ? `${scheduledAhead} scheduled to publish`
                : `${createdInRange.toLocaleString()} created in the last ${WEEKS} weeks`
            }
            action={{ label: "Open content", href: "/dashboard/content" }}
          />
          <KpiCard
            title="SEO score"
            value={latestCheck ? `${latestCheck.score}` : "–"}
            decimals={latestCheck ? "%" : undefined}
            delta={
              scoreChange === null
                ? undefined
                : {
                    label: `${scoreChange > 0 ? "+" : scoreChange < 0 ? "−" : ""}${Math.abs(scoreChange)} pts`,
                    direction: scoreChange > 0 ? "up" : scoreChange < 0 ? "down" : "flat",
                    favorable: scoreChange >= 0,
                  }
            }
            comparison="since the last check"
            context={seoHost ? `${seoHost} · checked ${shortDate(latestCheck!.createdAt)}` : "No pages checked yet"}
            action={{ label: "Open the SEO checker", href: "/dashboard/seo" }}
          />
          <KpiCard
            title="Outlets featured in"
            value={outletsFeatured.toLocaleString()}
            context={
              followUpsDue > 0 ? (
                <span className="font-semibold text-warning">
                  {followUpsDue} press {followUpsDue === 1 ? "follow-up" : "follow-ups"} due
                </span>
              ) : (
                `${piecesOfCoverage.toLocaleString()} ${piecesOfCoverage === 1 ? "piece" : "pieces"} of coverage`
              )
            }
            action={{ label: "Open Press & Media", href: "/dashboard/media" }}
          />
        </KpiGrid>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Momentum</CardTitle>
              <CardDescription>Content published and new press coverage, last {WEEKS} weeks</CardDescription>
              <CardAction className="flex items-baseline gap-4 text-right">
                <span className="flex flex-col">
                  <span className="text-[22px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">{shippedInRange}</span>
                  <span className="mt-1 text-xs text-muted-foreground">published</span>
                </span>
                <span className="flex flex-col">
                  <span className="text-[22px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">{coverageInRange}</span>
                  <span className="mt-1 text-xs text-muted-foreground">features</span>
                </span>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ChartLegend
                series={[
                  { name: "Content published", color: "chart-1" },
                  { name: "Press coverage", color: "chart-2" },
                ]}
              />
              <GroupedWeeklyBars
                weeks={weeks}
                label={`Content published and press coverage per week over the last ${WEEKS} weeks`}
                series={[
                  { name: "Content published", counts: publishedPerWeek, color: "chart-1" },
                  { name: "Press coverage", counts: coveragePerWeek, color: "chart-2" },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coming up</CardTitle>
              <CardDescription>Publish dates and press follow-ups</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="m-0 py-6 text-center text-[13px] text-muted-foreground">Nothing scheduled yet.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {upcoming.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
                      <span
                        className={cn(
                          "flex size-11 shrink-0 flex-col items-center justify-center rounded-xl leading-none",
                          item.overdue ? "bg-warning-muted text-warning" : "bg-accent text-accent-foreground"
                        )}
                      >
                        <span className="text-[15px] font-extrabold tabular-nums">{item.date.getUTCDate()}</span>
                        <span className="mt-0.5 text-2xs font-bold uppercase">
                          {item.date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[13px] font-semibold text-foreground">{item.title}</p>
                        <p className="m-0 truncate text-xs text-muted-foreground">{item.meta}</p>
                      </div>
                      {item.overdue && <Badge variant="warning">Overdue</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>What&apos;s slipping across content, SEO and press</CardDescription>
              {attention.length > 0 && (
                <CardAction>
                  <Badge variant="warning">
                    {attention.length} {attention.length === 1 ? "item" : "items"}
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              {attention.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl bg-success-muted/60 px-4 py-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-success-muted text-success">
                    <CircleCheckIcon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="m-0 text-sm font-semibold text-foreground">All clear</p>
                    <p className="m-0 text-xs text-muted-foreground">Nothing is overdue or broken right now.</p>
                  </div>
                </div>
              ) : (
                <ul className="m-0 grid list-none gap-2 p-0 xl:grid-cols-2">
                  {attentionShown.map((item) => {
                    const Icon = CHANNEL_ICON[item.channel];
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="group/item flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-3 no-underline transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl",
                              item.tone === "destructive" ? "bg-destructive-muted text-destructive" : "bg-warning-muted text-warning"
                            )}
                          >
                            <Icon className="size-4.5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.channel} · {item.detail}
                            </span>
                          </span>
                          <ArrowUpRightIcon
                            className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/item:text-foreground"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              {attention.length > attentionShown.length && (
                <p className="m-0 mt-3 text-xs text-muted-foreground">
                  Showing the {attentionShown.length} most urgent of {attention.length}.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Press funnel</CardTitle>
              <CardDescription>From target outlet to published feature</CardDescription>
              <CardAction>
                <Button asChild variant="outline" size="icon">
                  <Link href="/dashboard/media" aria-label="Open Press & Media" title="Open Press & Media">
                    <ArrowUpRightIcon aria-hidden="true" />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ol className="m-0 flex list-none flex-col gap-4 p-0">
                {funnel.map((step) => (
                  <li key={step.stage} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{step.stage}</span>
                        <span className="text-xs text-muted-foreground">{step.hint}</span>
                      </span>
                      <span className="text-[22px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">{step.count}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-chart-track" aria-hidden="true">
                      <div
                        className={cn("h-full rounded-full", step.bar, step.count === 0 && "opacity-0")}
                        style={{ width: `${Math.max(4, (step.count / funnelMax) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
              <p className="m-0 border-t border-border pt-3 text-xs text-muted-foreground">
                {closedPitches > 0
                  ? `${closedPitches} ${closedPitches === 1 ? "pitch" : "pitches"} closed (rejected or withdrawn)`
                  : "No pitches have been rejected or withdrawn"}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
