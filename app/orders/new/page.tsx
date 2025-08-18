"use client"
import * as React from "react"
import { AppLayout as AppLayout2 } from "@/components/layout/app-layout"
import { Card as Card2, CardContent as CardContent2, CardHeader as CardHeader2, CardTitle as CardTitle2 } from "@/components/ui/card"
import { useRouter as useRouter2 } from "next/navigation"
import OrderForm, { OrderFormValues } from "@/app/orders/components/OrderForm"
import api from "@/lib/axios"

export default function NewOrderPage() {
  const router = useRouter2()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(values: OrderFormValues | FormData) {
    try {
      setSubmitting(true)
      const res = await api.post("/api/orders", values, {
        headers: values instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      })
      const id = res.data?._id
      router.push(`/orders/${id}`)
      router.refresh()
    } catch (e: any) { setError(e?.response?.data?.message || "Failed to create order.") } finally { setSubmitting(false) }
  }

  return (
    <AppLayout2 breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Orders", href: "/orders" }, { label: "New" }]}>
      <Card2>
        <CardHeader2><CardTitle2>New Order</CardTitle2></CardHeader2>
        <CardContent2>
          <OrderForm onSubmit={handleSubmit} submitting={submitting} error={error} />
        </CardContent2>
      </Card2>
    </AppLayout2>
  )
}