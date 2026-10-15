import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/AuthButtons";
import { authOptions } from "@/lib/auth";

const metrics = [
  { label: "Published", value: "24", change: "+12%", tone: "positive" },
  { label: "Organic traffic", value: "18.4K", change: "+8.4%", tone: "positive" },
  { label: "Social engagements", value: "6.8K", change: "+4.2%", tone: "positive" },
  { label: "Ad spend", value: "$3,240", change: "−2.1%", tone: "neutral" },
];

const channels = [
  { name: "Content", value: "24 published", progress: 78 },
  { name: "Search", value: "18.4K visits", progress: 68 },
  { name: "Social", value: "6.8K engagements", progress: 54 },
  { name: "Paid", value: "1.2K clicks", progress: 42 },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/");

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <a className="dashboard-brand" href="/dashboard">
          <span aria-hidden="true" className="dashboard-mark" />
          Metric Tracker
        </a>
        <nav aria-label="Dashboard navigation" className="dashboard-nav">
          <a aria-current="page" href="/dashboard">Overview</a>
          <a href="#content">Content</a>
          <a href="#search">Search</a>
          <a href="#social">Social</a>
          <a href="#paid">Paid</a>
        </nav>
        <div className="dashboard-account">
          <span>{session.user.email}</span>
          <SignOutButton />
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Marketing metrics</h1>
            <p>Illustrative data · Last 30 days</p>
          </div>
        </header>

        <section aria-label="Key metrics" className="metric-grid">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <p>{metric.label}</p>
              <div>
                <strong>{metric.value}</strong>
                <span className={metric.tone}>{metric.change}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-main-grid">
          <article className="dashboard-panel performance-panel">
            <div className="panel-heading">
              <h2>Performance overview</h2>
              <span>Illustrative</span>
            </div>
            <div aria-label="Performance trend" className="trend-chart">
              <i style={{ height: "34%" }} />
              <i style={{ height: "47%" }} />
              <i style={{ height: "40%" }} />
              <i style={{ height: "63%" }} />
              <i style={{ height: "57%" }} />
              <i style={{ height: "76%" }} />
              <i style={{ height: "90%" }} />
            </div>
          </article>

          <article className="dashboard-panel channel-panel">
            <div className="panel-heading">
              <h2>Channel activity</h2>
            </div>
            <div className="channel-list">
              {channels.map((channel) => (
                <div className="channel-row" key={channel.name}>
                  <div><strong>{channel.name}</strong><span>{channel.value}</span></div>
                  <div aria-hidden="true" className="channel-meter"><i style={{ width: `${channel.progress}%` }} /></div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
