import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { DirectoriesView } from "@/components/directories/DirectoriesView";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DirectoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <DashboardShell session={session} title="Directories">
      <DirectoriesView />
    </DashboardShell>
  );
}
