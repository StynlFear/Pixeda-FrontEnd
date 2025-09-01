"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ProductForm, { ProductFormValues } from "@/app/products/components/ProductForm"
import api from "@/lib/axios"
import { Loader2 } from "lucide-react"

const typeOptions = ["Stickers", "Flyers", "Business Cards", "Banners", "Posters"]

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const [defaults, setDefaults] = React.useState<Partial<ProductFormValues> | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get(`/api/products/${id}`, { signal: controller.signal })
        setDefaults({
          type: data?.type ?? "",
          material: data?.material ?? "",
          productName: data?.productName ?? "",
          productCode: data?.productCode ?? "",
          description: data?.description ?? "",
          price: typeof data?.price === "number" ? data.price : undefined,
        })
        setError(null)
      } catch (e: any) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED" || e?.message === "canceled") return
        setError(e?.response?.status === 404 ? "Product not found." : (e?.response?.data?.message || "Failed to load product."))
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [id])

  async function handleSubmit(values: ProductFormValues) {
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        type: values.type || undefined,
  material: values.material || undefined,
        productName: values.productName,
        productCode: values.productCode,
        description: values.description || undefined,
        price: typeof values.price === "number" ? values.price : undefined,
      }
      await api.put(`/api/products/${id}`, payload)
      router.push(`/products/${id}`)
      router.refresh()
    } catch (e: any) {
      const msg =
        e?.response?.status === 409
          ? "A product with this code already exists."
          : e?.response?.data?.message || e?.message || "Failed to update product."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Products", href: "/products" }, { label: "Edit" }]}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : !defaults ? (
            <div className="py-12 text-center text-red-500">{error ?? "No data."}</div>
          ) : (
            <ProductForm
              defaultValues={defaults}
              typeOptions={typeOptions}
              submitting={submitting}
              error={error}
              submitLabel="Save changes"
              onSubmit={handleSubmit}
            />
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}
