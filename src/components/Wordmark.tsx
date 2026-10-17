export function Wordmark({ href }: { href: string }) {
  return (
    <a
      className="inline-flex items-center gap-2.25 text-sm font-bold tracking-[-0.03em] text-foreground no-underline"
      href={href}
    >
      <span
        className="flex size-5.5 shrink-0 items-end gap-0.5 rounded-md bg-primary p-1.25"
        aria-hidden="true"
      >
        <i className="block h-[38%] flex-1 rounded-[1px] bg-primary-foreground" />
        <i className="block h-[65%] flex-1 rounded-[1px] bg-primary-foreground" />
        <i className="block h-full flex-1 rounded-[1px] bg-primary-foreground" />
      </span>
      Metric Tracker
    </a>
  );
}
