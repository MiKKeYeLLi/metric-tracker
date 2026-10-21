"use client";

import { usePathname } from "next/navigation";
import {
  FileTextIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  NewspaperIcon,
  ScanSearchIcon,
  TargetIcon,
  TrophyIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarNavList({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return <nav className={cn("flex shrink-0 items-center gap-1 lg:flex-col lg:items-stretch lg:gap-1.5", className)} {...props} />;
}

interface SidebarNavLinkProps extends React.ComponentProps<"a"> {
  icon: React.ReactNode;
  badge?: React.ReactNode;
  collapsed?: boolean;
}

export function SidebarNavLink({ icon, badge, collapsed = false, children, className, ...props }: SidebarNavLinkProps) {
  return (
    <a
      title={collapsed && typeof children === "string" ? children : undefined}
      className={cn(
        "group/nav flex h-9 shrink-0 items-center gap-2.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap text-sidebar-muted-foreground no-underline transition-[color,background-color,box-shadow] duration-150 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&_svg]:size-4 [&_svg]:shrink-0",
        "lg:h-11 lg:gap-3 lg:px-4 lg:text-[15px] lg:[&_svg]:size-5",
        "aria-[current=page]:bg-sidebar-primary aria-[current=page]:font-semibold aria-[current=page]:text-sidebar-primary-foreground aria-[current=page]:shadow-[0_8px_20px_rgb(125_104_249/0.35)]",
        collapsed && "lg:size-11 lg:justify-center lg:self-center lg:px-0",
        className
      )}
      {...props}
    >
      {icon}
      <span className={cn("min-w-0 flex-1 truncate", collapsed && "lg:sr-only")}>{children}</span>
      {badge != null && !collapsed && (
        <span className="ml-auto shrink-0 rounded-full bg-sidebar-accent px-2 text-xs font-semibold text-sidebar-foreground group-aria-[current=page]/nav:bg-white/20">
          {badge}
        </span>
      )}
    </a>
  );
}

const CHANNELS = [
  { href: "/dashboard/content", label: "Content", icon: FileTextIcon },
  { href: "/dashboard/directories", label: "Directories", icon: FolderOpenIcon },
  { href: "/dashboard/seo", label: "SEO checker", icon: ScanSearchIcon },
  { href: "/dashboard/media", label: "Press & Media", icon: NewspaperIcon },
  { href: "/dashboard/goals", label: "Goals", icon: TargetIcon },
  { href: "/dashboard/scoreboard", label: "Scoreboard", icon: TrophyIcon }, // PR 5 (doc/points-schema-requests.md)
];

export function DashboardSidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const current = (href: string) =>
    (href === "/dashboard" ? pathname === href : pathname.startsWith(href)) ? "page" : undefined;

  return (
    <SidebarNavList aria-label="Main navigation">
      <SidebarNavLink
        aria-current={current("/dashboard")}
        href="/dashboard"
        collapsed={collapsed}
        icon={<LayoutDashboardIcon aria-hidden="true" />}
      >
        Overview
      </SidebarNavLink>
      <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-sidebar-border lg:mx-3 lg:my-1.5 lg:h-px lg:w-auto" />
      {CHANNELS.map(({ href, label, icon: Icon }) => (
        <SidebarNavLink
          key={href}
          aria-current={current(href)}
          href={href}
          collapsed={collapsed}
          icon={<Icon aria-hidden="true" />}
        >
          {label}
        </SidebarNavLink>
      ))}
    </SidebarNavList>
  );
}
