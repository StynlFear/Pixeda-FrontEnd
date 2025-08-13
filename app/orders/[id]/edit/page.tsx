"use client"
import * as React2 from "react"
import { AppLayout as AppLayout3 } from "@/components/layout/app-layout"
import { Card as Card3, CardContent as CardContent3, CardHeader as CardHeader3, CardTitle as CardTitle3 } from "@/components/ui/card"
import { useRouter as useRouter3 } from "next/navigation"
import OrderForm2, { OrderFormValues as OrderFormValues2 } from "@/app/orders/components/OrderForm"
import api from "@/lib/axios"
export default function EditOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter3()
  const [defaults, setDefaults] = React2.useState<Partial<OrderFormValues2> | null>(null)
  const [loading, setLoading] = React2.useState(true)
  const [error, setError] = React2.useState<string | null>(null)

  React2.useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        setLoading(true)
        const res = await api.get(`/api/orders/${params.id}`, { signal: controller.signal })
        setDefaults(res.data)
      } catch (e: any) { setError(e?.response?.data?.message || "Failed to load order.") } finally { setLoading(false) }
    }
    load(); return () => controller.abort()
  }, [params.id])

  async function handleSubmit(values: OrderFormValues2) {
    try {
      await api.put(`/api/orders/${params.id}`, values)
      router.push(`/orders/${params.id}`)
      router.refresh()
    } catch (e: any) { setError(e?.response?.data?.message || "Failed to update order.") }
  }

  return (
    <AppLayout3 breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Orders", href: "/orders" }, { label: params.id }]}>
      <Card3>
        <CardHeader3><CardTitle3>Edit Order</CardTitle3></CardHeader3>
        <CardContent3>
          {loading ? <div>Loading…</div> : <OrderForm2 defaults={defaults ?? {}} onSubmit={handleSubmit} error={error} />}
        </CardContent3>
      </Card3>
    </AppLayout3>
  )
}