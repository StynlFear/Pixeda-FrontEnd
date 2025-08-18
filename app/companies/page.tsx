"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import api from "@/lib/axios"

import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Plus, Search, Edit, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

type Company = {
  _id: string
  name: string
  cui?: string
  defaultFolderPath?: string
  description?: string
  createdAt: string
}

export default function CompaniesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1))
  const [limit] = useState<number>(10)
  const [sort] = useState<string>("-createdAt")

  const [searchInput, setSearchInput] = useState<string>(searchParams.get("search") || "")
  const debouncedSearch = useDebounce(searchInput, 350)

  const [items, setItems] = useState<Company[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  // push URL state
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (page > 1) params.set("page", String(page))
    router.replace(`/companies${params.toString() ? `?${params.toString()}` : ""}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page])

  // fetch data
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        const res = await api.get("/api/companies", {
          params: { search: debouncedSearch || undefined, page, limit, sort },
        })
        const { items, total } = res.data || {}
        setItems(Array.isArray(items) ? items : [])
        setTotal(typeof total === "number" ? total : 0)
      } catch (e) {
        console.error("Failed to fetch companies:", e)
        setItems([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [debouncedSearch, page, limit, sort])

  const breadcrumbs = [{ label: "Dashboard", href: "/dashboard" }, { label: "Companies" }]

  const refetch = async (p = page) => {
    const res = await api.get("/api/companies", {
      params: { search: debouncedSearch || undefined, page: p, limit, sort },
    })
    const { items, total } = res.data || {}
    setItems(Array.isArray(items) ? items : [])
    setTotal(typeof total === "number" ? total : 0)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/companies/${id}`)
      if (items.length === 1 && page > 1) {
        const newPage = page - 1
        setPage(newPage)
        await refetch(newPage)
      } else {
        await refetch()
      }
    } catch (e) {
      console.error("Delete failed:", e)
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Companies</h1>
            <p className="text-muted-foreground">Manage client companies</p>
          </div>
          <Button asChild>
            <Link href="/companies/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Directory</CardTitle>
            <CardDescription>Search and manage all companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value)
                    setPage(1)
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
                    <TableHead>CUI</TableHead>
                    <TableHead>Default folder</TableHead>
                    <TableHead>Description</TableHead>
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
                        No companies found
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((co) => (
                      <TableRow key={co._id}>
                        <TableCell className="font-medium">
                          {co.name}
                        </TableCell>

                        <TableCell>{co.cui || <span className="text-muted-foreground">-</span>}</TableCell>

                        <TableCell>
                          {co.defaultFolderPath ? (
                            <div className="max-w-[280px] truncate font-mono text-xs" title={co.defaultFolderPath}>
                              {co.defaultFolderPath}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {co.description ? (
                            <div className="max-w-[320px] truncate" title={co.description}>{co.description}</div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>{new Date(co.createdAt).toLocaleDateString()}</TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/companies/${co._id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/companies/${co._id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete company?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. The company will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDelete(co._id)}
                                  >
                                    Delete
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {total > 0 ? (
                  <>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} companies</>
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
