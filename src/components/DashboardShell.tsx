import { LayoutGridIcon, FolderGit2Icon, NewspaperIcon } from "lucide-react";
import type { Session } from "next-auth";
import { SignOutButton } from "@/components/AuthButtons";
import { SidebarNavLink, SidebarNavList } from "@/components/SidebarNav";
import { Wordmark } from "@/components/Wordmark";

export function DashboardShell({
  session,
  title,
  children,
}: {
  session: Session;
  title: string;
  children: React.ReactNode;
}) {
  const userEmail = session.user?.email ?? "User";

  return (
    <main className="grid min-h-screen lg:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="flex items-center gap-1 overflow-x-auto border-b border-sidebar-border bg-sidebar px-4 py-3.5 lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:items-stretch lg:gap-0 lg:overflow-x-hidden lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-2.5 lg:pt-5 lg:pb-4">
        <div className="mr-5 shrink-0 px-2 py-0.5 lg:mr-0 lg:mb-6">
          <Wordmark href="/dashboard" />
        </div>

        <SidebarNavList aria-label="Main navigation">
          <SidebarNavLink href="/dashboard" icon={<LayoutGridIcon aria-hidden="true" />}>
            Overview
          </SidebarNavLink>
          <SidebarNavLink href="/directories" icon={<FolderGit2Icon aria-hidden="true" />}>
            Directories
          </SidebarNavLink>
          <SidebarNavLink href="/press" icon={<NewspaperIcon aria-hidden="true" />}>
            Press &amp; Media
          </SidebarNavLink>
        </SidebarNavList>

        <div className="mt-auto hidden shrink-0 gap-1.5 border-t border-sidebar-border px-2.5 pt-3.5 lg:grid">
          <span
            className="truncate text-[11px] font-medium text-muted-foreground"
            title={userEmail}
          >
            {userEmail}
          </span>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b bg-background/90 px-4 backdrop-blur-sm sm:px-[clamp(20px,4vw,48px)]">
          <h1 className="m-0 text-base leading-none font-bold tracking-[-0.03em] text-foreground">
            {title}
          </h1>
        </header>

        <main className="flex-1 p-4 sm:px-[clamp(20px,4vw,48px)] sm:py-6">{children}</main>
      </div>
    </main>
  );
}
