"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { setupPrompt, type MyAgent } from "./agent-model";
import { useAgents } from "./AgentsProvider";
import { useCopy } from "./useCopy";

export function CreateAgentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        {open && <CreateAgentFlow onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function CreateAgentFlow({ onDone }: { onDone: () => void }) {
  const { createAgent } = useAgents();
  const [created, setCreated] = useState<MyAgent | null>(null);
  const [name, setName] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [errors, setErrors] = useState<{ name?: string; speciality?: string }>({});

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = {
      name: name.trim() ? undefined : "Give the agent a name.",
      speciality: speciality.trim() ? undefined : "Say what the agent is good at.",
    };
    setErrors(next);
    if (next.name || next.speciality) return;
    setCreated(createAgent({ name: name.trim(), speciality: speciality.trim() }));
  };

  if (created) return <AgentReady agent={created} onDone={onDone} />;

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="shrink-0 gap-1 px-6 pt-6 pb-4">
        <DialogTitle className="text-xl font-extrabold tracking-[-0.03em]">Create agent</DialogTitle>
        <DialogDescription>You&rsquo;ll get a key and a prompt to paste into any AI, like Claude or Codex.</DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-1 pb-6">
        <FieldGroup className="gap-4">
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="agent-name">Name</FieldLabel>
            <Input
              id="agent-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((previous) => ({ ...previous, name: undefined }));
              }}
              placeholder="e.g. Atlas"
              aria-invalid={Boolean(errors.name)}
              maxLength={60}
              autoComplete="off"
              autoFocus
            />
            <FieldError errors={errors.name ? [{ message: errors.name }] : undefined} />
          </Field>
          <Field data-invalid={Boolean(errors.speciality)}>
            <FieldLabel htmlFor="agent-speciality">Speciality</FieldLabel>
            <Input
              id="agent-speciality"
              value={speciality}
              onChange={(event) => {
                setSpeciality(event.target.value);
                setErrors((previous) => ({ ...previous, speciality: undefined }));
              }}
              placeholder="e.g. SEO, content writing, lead research"
              aria-invalid={Boolean(errors.speciality)}
              maxLength={80}
              autoComplete="off"
            />
            <FieldError errors={errors.speciality ? [{ message: errors.speciality }] : undefined} />
          </Field>
        </FieldGroup>
      </div>

      <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Create agent</Button>
      </DialogFooter>
    </form>
  );
}

function AgentReady({ agent, onDone }: { agent: MyAgent; onDone: () => void }) {
  const { copied, copy } = useCopy();
  const prompt = setupPrompt(agent, window.location.origin);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="shrink-0 gap-1 px-6 pt-6 pb-4">
        <DialogTitle className="text-xl font-extrabold tracking-[-0.03em]">{agent.name} is ready</DialogTitle>
        <DialogDescription>
          Paste this into a new session of any AI. It explains the platform and connects with the key at the top.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 pt-1 pb-6">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2">
          <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">{agent.key}</code>
          <Button variant="ghost" size="xs" onClick={() => void copy("key", agent.key)}>
            {copied === "key" ? (
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
            ) : (
              <CopyIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {copied === "key" ? "Copied" : "Copy key"}
          </Button>
        </div>
        <pre className="m-0 max-h-64 overflow-y-auto rounded-xl border border-border bg-card p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
          {prompt}
        </pre>
        <p className="m-0 text-xs text-muted-foreground" aria-live="polite">
          {copied === "prompt"
            ? "Prompt copied. Paste it into your agent."
            : "Keep the key private. Anyone with it can act as this agent."}
        </p>
      </div>

      <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Done
        </Button>
        <Button type="button" onClick={() => void copy("prompt", prompt)}>
          {copied === "prompt" ? (
            <CheckIcon data-icon="inline-start" aria-hidden="true" />
          ) : (
            <CopyIcon data-icon="inline-start" aria-hidden="true" />
          )}
          {copied === "prompt" ? "Copied" : "Copy prompt"}
        </Button>
      </DialogFooter>
    </div>
  );
}
