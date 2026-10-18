import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/AuthButtons";
import { DashboardSidebarNav } from "@/components/SidebarNav";
import { Wordmark } from "@/components/Wordmark";
import { authOptions } from "@/lib/auth";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "Z";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const displayName = session.user.name ?? session.user.email ?? "Signed in";

  return (
    <main className="grid min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-20 flex items-center gap-2 overflow-x-auto bg-sidebar px-4 py-3 text-sidebar-foreground lg:h-screen lg:flex-col lg:items-stretch lg:gap-0 lg:overflow-x-hidden lg:overflow-y-auto lg:px-4 lg:pt-6 lg:pb-4">
        <div className="mr-3 shrink-0 px-1 lg:mr-0 lg:mb-8 lg:px-2">
          <Wordmark href="/dashboard" tone="inverse" />
        </div>

        <DashboardSidebarNav />

        <div className="mt-auto hidden shrink-0 items-center gap-2.5 rounded-2xl bg-sidebar-accent p-2.5 lg:flex">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            {initials(displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-sidebar-foreground">{displayName}</p>
            {session.user.email && session.user.email !== displayName && (
              <p className="truncate text-[11px] text-sidebar-muted-foreground" title={session.user.email}>
                {session.user.email}
              </p>
            )}
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">{children}</div>
    </main>
  );
}
