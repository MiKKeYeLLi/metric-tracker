"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BoxIcon } from "lucide-react";
import { AddProductModal } from "@/components/AddProductModal";
import {
  SidebarAddButton,
  SidebarNavLink,
  SidebarNavList,
  SidebarSectionLabel,
} from "@/components/SidebarNav";

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
      <SidebarSectionLabel>Products</SidebarSectionLabel>
      <SidebarNavList aria-label="Products">
        {products.map((p) => (
          <SidebarNavLink
            href={`/dashboard/products/${p.id}`}
            key={p.id}
            icon={<BoxIcon aria-hidden="true" />}
          >
            {p.name}
          </SidebarNavLink>
        ))}
        <SidebarAddButton onClick={() => setIsModalOpen(true)}>Add product</SidebarAddButton>
      </SidebarNavList>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
