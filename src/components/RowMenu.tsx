"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function RowMenu({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div className="row-menu-wrap" ref={ref}>
      <button
        className="row-menu"
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <circle cx="3" cy="7" r="1.2" />
          <circle cx="7" cy="7" r="1.2" />
          <circle cx="11" cy="7" r="1.2" />
        </svg>
      </button>

      {open && (
        <div className="row-dropdown" role="menu">
          <button className="row-dropdown-item" role="menuitem" type="button" onClick={() => setOpen(false)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5" />
              <polyline points="4,6.5 6,8.5 9,5" />
            </svg>
            Update status
          </button>
          <button
            className="row-dropdown-item"
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
          <div className="row-dropdown-divider" role="separator" />
          <button className="row-dropdown-item row-dropdown-item--danger" role="menuitem" type="button" onClick={() => setOpen(false)}>
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
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-traffic-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="modal-sheet">
            <div className="modal-header">
              <div>
                <h2 id="add-traffic-title" className="modal-title">Add traffic</h2>
                <p className="modal-desc">Record submission date and latest visit count.</p>
              </div>
              <button
                className="modal-close"
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

            <div className="modal-body">
              <div className="modal-field">
                <label htmlFor="traffic-date" className="modal-label">Date</label>
                <input
                  id="traffic-date"
                  type="date"
                  className="modal-input"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="modal-field">
                <label htmlFor="traffic-visits" className="modal-label">Visits</label>
                <input
                  id="traffic-visits"
                  type="text"
                  className="modal-input"
                  placeholder="e.g. 3.1K or 1,200"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" type="button">
                Cancel
              </button>
              <button className="btn-primary" type="button">
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
