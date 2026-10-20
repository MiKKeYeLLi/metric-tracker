import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TasksView } from "@/components/tasks/TasksView";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  return <TasksView currentUserId={userId} />;
}
