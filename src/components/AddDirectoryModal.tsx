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
        className="flex items-center gap-[7px] w-full px-[10px] py-[6px] text-muted text-[12px] font-medium cursor-pointer bg-transparent border-none rounded-[6px] text-left transition-[color,background-color] duration-[120ms] hover:text-ink hover:bg-white/[0.64] max-[980px]:hidden"
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
          className="fixed inset-0 z-[100] grid place-items-center p-5 bg-[rgba(30,29,34,0.38)] animate-overlay-in"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="w-[min(100%,440px)] max-h-[calc(100vh-40px)] overflow-y-auto p-6 border border-line rounded-[12px] bg-sheet animate-sheet-in max-[480px]:p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="directory-modal-title"
          >
            <header className="flex items-center justify-between gap-3 mb-[10px]">
              <h2
                id="directory-modal-title"
                className="m-0 text-ink [font-family:Georgia,serif] text-[25px] font-medium tracking-[-0.04em]"
              >
                Add a directory
              </h2>
              <button
                type="button"
                className="w-9 min-h-[36px] p-0 border border-line rounded-[8px] bg-transparent text-muted text-[23px] cursor-pointer hover:bg-surface hover:text-ink"
                aria-label="Close dialog"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <p className="mt-0 mb-6 text-muted text-[13px] leading-[1.6]">
              Add a marketing directory to track your product submissions.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="grid gap-[7px] mb-[18px]">
                <label htmlFor="directory-name" className="text-ink text-[12px] font-semibold">
                  Name
                </label>
                <input
                  id="directory-name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Product Hunt"
                  maxLength={100}
                  required
                  autoFocus
                  className="w-full min-h-[44px] px-3 py-[10px] border border-line-strong rounded-[8px] bg-sheet text-ink text-[13px] focus:outline-[2px] focus:outline-[rgba(142,106,250,0.25)] focus:border-violet"
                />
              </div>

              <div className="grid gap-[7px] mb-[18px]">
                <label htmlFor="directory-url" className="text-ink text-[12px] font-semibold">
                  URL
                </label>
                <input
                  id="directory-url"
                  name="url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://www.producthunt.com"
                  maxLength={2048}
                  required
                  className="w-full min-h-[44px] px-3 py-[10px] border border-line-strong rounded-[8px] bg-sheet text-ink text-[13px] focus:outline-[2px] focus:outline-[rgba(142,106,250,0.25)] focus:border-violet"
                />
              </div>

              {error && (
                <p className="m-0 text-rejected text-[12px]" role="alert">
                  {error}
                </p>
              )}

              <footer className="flex justify-end gap-[10px] mt-6 pt-[18px] border-t border-line max-[480px]:flex-wrap">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[6px] px-[13px] min-h-[44px] rounded-[8px] bg-transparent text-muted border border-line text-[13px] font-medium cursor-pointer w-auto whitespace-nowrap transition-[color,background-color,border-color] duration-[120ms] hover:text-ink hover:bg-sheet hover:border-line-strong"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-[6px] px-[15px] min-h-[44px] rounded-[8px] bg-violet text-white border-none text-[13px] font-semibold cursor-pointer w-auto whitespace-nowrap shadow-[0_1px_2px_rgba(118,81,232,0.25),0_4px_12px_rgba(118,81,232,0.14)] transition-[background-color,transform,box-shadow] duration-[140ms] hover:bg-violet-deep hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={saving}
                >
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
