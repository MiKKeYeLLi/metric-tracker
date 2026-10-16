"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface Product {
  id: string;
  name: string;
}

interface ProductsNavProps {
  initialProducts: Product[];
}

export function ProductsNav({ initialProducts }: ProductsNavProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  function handleSuccess(product: Product) {
    setProducts((prev) => [...prev, product]);
    router.refresh();
  }

  return (
    <>
      <div className="px-[10px] mt-[18px] mb-[2px] text-muted text-[10px] font-bold tracking-[0.08em] uppercase max-[980px]:hidden" aria-hidden="true">
        Products
      </div>
      <nav aria-label="Products">
        {products.map((p) => (
          <a
            className="group flex items-center gap-2 px-[10px] py-[7px] rounded-[7px] text-muted text-[13px] font-medium no-underline transition-[color,background-color] duration-[120ms] whitespace-nowrap overflow-hidden hover:text-ink hover:bg-white/[0.64] aria-[current=page]:text-violet-deep aria-[current=page]:bg-white/[0.64] aria-[current=page]:font-semibold aria-[current=page]:rounded-l-none aria-[current=page]:shadow-[inset_2px_0_0_#8e6afa] aria-[current=page]:pl-2 max-[980px]:flex-shrink-0 max-[980px]:aria-[current=page]:rounded-[7px] max-[980px]:aria-[current=page]:shadow-none max-[980px]:aria-[current=page]:pl-[10px] max-[980px]:aria-[current=page]:bg-violet-tint"
            href={`/dashboard/products/${p.id}`}
            key={p.id}
          >
            <IconBox />
            <span className="flex-1 min-w-0 overflow-hidden text-ellipsis">{p.name}</span>
          </a>
        ))}
        <button
          className="flex items-center gap-[7px] w-full px-[10px] py-[6px] text-muted text-[12px] font-medium cursor-pointer bg-transparent border-none rounded-[6px] text-left transition-[color,background-color] duration-[120ms] hover:text-ink hover:bg-white/[0.64] max-[980px]:hidden"
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
        onSuccess={handleSuccess}
      />
    </>
  );
}
