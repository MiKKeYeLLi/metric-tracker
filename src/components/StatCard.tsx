import { cn } from "@/lib/utils";

const TONE = {
  neutral: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  primary: "text-primary-deep",
} as const;

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "neutral",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgb(21_21_31/0.04)] ring-1 ring-border sm:p-5",
        className
      )}
    >
      <div className="flex items-center gap-2.5 max-sm:flex-col max-sm:items-start max-sm:gap-2">
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary-deep [&_svg]:size-4">
            {icon}
          </span>
        )}
        <p className="m-0 min-w-0 text-[13px] leading-snug font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="m-0 text-[clamp(24px,2.2vw,30px)] leading-none font-extrabold tracking-[-0.04em] text-foreground tabular-nums">
        {value}
      </p>
      {hint && <p className={cn("m-0 text-xs font-medium", TONE[tone])}>{hint}</p>}
    </div>
  );
}

export function StatGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4", className)} {...props} />;
}
