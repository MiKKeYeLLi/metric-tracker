"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AddDirectoryModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function validateUrl(value: string) {
    try {
      const parsed = new URL(value.trim());
      return (
        ["http:", "https:"].includes(parsed.protocol) &&
        parsed.hostname.includes(".") &&
        !parsed.hostname.startsWith(".") &&
        !parsed.hostname.endsWith(".")
      );
    } catch {
      return false;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanUrl = url.trim();

    if (!cleanName) {
      setError("Enter a directory name.");
      return;
    }

    if (!cleanUrl || !validateUrl(cleanUrl)) {
      setError("Enter a valid website URL starting with https:// or http://.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/directories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, url: cleanUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save the directory. Please try again.");
        return;
      }

      setOpen(false);
      setName("");
      setUrl("");
      router.refresh();
    } catch {
      setError("Could not save the directory. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        className="dash-nav-add"
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 1v10M1 6h10" />
        </svg>
        Add directory
      </button>

      {open && (
        <div
          className="directory-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="directory-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="directory-modal-title"
          >
            <header className="directory-modal-header">
              <h2 id="directory-modal-title">Add a directory</h2>
              <button
                type="button"
                className="directory-modal-close"
                aria-label="Close dialog"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <p className="directory-modal-description">
              Add a marketing directory to track your product submissions.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="directory-form-field">
                <label htmlFor="directory-name">Name</label>
                <input
                  id="directory-name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Product Hunt"
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div className="directory-form-field">
                <label htmlFor="directory-url">URL</label>
                <input
                  id="directory-url"
                  name="url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://www.producthunt.com"
                  maxLength={2048}
                  required
                />
              </div>

              {error && (
                <p className="directory-form-error" role="alert">
                  {error}
                </p>
              )}

              <footer className="directory-modal-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save directory"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
