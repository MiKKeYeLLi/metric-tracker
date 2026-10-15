import Link from "next/link";

export default function NotFound() {
  return (
    <main className="nf-page">
      <header className="nf-header">
        <a className="wordmark" href="/">
          <span className="wordmark-mark" aria-hidden="true">
            <i /><i /><i />
          </span>
          Metric Tracker
        </a>
      </header>

      <div className="nf-body">
        <div className="nf-graphic" aria-hidden="true">
          <span className="nf-code">404</span>
          <div className="nf-grid" />
        </div>

        <div className="nf-content">
          <h1 className="nf-title">Page not found</h1>
          <p className="nf-desc">
            This page doesn&apos;t exist or has been moved. Head back to the
            dashboard to pick up where you left off.
          </p>
          <Link className="nf-cta" href="/dashboard">
            Go to dashboard
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="1" y1="7" x2="13" y2="7" />
              <polyline points="8,2 13,7 8,12" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
