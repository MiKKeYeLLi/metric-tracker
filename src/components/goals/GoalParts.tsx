"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ChevronDownIcon, MessageSquareIcon, type LucideIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { shortDate, type Agent, type Task } from "./goal-model";

/** DESIGN.md's progress bar for goals and workstreams: a full-width track with the share approved written inside the fill. */
export function TaskProgress({ label, done, total }: { label: string; done: number; total: number }) {
  if (total === 0) {
    return <p className="m-0 text-[13px] text-muted-foreground">No tasks yet. They appear once an idea is approved.</p>;
  }

  const percent = Math.round((done / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="font-medium text-muted-foreground">Tasks approved</span>
        <span className="font-bold text-primary-deep tabular-nums">
          {done} / {total}
        </span>
      </div>
      <div
        className="relative h-[26px] overflow-hidden rounded-full bg-chart-track"
        role="progressbar"
        aria-label={`${label}: ${done} of ${total} tasks approved`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        {done > 0 ? (
          <div
            className="flex h-full min-w-11 items-center justify-end rounded-full bg-primary px-2.5"
            style={{ width: `${percent}%` }}
          >
            <span className="text-[13px] font-semibold text-primary-foreground tabular-nums">{percent}%</span>
          </div>
        ) : (
          <span className="absolute inset-y-0 left-3 flex items-center text-[13px] font-semibold text-primary-deep tabular-nums">
            0%
          </span>
        )}
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** A person's photo, or their initials when there is none (demo owners have no photos). */
export function OwnerAvatar({ name, image, className }: { name: string; image?: string; className?: string }) {
  return (
    <Avatar className={cn("size-6", className)}>
      {image && <AvatarImage src={image} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-accent text-[10px] font-bold text-primary-deep">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

export function Panel({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-[22px] border border-border bg-card p-4 sm:p-5">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 flex items-baseline gap-2 text-[17px] leading-tight font-bold tracking-[-0.02em] text-foreground">
          {title}
          {count !== undefined && <span className="text-sm font-semibold text-muted-foreground tabular-nums">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TaskPoints({ task }: { task: Task }) {
  return (
    <span className="shrink-0 text-xs text-muted-foreground">
      {task.taskType} · <span className="font-bold text-primary-deep tabular-nums">{task.points} pts</span>
    </span>
  );
}

export function ThreadButton({ href, task }: { href: string; task: Task }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link
        href={href}
        aria-label={`Open thread for ${task.title}, ${task.commentCount} ${task.commentCount === 1 ? "comment" : "comments"}`}
      >
        <MessageSquareIcon data-icon="inline-start" aria-hidden="true" />
        Thread
        {task.commentCount > 0 && <span className="text-muted-foreground tabular-nums">{task.commentCount}</span>}
      </Link>
    </Button>
  );
}

export function QuietEmpty({ children }: { children: React.ReactNode }) {
  return <p className="m-0 py-3 text-sm text-muted-foreground">{children}</p>;
}

export function RowList({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 flex list-none flex-col divide-y divide-border p-0">{children}</ul>;
}

export function ByAgent({ agent, at }: { agent?: Agent; at: string }) {
  return (
    <p className="m-0 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{agent?.name ?? "Unknown agent"}</span>
      {agent && ` (${agent.ownerName})`} · {shortDate.format(new Date(at))}
    </p>
  );
}

/** Keeps rejected items out of the way but one click from view. */
export function RejectedToggle({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;

  return (
    <div className="flex flex-col gap-1 border-t border-border pt-2">
      <Button variant="ghost" size="sm" className="-ml-3 self-start" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Hide" : "Show"} rejected ({count})
        <ChevronDownIcon data-icon="inline-end" className={cn("transition-transform", open && "rotate-180")} aria-hidden="true" />
      </Button>
      {open && children}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="px-4 pt-6 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="-ml-3 max-w-full">
        <Link href={href}>
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </Link>
      </Button>
    </div>
  );
}

export function NotFoundState({
  title,
  description,
  icon: Icon,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  backHref: string;
  backLabel: string;
}) {
  return (
    <>
      <BackLink href={backHref} label={backLabel} />
      <PageHeader title={title} className="pt-2" />
      <PageContent>
        <section className="rounded-[22px] border border-border bg-card p-5">
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia className="size-12 rounded-full bg-accent text-primary-deep">
                <Icon className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{title}</EmptyTitle>
              <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" asChild>
                <Link href={backHref}>{backLabel}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </section>
      </PageContent>
    </>
  );
}
