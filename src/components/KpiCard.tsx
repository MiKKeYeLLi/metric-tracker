import { ArrowDownIcon, ArrowUpIcon, ArrowUpRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Delta = {
  label: string;
  direction: "up" | "down" | "flat";
  favorable: boolean;
};

export function DeltaChip({ label, direction, favorable }: Delta) {
  const Arrow = direction === "up" ? ArrowUpIcon : direction === "down" ? ArrowDownIcon : null;
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold tabular-nums",
        direction === "flat"
          ? "bg-muted text-muted-foreground"
          : favorable
            ? "bg-success-muted text-success"
            : "bg-destructive-muted text-destructive"
      )}
    >
      {Arrow && <Arrow className="size-3" aria-hidden="true" />}
      {label}
    </span>
  );
}

type KpiAction = { label: string } & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

export function KpiCard({
  title,
  value,
  decimals,
  delta,
  comparison = "vs last month",
  context,
  action,
  className,
}: {
  title: string;
  value: string;
  decimals?: string;
  delta?: Delta;
  comparison?: string;
  context?: React.ReactNode;
  action?: KpiAction;
  className?: string;
}) {
  const actionClass = cn(
    buttonVariants({ variant: "outline", size: "icon" }),
    "shrink-0"
  );

  return (
    <div className={cn("flex min-w-0 flex-col gap-5 rounded-[22px] border border-border bg-card p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 pt-2 text-[15px] leading-tight font-bold tracking-[-0.02em] text-foreground sm:text-[17px]">
          {title}
        </h2>
        {action &&
          (action.href ? (
            <a href={action.href} aria-label={action.label} title={action.label} className={actionClass}>
              <ArrowUpRightIcon aria-hidden="true" />
            </a>
          ) : (
            <button type="button" onClick={action.onClick} aria-label={action.label} title={action.label} className={actionClass}>
              <ArrowUpRightIcon aria-hidden="true" />
            </button>
          ))}
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <p className="m-0 text-[26px] leading-none font-extrabold tracking-[-0.04em] text-foreground tabular-nums sm:text-[30px]">
          {value}
          {decimals && <span className="text-faint-foreground">{decimals}</span>}
        </p>
        {(delta || context) && (
          <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1">
            {delta && <DeltaChip {...delta} />}
            {delta ? (
              <span className="text-[13px] text-muted-foreground">{comparison}</span>
            ) : (
              <span className="text-[13px] text-muted-foreground">{context}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function KpiGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4", className)} {...props} />;
}
