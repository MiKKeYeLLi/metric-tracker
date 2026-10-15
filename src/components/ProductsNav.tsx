"use client";

import { useState } from "react";
import { AddProductModal } from "@/components/AddProductModal";

function IconBox() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M1.5 3.5 7 1.5l5.5 2v7L7 12.5l-5.5-2v-7z" />
      <line x1="7" y1="1.5" x2="7" y2="12.5" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  );
}

interface ProductsNavProps {
  initialProducts: string[];
}

export function ProductsNav({ initialProducts }: ProductsNavProps) {
  const [products] = useState<string[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="dash-nav-section-label" aria-hidden="true">Products</div>
      <nav aria-label="Products">
        {products.map((p) => (
          <a className="dash-nav-link" href={`/dashboard/products/${p.toLowerCase()}`} key={p}>
            <IconBox />
            <span className="dash-nav-link-text">{p}</span>
          </a>
        ))}
        <button
          className="dash-nav-add"
          type="button"
          onClick={() => setIsModalOpen(true)}
        >
          <IconPlus />
          Add product
        </button>
      </nav>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

