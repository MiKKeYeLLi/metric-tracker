import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
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
    <main className="grid min-h-screen lg:grid-cols-[auto_minmax(0,1fr)]">
      <AppSidebar />
      <div className="flex min-h-screen min-w-0 flex-col">
        <TopBar
          name={displayName}
          email={session.user.email ?? undefined}
          image={session.user.image ?? undefined}
          initials={initials(displayName)}
        />
        {children}
      </div>
    </main>
  );
}
