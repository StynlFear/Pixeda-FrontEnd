// =============================
// app/orders/page.tsx — Orders index with pagination + inline status change
// =============================
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, ChevronLeft, ChevronRight, Edit, Eye, Loader2, Plus } from "lucide-react"
import api from "@/lib/axios"
import { useDebounce } from "@/hooks/use-debounce"

// ===== Types & Enums (keep in one place for reuse) =====
export type OrderStatus = "TO_DO" | "IN_PROGRESS" | "DONE" | "CANCELLED"
export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT"
export type ReceivedThrough = "FACEBOOK" | "WHATSAPP" | "PHONE" | "IN_PERSON" | "EMAIL"

export type ClientLite = {
  _id: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
}

export type OrderLite = {
  _id: string
  orderNumber: string
  customer: ClientLite | null
  dueDate?: string
  status: OrderStatus
  priority: Priority
  itemsCount: number
  createdAt?: string
}

// API response shape resilience
 type OrdersResponse =
  | { data: any[]; total: number; page: number; limit: number }
  | { orders: any[]; total: number; page: number; limit: number }
  | { items: any[]; total: number; page: number; limit: number }

export default function OrdersPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const page   = Number(sp.get("page")   || 1)
  const limit  = Number(sp.get("limit")  || 10)
  const sortBy =        sp.get("sortBy") || "createdAt"
  const order  = (sp.get("order") || "desc") as "asc" | "desc"
  const qParam =        sp.get("q")      || ""
  const status =        sp.get("status") as OrderStatus | "ALL" | null
  const prio   =        sp.get("priority") as Priority | "ALL" | null
  const from   =        sp.get("from") || "" // due date >= from (YYYY-MM-DD)
  const to     =        sp.get("to")   || "" // due date <= to

  const sortValue = `${sortBy}:${order}`

  const [searchInput, setSearchInput] = useState(qParam)
  const debouncedSearch = useDebounce(searchInput, 400)

  const [rows, setRows] = useState<OrderLite[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const breadcrumbs = useMemo(
    () => [{ label: "Dashboard", href: "/dashboard" }, { label: "Orders" }],
    []
  )

  const pushQuery = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(sp.toString())
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === "" || v === "ALL") params.delete(k)
      else params.set(k, String(v))
    })
    if (!params.get("page")) params.set("page", "1")
    if (!params.get("limit")) params.set("limit", String(limit))
    router.push(`/orders?${params.toString()}`)
  }

  useEffect(() => { setSearchInput(qParam) }, [qParam])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<OrdersResponse>("/api/orders", {
          signal: controller.signal,
          params: {
            page, limit, sortBy, order,
            q: debouncedSearch || undefined,
            status: status && status !== "ALL" ? status : undefined,
            priority: prio && prio !== "ALL" ? prio : undefined,
            from: from || undefined,
            to: to || undefined,
          },
        })
        const payload: any = res.data
        const raw = payload?.data ?? payload?.orders ?? payload?.items ?? []
        const list: OrderLite[] = Array.isArray(raw) ? raw.map((o: any) => ({
          _id: o._id,
          orderNumber: o.orderNumber,
          customer: o.customer || null,
          dueDate: o.dueDate,
          status: o.status,
          priority: o.priority,
          itemsCount: Array.isArray(o.items) ? o.items.length : (o.itemsCount ?? 0),
          createdAt: o.createdAt,
        })) : []
        setRows(list)
        setTotal(Number(payload?.total ?? payload?.count ?? 0))
      } catch (e: any) {
        if (e.name !== "CanceledError") {
          setRows([])
          setError(e?.response?.data?.message || "Failed to load orders.")
        }
      } finally { setLoading(false) }
    }
    load()
    return () => controller.abort()
  }, [page, limit, sortBy, order, status, prio, from, to, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1
  const showingTo = Math.min(total, page * limit)

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Orders</h1>
            <p className="text-muted-foreground">Track and manage all customer orders</p>
          </div>
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Order
            </Link>
          </Button>
        </div>

    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Quick search, filter by status/priority, inline status updates</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search by order # or client…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") pushQuery({ q: searchInput, page: 1 }) }}
              className="pl-3"
            />
          </div>

          <div className="flex gap-2">
            <Select value={status || "ALL"} onValueChange={(v) => pushQuery({ status: v, page: 1 })}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="TO_DO">To do</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={prio || "ALL"} onValueChange={(v) => pushQuery({ priority: v, page: 1 })}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>

            {/* Due range (simple inputs, you can replace with your DatePicker later) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <Input type="date" value={from} onChange={(e) => pushQuery({ from: e.target.value, page: 1 })} className="w-[150px]" />
                <span className="text-sm text-muted-foreground">to</span>
                <Input type="date" value={to} onChange={(e) => pushQuery({ to: e.target.value, page: 1 })} className="w-[150px]" />
              </div>
            </div>

            <Select
              value={`${sortBy}:${order}`}
              onValueChange={(v) => { const [field, dir] = v.split(":"); pushQuery({ sortBy: field, order: dir, page: 1 }) }}
            >
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Newest first</SelectItem>
                <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                <SelectItem value="dueDate:asc">Due date ↑</SelectItem>
                <SelectItem value="dueDate:desc">Due date ↓</SelectItem>
                <SelectItem value="priority:desc">Priority high→low</SelectItem>
                <SelectItem value="priority:asc">Priority low→high</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <EffectApplySearch debouncedSearch={debouncedSearch} currentQ={qParam} pushQuery={pushQuery} />

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading orders…</div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-red-500">{error}</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No orders found</TableCell>
                </TableRow>
              ) : (
                rows.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell className="font-medium">{o.orderNumber}</TableCell>
                    <TableCell>
                      {o.customer ? (
                        <span>{o.customer.companyName || `${o.customer.lastName ?? ""} ${o.customer.firstName ?? ""}`}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{o.dueDate ? new Date(o.dueDate).toLocaleDateString() : <span className="text-muted-foreground">-</span>}</TableCell>
                    <TableCell>
                      <QuickStatusSelect orderId={o._id} value={o.status} onChanged={() => {/* optional refetch */}} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={o.priority} />
                    </TableCell>
                    <TableCell>{o.itemsCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/orders/${o._id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/orders/${o._id}/edit`}><Edit className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {total > 0 ? (<>Showing {showingFrom} to {showingTo} of {total} orders</>) : (<>No results</>)}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => pushQuery({ page: page - 1 })}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => pushQuery({ page: page + 1 })}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

      </div>
    </AppLayout>
  )
}

function EffectApplySearch({ debouncedSearch, currentQ, pushQuery }: { debouncedSearch: string; currentQ: string; pushQuery: (n: Record<string, string | number | undefined>) => void }) {
  useEffect(() => { if (debouncedSearch !== currentQ) pushQuery({ q: debouncedSearch, page: 1 }) }, [debouncedSearch])
  return null
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, string> = {
    LOW: "bg-secondary/40 text-secondary-foreground",
    NORMAL: "bg-muted text-foreground",
    HIGH: "bg-amber-500/20 text-amber-600",
    URGENT: "bg-red-500/20 text-red-600",
  }
  return <Badge className={map[priority]}>{priority.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</Badge>
}

// ===== Inline Status select (uses /api/orders/:id) =====
import { useState as useState2 } from "react"
import { Select as Select2, SelectContent as SelectContent2, SelectItem as SelectItem2, SelectTrigger as SelectTrigger2, SelectValue as SelectValue2 } from "@/components/ui/select"

function QuickStatusSelect({ orderId, value, onChanged }: { orderId: string; value: OrderStatus; onChanged?: () => void }) {
  const [val, setVal] = useState2<OrderStatus>(value)
  const [busy, setBusy] = useState2(false)
  async function save(next: OrderStatus) {
    try {
      setBusy(true)
      setVal(next)
      await api.patch(`/api/orders/${orderId}`, { status: next })
      onChanged?.()
    } catch (e) { /* show toast if you like */ } finally { setBusy(false) }
  }
  return (
    <Select2 value={val} onValueChange={(v: OrderStatus) => save(v)} disabled={busy}>
      <SelectTrigger2 className="w-[160px]">
        <SelectValue2 />
      </SelectTrigger2>
      <SelectContent2>
        <SelectItem2 value="TO_DO">To do</SelectItem2>
        <SelectItem2 value="IN_PROGRESS">In progress</SelectItem2>
        <SelectItem2 value="DONE">Done</SelectItem2>
        <SelectItem2 value="CANCELLED">Cancelled</SelectItem2>
      </SelectContent2>
    </Select2>
  )
}
