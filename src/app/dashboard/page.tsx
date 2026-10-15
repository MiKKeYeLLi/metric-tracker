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

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1" y1="6" x2="11" y2="6" />
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
    <main className="dash-page">
      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-logo">
          <a className="wordmark" href="/dashboard">
            <span className="wordmark-mark" aria-hidden="true">
              <i /><i /><i />
            </span>
            Metric Tracker
          </a>
        </div>

        <nav aria-label="Main navigation">
          <a className="dash-nav-link" aria-current="page" href="/dashboard">
            <IconGrid />
            <span className="dash-nav-link-text">Overview</span>
          </a>
          <a className="dash-nav-link" href="/dashboard/submissions">
            <IconList />
            <span className="dash-nav-link-text">Submissions</span>
          </a>
        </nav>

        <DirectoriesNav initialDirectories={dbDirectories} />
        <ProductsNav initialProducts={products} />

        <div className="dash-account">
          <span className="dash-account-email" title={session.user.email ?? undefined}>
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="dash-main">
        {/* HEADER */}
        <header className="dash-header">
          <div className="dash-header-left">
            <h1 className="dash-page-title">Submissions</h1>
          </div>
          <div className="dash-header-actions">
            <button className="btn-ghost" type="button">
              <IconFilter />
              Filter
            </button>
            <NewSubmissionButton products={products} directories={dbDirectories} />
          </div>
        </header>

        {/* STATS STRIP */}
        <div className="dash-stats" role="region" aria-label="Key metrics">
          {stats.map((s) => (
            <div className="dash-stat" key={s.label}>
              <p className="dash-stat-label">{s.label}</p>
              <div className="dash-stat-row">
                <span className="dash-stat-value">{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="dash-body">
          {/* SUBMISSIONS TABLE */}
          <section className="dash-section" aria-label="Recent submissions">
            <div className="dash-section-header">
              <h2 className="dash-section-title">Recent submissions</h2>
              <span className="dash-section-meta">{dbSubmissions.length} total</span>
            </div>

            {dbSubmissions.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No submissions yet — add your first one.</p>
              </div>
            ) : (
              <table className="sub-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Directory</th>
                    <th scope="col">Status</th>
                    <th scope="col">Submitted</th>
                    <th scope="col" className="col-r">Traffic</th>
                    <th scope="col" className="col-actions">
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
                        <td className="td-product">{sub.product.name}</td>
                        <td className="td-dir">{sub.directory.name}</td>
                        <td>
                          <span className={`status-badge s-${sub.status}`}>
                            {statusLabel[sub.status] ?? sub.status}
                          </span>
                        </td>
                        <td className="td-date">{formatDate(sub.submittedAt)}</td>
                        <td className={`td-traffic${!trafficStr ? " td-traffic-em" : ""}`}>
                          {trafficStr ?? "—"}
                        </td>
                        <td className="td-actions">
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
          <section className="dash-section" aria-label="Directory breakdown">
            <div className="dash-section-header">
              <h2 className="dash-section-title">By directory</h2>
              <span className="dash-section-meta">{dbDirectories.length} dirs</span>
            </div>
            <div className="dir-list">
              {dbDirectories.length === 0 ? (
                <p className="empty-state-text">No directories yet.</p>
              ) : (
                dbDirectories.map((dir) => (
                  <div className="dir-row" key={dir.id}>
                    <span className="dir-row-name">{dir.name}</span>
                    <div className="dir-row-dots" aria-label={`${dir._count.submissions} submissions`}>
                      {Array.from({ length: Math.min(dir._count.submissions, 12) }).map((_, i) => (
                        <span key={i} className="d-dot d-live" />
                      ))}
                    </div>
                    <span className="dir-row-count">{dir._count.submissions}</span>
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
