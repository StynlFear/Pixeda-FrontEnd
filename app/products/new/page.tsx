"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ProductForm, { ProductFormValues } from "../components/ProductForm"
import api from "@/lib/axios"

const typeOptions = ["Stickers", "Flyers", "Business Cards", "Banners", "Posters"]

export default function NewProductPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(values: ProductFormValues) {
    setError(null)
    setSubmitting(true)
    try {
      // Ensure price is a number or undefined
      const payload = {
        type: values.type || undefined,
        // Keep legacy single field for backward-compat
        material: values.material || (values.materials && values.materials[0]) || undefined,
        // New multi field
        materials: values.materials && values.materials.length ? values.materials : undefined,
        productName: values.productName,
        productCode: values.productCode,
        description: values.description || undefined,
        price: typeof values.price === "number" ? values.price : undefined,
      }

      await api.post("/api/products", payload)

      // success → go back to list
      router.push("/products")
      router.refresh()
    } catch (e: any) {
      const msg =
        e?.response?.status === 409
          ? "A product with this code already exists."
          : e?.response?.data?.message || e?.message || "Failed to create product."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Products", href: "/products" },
        { label: "New" },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            typeOptions={typeOptions}
            submitting={submitting}
            error={error}
            submitLabel="Create Product"
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </AppLayout>
  )
}
