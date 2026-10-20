# Task Management Feature Documentation

This document provides the technical specification and API reference for the **Task Management** system in `metric-tracker`. It serves as a canonical reference for both human engineers and autonomous AI agents integrating with or extending the task system.

---

## 1. System Overview

The Task system provides operational to-do, follow-up, and deadline tracking for marketing teams, content managers, and press outreach campaigns.

### Key Capabilities
- **CRUD Operations**: Complete REST API for creating, listing, inspecting, updating, and deleting tasks.
- **Automatic / Manual Assignment**: Tasks can be assigned automatically to the creator via `assignToMe: true`, assigned to another user via `ownerId`, or left unassigned.
- **Completion Tracking**: Toggling a task automatically manages the `completedAt` timestamp.
- **OpenAPI Compliant**: All routes and schemas are validated via Zod and exported to interactive OpenAPI documentation at `/docs`.
- **Integrated Dashboard View**: Accessible at `/dashboard/tasks` with KPI metrics, status filters, search, and optimistic completion toggles.

---

## 2. Data Model & Types

### Prisma Schema
Defined in [`prisma/schema.prisma`](file:///c:/Users/hp/Documents/hng/zedu/team-project/metric-tracker/prisma/schema.prisma):

```prisma
enum TaskType {
  Call
  Email
  FollowUp
  Meeting
  Other
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  type        TaskType  @default(Other)
  dueAt       DateTime
  done        Boolean   @default(false)
  completedAt DateTime?
  ownerId     String?
  owner       User?     @relation("TaskOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  userId      String
  user        User      @relation("TaskCreator", fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([dueAt])
  @@index([userId, done])
  @@index([ownerId])
}
```

### Entity Fields Description
| Field | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | No | `cuid()` | Unique task identifier |
| `title` | `String` | No | - | Brief title of the task (max 200 characters) |
| `description` | `String` | Yes | `null` | Context, notes, talking points, or links (max 2,000 characters) |
| `type` | `TaskType` | No | `Other` | One of `Call`, `Email`, `FollowUp`, `Meeting`, `Other` |
| `dueAt` | `DateTime` | No | - | ISO 8601 target deadline timestamp |
| `done` | `Boolean` | No | `false` | Status indicating if the task is finished |
| `completedAt` | `DateTime` | Yes | `null` | Timestamp when the task was marked done (cleared if reopened) |
| `ownerId` | `String` | Yes | `null` | User ID of the assignee (null if unassigned) |
| `userId` | `String` | No | - | User ID of the creator |
| `createdAt` | `DateTime` | No | `now()` | Record creation timestamp |
| `updatedAt` | `DateTime` | No | `now()` | Last modification timestamp |

---

## 3. Authentication

All Task API endpoints are protected and require an authenticated session via `requireAuth()` (`src/lib/api.ts`).

- **Web Browser**: Authenticates via the NextAuth session cookie (`next-auth.session-token`).
- **Unauthenticated Requests**: Return HTTP `401 Unauthorized`:
  ```json
  { "error": "Unauthorized" }
  ```

---

## 4. API Endpoints Reference

### 4.1. List Tasks (`GET /api/tasks`)

Retrieves tasks sorted chronologically by `dueAt` ascending.

#### Query Parameters
| Parameter | Type | Required | Values | Description |
| :--- | :--- | :---: | :--- | :--- |
| `status` | `string` | No | `open`, `completed`, `all` | Filter by completion state. Default is `all`. |
| `type` | `string` | No | `Call`, `Email`, `FollowUp`, `Meeting`, `Other` | Filter by task category. |
| `assignedToMe` | `string` | No | `true`, `false` | When `true`, returns only tasks assigned to the current user. When `false`, returns tasks assigned to others or unassigned. |

#### Example Request
```http
GET /api/tasks?status=open&type=FollowUp&assignedToMe=true HTTP/1.1
Host: localhost:3000
```

#### Success Response (`200 OK`)
```json
[
  {
    "id": "cm2...",
    "title": "Send press kit to TechCabal",
    "description": "Include product demo video link",
    "type": "Email",
    "dueAt": "2026-10-25T14:00:00.000Z",
    "done": false,
    "completedAt": null,
    "ownerId": "usr_123",
    "userId": "usr_123",
    "owner": {
      "id": "usr_123",
      "name": "Alex Taylor",
      "email": "alex@example.com"
    },
    "user": {
      "id": "usr_123",
      "name": "Alex Taylor",
      "email": "alex@example.com"
    },
    "createdAt": "2026-10-20T00:00:00.000Z",
    "updatedAt": "2026-10-20T00:00:00.000Z"
  }
]
```

---

### 4.2. Create Task (`POST /api/tasks`)

Creates a new task.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Payload
```json
{
  "title": "Review marketing copy",
  "description": "Check SEO meta descriptions and landing page headlines",
  "type": "FollowUp",
  "dueAt": "2026-10-24T09:00:00.000Z",
  "assignToMe": true
}
```

#### Payload Fields
| Field | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `title` | `string` | **Yes** | - | 1 to 200 characters. Trimmed. |
| `description` | `string` | No | `null` | Up to 2,000 characters. |
| `type` | `string` | No | `"Other"` | Must be one of `Call`, `Email`, `FollowUp`, `Meeting`, `Other`. |
| `dueAt` | `string` | **Yes** | - | Valid ISO 8601 datetime string (e.g., `2026-10-24T09:00:00.000Z`). |
| `assignToMe` | `boolean` | No | `true` | When `true`, automatically assigns the task to the current authenticated user (`ownerId = session.user.id`). |
| `ownerId` | `string` | No | `null` | Target assignee user ID. Used when `assignToMe` is `false`. If omitted or null, the task is unassigned. |

#### Success Response (`201 Created`)
Returns the complete created task object with `201 Created`.

#### Validation Error (`400 Bad Request`)
```json
{
  "error": "Validation failed",
  "details": {
    "title": ["Title is required"],
    "dueAt": ["Invalid datetime"]
  }
}
```

---

### 4.3. Get Task By ID (`GET /api/tasks/:id`)

Fetches details for a single task.

#### Success Response (`200 OK`)
Returns the task object matching the provided `:id`.

#### Error Response (`404 Not Found`)
```json
{
  "error": "Not found"
}
```

---

### 4.4. Update Task (`PATCH /api/tasks/:id`)

Partially updates an existing task. Any omitted field remains untouched.

#### Request Payload (at least one field required)
```json
{
  "title": "Send updated pitch deck",
  "done": true
}
```

#### Updatable Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | Updated title (1–200 characters) |
| `description` | `string \| null` | Updated notes or description |
| `type` | `TaskType` | Updated task category |
| `dueAt` | `string` | Updated ISO 8601 datetime deadline |
| `done` | `boolean` | Updating to `true` marks the task completed and sets `completedAt = now()`. Updating to `false` reopens it and resets `completedAt = null`. |
| `ownerId` | `string \| null` | Changes or clears the assignee |

#### Success Response (`200 OK`)
Returns the updated task object.

---

### 4.5. Delete Task (`DELETE /api/tasks/:id`)

Permanently deletes the task.

#### Success Response (`204 No Content`)
HTTP 204 with an empty body.

#### Error Response (`404 Not Found`)
```json
{
  "error": "Not found"
}
```

---

## 5. Business Logic & Rules

1. **Assignment Resolution**:
   - On creation, if `assignToMe` is `true` (the default), `ownerId` is set to the caller's `session.user.id`.
   - If `assignToMe` is `false`, `ownerId` uses the explicitly supplied `ownerId`, or remains `null` (unassigned).
2. **Completion Timestamps**:
   - Marking `done: true` records `completedAt: new Date()` if not already set.
   - Reopening via `done: false` resets `completedAt: null`.
3. **Due Urgency Calculation**:
   - **Overdue**: `!done && dueAt < todayStart` (highlighted in red).
   - **Due Today**: `!done && dueAt == today` (highlighted in amber).
   - **Upcoming**: `!done && dueAt > today` (highlighted in neutral/primary).
   - **Done**: `done === true` (displayed with strikethrough and muted text).

---

## 6. Integration Examples

### Example: Calling from cURL / External Agent
```bash
# 1. Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<SESSION_TOKEN>" \
  -d '{
    "title": "Follow up with TechPoint journalist",
    "type": "FollowUp",
    "dueAt": "2026-10-25T11:00:00.000Z",
    "assignToMe": true
  }'

# 2. Complete a task
curl -X PATCH http://localhost:3000/api/tasks/cm2... \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<SESSION_TOKEN>" \
  -d '{ "done": true }'

# 3. List open tasks
curl -X GET "http://localhost:3000/api/tasks?status=open" \
  -H "Cookie: next-auth.session-token=<SESSION_TOKEN>"
```

### Example: Calling from Frontend Client (Fetch)
```typescript
// Toggle completion state with optimistic update
async function toggleTask(id: string, nextDone: boolean) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done: nextDone }),
  });
  if (!response.ok) throw new Error("Failed to update task");
  return response.json();
}
```
