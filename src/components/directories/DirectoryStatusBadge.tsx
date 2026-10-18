import { DirectoryStatus } from "@/types/directory";
import { cn } from "@/lib/utils";

interface BadgeProps {
  status: DirectoryStatus;
  className?: string;
}

export function DirectoryStatusBadge({ status, className }: BadgeProps) {
  const styles: Record<DirectoryStatus, { bg: string; text: string; dot: string }> = {
    Live: { bg: "bg-success-muted", text: "text-success", dot: "bg-success" },
    "Pending review": { bg: "bg-info-muted", text: "text-info", dot: "bg-info" },
    "Needs changes": { bg: "bg-warning-muted", text: "text-warning", dot: "bg-warning" },
    Rejected: { bg: "bg-destructive-muted", text: "text-destructive", dot: "bg-destructive" },
    "Not submitted": { bg: "bg-secondary", text: "text-muted-foreground", dot: "bg-border-strong" },
  };

  const style = styles[status] || styles["Not submitted"];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors",
        style.bg,
        style.text,
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", style.dot)}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}
