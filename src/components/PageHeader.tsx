import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex w-full flex-col gap-4 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="m-0 text-[24px] leading-tight font-extrabold tracking-[-0.035em] text-foreground sm:text-[26px]">
          {title}
        </h1>
        {description && <p className="m-0 max-w-[68ch] text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex w-full flex-1 flex-col gap-4 px-4 pt-5 pb-10 sm:px-6", className)}
      {...props}
    />
  );
}
