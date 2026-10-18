"use client";

import { usePathname } from "next/navigation";
import {
  FileTextIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  NewspaperIcon,
  ScanSearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarNavList({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return <nav className={cn("flex shrink-0 gap-1 lg:flex-col lg:gap-0.5", className)} {...props} />;
}

export function SidebarNavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents lg:mt-5 lg:flex lg:flex-col lg:gap-0.5 lg:first:mt-0">
      <p className="hidden px-3 pb-1.5 text-2xs font-bold tracking-[0.09em] text-sidebar-muted-foreground/80 uppercase lg:block">
        {label}
      </p>
      {children}
    </div>
  );
}

interface SidebarNavLinkProps extends React.ComponentProps<"a"> {
  icon: React.ReactNode;
  badge?: React.ReactNode;
}

export function SidebarNavLink({ icon, badge, children, className, ...props }: SidebarNavLinkProps) {
  return (
    <a
      className={cn(
        "group/nav flex shrink-0 items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium whitespace-nowrap text-sidebar-muted-foreground no-underline transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&_svg]:size-4 [&_svg]:shrink-0 lg:rounded-xl lg:py-2.25",
        "aria-[current=page]:bg-sidebar-primary aria-[current=page]:font-semibold aria-[current=page]:text-sidebar-primary-foreground aria-[current=page]:shadow-[0_6px_18px_rgb(10_4_40/0.35)]",
        className
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {badge != null && (
        <span className="shrink-0 rounded-full bg-sidebar-accent px-1.5 font-mono text-2xs/[1.7] font-medium text-sidebar-foreground group-aria-[current=page]/nav:bg-accent group-aria-[current=page]/nav:text-primary-deep">
          {badge}
        </span>
      )}
    </a>
  );
}

export function DashboardSidebarNav() {
  const pathname = usePathname();
  const current = (href: string) =>
    (href === "/dashboard" ? pathname === href : pathname.startsWith(href)) ? "page" : undefined;

  return (
    <SidebarNavList aria-label="Main navigation">
      <SidebarNavSection label="Workspace">
        <SidebarNavLink aria-current={current("/dashboard")} href="/dashboard" icon={<LayoutDashboardIcon aria-hidden="true" />}>
          Overview
        </SidebarNavLink>
      </SidebarNavSection>
      <SidebarNavSection label="Channels">
        <SidebarNavLink aria-current={current("/dashboard/content")} href="/dashboard/content" icon={<FileTextIcon aria-hidden="true" />}>
          Content
        </SidebarNavLink>
        <SidebarNavLink aria-current={current("/dashboard/directories")} href="/dashboard/directories" icon={<FolderOpenIcon aria-hidden="true" />}>
          Directories
        </SidebarNavLink>
        <SidebarNavLink aria-current={current("/dashboard/seo")} href="/dashboard/seo" icon={<ScanSearchIcon aria-hidden="true" />}>
          SEO checker
        </SidebarNavLink>
        <SidebarNavLink aria-current={current("/dashboard/media")} href="/dashboard/media" icon={<NewspaperIcon aria-hidden="true" />}>
          Press &amp; Media
        </SidebarNavLink>
      </SidebarNavSection>
    </SidebarNavList>
  );
}
