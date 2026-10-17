"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarNavList({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return <nav className={cn("flex shrink-0 gap-1 lg:flex-col lg:gap-0", className)} {...props} />;
}

interface SidebarNavLinkProps extends React.ComponentProps<"a"> {
  icon: React.ReactNode;
  badge?: React.ReactNode;
}

export function SidebarNavLink({ icon, badge, children, className, href, ...props }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const isCurrent =
    typeof href === "string" &&
    (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <a
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "group/nav flex shrink-0 items-center gap-2 overflow-hidden rounded-[7px] px-2.5 py-1.75 text-[13px] font-medium whitespace-nowrap text-muted-foreground no-underline transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:size-3.5 [&_svg]:shrink-0",
        "aria-[current=page]:bg-accent aria-[current=page]:font-semibold aria-[current=page]:text-primary-deep",
        "lg:aria-[current=page]:rounded-l-none lg:aria-[current=page]:bg-sidebar-accent lg:aria-[current=page]:pl-2 lg:aria-[current=page]:shadow-[inset_2px_0_0_var(--primary)]",
        className
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {badge != null && (
        <span className="shrink-0 rounded-full bg-black/7 px-1.5 font-mono text-2xs/[1.7] font-medium text-muted-foreground group-aria-[current=page]/nav:bg-accent group-aria-[current=page]/nav:text-primary-deep">
          {badge}
        </span>
      )}
    </a>
  );
}
