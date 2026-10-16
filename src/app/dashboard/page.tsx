import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/AuthButtons";
import { DirectoriesNav } from "@/components/DirectoriesNav";
import { NewSubmissionButton } from "@/components/NewSubmissionButton";
import { ProductsNav } from "@/components/ProductsNav";
import { RowMenu } from "@/components/RowMenu";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  planned:   "Planned",
  submitted: "Submitted",
  live:      "Live",
  rejected:  "Rejected",
};

const statusBadgeClass: Record<string, string> = {
  live:      "bg-live-bg text-live before:bg-live",
  pending:   "bg-pending-bg text-pending before:bg-pending",
  planned:   "bg-[#f4f3f0] text-muted before:bg-muted",
  submitted: "bg-pending-bg text-pending before:bg-pending",
  review:    "bg-review-bg text-review before:bg-review",
  rejected:  "bg-rejected-bg text-rejected before:bg-rejected",
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

function IconGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1.5" />
      <rect x="8" y="1" width="5" height="5" rx="1.5" />
      <rect x="1" y="8" width="5" height="5" rx="1.5" />
      <rect x="8" y="8" width="5" height="5" rx="1.5" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <line x1="1" y1="3.5" x2="13" y2="3.5" />
      <line x1="1" y1="7" x2="13" y2="7" />
      <line x1="1" y1="10.5" x2="13" y2="10.5" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="1" y1="3" x2="12" y2="3" />
      <line x1="3" y1="6.5" x2="10" y2="6.5" />
      <line x1="5" y1="10" x2="8" y2="10" />
    </svg>
  );
}

const navLinkClass = "group flex items-center gap-2 px-[10px] py-[7px] rounded-[7px] text-muted text-[13px] font-medium no-underline transition-[color,background-color] duration-[120ms] whitespace-nowrap overflow-hidden hover:text-ink hover:bg-white/[0.64] aria-[current=page]:text-violet-deep aria-[current=page]:bg-white/[0.64] aria-[current=page]:font-semibold aria-[current=page]:rounded-l-none aria-[current=page]:shadow-[inset_2px_0_0_#8e6afa] aria-[current=page]:pl-2 max-[980px]:flex-shrink-0 max-[980px]:aria-[current=page]:rounded-[7px] max-[980px]:aria-[current=page]:shadow-none max-[980px]:aria-[current=page]:pl-[10px] max-[980px]:aria-[current=page]:bg-violet-tint";

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
    <main className="grid grid-cols-[224px_minmax(0,1fr)] min-h-screen max-[980px]:grid-cols-1">
      {/* ── SIDEBAR ── */}
      <aside className="flex flex-col sticky top-0 h-screen overflow-y-auto py-5 px-[10px] pb-4 border-r border-line bg-sidebar-bg max-[980px]:static max-[980px]:h-auto max-[980px]:flex-row max-[980px]:items-center max-[980px]:py-[14px] max-[980px]:px-4 max-[980px]:border-r-0 max-[980px]:border-b max-[980px]:overflow-x-auto max-[980px]:gap-1">
        <div className="py-0.5 px-2 mb-6 flex-shrink-0 max-[980px]:mb-0 max-[980px]:mr-5">
          <a className="inline-flex items-center gap-[9px] text-ink text-[14px] font-bold tracking-[-0.03em] no-underline" href="/dashboard">
            <span className="wordmark-mark" aria-hidden="true">
              <i /><i /><i />
            </span>
            Metric Tracker
          </a>
        </div>

        <nav aria-label="Main navigation">
          <a className={navLinkClass} aria-current="page" href="/dashboard">
            <IconGrid />
            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis">Overview</span>
          </a>
          <a className={navLinkClass} href="/dashboard/submissions">
            <IconList />
            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis">Submissions</span>
          </a>
        </nav>

        <DirectoriesNav initialDirectories={dbDirectories} />
        <ProductsNav initialProducts={products} />

        <div className="grid gap-[6px] mt-auto pt-[14px] px-[10px] border-t border-line flex-shrink-0 max-[980px]:hidden">
          <span className="text-muted text-[11px] font-medium overflow-hidden text-ellipsis whitespace-nowrap" title={session.user.email ?? undefined}>
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex flex-col min-h-screen min-w-0">
        {/* HEADER */}
        <header className="sticky top-0 z-[10] flex items-center justify-between gap-4 px-[clamp(20px,4vw,48px)] h-[57px] border-b border-line bg-[rgba(250,250,249,0.9)] backdrop-blur-[8px] flex-shrink-0 max-[640px]:px-4">
          <div className="flex items-baseline gap-[10px]">
            <h1 className="m-0 text-[16px] font-bold tracking-[-0.03em] text-ink leading-none">Submissions</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="inline-flex items-center gap-[6px] px-[13px] h-[34px] rounded-[8px] bg-transparent text-muted border border-line text-[13px] font-medium cursor-pointer w-auto whitespace-nowrap transition-[color,background-color,border-color] duration-[120ms] hover:text-ink hover:bg-sheet hover:border-line-strong"
              type="button"
            >
              <IconFilter />
              Filter
            </button>
            <NewSubmissionButton products={products} directories={dbDirectories} />
          </div>
        </header>

        {/* STATS STRIP */}
        <div className="flex border-b border-line flex-shrink-0 max-[640px]:flex-wrap" role="region" aria-label="Key metrics">
          {stats.map((s) => (
            <div className="dash-stat flex-1 px-[clamp(16px,3vw,36px)] py-4 border-r border-line last:border-r-0 max-[640px]:flex-none max-[640px]:basis-1/2" key={s.label}>
              <p className="m-0 mb-[5px] text-muted text-[10px] font-bold tracking-[0.07em] uppercase">{s.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[24px] font-medium tracking-[-0.04em] text-ink leading-none">{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(230px,300px)] flex-1 max-[980px]:grid-cols-1">
          {/* SUBMISSIONS TABLE */}
          <section className="py-[clamp(18px,3vw,30px)] px-[clamp(20px,4vw,36px)]" aria-label="Recent submissions">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="m-0 text-[13px] font-bold tracking-[-0.02em] text-ink leading-none">Recent submissions</h2>
              <span className="text-muted font-mono text-[11px] font-normal">{dbSubmissions.length} total</span>
            </div>

            {dbSubmissions.length === 0 ? (
              <div>
                <p className="text-muted text-[13px]">No submissions yet — add your first one.</p>
              </div>
            ) : (
              <table className="sub-table w-full border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className="pb-[10px] pr-[14px] text-muted text-[10px] font-bold tracking-[0.07em] uppercase text-left border-b border-line whitespace-nowrap first:pl-0">Product</th>
                    <th scope="col" className="pb-[10px] pr-[14px] text-muted text-[10px] font-bold tracking-[0.07em] uppercase text-left border-b border-line whitespace-nowrap">Directory</th>
                    <th scope="col" className="pb-[10px] pr-[14px] text-muted text-[10px] font-bold tracking-[0.07em] uppercase text-left border-b border-line whitespace-nowrap">Status</th>
                    <th scope="col" className="pb-[10px] pr-[14px] text-muted text-[10px] font-bold tracking-[0.07em] uppercase text-left border-b border-line whitespace-nowrap max-[640px]:hidden">Submitted</th>
                    <th scope="col" className="pb-[10px] pr-[14px] text-muted text-[10px] font-bold tracking-[0.07em] uppercase text-right border-b border-line whitespace-nowrap">Traffic</th>
                    <th scope="col" className="pb-[10px] w-[40px] pr-0 border-b border-line">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dbSubmissions.map((sub) => {
                    const visits = sub.traffic.reduce((acc, t) => acc + t.visits, 0);
                    const trafficStr = visits > 0 ? formatTraffic(visits) : null;
                    return (
                      <tr key={sub.id}>
                        <td className="py-3 pr-[14px] text-ink border-b border-line align-middle whitespace-nowrap text-[13px] first:pl-0 font-semibold tracking-[-0.02em]">
                          {sub.product.name}
                        </td>
                        <td className="py-3 pr-[14px] text-muted border-b border-line align-middle whitespace-nowrap text-[13px]">
                          {sub.directory.name}
                        </td>
                        <td className="py-3 pr-[14px] border-b border-line align-middle whitespace-nowrap text-[13px]">
                          <span className={`inline-flex items-center gap-[5px] px-2 py-[2px] rounded-full text-[11px] font-semibold tracking-[0.01em] whitespace-nowrap leading-[1.6] before:content-[''] before:block before:w-[5px] before:h-[5px] before:rounded-full before:flex-shrink-0 ${statusBadgeClass[sub.status] ?? "bg-[#f4f3f0] text-muted before:bg-muted"}`}>
                            {statusLabel[sub.status] ?? sub.status}
                          </span>
                        </td>
                        <td className="py-3 pr-[14px] text-muted border-b border-line align-middle whitespace-nowrap text-[12px] max-[640px]:hidden">
                          {formatDate(sub.submittedAt)}
                        </td>
                        <td className={`py-3 pr-[14px] border-b border-line align-middle whitespace-nowrap text-right font-mono text-[12px] font-medium ${!trafficStr ? "text-muted" : "text-ink"}`}>
                          {trafficStr ?? "—"}
                        </td>
                        <td className="py-3 pr-0 border-b border-line align-middle text-right w-[40px]">
                          <RowMenu
                            label={`More options for ${sub.product.name} on ${sub.directory.name}`}
                            submissionId={sub.id}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* DIRECTORIES PANEL */}
          <section className="py-[clamp(18px,3vw,30px)] px-[clamp(20px,4vw,36px)] border-l border-line max-[980px]:border-l-0 max-[980px]:border-t" aria-label="Directory breakdown">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="m-0 text-[13px] font-bold tracking-[-0.02em] text-ink leading-none">By directory</h2>
              <span className="text-muted font-mono text-[11px] font-normal">{dbDirectories.length} dirs</span>
            </div>
            <div className="grid">
              {dbDirectories.length === 0 ? (
                <p className="text-muted text-[13px]">No directories yet.</p>
              ) : (
                dbDirectories.map((dir) => (
                  <div className="flex items-center gap-[10px] py-[10px] border-b border-line cursor-default transition-colors duration-[80ms] last:border-b-0 hover:bg-[rgba(142,106,250,0.03)]" key={dir.id}>
                    <span className="flex-1 min-w-0 text-[13px] font-semibold text-ink overflow-hidden text-ellipsis whitespace-nowrap tracking-[-0.02em]">
                      {dir.name}
                    </span>
                    <div className="flex items-center gap-[3px] flex-shrink-0" aria-label={`${dir._count.submissions} submissions`}>
                      {Array.from({ length: Math.min(dir._count.submissions, 12) }).map((_, i) => (
                        <span key={i} className="w-[7px] h-[7px] rounded-full flex-shrink-0 bg-live" />
                      ))}
                    </div>
                    <span className="flex-shrink-0 font-mono text-[12px] font-medium text-muted min-w-[20px] text-right">
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
