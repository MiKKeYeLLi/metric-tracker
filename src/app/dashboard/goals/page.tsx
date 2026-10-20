import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoalsView } from "@/components/goals/GoalsView";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);

  return <GoalsView currentUserName={session?.user?.name ?? "You"} />;
}
