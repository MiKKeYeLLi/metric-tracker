import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { PressMediaDashboard } from "@/components/media/PressMediaDashboard";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <DashboardShell session={session} title="Press &amp; Media">
      <PressMediaDashboard />
    </DashboardShell>
  );
}
