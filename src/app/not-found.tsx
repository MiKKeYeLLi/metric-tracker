import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col min-h-screen px-[clamp(16px,5vw,48px)] pt-6 pb-12">
      <header className="flex-shrink-0">
        <a className="inline-flex items-center gap-[9px] text-ink text-[14px] font-bold tracking-[-0.03em] no-underline" href="/">
          <span className="wordmark-mark" aria-hidden="true">
            <i /><i /><i />
          </span>
          Metric Tracker
        </a>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-0 py-12 px-4">
        <div className="relative flex items-center justify-center mb-8 select-none" aria-hidden="true">
          <span className="nf-code">404</span>
          <div className="nf-grid" />
        </div>

        <div className="flex flex-col items-center text-center gap-[10px] max-w-[400px]">
          <h1 className="[font-size:clamp(18px,3vw,24px)] font-bold tracking-[-0.03em] text-ink m-0">
            Page not found
          </h1>
          <p className="text-[14px] leading-[1.65] text-muted m-0 mb-2 [text-wrap:balance]">
            This page doesn&apos;t exist or has been moved. Head back to the
            dashboard to pick up where you left off.
          </p>
          <Link
            className="inline-flex items-center gap-[7px] px-[18px] h-[38px] rounded-[8px] bg-violet text-white text-[13px] font-semibold no-underline transition-[background-color,transform] duration-[160ms] hover:bg-violet-deep hover:-translate-y-px"
            href="/dashboard"
          >
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
