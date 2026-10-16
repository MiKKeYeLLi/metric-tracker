"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheckIcon, EllipsisIcon, Trash2Icon, TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function RowMenu({ label, submissionId }: { label: string; submissionId: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/submissions/${submissionId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            disabled={deleting}
            className="opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 disabled:opacity-100"
          >
            {deleting ? <Spinner /> : <EllipsisIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-40">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <CircleCheckIcon />
              Update status
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setModalOpen(true)}>
              <TrendingUpIcon />
              Add traffic
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>Add traffic</DialogTitle>
            <DialogDescription>Record submission date and latest visit count.</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="traffic-date">Date</FieldLabel>
              <Input
                id="traffic-date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="traffic-visits">Visits</FieldLabel>
              <Input id="traffic-visits" type="text" placeholder="e.g. 3.1K or 1,200" />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" size="lg">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
