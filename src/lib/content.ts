import type { ContentItem } from "@prisma/client";

export function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateToOutput(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

export function serializeContent(item: ContentItem) {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    type: item.type,
    platform: item.platform,
    topics: item.topics,
    status: item.status,
    createdDate: dateToOutput(item.createdDate),
    publishDate: dateToOutput(item.publishDate),
    updatedDate: dateToOutput(item.updatedDate),
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}