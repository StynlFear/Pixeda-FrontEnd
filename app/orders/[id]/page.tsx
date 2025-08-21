"use client"
import * as React3 from "react"
import { AppLayout as AppLayout4 } from "@/components/layout/app-layout"
import { Badge as Badge2 } from "@/components/ui/badge"
import { Button as Button2 } from "@/components/ui/button"
import { Card as Card4, CardContent as CardContent4, CardHeader as CardHeader4, CardTitle as CardTitle4, CardDescription as CardDescription4 } from "@/components/ui/card"
import { Select as Select3, SelectContent as SelectContent3, SelectItem as SelectItem3, SelectTrigger as SelectTrigger3, SelectValue as SelectValue3 } from "@/components/ui/select"
import { Download, Edit as Edit2 } from "lucide-react"
import api from "@/lib/axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

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
    await api.patch(`/api/orders/${params.id}/items/${itemId}/status`, { itemStatus: next })
    setOrder((prev: any) => ({ ...prev, items: prev.items.map((it: any) => it._id === itemId ? { ...it, itemStatus: next } : it) }))
  }

  async function exportOrderAsPDF() {
    try {
      const response = await api.get(`/api/orders/${params.id}/pdf`, {
        responseType: 'blob'
      })
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `order-${order.orderNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  if (loading || !order) return <AppLayout4 breadcrumbs={[{label: "Orders", href: "/orders"},{label: params.id}]}>Loading…</AppLayout4>

  return (
    <AppLayout4 breadcrumbs={[{label: "Orders", href: "/orders"},{label: order.orderNumber}]}> 
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Client: {order.customerCompany?.name || `${order.customer?.firstName ?? ''} ${order.customer?.lastName ?? ''}`}
            {order.customerCompany && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Company</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button2 onClick={exportOrderAsPDF}> <Download className="mr-2 h-4 w-4"/> Export PDF</Button2>
          <Button2 asChild><a href={`/orders/${order._id}/edit`}><Edit2 className="mr-2 h-4 w-4"/> Edit</a></Button2>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Order Meta Information */}
        <Card4>
          <CardHeader4>
            <CardTitle4>Order Information</CardTitle4>
            <CardDescription4>Basic order details and metadata</CardDescription4>
          </CardHeader4>
          <CardContent4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Due Date:</span>
                <div className="mt-1">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Received Through:</span>
                <div className="mt-1"><Badge2 variant="outline">{order.receivedThrough}</Badge2></div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Status:</span>
                <div className="mt-1"><Badge2>{order.status}</Badge2></div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Priority:</span>
                <div className="mt-1"><Badge2 variant={order.priority === 'HIGH' ? 'destructive' : order.priority === 'URGENT' ? 'destructive' : 'secondary'}>{order.priority}</Badge2></div>
              </div>
              {order.description && (
                <div className="md:col-span-2 lg:col-span-4">
                  <span className="text-muted-foreground font-medium">Description:</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded border text-sm">{order.description}</div>
                </div>
              )}
              <div className="md:col-span-2 lg:col-span-4">
                <span className="text-muted-foreground font-medium">Created:</span>
                <div className="mt-1">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</div>
              </div>
            </div>
          </CardContent4>
        </Card4>

        {/* Customer Information */}
        <Card4>
          <CardHeader4>
            <CardTitle4>Customer Information</CardTitle4>
          </CardHeader4>
          <CardContent4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Client:</span>
                <div className="mt-1">
                  {order.customer?.firstName} {order.customer?.lastName}
                  {order.customer?.email && (
                    <div className="text-muted-foreground">{order.customer.email}</div>
                  )}
                </div>
              </div>
              {order.customerCompany && (
                <div>
                  <span className="text-muted-foreground font-medium">Company:</span>
                  <div className="mt-1">
                    <div className="font-medium">{order.customerCompany.name}</div>
                    {order.customerCompany.cui && (
                      <div className="text-muted-foreground">CUI: {order.customerCompany.cui}</div>
                    )}
                    {order.customerCompany.description && (
                      <div className="text-muted-foreground mt-1">{order.customerCompany.description}</div>
                    )}
                    {order.customerCompany.defaultFolderPath && (
                      <div className="text-muted-foreground text-xs mt-1">Folder: {order.customerCompany.defaultFolderPath}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent4>
        </Card4>

        {/* Items Detailed View */}
        <Card4>
          <CardHeader4>
            <CardTitle4>Order Items ({order.items?.length || 0})</CardTitle4>
            <CardDescription4>Detailed view of all items with assignments, files, and status</CardDescription4>
          </CardHeader4>
          <CardContent4>
            <div className="space-y-6">
              {order.items?.map((item: any, idx: number) => (
                <div key={item._id} className="border rounded-lg p-4 bg-gray-50/50">
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">#{idx + 1} {item.productNameSnapshot}</h3>
                        <Badge2 variant="outline">Qty: {item.quantity}</Badge2>
                        {item.priceSnapshot && (
                          <Badge2 variant="outline">{item.priceSnapshot} RON</Badge2>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Product ID: {item.product?._id || item.product}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Select3 value={item.itemStatus} onValueChange={(v: ItemStage) => updateItemStatus(item._id, v)}>
                        <SelectTrigger3 className="w-[180px]"><SelectValue3 /></SelectTrigger3>
                        <SelectContent3>
                          {["TO_DO","GRAPHICS","PRINTING","CUTTING","FINISHING","PACKING","DONE","STANDBY","CANCELLED"]
                            .filter(s => !item.disabledStages?.includes(s))
                            .map(s => (
                            <SelectItem3 key={s} value={s as ItemStage}>{s[0] + s.slice(1).toLowerCase().replace(/_/g,' ')}</SelectItem3>
                          ))}
                        </SelectContent3>
                      </Select3>
                    </div>
                  </div>

                  {/* Item Details Grid */}
                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* Left Column - Text Information */}
                    <div className="space-y-4">
                      {item.descriptionSnapshot && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Description:</span>
                          <div className="mt-1 p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                            {item.descriptionSnapshot}
                          </div>
                        </div>
                      )}

                      {item.textToPrint && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Text to Print:</span>
                          <div className="mt-1 p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                            {item.textToPrint}
                          </div>
                        </div>
                      )}

                      {/* File Paths */}
                      <div className="grid grid-cols-1 gap-2">
                        {item.editableFilePath && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Editable File:</span>
                            <div className="mt-1 p-2 bg-white rounded border text-xs font-mono">
                              {item.editableFilePath}
                            </div>
                          </div>
                        )}
                        {item.printingFilePath && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Printing File:</span>
                            <div className="mt-1 p-2 bg-white rounded border text-xs font-mono">
                              {item.printingFilePath}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Disabled Stages */}
                      {item.disabledStages && item.disabledStages.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Skipped Stages:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.disabledStages.map((stage: string) => (
                              <Badge2 key={stage} variant="secondary" className="text-xs">
                                {stage.replace(/_/g, ' ')}
                              </Badge2>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Images and Files */}
                    <div className="space-y-4">
                      {/* Images */}
                      <div className="grid grid-cols-1 gap-4">
                        {item.graphicsImage && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Graphics Image:</span>
                            <div className="mt-1 border rounded p-2 bg-white">
                              <img 
                                src={`${API_BASE_URL}/api/uploads/${item.graphicsImage.replace(/\\/g, '/').replace(/^uploads\//, '')}`} 
                                alt="Graphics" 
                                className="max-w-full h-auto max-h-48 object-contain rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.style.display = 'block';
                                }}
                              />
                              <div className="text-xs text-muted-foreground hidden">
                                Image not available: {item.graphicsImage}
                              </div>
                            </div>
                          </div>
                        )}

                        {item.finishedProductImage && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Finished Product Image:</span>
                            <div className="mt-1 border rounded p-2 bg-white">
                              <img 
                                src={`${API_BASE_URL}/api/uploads/${item.finishedProductImage.replace(/\\/g, '/').replace(/^uploads\//, '')}`} 
                                alt="Finished Product" 
                                className="max-w-full h-auto max-h-48 object-contain rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.style.display = 'block';
                                }}
                              />
                              <div className="text-xs text-muted-foreground hidden">
                                Image not available: {item.finishedProductImage}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Attachments */}
                      {item.attachments && item.attachments.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Attachments:</span>
                          <div className="mt-1 space-y-1">
                            {item.attachments.map((attachment: string, attIdx: number) => (
                              <div key={attIdx} className="flex items-center gap-2 p-2 bg-white rounded border text-xs">
                                <span className="flex-1 font-mono">{attachment}</span>
                                <a 
                                  href={`${API_BASE_URL}/api/uploads/${attachment}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  View
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assignments */}
                  {item.assignments && item.assignments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-sm font-medium text-muted-foreground">Stage Assignments:</span>
                      <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {item.assignments.map((assignment: any, assIdx: number) => (
                          <div key={assIdx} className="bg-white rounded border p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge2 variant="outline" className="text-xs">
                                {assignment.stage.replace(/_/g, ' ')}
                              </Badge2>
                            </div>
                            <div className="text-sm">
                              <div className="font-medium">
                                {assignment.assignedTo?.firstName} {assignment.assignedTo?.lastName}
                              </div>
                              {assignment.assignedTo?.email && (
                                <div className="text-xs text-muted-foreground">
                                  {assignment.assignedTo.email}
                                </div>
                              )}
                              {assignment.stageNotes && (
                                <div className="text-xs text-muted-foreground mt-1 italic">
                                  "{assignment.stageNotes}"
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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
