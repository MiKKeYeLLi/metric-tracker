"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";

interface Product { id: string; name: string; }
interface Directory { id: string; name: string; }

interface NewSubmissionButtonProps {
  products: Product[];
  directories: Directory[];
}

const STATUSES = [
  { value: "planned",   label: "Planned" },
  { value: "submitted", label: "Submitted" },
  { value: "live",      label: "Live" },
  { value: "rejected",  label: "Rejected" },
];

function OptionalHint() {
  return (
    <span className="text-2xs font-normal tracking-[0.02em] text-muted-foreground uppercase">
      optional
    </span>
  );
}

export function NewSubmissionButton({ products, directories }: NewSubmissionButtonProps) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [directoryId, setDirectoryId] = useState("");
  const [status, setStatus] = useState("planned");
  const [submittedAt, setSubmittedAt] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setProductId(products[0]?.id ?? "");
    setDirectoryId(directories[0]?.id ?? "");
    setStatus("planned");
    setSubmittedAt("");
    setListingUrl("");
    setFieldErrors({});
    setServerError(null);
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
  }

  // Auto-fill today's date when status flips to "submitted"
  function handleStatusChange(val: string) {
    setStatus(val);
    if (val === "submitted" && !submittedAt) {
      setSubmittedAt(new Date().toISOString().split("T")[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setServerError(null);
    setLoading(true);

    try {
      const body: Record<string, unknown> = { productId, directoryId, status };
      if (submittedAt) body.submittedAt = new Date(submittedAt).toISOString();
      if (listingUrl)  body.listingUrl  = listingUrl;

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) { setFieldErrors(data.details); }
        else { setServerError(data.error ?? "Something went wrong"); }
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setServerError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const noProducts     = products.length === 0;
  const noDirectories  = directories.length === 0;
  const cannotSubmit   = noProducts || noDirectories;

  return (
    <>
      <Button type="button" onClick={openModal}>
        <PlusIcon data-icon="inline-start" />
        New submission
      </Button>

      <Dialog open={open} onOpenChange={(next) => !next && closeModal()}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>New submission</DialogTitle>
            <DialogDescription>
              Record a product submission to a directory and track its status over time.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <FieldGroup>
              {cannotSubmit && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {noProducts
                      ? "Add at least one product before creating a submission."
                      : "Add at least one directory before creating a submission."}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field data-invalid={!!fieldErrors.productId} data-disabled={noProducts}>
                  <FieldLabel htmlFor="sub-product">Product</FieldLabel>
                  <NativeSelect
                    id="sub-product"
                    className="w-full"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    aria-invalid={!!fieldErrors.productId}
                    required
                    disabled={noProducts}
                  >
                    {noProducts
                      ? <NativeSelectOption>No products yet</NativeSelectOption>
                      : products.map((p) => <NativeSelectOption key={p.id} value={p.id}>{p.name}</NativeSelectOption>)
                    }
                  </NativeSelect>
                  {fieldErrors.productId && <FieldError>{fieldErrors.productId[0]}</FieldError>}
                </Field>

                <Field data-invalid={!!fieldErrors.directoryId} data-disabled={noDirectories}>
                  <FieldLabel htmlFor="sub-directory">Directory</FieldLabel>
                  <NativeSelect
                    id="sub-directory"
                    className="w-full"
                    value={directoryId}
                    onChange={(e) => setDirectoryId(e.target.value)}
                    aria-invalid={!!fieldErrors.directoryId}
                    required
                    disabled={noDirectories}
                  >
                    {noDirectories
                      ? <NativeSelectOption>No directories yet</NativeSelectOption>
                      : directories.map((d) => <NativeSelectOption key={d.id} value={d.id}>{d.name}</NativeSelectOption>)
                    }
                  </NativeSelect>
                  {fieldErrors.directoryId && <FieldError>{fieldErrors.directoryId[0]}</FieldError>}
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="sub-status">Status</FieldLabel>
                  <NativeSelect
                    id="sub-status"
                    className="w-full"
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <NativeSelectOption key={s.value} value={s.value}>{s.label}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>

                <Field>
                  <FieldLabel htmlFor="sub-date">
                    Submitted date
                    <OptionalHint />
                  </FieldLabel>
                  <Input
                    id="sub-date"
                    type="date"
                    value={submittedAt}
                    onChange={(e) => setSubmittedAt(e.target.value)}
                  />
                </Field>
              </div>

              <Field data-invalid={!!fieldErrors.listingUrl}>
                <FieldLabel htmlFor="sub-listing">
                  Listing URL
                  <OptionalHint />
                </FieldLabel>
                <Input
                  id="sub-listing"
                  type="url"
                  placeholder="https://www.producthunt.com/posts/..."
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  aria-invalid={!!fieldErrors.listingUrl}
                />
                {fieldErrors.listingUrl && <FieldError>{fieldErrors.listingUrl[0]}</FieldError>}
              </Field>

              {serverError && (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" size="lg" onClick={closeModal} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={loading || cannotSubmit}>
                {loading && <Spinner data-icon="inline-start" />}
                {loading ? "Saving…" : "Save submission"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
