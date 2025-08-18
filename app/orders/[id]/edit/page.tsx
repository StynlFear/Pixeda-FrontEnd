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
        const orderData = res.data
        
        // Transform the data to match the form structure
        const transformedData = {
          dueDate: orderData.dueDate ? new Date(orderData.dueDate).toISOString().slice(0, 10) : "",
          receivedThrough: orderData.receivedThrough || "IN_PERSON",
          status: orderData.status || "TO_DO",
          customer: JSON.stringify({
            clientId: orderData.customer?._id || "",
            companyId: orderData.customerCompany?._id || undefined,
            displayName: orderData.customerCompany 
              ? orderData.customerCompany.name 
              : `${orderData.customer?.firstName || ""} ${orderData.customer?.lastName || ""}`.trim(),
            isPhysicalPerson: !orderData.customerCompany
          }),
          priority: orderData.priority || "NORMAL",
          description: orderData.description || "",
          items: (orderData.items || []).map((item: any) => ({
            product: item.product?._id || item.product,
            productNameSnapshot: item.productNameSnapshot || "",
            descriptionSnapshot: item.descriptionSnapshot || "",
            priceSnapshot: item.priceSnapshot,
            quantity: item.quantity || 1,
            itemStatus: item.itemStatus || "TO_DO",
            attachments: item.attachments || [],
            graphicsImage: item.graphicsImage || null,
            finishedProductImage: item.finishedProductImage || null,
            textToPrint: item.textToPrint || "",
            editableFilePath: item.editableFilePath || "",
            printingFilePath: item.printingFilePath || "",
            disabledStages: item.disabledStages || [],
            assignments: (item.assignments || []).map((assignment: any) => ({
              stage: assignment.stage,
              assignedTo: assignment.assignedTo?._id || assignment.assignedTo,
              stageNotes: assignment.stageNotes || "",
            }))
          }))
        }
        
        setDefaults(transformedData)
      } catch (e: any) { 
        // Don't show error for canceled requests (normal behavior when component unmounts)
        if (e.code === 'ERR_CANCELED' || e.name === 'CanceledError') {
          console.log('Request was canceled (component unmounted)')
          return
        }
        console.error('Error loading order:', e) // Debug log
        setError(e?.response?.data?.message || e?.message || "Failed to load order.") 
      } finally { 
        setLoading(false) 
      }
    }
    load(); return () => controller.abort()
  }, [params.id])

  async function handleSubmit(values: OrderFormValues2 | FormData) {
    try {
      await api.put(`/api/orders/${params.id}`, values, {
        headers: values instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
      })
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