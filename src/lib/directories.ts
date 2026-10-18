import type {
  Directory,
  DirectoryActivity,
  DirectoryChecklistItem,
  DirectoryPriority,
  DirectoryStatus,
} from "@prisma/client";
import { directoryStatusValues } from "@/lib/schemas/directories";

export type DirectoryStatusLabel = (typeof directoryStatusValues)[number];

const STATUS_TO_DB: Record<DirectoryStatusLabel, DirectoryStatus> = {
  "Not submitted": "NotSubmitted",
  "Pending review": "PendingReview",
  "Needs changes": "NeedsChanges",
  Live: "Live",
  Rejected: "Rejected",
};

const STATUS_FROM_DB = Object.fromEntries(
  Object.entries(STATUS_TO_DB).map(([label, value]) => [value, label])
) as Record<DirectoryStatus, DirectoryStatusLabel>;

export const statusToDb = (label: DirectoryStatusLabel) => STATUS_TO_DB[label];

/** What to call a directory in messages when its name hasn't been filled in. */
export const displayName = (directory: { name: string; website: string }) =>
  directory.name || directory.website || "A directory";
export const statusFromDb = (value: DirectoryStatus) => STATUS_FROM_DB[value];
export const priorityToDb = (label: "High" | "Medium" | "Low"): DirectoryPriority => label;

export const DEFAULT_CHECKLIST_LABELS = [
  "Logo (square and wide)",
  "Product screenshots",
  "One-line tagline",
  "Long description",
  "Pricing details",
];

/** Each new directory gets the standard checklist. */
export const defaultChecklist = () =>
  DEFAULT_CHECKLIST_LABELS.map((label, position) => ({ label, isDefault: true, position }));

export function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function todayDate() {
  return dateFromInput(new Date().toISOString().slice(0, 10));
}

/** Plain-language activity line for a status change. No names: the log is team-wide. */
export function statusMessage(name: string, status: DirectoryStatus) {
  switch (status) {
    case "Live":
      return `${name} went live`;
    case "PendingReview":
      return `${name} was submitted and is pending review`;
    case "NeedsChanges":
      return `${name} needs changes`;
    case "Rejected":
      return `${name} was rejected`;
    case "NotSubmitted":
      return `${name} moved back to the shortlist`;
  }
}

/** Submitted statuses need a submission date; default it to today when one isn't given. */
export function isSubmittedStatus(status: DirectoryStatus) {
  return status !== "NotSubmitted";
}

type DirectoryWithChecklist = Directory & { checklistItems: DirectoryChecklistItem[] };

export function serializeChecklistItem(item: DirectoryChecklistItem) {
  return { id: item.id, label: item.label, done: item.done, isDefault: item.isDefault, position: item.position };
}

export function serializeDirectory(directory: DirectoryWithChecklist) {
  return {
    id: directory.id,
    name: directory.name,
    website: directory.website,
    status: statusFromDb(directory.status),
    priority: directory.priority,
    dateSubmitted: directory.dateSubmitted?.toISOString().slice(0, 10) ?? null,
    listingUrl: directory.listingUrl,
    notes: directory.notes,
    checklist: [...directory.checklistItems].sort((a, b) => a.position - b.position).map(serializeChecklistItem),
    createdAt: directory.createdAt.toISOString(),
    updatedAt: directory.updatedAt.toISOString(),
  };
}

export function serializeActivity(activity: DirectoryActivity) {
  return {
    id: activity.id,
    directoryId: activity.directoryId,
    directoryName: activity.directoryName,
    message: activity.message,
    status: activity.status ? statusFromDb(activity.status) : null,
    createdAt: activity.createdAt.toISOString(),
  };
}

export const withChecklist = { checklistItems: { orderBy: { position: "asc" as const } } };
