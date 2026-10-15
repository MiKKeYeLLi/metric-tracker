"use client";

import { useState, useEffect, useRef } from "react";

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
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setUrl("");
      setFieldErrors({});
      setServerError(null);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

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
    <div
      className="modal-backdrop"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2 id="modal-title" className="modal-title">Add product</h2>
          </div>
          <button
            type="button"
            className="modal-done-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            CANCEL
          </button>
        </div>

        <p className="modal-description">
          A product is the site or app whose directory listings and traffic you want to track.
        </p>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <div className="modal-field">
            <label htmlFor="product-name" className="modal-label">Name</label>
            <input
              ref={nameRef}
              id="product-name"
              type="text"
              className={`modal-input${fieldErrors.name ? " modal-input--error" : ""}`}
              placeholder="e.g. Zeduchat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {fieldErrors.name && (
              <span className="modal-field-error">{fieldErrors.name[0]}</span>
            )}
          </div>

          <div className="modal-field">
            <label htmlFor="product-url" className="modal-label">URL</label>
            <input
              id="product-url"
              type="url"
              className={`modal-input${fieldErrors.url ? " modal-input--error" : ""}`}
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            {fieldErrors.url && (
              <span className="modal-field-error">{fieldErrors.url[0]}</span>
            )}
          </div>

          {serverError && (
            <p className="modal-server-error">{serverError}</p>
          )}

          <div className="modal-actions">
            <button type="submit" className="modal-btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
