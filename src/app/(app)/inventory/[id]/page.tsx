"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HowItWorks from "@/components/ui/HowItWorks";
import ProductForm from "@/components/product/ProductForm";
import { fetchProduct } from "@/features/inventory/inventory.service";
import type { ProductView } from "@/types/product";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct(id).then(setProduct).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!product) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-sm text-slate-500">
          {product.name} · {product.sku}
        </p>
      </div>

      <HowItWorks
        id="inventory-edit"
        title="Product edit karte waqt dhyan rakhein"
        steps={[
          "Jo badalna hai badlo aur Save dabao. Dashboard, Branches aur Categories ke numbers turant naye ho jate hain.",
          "Category badloge to purani category ke columns ki values chhupi rehti hain; wapas purani category chunoge to wapas aa jayengi.",
          "Quantity abhi yahi se badalti hai. Aage Stock IN / OUT feature aane par har badlav ki history (kisne, kab, kyu) bhi dikhegi.",
        ]}
      />

      <ProductForm initial={product} />
    </div>
  );
}