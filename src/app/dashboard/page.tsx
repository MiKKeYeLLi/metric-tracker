import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  ArrowUpRightIcon,
  FileTextIcon,
  NewspaperIcon,
  PlusIcon,
  ScanSearchIcon,
  SendIcon,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { StatCard, StatGrid } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const WEEKS = 8;
const CLOSED_SUBMISSION = ["Published", "Rejected", "Withdrawn"] as const;

const CONTENT_BADGE: Record<string, "success" | "info" | "warning" | "secondary"> = {
  Published: "success",
  Scheduled: "info",
  Draft: "warning",
};

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

function startOfUtcWeek(value: Date) {
  const day = startOfUtcDay(value);
  return new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY);
}

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

  const [content, latestCheck, coverageCount, openSubmissions] = await Promise.all([
    prisma.contentItem.findMany({
      where: { userId },
      select: { id: true, title: true, type: true, platform: true, status: true, createdDate: true, publishDate: true },
      orderBy: [{ createdDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.seoCheck.findFirst({
      orderBy: { createdAt: "desc" },
      select: { score: true, url: true, createdAt: true },
    }),
    prisma.pressCoverage.count(),
    prisma.pressSubmission.findMany({
      where: { status: { notIn: [...CLOSED_SUBMISSION] } },
      select: { id: true, title: true, outlet: true, followUpDate: true },
    }),
  ]);

  const today = startOfUtcDay(new Date());
  const published = content.filter((item) => item.status === "Published").length;
  const inPipeline = content.filter((item) => item.status === "Draft" || item.status === "Scheduled").length;
  const followUpsDue = openSubmissions.filter((item) => item.followUpDate && item.followUpDate <= today).length;

  const firstWeek = new Date(startOfUtcWeek(today).getTime() - (WEEKS - 1) * 7 * DAY);
  const weeks = Array.from({ length: WEEKS }, (_, index) => ({
    start: new Date(firstWeek.getTime() + index * 7 * DAY),
    count: 0,
  }));
  for (const item of content) {
    const index = Math.floor((item.createdDate.getTime() - firstWeek.getTime()) / (7 * DAY));
    if (index >= 0 && index < WEEKS) weeks[index].count += 1;
  }
  const busiestWeek = Math.max(1, ...weeks.map((week) => week.count));
  const createdInRange = weeks.reduce((total, week) => total + week.count, 0);

  const upcoming: UpcomingItem[] = [
    ...content
      .filter((item) => item.publishDate && item.publishDate >= today && item.status !== "Published")
      .map((item) => ({
        id: `content-${item.id}`,
        date: item.publishDate as Date,
        title: item.title,
        meta: `Publish · ${item.platform || item.type}`,
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

  const recent = content.slice(0, 5);
  const seoHost = latestCheck ? hostOf(latestCheck.url) : null;

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Overview"}
        description="Content, SEO, directories and press for Zedu at a glance."
        actions={
          <Button asChild>
            <Link href="/dashboard/content">
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Add content
            </Link>
          </Button>
        }
      />

      <PageContent>
        <StatGrid>
          <StatCard
            label="Content pieces"
            value={content.length.toLocaleString()}
            icon={<FileTextIcon aria-hidden="true" />}
            hint={`${published.toLocaleString()} published`}
            tone={published > 0 ? "success" : "neutral"}
          />
          <StatCard
            label="Drafts & scheduled"
            value={inPipeline.toLocaleString()}
            icon={<SendIcon aria-hidden="true" />}
            hint={`${createdInRange.toLocaleString()} created in the last ${WEEKS} weeks`}
          />
          <StatCard
            label="Latest SEO score"
            value={latestCheck ? `${latestCheck.score}%` : "–"}
            icon={<ScanSearchIcon aria-hidden="true" />}
            hint={seoHost ? `${seoHost} · ${shortDate(latestCheck!.createdAt)}` : "No pages checked yet"}
            tone={!latestCheck ? "neutral" : latestCheck.score >= 80 ? "success" : latestCheck.score >= 50 ? "warning" : "destructive"}
          />
          <StatCard
            label="Open press submissions"
            value={openSubmissions.length.toLocaleString()}
            icon={<NewspaperIcon aria-hidden="true" />}
            hint={
              followUpsDue > 0
                ? `${followUpsDue} follow-up${followUpsDue === 1 ? "" : "s"} due`
                : `${coverageCount.toLocaleString()} pieces of coverage`
            }
            tone={followUpsDue > 0 ? "warning" : "neutral"}
          />
        </StatGrid>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Content created</CardTitle>
              <CardDescription>Pieces added each week, last {WEEKS} weeks</CardDescription>
              <CardAction>
                <span className="text-[clamp(22px,2vw,26px)] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
                  {createdInRange}
                </span>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ol
                className="m-0 grid h-52 list-none grid-cols-8 items-end gap-2 p-0 sm:gap-3"
                aria-label={`Content created per week over the last ${WEEKS} weeks`}
              >
                {weeks.map((week, index) => (
                  <li key={week.start.toISOString()} className="flex h-full min-w-0 flex-col items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{week.count}</span>
                    <div className="relative w-full max-w-11 flex-1 overflow-hidden rounded-lg bg-chart-track">
                      <div
                        className={cn(
                          "absolute inset-x-0 bottom-0 rounded-lg transition-[height]",
                          index === WEEKS - 1 ? "bg-primary" : "bg-chart-2"
                        )}
                        style={{ height: `${(week.count / busiestWeek) * 100}%` }}
                      />
                    </div>
                    <span className={cn("truncate text-[11px] text-muted-foreground", index % 2 === 1 && "invisible sm:visible")}>
                      {shortDate(week.start)}
                    </span>
                  </li>
                ))}
              </ol>
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

        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Recent content</CardTitle>
            <CardDescription>The latest pieces you added</CardDescription>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/content">
                  View all
                  <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          {recent.length === 0 ? (
            <Empty className="mx-5 mb-5 border">
              <EmptyHeader>
                <EmptyTitle>No content yet</EmptyTitle>
                <EmptyDescription>Add your first article, post or video to start tracking it here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden pr-5 text-right sm:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-[200px] truncate pl-5 font-semibold sm:max-w-[320px]">{item.title}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{item.type}</TableCell>
                    <TableCell>
                      <Badge variant={CONTENT_BADGE[item.status] ?? "secondary"}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden pr-5 text-right font-mono text-xs text-muted-foreground sm:table-cell">
                      {shortDate(item.createdDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </PageContent>
    </>
  );
}
