"use client";

import { useState } from "react";

const products = ["Zeduchat", "Telex"];
const directories = [
  "Product Hunt",
  "TechCrunch",
  "Hacker News",
  "Indie Hackers",
  "BetaList",
];

export function LogSubmissionModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn-primary"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">+</span>
        Log a submission
      </button>

      {open && (
        <div
          className="submission-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            className="submission-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-modal-title"
          >
            <div className="submission-modal-header">
              <div>
                <h2 id="submission-modal-title">
                  Log a submission
                </h2>
                <p>
                  Record a product submission to a directory.
                </p>
              </div>

              <button
                type="button"
                className="submission-modal-close"
                aria-label="Close modal"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setOpen(false);
              }}
            >
              <div className="submission-form-field">
                <label htmlFor="submission-product">
                  Product / Site
                </label>
                <select id="submission-product" defaultValue="" required>
                  <option value="" disabled>
                    Select a product
                  </option>
                  {products.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </div>

              <div className="submission-form-field">
                <label htmlFor="submission-directory">
                  Directory / Platform
                </label>
                <select
                  id="submission-directory"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Select a directory
                  </option>
                  {directories.map((directory) => (
                    <option key={directory} value={directory}>
                      {directory}
                    </option>
                  ))}
                </select>
              </div>

              <div className="submission-form-field">
                <label htmlFor="submission-status">
                  Submission status
                </label>
                <select
                  id="submission-status"
                  defaultValue="planned"
                  required
                >
                  <option value="planned">Planned</option>
                  <option value="submitted">Submitted</option>
                  <option value="live">Live</option>
                </select>
              </div>

              <div className="submission-form-field">
                <label htmlFor="submission-date">
                  Submission date
                </label>
                <input
                  id="submission-date"
                  type="date"
                />
              </div>

              <div className="submission-form-field">
                <label htmlFor="submission-url">
                  Listing URL
                </label>
                <input
                  id="submission-url"
                  type="url"
                  placeholder="https://example.com/listing"
                />
                <small>
                  Optional until the listing is live.
                </small>
              </div>

              <div className="submission-modal-actions">
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn-primary" type="submit">
                  Log submission
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
