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
import { Plus, Search, Edit, Eye, ChevronLeft, ChevronRight, Loader2, Trash2, ChevronsUpDown, Check, Plus as PlusIcon } from "lucide-react"
import api from "@/lib/axios"
import { useDebounce } from "@/hooks/use-debounce"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
// import { useToast } from "@/components/ui/use-toast"

type Product = {
  _id: string
  type?: string
  material?: string | { _id: string; name: string }
  materials?: Array<string | { _id: string; name: string }>
  productName: string
  productCode: string
  description?: string
  price?: number
  createdAt: string
}
const typeOptions = ["Stickers", "Flyers", "Business Cards", "Banners", "Posters"]
type ProductsResponse =
  | { data: any[]; total: number; page: number; limit: number }
  | { products: any[]; total: number; page: number; limit: number }
  | { items: any[]; total: number; page: number; limit: number }

export default function ProductsPage() {
  const router = useRouter()
  const sp = useSearchParams()
  // const { toast } = useToast()

  const page   = Number(sp.get("page")   || 1)
  const limit  = Number(sp.get("limit")  || 8)
  const sortBy =        sp.get("sortBy") || "createdAt"
  const order  = (sp.get("order") || "desc") as "asc" | "desc"
  const qParam =        sp.get("q")      || ""
  const type   =        sp.get("type")   || "ALL" // UI string; backend expects plain type when != ALL

  const sortValue = `${sortBy}:${order}`

  const [searchInput, setSearchInput] = useState(qParam)
  const debouncedSearch = useDebounce(searchInput, 400)

  const [rows, setRows] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const breadcrumbs = useMemo(
    () => [{ label: "Dashboard", href: "/dashboard" }, { label: "Products" }],
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
    router.push(`/products?${params.toString()}`)
  }

  useEffect(() => {
    setSearchInput(qParam)
  }, [qParam])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<ProductsResponse>("/api/products", {
          signal: controller.signal,
          params: {
            page,
            limit,
            sortBy,
            order,
            q: debouncedSearch || undefined,
            type: type !== "ALL" ? type : undefined,
          },
        })

        const payload: any = res.data
        const raw = payload?.data ?? payload?.products ?? payload?.items ?? []

        const list: Product[] = Array.isArray(raw)
          ? raw.map((p: any) => ({
              _id: p._id,
              type: p.type,
              material: p.material,
              materials: Array.isArray(p.materials) ? p.materials : undefined,
              productName: p.productName,
              productCode: p.productCode,
              description: p.description,
              price: typeof p.price === "number" ? p.price : undefined,
              createdAt: p.createdAt ?? new Date().toISOString(),
            }))
          : []

        setRows(list)
        setTotal(Number(payload?.total ?? payload?.count ?? 0))
      } catch (e: any) {
        if (e.name !== "CanceledError") {
          setRows([])
          setError(e?.response?.data?.message || "Failed to load products.")
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [page, limit, sortBy, order, type, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1
  const showingTo = Math.min(total, page * limit)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/api/products/${id}`)
      const nextTotal = Math.max(0, total - 1)
      const nextRows = rows.filter((r) => r._id !== id)
      setRows(nextRows)
      setTotal(nextTotal)

      const isPageEmptyAfterDelete = nextRows.length === 0 && page > 1
      const prevPageLastIndex = (page - 1) * limit
      if (isPageEmptyAfterDelete && nextTotal <= prevPageLastIndex) {
        pushQuery({ page: page - 1 })
      } else {
        // optional refresh
        // pushQuery({ page })
      }

      // toast?.({ title: "Product deleted", description: "The product was removed successfully." })
    } catch (e: any) {
      setError(e?.response?.data?.message || "Delete failed.")
      // toast?.({ title: "Delete failed", description: e?.response?.data?.message || "Could not delete product.", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const priceFmt = (n?: number) =>
    typeof n === "number" ? new Intl.NumberFormat().format(n) : undefined

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Directory</CardTitle>
            <CardDescription>Search and manage all your products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") pushQuery({ q: searchInput, page: 1 })
                  }}
                  className="pl-8"
                />
              </div>

              <div className="flex gap-2">
                {/* Type filter with typing support */}
                <TypeCombobox
                  value={type === "ALL" ? "" : type}
                  options={typeOptions}
                  onChange={(v) => pushQuery({ type: v || "ALL", page: 1 })}
                  placeholder="Type (filter)"
                  className="w-[190px]"
                />

                <Select
                  value={sortValue}
                  onValueChange={(v) => {
                    const [field, dir] = v.split(":")
                    pushQuery({ sortBy: field, order: dir, page: 1 })
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt:desc">Newest first</SelectItem>
                    <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                    <SelectItem value="productName:asc">Name A→Z</SelectItem>
                    <SelectItem value="productName:desc">Name Z→A</SelectItem>
                    <SelectItem value="price:asc">Price low→high</SelectItem>
                    <SelectItem value="price:desc">Price high→low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <EffectApplySearch debouncedSearch={debouncedSearch} currentQ={qParam} pushQuery={pushQuery} />

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading products…
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : !Array.isArray(rows) || rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium">{p.productName}</TableCell>
                        <TableCell>{p.productCode}</TableCell>
                        <TableCell>
                          {p.type ? (
                            <Badge variant="secondary">{p.type}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.materials && p.materials.length ? (
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {p.materials.map((m) => {
                                const key = typeof m === "string" ? m : m._id
                                const label = typeof m === "string" ? m : m.name
                                return (
                                  <Badge key={key} variant="secondary">{label}</Badge>
                                )
                              })}
                            </div>
                          ) : p.material ? (
                            <Badge variant="secondary">{typeof p.material === 'string' ? p.material : p.material.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {priceFmt(p.price) ?? <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/products/${p._id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/products/${p._id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={deletingId === p._id}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete product?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. The product will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(p._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deletingId === p._id ? (
                                      <span className="inline-flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Deleting…
                                      </span>
                                    ) : (
                                      "Delete"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {total > 0 ? (
                  <>Showing {showingFrom} to {showingTo} of {total} products</>
                ) : (
                  <>No results</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => pushQuery({ page: page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => pushQuery({ page: page + 1 })}
                >
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

function EffectApplySearch({
  debouncedSearch,
  currentQ,
  pushQuery,
}: {
  debouncedSearch: string
  currentQ: string
  pushQuery: (next: Record<string, string | number | undefined>) => void
}) {
  useEffect(() => {
    if (debouncedSearch !== currentQ) {
      pushQuery({ q: debouncedSearch, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])
  return null
}

/** Typeable Select (Combobox) */
function TypeCombobox({
  value,
  options,
  onChange,
  placeholder = "Select type",
  className,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const current = value ?? ""

  const submit = (v: string) => {
    onChange(v)
    setOpen(false)
    setQuery("")
  }

  const normalized = query.trim()
  const hasExact = options.some((o) => o.toLowerCase() === normalized.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn("justify-between", className)}>
          {current || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput
            placeholder="Search or type custom…"
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submit(normalized)
              }
            }}
          />
          <CommandEmpty>No results. Press Enter to use custom.</CommandEmpty>

          {normalized && !hasExact && (
            <CommandItem value={normalized} onSelect={() => submit(normalized)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Use “{normalized}”
            </CommandItem>
          )}

          <CommandGroup heading="Suggestions">
            {options.map((opt) => (
              <CommandItem key={opt} value={opt} onSelect={() => submit(opt)}>
                <Check className={cn("mr-2 h-4 w-4", current.toLowerCase() === opt.toLowerCase() ? "opacity-100" : "opacity-0")} />
                {opt}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
