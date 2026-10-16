"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export function RowMenu({ label, submissionId }: { label: string; submissionId: string }) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  async function handleDelete() {
    setOpen(false);
    setDeleting(true);
    try {
      await fetch(`/api/submissions/${submissionId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        className="row-menu inline-flex items-center justify-center w-[28px] h-[28px] rounded-[6px] text-muted bg-transparent border-none cursor-pointer opacity-0 p-0 transition-[opacity,background-color,color] duration-[100ms] hover:bg-line hover:text-ink"
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={deleting}
        onClick={() => setOpen((v) => !v)}
      >
        {deleting ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="7" cy="7" r="5" strokeOpacity="0.3" />
            <path d="M7 2a5 5 0 0 1 5 5" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <circle cx="3" cy="7" r="1.2" />
            <circle cx="7" cy="7" r="1.2" />
            <circle cx="11" cy="7" r="1.2" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+4px)] right-0 z-[50] min-w-[158px] p-[4px] border border-line rounded-[10px] bg-sheet shadow-[0_4px_6px_rgba(0,0,0,0.06),0_10px_24px_rgba(0,0,0,0.08)] animate-dropdown-in"
          role="menu"
        >
          <button
            className="flex items-center gap-2 w-full px-[10px] py-[7px] border-none rounded-[7px] bg-transparent text-ink text-[13px] font-medium cursor-pointer text-left whitespace-nowrap transition-[background-color,color] duration-[100ms] hover:bg-surface [&>svg]:flex-shrink-0 [&>svg]:text-muted hover:[&>svg]:text-ink"
            role="menuitem"
            type="button"
            onClick={() => setOpen(false)}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5" />
              <polyline points="4,6.5 6,8.5 9,5" />
            </svg>
            Update status
          </button>
          <button
            className="flex items-center gap-2 w-full px-[10px] py-[7px] border-none rounded-[7px] bg-transparent text-ink text-[13px] font-medium cursor-pointer text-left whitespace-nowrap transition-[background-color,color] duration-[100ms] hover:bg-surface [&>svg]:flex-shrink-0 [&>svg]:text-muted hover:[&>svg]:text-ink"
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              setModalOpen(true);
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1,9 4,5 7,7 10,3 12,4" />
            </svg>
            Add traffic
          </button>
          <div className="h-px m-[4px] bg-line" role="separator" />
          <button
            className="flex items-center gap-2 w-full px-[10px] py-[7px] border-none rounded-[7px] bg-transparent text-rejected text-[13px] font-medium cursor-pointer text-left whitespace-nowrap transition-[background-color,color] duration-[100ms] hover:bg-rejected-bg [&>svg]:flex-shrink-0 [&>svg]:text-rejected"
            role="menuitem"
            type="button"
            onClick={handleDelete}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1,3 12,3" />
              <path d="M5 3V2h3v1" />
              <rect x="2.5" y="3" width="8" height="8" rx="1" />
              <line x1="5" y1="6" x2="5" y2="9" />
              <line x1="8" y1="6" x2="8" y2="9" />
            </svg>
            Delete
          </button>
        </div>
      )}

      {modalOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[rgba(26,25,23,0.45)] backdrop-blur-[4px] animate-modal-fade-in overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-traffic-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-[520px] max-h-[calc(100vh-32px)] overflow-y-auto p-6 bg-sheet border border-line rounded-[12px] shadow-[0_12px_32px_rgba(26,25,23,0.12),0_2px_6px_rgba(26,25,23,0.04)] animate-modal-scale-in">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h2 id="add-traffic-title" className="m-0 text-[16px] font-bold tracking-[-0.03em] text-ink leading-[1.2]">
                  Add traffic
                </h2>
                <p className="m-0 mt-1 text-muted text-[13px] leading-[1.5]">
                  Record submission date and latest visit count.
                </p>
              </div>
              <button
                className="inline-flex items-center justify-center w-[28px] h-[28px] rounded-[6px] text-muted bg-transparent border border-line cursor-pointer p-0 transition-[background-color,color] duration-[100ms] hover:bg-surface hover:text-ink"
                type="button"
                aria-label="Close modal"
                onClick={() => setModalOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="2" y1="2" x2="12" y2="12" />
                  <line x1="12" y1="2" x2="2" y2="12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="traffic-date" className="text-[12px] font-semibold text-ink tracking-[-0.01em]">Date</label>
                <input
                  id="traffic-date"
                  type="date"
                  className="w-full h-[42px] px-[14px] bg-surface border border-line rounded-[8px] text-ink text-[13px] transition-[border-color,box-shadow,background-color] duration-[120ms] focus:outline-none focus:bg-sheet focus:border-violet focus:shadow-[0_0_0_3px_rgba(142,106,250,0.2)]"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label htmlFor="traffic-visits" className="text-[12px] font-semibold text-ink tracking-[-0.01em]">Visits</label>
                <input
                  id="traffic-visits"
                  type="text"
                  className="w-full h-[42px] px-[14px] bg-surface border border-line rounded-[8px] text-ink text-[13px] transition-[border-color,box-shadow,background-color] duration-[120ms] focus:outline-none focus:bg-sheet focus:border-violet focus:shadow-[0_0_0_3px_rgba(142,106,250,0.2)] placeholder:text-muted placeholder:opacity-70"
                  placeholder="e.g. 3.1K or 1,200"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-[10px]">
              <button
                className="inline-flex items-center justify-center gap-[6px] px-[13px] h-[34px] rounded-[8px] bg-transparent text-muted border border-line text-[13px] font-medium cursor-pointer w-auto whitespace-nowrap transition-[color,background-color,border-color] duration-[120ms] hover:text-ink hover:bg-sheet hover:border-line-strong"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-[6px] px-[15px] h-[34px] rounded-[8px] bg-violet text-white border-none text-[13px] font-semibold cursor-pointer w-auto whitespace-nowrap shadow-[0_1px_2px_rgba(118,81,232,0.25),0_4px_12px_rgba(118,81,232,0.14)] transition-[background-color,transform,box-shadow] duration-[140ms] hover:bg-violet-deep hover:-translate-y-px active:translate-y-0"
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
