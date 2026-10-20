"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CheckIcon,
  CircleDotIcon,
  CopyIcon,
  FileIcon,
  FileTextIcon,
  LinkIcon,
  MessageSquareIcon,
  UserCheckIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { shortDateTime, type Agent, type Task } from "./goal-model";
import { Panel, QuietEmpty } from "./GoalParts";
import { useGoals } from "./GoalsProvider";
import {
  ACTIVE_STATUSES,
  COMMENT_TYPES,
  MAX_ACTIVE_TASKS,
  REVIEW_SCALE,
  THREAD_FILTERS,
  type Attachment,
  type Author,
  type CommentType,
  type ThreadComment,
  type ThreadEntry,
} from "./thread-model";

type Filter = "all" | CommentType;

/** The task's conversation: every bid, delivery, review and decision, filterable by comment type. */
export function TaskThread({ task }: { task: Task }) {
  const { threadFor, addNote } = useGoals();
  const entries = threadFor(task.id);
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const byType = new Map<CommentType, number>();
    for (const entry of entries) {
      if (entry.kind === "comment") byType.set(entry.type, (byType.get(entry.type) ?? 0) + 1);
    }
    return byType;
  }, [entries]);
  const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
  const filters: Filter[] = ["all", ...THREAD_FILTERS.filter((type) => (counts.get(type) ?? 0) > 0)];

  return (
    <Panel
      title="Thread"
      count={total}
      action={<span className="text-xs text-muted-foreground">Agents bid, deliver and review here</span>}
    >
      {entries.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia className="size-12 rounded-full bg-accent text-primary-deep">
              <MessageSquareIcon className="size-5" aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No activity yet</EmptyTitle>
            <EmptyDescription>Bids from interested agents will show up here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} className="pt-1">
          <TabsList className="max-w-full justify-start overflow-x-auto" aria-label="Filter the thread by comment type">
            {filters.map((value) => (
              <TabsTrigger key={value} value={value} className="flex-none">
                {value === "all" ? "All" : COMMENT_TYPES[value].plural}{" "}
                <span className="tabular-nums opacity-70">{value === "all" ? total : counts.get(value)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {filters.map((value) => {
            const visible =
              value === "all" ? entries : entries.filter((entry) => entry.kind === "comment" && entry.type === value);
            return (
              <TabsContent key={value} value={value}>
                {visible.length === 0 ? (
                  <QuietEmpty>Nothing here yet.</QuietEmpty>
                ) : (
                  <ol className="m-0 flex list-none flex-col divide-y divide-border p-0">
                    {visible.map((entry) => (
                      <ThreadItem key={entry.id} entry={entry} task={task} />
                    ))}
                  </ol>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <NoteComposer taskId={task.id} onPost={(body) => addNote(task.id, body)} />
    </Panel>
  );
}

function ThreadItem({ entry, task }: { entry: ThreadEntry; task: Task }) {
  if (entry.kind === "event") {
    return (
      <li className="flex items-center gap-2 py-2.5 text-xs text-muted-foreground">
        <CircleDotIcon className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">{entry.text}</span>
        <EntryTime at={entry.at} />
      </li>
    );
  }
  return <CommentItem comment={entry} task={task} />;
}

function CommentItem({ comment, task }: { comment: ThreadComment; task: Task }) {
  const { agentFor, currentUser } = useGoals();
  const author = describeAuthor(comment.author, agentFor, currentUser.name);
  const type = COMMENT_TYPES[comment.type];
  const bidder = comment.type === "bid" && comment.author.kind === "agent" ? agentFor(comment.author.agentId) : undefined;

  return (
    <li className="flex gap-3 py-4">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold",
          comment.author.kind === "agent" ? "bg-accent text-primary-deep" : "bg-secondary text-secondary-foreground"
        )}
        aria-hidden="true"
      >
        {author.initials}
      </span>

      <article className="flex min-w-0 flex-1 flex-col gap-1.5" aria-label={`${type.label} from ${author.name}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-foreground">{author.name}</span>
          <span className="text-xs text-muted-foreground">{author.detail}</span>
          <Badge variant={type.badge}>{type.label}</Badge>
          <span className="font-mono text-xs text-muted-foreground">#{comment.tag}</span>
          <EntryTime at={comment.at} className="sm:ml-auto" />
        </div>

        <h3 className="m-0 flex flex-wrap items-baseline gap-x-2 text-sm leading-snug font-bold text-foreground">
          {comment.title}
          {comment.score !== undefined && (
            <span className="text-xs font-semibold text-primary-deep tabular-nums">
              Score {comment.score}/{REVIEW_SCALE}
            </span>
          )}
        </h3>
        <p className="m-0 text-sm whitespace-pre-line text-foreground/80">{comment.body}</p>
        {comment.attachment && <AttachmentBlock attachment={comment.attachment} />}
        {bidder && <BidActions bidder={bidder} task={task} />}
      </article>
    </li>
  );
}

/** Lets a human assign the task to this bidder, showing how busy the bidder already is. */
function BidActions({ bidder, task }: { bidder: Agent; task: Task }) {
  const { tasks, assignTask } = useGoals();
  const [confirming, setConfirming] = useState(false);

  const biddingOpen = task.status === "open" || task.status === "bidding";
  const assigned = task.assignedAgentId === bidder.id;
  if (!biddingOpen && !assigned) return null;

  const activeTasks = tasks.filter(
    (candidate) => candidate.assignedAgentId === bidder.id && ACTIVE_STATUSES.includes(candidate.status)
  ).length;
  const atLimit = activeTasks >= MAX_ACTIVE_TASKS;
  const otherBidders = Math.max(task.bidCount - 1, 0);

  return (
    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground tabular-nums">
        {activeTasks} of {MAX_ACTIVE_TASKS} active tasks
      </span>

      {assigned ? (
        <Badge variant="success">
          <CheckIcon data-icon="inline-start" aria-hidden="true" />
          Assigned
        </Badge>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={atLimit}
          onClick={() => setConfirming(true)}
          aria-label={atLimit ? `${bidder.name} is at the active-task limit` : `Assign this task to ${bidder.name}`}
        >
          <UserCheckIcon data-icon="inline-start" aria-hidden="true" />
          {atLimit ? "At task limit" : `Assign to ${bidder.name}`}
        </Button>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-extrabold tracking-[-0.03em]">Assign to {bidder.name}?</DialogTitle>
            <DialogDescription>
              {bidder.name} ({bidder.ownerName}) gets the offer and starts work on &ldquo;{task.title}&rdquo;.
              {otherBidders > 0 &&
                ` The other ${otherBidders} ${otherBidders === 1 ? "bidder stays" : "bidders stay"} in the thread but won't be assigned.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                assignTask(task.id, bidder.id);
                setConfirming(false);
              }}
            >
              Assign task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ATTACHMENT_ICONS = { text: FileTextIcon, file: FileIcon, link: LinkIcon };

/** The deliverable on its own, so copying it gives only the work and none of the chatter. */
function AttachmentBlock({ attachment }: { attachment: Attachment }) {
  const [copied, setCopied] = useState(false);
  const Icon = ATTACHMENT_ICONS[attachment.kind];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(attachment.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground">
          <Icon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{attachment.label}</span>
        </span>
        <Button variant="ghost" size="xs" onClick={copy} aria-label={`Copy ${attachment.label}`}>
          {copied ? (
            <CheckIcon data-icon="inline-start" aria-hidden="true" />
          ) : (
            <CopyIcon data-icon="inline-start" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="m-0 max-h-48 overflow-auto font-mono text-xs whitespace-pre-wrap text-foreground/80">
        {attachment.content}
      </pre>
    </div>
  );
}

function NoteComposer({ taskId, onPost }: { taskId: string; onPost: (body: string) => void }) {
  const [body, setBody] = useState("");
  const id = `note-${taskId}`;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    onPost(body.trim());
    setBody("");
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-border pt-4">
      <Field>
        <FieldLabel htmlFor={id}>Add a note</FieldLabel>
        <Textarea
          id={id}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Answer an escalation or give the agents direction"
          rows={2}
          maxLength={2000}
          className="min-h-16"
        />
        <FieldDescription>Agents read the thread before they work on the task.</FieldDescription>
      </Field>
      <Button type="submit" variant="outline" size="sm" className="self-end" disabled={!body.trim()}>
        Post note
      </Button>
    </form>
  );
}

function EntryTime({ at, className }: { at: string; className?: string }) {
  return (
    <time dateTime={at} className={cn("shrink-0 font-mono text-xs text-muted-foreground", className)}>
      {shortDateTime.format(new Date(at))}
    </time>
  );
}

function describeAuthor(
  author: Author,
  agentFor: ReturnType<typeof useGoals>["agentFor"],
  currentUserName: string
): { name: string; initials: string; detail: string } {
  if (author.kind === "human") {
    const isYou = author.name === currentUserName;
    return { name: isYou ? "You" : author.name, initials: initials(author.name), detail: "Human" };
  }
  const agent = agentFor(author.agentId);
  return agent
    ? { name: agent.name, initials: initials(agent.name), detail: `${agent.speciality} · ${agent.ownerName}` }
    : { name: "Unknown agent", initials: "?", detail: "" };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
