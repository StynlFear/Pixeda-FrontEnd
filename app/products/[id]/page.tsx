"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import api from "@/lib/axios"

type Product = {
  _id: string
  type?: string
  productName: string
  productCode: string
  description?: string
  price?: number
  createdAt?: string
  updatedAt?: string
}

export default function ViewProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const [product, setProduct] = React.useState<Product | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Products", href: "/products" },
    { label: "View" },
  ]

  React.useEffect(() => {
  const controller = new AbortController()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/api/products/${id}`, { signal: controller.signal })
      setProduct(data)
      setError(null) // ensure stale error is cleared after a successful load
    } catch (e: any) {
      // ignore abort/cancel errors from StrictMode double-invoke
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED" || e?.message === "canceled") {
        return
      }
      const msg =
        e?.response?.status === 404
          ? "Product not found."
          : e?.response?.data?.message || "Failed to load product."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  load()
  return () => controller.abort()
}, [id])

  function formatPrice(value?: number) {
    if (typeof value !== "number") return "—"
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      await api.delete(`/api/products/${id}`)
      router.push("/products")
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || "Delete failed.")
      setDeleting(false)
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              {loading ? "Loading…" : product?.productName ?? "Product"}
            </h1>
            <p className="text-muted-foreground">Product details</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/products">Back</Link>
            </Button>
            <Button asChild disabled={!product || loading}>
              <Link href={`/products/${id}/edit`}>Edit</Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loading || !product || deleting}>
                  {deleting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</span> : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The product will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirm Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {error && !loading && !product && (
  <div className="text-sm text-red-500">{error}</div>
)}

        {loading ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading product…
            </div>
          </div>
        ) : !product ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            No product to display.
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Product</CardTitle>
                <CardDescription>Core attributes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Code</div>
                    <div className="text-base font-medium">{product.productCode}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="text-base">
                      {product.type ? (
                        <Badge variant="secondary">{product.type}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Price</div>
                    <div className="text-base">{formatPrice(product.price)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="text-base">
                      {product.createdAt ? new Date(product.createdAt).toLocaleString() : "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Last updated</div>
                    <div className="text-base">
                      {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : "—"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="text-base whitespace-pre-wrap break-words">
  {product.description || <span className="text-muted-foreground">—</span>}
</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optional quick action */}
            <div className="flex justify-end">
              <Button asChild variant="secondary">
                <Link href={`/orders/new?productCode=${encodeURIComponent(product.productCode)}`}>
                  Create Order with this product
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
