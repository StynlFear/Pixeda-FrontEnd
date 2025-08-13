"use client"
import * as React3 from "react"
import { AppLayout as AppLayout4 } from "@/components/layout/app-layout"
import { Badge as Badge2 } from "@/components/ui/badge"
import { Button as Button2 } from "@/components/ui/button"
import { Card as Card4, CardContent as CardContent4, CardHeader as CardHeader4, CardTitle as CardTitle4, CardDescription as CardDescription4 } from "@/components/ui/card"
import { Select as Select3, SelectContent as SelectContent3, SelectItem as SelectItem3, SelectTrigger as SelectTrigger3, SelectValue as SelectValue3 } from "@/components/ui/select"
import { Download, Edit as Edit2 } from "lucide-react"
import api from "@/lib/axios"

// Item stage enum per spec
export type ItemStage = "TO_DO" | "GRAPHICS" | "PRINTING" | "CUTTING" | "FINISHING" | "PACKING" | "DONE" | "STANDBY" | "CANCELLED"

export default function ViewOrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = React3.useState<any | null>(null)
  const [loading, setLoading] = React3.useState(true)

  React3.useEffect(() => {
    const c = new AbortController()
    async function load() {
      const res = await api.get(`/api/orders/${params.id}`, { signal: c.signal })
      setOrder(res.data)
      setLoading(false)
    }
    load(); return () => c.abort()
  }, [params.id])

  async function updateItemStatus(itemId: string, next: ItemStage) {
    await api.patch(`/api/orders/${params.id}/items/${itemId}`, { itemStatus: next })
    setOrder((prev: any) => ({ ...prev, items: prev.items.map((it: any) => it._id === itemId ? { ...it, itemStatus: next } : it) }))
  }

  if (loading || !order) return <AppLayout4 breadcrumbs={[{label: "Orders", href: "/orders"},{label: params.id}]}>Loading…</AppLayout4>

  return (
    <AppLayout4 breadcrumbs={[{label: "Orders", href: "/orders"},{label: order.orderNumber}]}> 
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{order.orderNumber}</h1>
          <p className="text-muted-foreground">Client: {order.customer?.companyName || `${order.customer?.lastName ?? ''} ${order.customer?.firstName ?? ''}`}</p>
        </div>
        <div className="flex gap-2">
          <Button2 asChild><a href={`/api/orders/${order._id}/export`}> <Download className="mr-2 h-4 w-4"/> Export PDF</a></Button2>
          <Button2 asChild><a href={`/orders/${order._id}/edit`}><Edit2 className="mr-2 h-4 w-4"/> Edit</a></Button2>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card4>
          <CardHeader4><CardTitle4>Meta</CardTitle4><CardDescription4>Due date, status, priority</CardDescription4></CardHeader4>
          <CardContent4>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Due:</span> {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '-'}</div>
              <div><span className="text-muted-foreground">Received:</span> {order.receivedThrough}</div>
              <div><span className="text-muted-foreground">Status:</span> <Badge2>{order.status}</Badge2></div>
              <div><span className="text-muted-foreground">Priority:</span> <Badge2><>{order.priority}</></Badge2></div>
            </div>
          </CardContent4>
        </Card4>

        <Card4 className="md:col-span-2">
          <CardHeader4><CardTitle4>Items</CardTitle4><CardDescription4>Quickly update item statuses</CardDescription4></CardHeader4>
          <CardContent4>
            <div className="space-y-4">
              {order.items?.map((it: any) => (
                <div key={it._id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.productNameSnapshot || it.product?.productName}</div>
                      <div className="text-sm text-muted-foreground">Qty {it.quantity} • {typeof it.priceSnapshot === 'number' ? `${it.priceSnapshot} RON` : '-'} </div>
                    </div>
                    <Select3 value={it.itemStatus} onValueChange={(v: ItemStage) => updateItemStatus(it._id, v)}>
                      <SelectTrigger3 className="w-[200px]"><SelectValue3 /></SelectTrigger3>
                      <SelectContent3>
                        {["TO_DO","GRAPHICS","PRINTING","CUTTING","FINISHING","PACKING","DONE","STANDBY","CANCELLED"].map(s => (
                          <SelectItem3 key={s} value={s as ItemStage}>{s[0] + s.slice(1).toLowerCase().replace(/_/g,' ')}</SelectItem3>
                        ))}
                      </SelectContent3>
                    </Select3>
                  </div>
                  {Array.isArray(it.attachments) && it.attachments.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {it.attachments.map((f: any) => (
                        <a key={f._id || f.fileId} href={`/api/files/${f._id || f.fileId}`} className="text-xs underline">Attachment</a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent4>
        </Card4>
      </div>
    </AppLayout4>
  )
}
