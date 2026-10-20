import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoalsProvider } from "@/components/goals/GoalsProvider";

export const dynamic = "force-dynamic";

export default async function GoalsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string | null } | undefined;

  return (
    <GoalsProvider currentUser={{ id: user?.id ?? "current_user", name: user?.name ?? "You" }}>{children}</GoalsProvider>
  );
}
