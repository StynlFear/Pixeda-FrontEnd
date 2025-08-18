// app/clients/page.tsx
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
import { Plus, Search, Edit, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import api from "@/lib/axios"
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
import { useDebounce } from "@/hooks/use-debounce"

type Company = {
  _id: string
  name: string
  cui?: string
  defaultFolderPath?: string
  description?: string
}

type Client = {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  whatsapp?: string
  defaultFolderPath?: string
  companies: (Company | string)[]
  createdAt: string
}

export default function ClientsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // query params (server-side pagination-ready)
  const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1))
  const [limit] = useState<number>(10)
  const [sort] = useState<string>("-createdAt")

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const debouncedSearch = useDebounce(searchInput, 350)

  const [items, setItems] = useState<Client[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  // push URL state
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (page > 1) params.set("page", String(page))
    router.replace(`/clients${params.toString() ? `?${params.toString()}` : ""}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page])

  // fetch
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        const res = await api.get("/api/clients", {
          params: { search: debouncedSearch || undefined, page, limit, sort },
        })
        const { items, total } = res.data || {}
        // ensure companies is an array for each client
        const normalized: Client[] = (Array.isArray(items) ? items : []).map((c: any) => ({
          ...c,
          companies: Array.isArray(c?.companies) ? c.companies : [],
        }))
        setItems(normalized)
        setTotal(typeof total === "number" ? total : 0)
      } catch (e) {
        console.error("Failed to fetch clients:", e)
        setItems([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [debouncedSearch, page, limit, sort])

  const breadcrumbs = [{ label: "Dashboard", href: "/dashboard" }, { label: "Clients" }]

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/clients/${id}`)
      // simple refetch; if last item on page, step back a page
      if (items.length === 1 && page > 1) setPage((p) => p - 1)
      else {
        const res = await api.get("/api/clients", { params: { search: debouncedSearch || undefined, page, limit, sort } })
        const { items: newItems, total: newTotal } = res.data || {}
        const normalized: Client[] = (Array.isArray(newItems) ? newItems : []).map((c: any) => ({
          ...c,
          companies: Array.isArray(c?.companies) ? c.companies : [],
        }))
        setItems(normalized)
        setTotal(typeof newTotal === "number" ? newTotal : 0)
      }
    } catch (e) {
      console.error("Delete failed:", e)
    }
  }

  // helper: normalize companies for row rendering
  const normalizeCompanies = (arr: (Company | string)[]) =>
    (arr ?? []).map((co) => (typeof co === "string" ? ({ _id: co, name: "…" } as Company) : co))

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Clients</h1>
            <p className="text-muted-foreground">Manage your client database</p>
          </div>
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Directory</CardTitle>
            <CardDescription>Search and manage all your clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value)
                    setPage(1) // reset to first page when searching
                  }}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Companies</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Folder path</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No clients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((client) => {
                      const companies = normalizeCompanies(client.companies)
                      return (
                        <TableRow key={client._id}>
                          <TableCell className="font-medium">
                            {client.firstName} {client.lastName}
                          </TableCell>

                          <TableCell>
                            {companies.length ? (
                              <div className="flex flex-wrap gap-2">
                                {companies.map((co) => (
                                  <Link key={co._id} href={`/companies/${co._id}`}>
                                    <Badge className="bg-gray-800 text-gray-100 hover:bg-gray-700">
                                      {co.name}
                                    </Badge>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              {client.email && <div className="text-sm">{client.email}</div>}
                              {client.phone && <div className="text-sm text-muted-foreground">{client.phone}</div>}
                              {client.whatsapp && (
                                <div className="text-xs text-muted-foreground">WhatsApp: {client.whatsapp}</div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            {client.defaultFolderPath ? (
                              <div
                                className="max-w-[280px] truncate font-mono text-xs"
                                title={client.defaultFolderPath}
                              >
                                {client.defaultFolderPath}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/clients/${client._id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/clients/${client._id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>

                              {/* Delete with confirm */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete client?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. The client will be permanently removed.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleDelete(client._id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {total > 0 ? (
                  <>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} clients</>
                ) : (
                  <>No results</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
