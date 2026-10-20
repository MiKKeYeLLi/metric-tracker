"use client";

import { useState } from "react";
import { CheckIcon, ChevronDownIcon, CopyIcon, FileTextIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { maskKey, setupPrompt } from "./agent-model";
import { AgentAvatar } from "./AgentAvatar";
import { useAgents } from "./AgentsProvider";
import { CreateAgentDialog } from "./CreateAgentDialog";
import { useCopy } from "./useCopy";

export function AgentSwitcher() {
  const { agents, selected, select } = useAgents();
  const { copied, copy } = useCopy();
  const [creating, setCreating] = useState(false);

  const createButton = (
    <>
      <Button onClick={() => setCreating(true)} className="hidden sm:inline-flex">
        <PlusIcon data-icon="inline-start" aria-hidden="true" />
        Create agent
      </Button>
      <Button size="icon" onClick={() => setCreating(true)} aria-label="Create agent" className="sm:hidden">
        <PlusIcon aria-hidden="true" />
      </Button>
    </>
  );

  if (!selected) {
    return (
      <>
        {createButton}
        <CreateAgentDialog open={creating} onOpenChange={setCreating} />
      </>
    );
  }

  const keyCopied = copied === `key:${selected.id}`;
  const promptCopied = copied === `prompt:${selected.id}`;

  return (
    <>
      {createButton}
      <div className="flex h-10 items-center rounded-full border border-border bg-card">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Agent: ${selected.name}. Switch agent`}
            className="flex h-full min-w-0 items-center gap-2 rounded-l-full pr-2.5 pl-1.5 text-sm font-semibold text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="relative flex shrink-0">
              <AgentAvatar avatar={selected.avatar} className="size-7" />
              <StatusDot connected={selected.status === "connected"} />
            </span>
            <span className="max-w-[96px] truncate sm:max-w-[160px]">{selected.name}</span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Your agents</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={selected.id} onValueChange={select}>
              {agents.map((agent) => (
                <DropdownMenuRadioItem key={agent.id} value={agent.id} className="gap-2.5 py-1.5">
                  <AgentAvatar avatar={agent.avatar} className="size-8" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{agent.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {agent.speciality} · {agent.status === "connected" ? "Connected" : "Waiting to connect"}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void copy(`prompt:${selected.id}`, setupPrompt(selected, window.location.origin))}>
              <FileTextIcon aria-hidden="true" />
              Copy setup prompt for {selected.name}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span aria-hidden="true" className="h-5 w-px bg-border" />

        <button
          type="button"
          onClick={() => void copy(`key:${selected.id}`, selected.key)}
          aria-label={`Copy key for ${selected.name}`}
          title={maskKey(selected.key)}
          className={cn(
            "flex h-full items-center gap-1.5 rounded-r-full pr-3.5 pl-2.5 text-[13px] font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
            keyCopied || promptCopied ? "text-success" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {keyCopied || promptCopied ? (
            <CheckIcon className="size-4" aria-hidden="true" />
          ) : (
            <CopyIcon className="size-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{promptCopied ? "Prompt copied" : keyCopied ? "Copied" : "Copy key"}</span>
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {keyCopied ? `Key for ${selected.name} copied` : promptCopied ? `Setup prompt for ${selected.name} copied` : ""}
      </span>

      <CreateAgentDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card",
        connected ? "bg-success" : "bg-warning"
      )}
    />
  );
}
