"use client";

import { useState, type FormEvent } from "react";
import { PartyPopperIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { sendJson, today, type PressItem } from "./press-model";

export function MarkFeaturedDialog({
  item,
  onOpenChange,
  onSaved,
}: {
  item: PressItem | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (message: string) => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {item && <MarkFeaturedForm key={item.id} item={item} onCancel={() => onOpenChange(false)} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function MarkFeaturedForm({
  item,
  onCancel,
  onSaved,
}: {
  item: PressItem;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [headline, setHeadline] = useState(item.title);
  const [url, setUrl] = useState(item.url ?? "");
  const [publishedOn, setPublishedOn] = useState(today());
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!item.submission) return;
    setIsSaving(true);
    setError("");
    try {
      await sendJson(`/api/media/${item.submission.id}/feature`, "POST", {
        title: headline.trim(),
        articleUrl: url.trim(),
        publicationDate: publishedOn || undefined,
      });
      onSaved(`Featured in ${item.outlet}!`);
      onCancel();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Couldn't save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <DialogHeader className="gap-1">
        <span className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-success-muted text-success">
          <PartyPopperIcon className="size-5" aria-hidden="true" />
        </span>
        <DialogTitle className="text-xl font-extrabold tracking-[-0.03em]">Featured in {item.outlet}</DialogTitle>
        <DialogDescription>Add where it was published. The pitch moves to Featured and stays linked to it.</DialogDescription>
      </DialogHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="featured-headline">Headline</FieldLabel>
          <Input id="featured-headline" value={headline} onChange={(event) => setHeadline(event.target.value)} autoComplete="off" />
        </Field>
        <Field>
          <FieldLabel htmlFor="featured-url">Link to the feature</FieldLabel>
          <Input
            id="featured-url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
            autoComplete="off"
            autoFocus
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="featured-date">Published on</FieldLabel>
          <Input id="featured-date" type="date" value={publishedOn} onChange={(event) => setPublishedOn(event.target.value)} />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Spinner data-icon="inline-start" />}
          {isSaving ? "Saving…" : "Mark as featured"}
        </Button>
      </DialogFooter>
    </form>
  );
}
