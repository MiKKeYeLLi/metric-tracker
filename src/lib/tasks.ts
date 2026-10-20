import type { Task, User } from "@prisma/client";

export type TaskWithRelations = Task & {
  owner?: Pick<User, "id" | "name" | "email"> | null;
  user?: Pick<User, "id" | "name" | "email"> | null;
};

export function serializeTask(task: TaskWithRelations) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    dueAt: task.dueAt ? task.dueAt.toISOString() : new Date().toISOString(),
    done: task.done,
    completedAt: task.completedAt?.toISOString() ?? null,
    ownerId: task.ownerId,
    userId: task.userId ?? "",
    owner: task.owner
      ? {
          id: task.owner.id,
          name: task.owner.name,
          email: task.owner.email,
        }
      : null,
    user: task.user
      ? {
          id: task.user.id,
          name: task.user.name,
          email: task.user.email,
        }
      : undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
