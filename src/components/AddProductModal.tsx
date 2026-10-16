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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[rgba(26,25,23,0.45)] backdrop-blur-[4px] animate-modal-fade-in overflow-y-auto"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-[520px] max-h-[calc(100vh-32px)] overflow-y-auto p-6 bg-sheet border border-line rounded-[12px] shadow-[0_12px_32px_rgba(26,25,23,0.12),0_2px_6px_rgba(26,25,23,0.04)] animate-modal-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-[10px]">
            <h2 id="modal-title" className="m-0 text-[16px] font-bold tracking-[-0.03em] text-ink leading-[1.2]">
              Add product
            </h2>
          </div>
          <button
            type="button"
            className="bg-transparent border-none text-muted text-[12px] font-bold tracking-[0.06em] uppercase cursor-pointer px-2 py-1 rounded-[6px] w-auto transition-[color,background-color] duration-[120ms] hover:text-violet-deep hover:bg-violet-tint"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            CANCEL
          </button>
        </div>

        <p className="m-0 mb-5 text-muted text-[13px] leading-[1.5]">
          A product is the site or app whose directory listings and traffic you want to track.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="product-name" className="text-[12px] font-semibold text-ink tracking-[-0.01em]">
              Name
            </label>
            <input
              ref={nameRef}
              id="product-name"
              type="text"
              className={`w-full h-[42px] px-[14px] bg-surface border rounded-[8px] text-ink text-[13px] transition-[border-color,box-shadow,background-color] duration-[120ms] focus:outline-none focus:bg-sheet focus:border-violet focus:shadow-[0_0_0_3px_rgba(142,106,250,0.2)] placeholder:text-muted placeholder:opacity-70 ${fieldErrors.name ? "border-rejected focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]" : "border-line"}`}
              placeholder="e.g. Zeduchat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {fieldErrors.name && (
              <span className="text-[12px] text-rejected mt-[2px]">{fieldErrors.name[0]}</span>
            )}
          </div>

          <div className="flex flex-col gap-[6px]">
            <label htmlFor="product-url" className="text-[12px] font-semibold text-ink tracking-[-0.01em]">
              URL
            </label>
            <input
              id="product-url"
              type="url"
              className={`w-full h-[42px] px-[14px] bg-surface border rounded-[8px] text-ink text-[13px] transition-[border-color,box-shadow,background-color] duration-[120ms] focus:outline-none focus:bg-sheet focus:border-violet focus:shadow-[0_0_0_3px_rgba(142,106,250,0.2)] placeholder:text-muted placeholder:opacity-70 ${fieldErrors.url ? "border-rejected focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]" : "border-line"}`}
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            {fieldErrors.url && (
              <span className="text-[12px] text-rejected mt-[2px]">{fieldErrors.url[0]}</span>
            )}
          </div>

          {serverError && (
            <p className="m-0 px-3 py-[10px] rounded-[8px] bg-rejected-bg text-rejected text-[13px]">
              {serverError}
            </p>
          )}

          <div className="flex items-center gap-[10px] mt-[6px]">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-[18px] h-[38px] rounded-[8px] bg-violet text-white border-none text-[13px] font-semibold cursor-pointer w-auto whitespace-nowrap shadow-[0_1px_2px_rgba(118,81,232,0.25),0_4px_12px_rgba(118,81,232,0.14)] transition-[background-color,transform,box-shadow] duration-[140ms] hover:bg-violet-deep hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(118,81,232,0.28),0_6px_18px_rgba(118,81,232,0.18)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Saving…" : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
