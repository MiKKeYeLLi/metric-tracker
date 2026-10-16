import { DirectoryStatus } from "@/types/directory";
import { cn } from "@/lib/utils";

interface BadgeProps {
  status: DirectoryStatus;
  className?: string;
}

export function DirectoryStatusBadge({ status, className }: BadgeProps) {
  const styles: Record<
    DirectoryStatus,
    { bg: string; text: string; dot: string }
  > = {
    Live: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    "Pending review": {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    "Needs changes": {
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-700 dark:text-rose-400",
      dot: "bg-rose-500",
    },
    Rejected: {
      bg: "bg-red-50 dark:bg-red-950/40",
      text: "text-red-700 dark:text-red-400",
      dot: "bg-red-500",
    },
    "Not submitted": {
      bg: "bg-slate-100 dark:bg-slate-800/50",
      text: "text-slate-600 dark:text-slate-400",
      dot: "bg-slate-400",
    },
  };

  const style = styles[status] || styles["Not submitted"];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent transition-colors",
        style.bg,
        style.text,
        className,
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", style.dot)}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}
