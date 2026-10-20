"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ChevronDownIcon, MessageSquareIcon, type LucideIcon } from "lucide-react";
import { PageContent, PageHeader } from "@/components/PageHeader";
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

export function Progress({ label, done, total, className }: { label: string; done: number; total: number; className?: string }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-chart-track"
        role="progressbar"
        aria-label={`${label}: ${done} of ${total} tasks approved`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
        {done}/{total}
      </span>
    </div>
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
