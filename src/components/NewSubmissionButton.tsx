"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

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

export function NewSubmissionButton({ products, directories }: NewSubmissionButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [productId, setProductId] = useState("");
  const [directoryId, setDirectoryId] = useState("");
  const [status, setStatus] = useState("planned");
  const [submittedAt, setSubmittedAt] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

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

  useEffect(() => {
    if (open) setTimeout(() => firstFieldRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading]);

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

  const modal = open && (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-sub-title"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h2 id="new-sub-title" className="modal-title">New submission</h2>
              </div>
              <button
                type="button"
                className="modal-done-btn"
                onClick={closeModal}
                disabled={loading}
                aria-label="Close"
              >
                CANCEL
              </button>
            </div>

            <p className="modal-description">
              Record a product submission to a directory and track its status over time.
            </p>

            <form onSubmit={handleSubmit} className="modal-form" noValidate>

              {cannotSubmit && (
                <p className="modal-server-error">
                  {noProducts ? "Add at least one product before creating a submission." : "Add at least one directory before creating a submission."}
                </p>
              )}

              <div className="modal-row">
                <div className="modal-field">
                  <label htmlFor="sub-product" className="modal-label">Product</label>
                  <select
                    ref={firstFieldRef}
                    id="sub-product"
                    className={`modal-input modal-select${fieldErrors.productId ? " modal-input--error" : ""}`}
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                    disabled={noProducts}
                  >
                    {noProducts
                      ? <option>No products yet</option>
                      : products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                    }
                  </select>
                  {fieldErrors.productId && <span className="modal-field-error">{fieldErrors.productId[0]}</span>}
                </div>

                <div className="modal-field">
                  <label htmlFor="sub-directory" className="modal-label">Directory</label>
                  <select
                    id="sub-directory"
                    className={`modal-input modal-select${fieldErrors.directoryId ? " modal-input--error" : ""}`}
                    value={directoryId}
                    onChange={(e) => setDirectoryId(e.target.value)}
                    required
                    disabled={noDirectories}
                  >
                    {noDirectories
                      ? <option>No directories yet</option>
                      : directories.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)
                    }
                  </select>
                  {fieldErrors.directoryId && <span className="modal-field-error">{fieldErrors.directoryId[0]}</span>}
                </div>
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label htmlFor="sub-status" className="modal-label">Status</label>
                  <select
                    id="sub-status"
                    className="modal-input modal-select"
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-field">
                  <label htmlFor="sub-date" className="modal-label">
                    Submitted date
                    <span className="modal-label-hint">optional</span>
                  </label>
                  <input
                    id="sub-date"
                    type="date"
                    className="modal-input"
                    value={submittedAt}
                    onChange={(e) => setSubmittedAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-field">
                <label htmlFor="sub-listing" className="modal-label">
                  Listing URL
                  <span className="modal-label-hint">optional</span>
                </label>
                <input
                  id="sub-listing"
                  type="url"
                  className={`modal-input${fieldErrors.listingUrl ? " modal-input--error" : ""}`}
                  placeholder="https://www.producthunt.com/posts/..."
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                />
                {fieldErrors.listingUrl && <span className="modal-field-error">{fieldErrors.listingUrl[0]}</span>}
              </div>

              {serverError && <p className="modal-server-error">{serverError}</p>}

              <div className="modal-actions">
                <button
                  type="submit"
                  className="modal-btn-primary"
                  disabled={loading || cannotSubmit}
                >
                  {loading ? "Saving…" : "Save submission"}
                </button>
              </div>
            </form>
          </div>
        </div>
  );

  return (
    <>
      <button className="btn-primary" type="button" onClick={openModal}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <line x1="6" y1="1" x2="6" y2="11" />
          <line x1="1" y1="6" x2="11" y2="6" />
        </svg>
        New submission
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
