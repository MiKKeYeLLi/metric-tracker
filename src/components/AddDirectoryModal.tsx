"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarAddButton } from "@/components/SidebarNav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function AddDirectoryModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function validateUrl(value: string) {
    try {
      const parsed = new URL(value.trim());
      return (
        ["http:", "https:"].includes(parsed.protocol) &&
        parsed.hostname.includes(".") &&
        !parsed.hostname.startsWith(".") &&
        !parsed.hostname.endsWith(".")
      );
    } catch {
      return false;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanUrl = url.trim();

    if (!cleanName) {
      setError("Enter a directory name.");
      return;
    }

    if (!cleanUrl || !validateUrl(cleanUrl)) {
      setError("Enter a valid website URL starting with https:// or http://.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/directories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, url: cleanUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save the directory. Please try again.");
        return;
      }

      setOpen(false);
      setName("");
      setUrl("");
      router.refresh();
    } catch {
      setError("Could not save the directory. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return;
        if (next) setError("");
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <SidebarAddButton>Add directory</SidebarAddButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>Add a directory</DialogTitle>
          <DialogDescription>
            Add a marketing directory to track your product submissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="directory-name">Name</FieldLabel>
              <Input
                id="directory-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Product Hunt"
                maxLength={100}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="directory-url">URL</FieldLabel>
              <Input
                id="directory-url"
                name="url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.producthunt.com"
                maxLength={2048}
                required
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="lg" disabled={saving}>
              {saving && <Spinner data-icon="inline-start" />}
              {saving ? "Saving…" : "Save directory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
