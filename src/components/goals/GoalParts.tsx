import type { LucideIcon } from "lucide-react";

export function GoalStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-muted px-3 py-2">
      <dt className="flex items-center gap-1 truncate text-2xs font-bold tracking-[0.07em] text-muted-foreground uppercase">
        <Icon className="size-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="m-0 text-lg leading-none font-extrabold text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

export function TaskProgress({ label, approved, total }: { label: string; approved: number; total: number }) {
  const progress = total === 0 ? 0 : Math.round((approved / total) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-foreground">Tasks approved</span>
        <span className="font-semibold text-primary-deep tabular-nums">
          {approved} / {total}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-chart-track"
        role="progressbar"
        aria-label={`${label}: tasks approved`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
