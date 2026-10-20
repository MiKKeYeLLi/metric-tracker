import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { taskCreateSchema, taskUpdateSchema, commentCreateSchema } from "@/lib/schemas/tasks";
import { serializeTask } from "@/lib/tasks";
import { getOpenApiDocument } from "@/lib/openapi";

describe("Tasks Validation & Serialization", () => {
  it("validates valid task creation payload with defaults", () => {
    const input = {
      title: "Write documentation",
      dueAt: "2026-10-25T14:00:00.000Z",
    };
    const parsed = taskCreateSchema.safeParse(input);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.title, "Write documentation");
      assert.equal(parsed.data.type, "Other");
      assert.equal(parsed.data.assignToMe, true);
    }
  });

  it("handles explicit assignToMe: false", () => {
    const input = {
      title: "Team meeting",
      type: "Meeting",
      dueAt: "2026-10-25T14:00:00.000Z",
      assignToMe: false,
    };
    const parsed = taskCreateSchema.safeParse(input);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.assignToMe, false);
      assert.equal(parsed.data.type, "Meeting");
    }
  });

  it("rejects task creation with missing title or invalid dueAt", () => {
    const emptyTitle = taskCreateSchema.safeParse({
      title: "   ",
      dueAt: "2026-10-25T14:00:00.000Z",
    });
    assert.equal(emptyTitle.success, false);

    const invalidDate = taskCreateSchema.safeParse({
      title: "Task with bad date",
      dueAt: "not-a-date",
    });
    assert.equal(invalidDate.success, false);
  });

  it("validates task updates and rejects empty updates", () => {
    const validUpdate = taskUpdateSchema.safeParse({ done: true });
    assert.equal(validUpdate.success, true);

    const emptyUpdate = taskUpdateSchema.safeParse({});
    assert.equal(emptyUpdate.success, false);
  });

  it("serializes task correctly with ISO dates and relations", () => {
    const dummyTask = {
      id: "task-1",
      workstreamId: null,
      taskType: null,
      title: "Follow up with client",
      description: "Discuss pricing",
      type: "FollowUp" as const,
      status: "proposed" as const,
      assignedAgentId: null,
      offeredToAgentId: null,
      offeredAt: null,
      offerExpiresAt: null,
      revisionCount: 0,
      maxRevisions: 2,
      dueAt: new Date("2026-10-25T14:00:00.000Z"),
      done: false,
      completedAt: null,
      ownerId: "user-1",
      userId: "user-creator",
      owner: {
        id: "user-1",
        name: "Jane Doe",
        email: "jane@example.com",
      },
      user: {
        id: "user-creator",
        name: "Admin User",
        email: "admin@example.com",
      },
      createdAt: new Date("2026-10-20T10:00:00.000Z"),
      updatedAt: new Date("2026-10-20T10:00:00.000Z"),
    };

    const serialized = serializeTask(dummyTask);
    assert.equal(serialized.id, "task-1");
    assert.equal(serialized.dueAt, "2026-10-25T14:00:00.000Z");
    assert.equal(serialized.completedAt, null);
    assert.equal(serialized.owner?.name, "Jane Doe");
    assert.equal(serialized.user?.name, "Admin User");
  });

  it("registers tasks endpoints in OpenAPI document", () => {
    const doc = getOpenApiDocument();
    assert.ok(doc.paths);
    assert.ok(doc.paths["/api/tasks"]);
    assert.ok(doc.paths["/api/tasks"].get);
    assert.ok(doc.paths["/api/tasks"].post);
    assert.ok(doc.paths["/api/tasks/{id}"]);
    assert.ok(doc.paths["/api/tasks/{id}"].get);
    assert.ok(doc.paths["/api/tasks/{id}"].patch);
    assert.ok(doc.paths["/api/tasks/{id}"].delete);
  });
});

describe("Comment Validation & Registration", () => {
  it("validates a valid review comment payload", () => {
    const parsed = commentCreateSchema.safeParse({
      type: "review",
      tag: "seo",
      title: "Peer review",
      body: "Looks good overall.",
      score: 8,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.type, "review");
      assert.equal(parsed.data.score, 8);
    }
  });

  it("rejects review with missing body", () => {
    assert.equal(commentCreateSchema.safeParse({ type: "review" }).success, false);
  });

  it("rejects review score outside 1-10", () => {
    assert.equal(
      commentCreateSchema.safeParse({ type: "review", body: "ok", score: 0 }).success,
      false
    );
    assert.equal(
      commentCreateSchema.safeParse({ type: "review", body: "ok", score: 11 }).success,
      false
    );
  });

  it("registers comments endpoint in OpenAPI document", () => {
    const doc = getOpenApiDocument();
    assert.ok(doc.paths);
    assert.ok(doc.paths["/api/tasks/{id}/comments"]);
    assert.ok(doc.paths["/api/tasks/{id}/comments"].post);
  });
});
