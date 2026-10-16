import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LayoutGridIcon, ListFilterIcon, ListIcon } from "lucide-react";
import { SignOutButton } from "@/components/AuthButtons";
import { DirectoriesNav } from "@/components/DirectoriesNav";
import { NewSubmissionButton } from "@/components/NewSubmissionButton";
import { ProductsNav } from "@/components/ProductsNav";
import { RowMenu } from "@/components/RowMenu";
import { SidebarNavLink, SidebarNavList } from "@/components/SidebarNav";
import { Wordmark } from "@/components/Wordmark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>["variant"]>;

const statusLabel: Record<string, string> = {
  planned:   "Planned",
  submitted: "Submitted",
  live:      "Live",
  rejected:  "Rejected",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatTraffic(visits: number): string {
  if (visits === 0) return "0";
  if (visits >= 1000) return `${(visits / 1000).toFixed(1)}K`;
  return visits.toString();
}

const statusVariant: Record<string, BadgeVariant> = {
  planned:   "secondary",
  submitted: "warning",
  live:      "success",
  rejected:  "destructive",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant[status] ?? "secondary"} className="gap-1.25 font-semibold">
      <span className="size-1.25 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {statusLabel[status] ?? status}
    </Badge>
  );
}

function SectionHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="m-0 text-[13px] leading-none font-bold tracking-[-0.02em] text-foreground">{title}</h2>
      <span className="font-mono text-[11px] text-muted-foreground">{meta}</span>
    </div>
  );
}

const headClass = "h-auto px-0 pt-0 pr-3.5 pb-2.5 text-2xs font-bold tracking-[0.07em] text-muted-foreground uppercase";
const cellClass = "py-3 pr-3.5 pl-0 text-[13px]";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const [products, dbDirectories, dbSubmissions, trafficAgg] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.directory.findMany({
      select: { id: true, name: true, _count: { select: { submissions: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.submission.findMany({
      select: {
        id: true,
        status: true,
        submittedAt: true,
        product:   { select: { name: true } },
        directory: { select: { name: true } },
        traffic:   { select: { visits: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.traffic.aggregate({ _sum: { visits: true } }),
  ]);

  const totalVisits = trafficAgg._sum.visits ?? 0;

  const stats = [
    { label: "Directories", value: String(dbDirectories.length) },
    { label: "Products",    value: String(products.length) },
    { label: "Submissions", value: String(dbSubmissions.length) },
    { label: "Traffic",     value: formatTraffic(totalVisits) },
  ];

  return (
    <main className="grid min-h-screen lg:grid-cols-[224px_minmax(0,1fr)]">
      {/* ── SIDEBAR ── */}
      <aside className="flex items-center gap-1 overflow-x-auto border-b border-sidebar-border bg-sidebar px-4 py-3.5 lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:items-stretch lg:gap-0 lg:overflow-x-hidden lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-2.5 lg:pt-5 lg:pb-4">
        <div className="mr-5 shrink-0 px-2 py-0.5 lg:mr-0 lg:mb-6">
          <Wordmark href="/dashboard" />
        </div>

        <SidebarNavList aria-label="Main navigation">
          <SidebarNavLink aria-current="page" href="/dashboard" icon={<LayoutGridIcon aria-hidden="true" />}>
            Overview
          </SidebarNavLink>
          <SidebarNavLink href="/dashboard/submissions" icon={<ListIcon aria-hidden="true" />}>
            Submissions
          </SidebarNavLink>
        </SidebarNavList>

        <DirectoriesNav initialDirectories={dbDirectories} />
        <ProductsNav initialProducts={products} />

        <div className="mt-auto hidden shrink-0 gap-1.5 border-t border-sidebar-border px-2.5 pt-3.5 lg:grid">
          <span className="truncate text-[11px] font-medium text-muted-foreground" title={session.user.email ?? undefined}>
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex min-h-screen min-w-0 flex-col">
        {/* HEADER */}
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur-sm sm:px-[clamp(20px,4vw,48px)]">
          <h1 className="m-0 text-base leading-none font-bold tracking-[-0.03em] text-foreground">Submissions</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" type="button">
              <ListFilterIcon data-icon="inline-start" />
              Filter
            </Button>
            <NewSubmissionButton products={products} directories={dbDirectories} />
          </div>
        </header>

        {/* STATS STRIP */}
        <div className="grid shrink-0 grid-cols-2 gap-px border-b bg-border sm:grid-cols-4" role="region" aria-label="Key metrics">
          {stats.map((s) => (
            <div className="bg-background px-[clamp(16px,3vw,36px)] py-4" key={s.label}>
              <p className="mb-1.25 text-2xs font-bold tracking-[0.07em] text-muted-foreground uppercase">{s.label}</p>
              <span className="font-mono text-2xl leading-none font-medium tracking-[-0.04em] text-foreground">
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(230px,300px)]">
          {/* SUBMISSIONS TABLE */}
          <section className="px-[clamp(20px,4vw,36px)] py-[clamp(18px,3vw,30px)]" aria-label="Recent submissions">
            <SectionHeader title="Recent submissions" meta={`${dbSubmissions.length} total`} />

            {dbSubmissions.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>No submissions yet</EmptyTitle>
                  <EmptyDescription>Add your first one to start tracking.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col" className={headClass}>Product</TableHead>
                    <TableHead scope="col" className={headClass}>Directory</TableHead>
                    <TableHead scope="col" className={headClass}>Status</TableHead>
                    <TableHead scope="col" className={cn(headClass, "hidden sm:table-cell")}>Submitted</TableHead>
                    <TableHead scope="col" className={cn(headClass, "text-right")}>Traffic</TableHead>
                    <TableHead scope="col" className={cn(headClass, "w-10 pr-0")}>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbSubmissions.map((sub) => {
                    const visits = sub.traffic.reduce((acc, t) => acc + t.visits, 0);
                    const trafficStr = visits > 0 ? formatTraffic(visits) : null;
                    return (
                      <TableRow key={sub.id} className="group/row hover:bg-primary/4 has-aria-expanded:bg-primary/4">
                        <TableCell className={cn(cellClass, "font-semibold tracking-[-0.02em]")}>{sub.product.name}</TableCell>
                        <TableCell className={cn(cellClass, "text-muted-foreground")}>{sub.directory.name}</TableCell>
                        <TableCell className={cellClass}>
                          <StatusBadge status={sub.status} />
                        </TableCell>
                        <TableCell className={cn(cellClass, "hidden text-xs text-muted-foreground sm:table-cell")}>
                          {formatDate(sub.submittedAt)}
                        </TableCell>
                        <TableCell
                          className={cn(cellClass, "text-right font-mono text-xs font-medium", !trafficStr && "text-muted-foreground")}
                        >
                          {trafficStr ?? "—"}
                        </TableCell>
                        <TableCell className={cn(cellClass, "w-10 pr-0 text-right")}>
                          <RowMenu
                            label={`More options for ${sub.product.name} on ${sub.directory.name}`}
                            submissionId={sub.id}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </section>

          {/* DIRECTORIES PANEL */}
          <section
            className="border-t px-[clamp(20px,4vw,36px)] py-[clamp(18px,3vw,30px)] lg:border-t-0 lg:border-l"
            aria-label="Directory breakdown"
          >
            <SectionHeader title="By directory" meta={`${dbDirectories.length} dirs`} />
            <div className="grid">
              {dbDirectories.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No directories yet.</p>
              ) : (
                dbDirectories.map((dir) => (
                  <div className="flex items-center gap-2.5 border-b py-2.5 transition-colors last:border-b-0 hover:bg-primary/3" key={dir.id}>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[-0.02em] text-foreground">
                      {dir.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.75" aria-label={`${dir._count.submissions} submissions`}>
                      {Array.from({ length: Math.min(dir._count.submissions, 12) }).map((_, i) => (
                        <span key={i} className="size-1.75 shrink-0 rounded-full bg-success" />
                      ))}
                    </div>
                    <span className="min-w-5 shrink-0 text-right font-mono text-xs font-medium text-muted-foreground">
                      {dir._count.submissions}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
