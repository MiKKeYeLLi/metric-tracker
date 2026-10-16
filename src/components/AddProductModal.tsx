"use client";

import { useEffect, useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";

interface Product {
  id: string;
  name: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
}

export function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string[]; url?: string[] }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setUrl("");
      setFieldErrors({});
      setServerError(null);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setServerError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setServerError(data.error ?? "Something went wrong");
        }
        return;
      }

      onSuccess({ id: data.id, name: data.name });
      onClose();
    } catch {
      setServerError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            A product is the site or app whose directory listings and traffic you want to track.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <FieldGroup>
            <Field data-invalid={!!fieldErrors.name}>
              <FieldLabel htmlFor="product-name">Name</FieldLabel>
              <Input
                id="product-name"
                type="text"
                placeholder="e.g. Zeduchat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!fieldErrors.name}
                required
              />
              {fieldErrors.name && <FieldError>{fieldErrors.name[0]}</FieldError>}
            </Field>

            <Field data-invalid={!!fieldErrors.url}>
              <FieldLabel htmlFor="product-url">URL</FieldLabel>
              <Input
                id="product-url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={!!fieldErrors.url}
                required
              />
              {fieldErrors.url && <FieldError>{fieldErrors.url[0]}</FieldError>}
            </Field>

            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Spinner data-icon="inline-start" />}
              {loading ? "Saving…" : "Save product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
