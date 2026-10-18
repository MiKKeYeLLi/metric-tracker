import { cn } from "@/lib/utils";

const DAY = 86_400_000;

export type WeekBucket = { start: Date; label: string };

function startOfUtcWeek(value: Date) {
  const day = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  return new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY);
}

/** The last `count` Monday-based weeks, oldest first, ending with the current week. */
export function lastWeeks(count: number, now = new Date()): WeekBucket[] {
  const first = startOfUtcWeek(now).getTime() - (count - 1) * 7 * DAY;
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(first + index * 7 * DAY);
    return { start, label: start.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) };
  });
}

/** How many of `dates` fall in each week. Dates outside the range are ignored. */
export function countPerWeek(weeks: WeekBucket[], dates: Date[]) {
  const counts = weeks.map(() => 0);
  if (weeks.length === 0) return counts;
  const first = weeks[0].start.getTime();
  for (const date of dates) {
    const index = Math.floor((date.getTime() - first) / (7 * DAY));
    if (index >= 0 && index < weeks.length) counts[index] += 1;
  }
  return counts;
}

function niceMax(value: number) {
  if (value <= 4) return 4;
  const step = Math.ceil(value / 4);
  return step * 4;
}

/** One series per week, drawn on a pale track; the current week is highlighted. */
export function WeeklyBars({ weeks, counts, label }: { weeks: WeekBucket[]; counts: number[]; label: string }) {
  const max = Math.max(1, ...counts);
  return (
    <ol className="m-0 grid h-52 list-none items-end gap-2 p-0 sm:gap-3" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }} aria-label={label}>
      {weeks.map((week, index) => (
        <li key={week.label} className="flex h-full min-w-0 flex-col items-center gap-2" aria-label={`Week of ${week.label}: ${counts[index]}`}>
          <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{counts[index]}</span>
          <div className="relative w-full max-w-11 flex-1 overflow-hidden rounded-lg bg-chart-track">
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 rounded-lg transition-[height]",
                index === weeks.length - 1 ? "bg-chart-1" : "bg-chart-2"
              )}
              style={{ height: `${(counts[index] / max) * 100}%` }}
            />
          </div>
          <span className={cn("truncate text-[11px] text-muted-foreground", index % 2 === 1 && "invisible sm:visible")}>
            {week.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export type Series = { name: string; counts: number[]; color: "chart-1" | "chart-2" };

const BAR_COLOR: Record<Series["color"], string> = { "chart-1": "bg-chart-1", "chart-2": "bg-chart-2" };

export function ChartLegend({ series }: { series: Pick<Series, "name" | "color">[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0">
      {series.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className={cn("size-2.5 rounded-full", BAR_COLOR[item.color])} aria-hidden="true" />
          {item.name}
        </li>
      ))}
    </ul>
  );
}

/** Two series per week, side by side, over dashed gridlines. */
export function GroupedWeeklyBars({ weeks, series, label }: { weeks: WeekBucket[]; series: Series[]; label: string }) {
  const max = niceMax(Math.max(0, ...series.flatMap((item) => item.counts)));
  const ticks = [max, (max * 3) / 4, max / 2, max / 4, 0];

  return (
    <div className="flex gap-3" role="img" aria-label={label}>
      <div className="flex h-56 flex-col justify-between pb-6 text-right text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick} className="leading-none">
            {Number.isInteger(tick) ? tick : ""}
          </span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className="block border-t border-dashed border-chart-grid" />
          ))}
        </div>
        <ol
          className="relative m-0 grid h-56 list-none p-0"
          style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
        >
          {weeks.map((week, index) => (
            <li key={week.label} className="group/week flex min-w-0 flex-col items-center">
              <div className="flex w-full flex-1 items-end justify-center gap-1 rounded-xl px-0.5 transition-colors group-hover/week:bg-accent/40 sm:gap-1.5">
                {series.map((item) => (
                  <span
                    key={item.name}
                    title={`${item.name}, week of ${week.label}: ${item.counts[index]}`}
                    className={cn(
                      "block w-full max-w-4.5 rounded-t-md transition-[height] sm:max-w-6",
                      BAR_COLOR[item.color],
                      item.counts[index] === 0 && "h-0.5! rounded-md opacity-40"
                    )}
                    style={{ height: `${(item.counts[index] / max) * 100}%` }}
                  />
                ))}
              </div>
              <span
                className={cn(
                  "mt-2 h-4 truncate text-[11px] leading-4 text-muted-foreground",
                  index % 2 === 1 && "invisible sm:visible"
                )}
              >
                {week.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            {series.map((item) => (
              <th key={item.name} scope="col">
                {item.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, index) => (
            <tr key={week.label}>
              <th scope="row">{week.label}</th>
              {series.map((item) => (
                <td key={item.name}>{item.counts[index]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
