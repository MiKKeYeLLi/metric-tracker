"use client";

import { useState, useEffect } from "react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSiteName("");
      setSiteUrl("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-step-badge" aria-hidden="true">2</span>
            <h2 id="modal-title" className="modal-title">Add a site to track</h2>
          </div>
          <button
            type="button"
            className="modal-done-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            DONE
          </button>
        </div>

        <p className="modal-description">
          A site is the product or website whose listings and traffic you follow.
        </p>

        <form onSubmit={(e) => e.preventDefault()} className="modal-form">
          <div className="modal-field">
            <label htmlFor="site-name" className="modal-label">
              Site name
            </label>
            <input
              id="site-name"
              type="text"
              className="modal-input"
              placeholder="Lumen Budget"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="modal-field">
            <label htmlFor="site-url" className="modal-label">
              Site URL
            </label>
            <input
              id="site-url"
              type="url"
              className="modal-input"
              placeholder="https://lumenbudget.app"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn-primary">
              Save site
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

