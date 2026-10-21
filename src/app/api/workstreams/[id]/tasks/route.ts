import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/api";
import { goalTaskCreateSchema } from "@/lib/schemas/tasks";
import { workstreamIdParamsSchema } from "@/lib/schemas/workstreams";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  // 1. Authenticate caller (supports both human users and agents)
  const auth = await getAuthContext(req);
  if (auth.error) {
    return auth.error;
  }

  // 2. Validate the path param before it reaches Prisma
  const paramsResult = workstreamIdParamsSchema.safeParse(params);
  if (!paramsResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: paramsResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const workstreamId = paramsResult.data.id;

  // 3. Parse and validate request body using Zod schema
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Validation failed", details: { _errors: ["Invalid JSON"] } },
      { status: 400 },
    );
  }

  const result = goalTaskCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // 4. Verify parent workstream exists and is accepted.
  // Rule: Tasks cannot be proposed under an unaccepted idea/workstream.
  const workstream = await prisma.workstream.findUnique({
    where: { id: workstreamId },
    select: { id: true, status: true, autoAcceptTasks: true },
  });

  if (!workstream) {
    return NextResponse.json(
      { error: "Workstream not found" },
      { status: 404 },
    );
  }

  if (workstream.status !== "accepted") {
    return NextResponse.json(
      { error: "Cannot propose tasks under an unaccepted idea" },
      { status: 400 },
    );
  }

  const { title, description, taskType } = result.data;

  // 5. Determine initial status based on workstream's autoAcceptTasks setting
  const initialStatus = workstream.autoAcceptTasks ? "open" : "proposed";

  // 6. Create the task record
  const newTask = await prisma.task.create({
    data: {
      workstreamId,
      title,
      description: description ?? null,
      taskType,
      status: initialStatus,
    },
  });

  return NextResponse.json(newTask, { status: 201 });
}
