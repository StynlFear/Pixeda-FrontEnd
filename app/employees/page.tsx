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
import { Plus, Search, Edit, Eye, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react"
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
// If you have shadcn toast, uncomment the next line and use toast(...) in handleDelete success/error.
// import { useToast } from "@/components/ui/use-toast"

type Role = "ADMIN" | "EMPLOYEE"

interface Employee {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role: Role          // derived from backend.position
  createdAt: string
}

type EmployeesResponse =
  | { data: any[]; total: number; page: number; limit: number }
  | { employees: any[]; total: number; page: number; limit: number }
  | { items: any[]; total: number; page: number; limit: number }

export default function EmployeesPage() {
  const router = useRouter()
  const sp = useSearchParams()
  // const { toast } = useToast()

  const page = Number(sp.get("page") || 1)
  const limit = Number(sp.get("limit") || 10)
  const sortBy = sp.get("sortBy") || "createdAt"
  const order = (sp.get("order") || "desc") as "asc" | "desc"
  const role = (sp.get("role") as Role | "ALL") || "ALL" // UI-only; sent as `position`
  const qParam = sp.get("q") || ""

  const sortValue = `${sortBy}:${order}`

  const [searchInput, setSearchInput] = useState(qParam)
  const debouncedSearch = useDebounce(searchInput, 400)

  const [rows, setRows] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const breadcrumbs = useMemo(
    () => [{ label: "Dashboard", href: "/dashboard" }, { label: "Employees" }],
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
    router.push(`/employees?${params.toString()}`)
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
        const res = await api.get<EmployeesResponse>("/api/employees", {
          signal: controller.signal,
          params: {
            page,
            limit,
            sortBy,
            order,
            q: debouncedSearch || undefined,
            position: role !== "ALL" ? role.toLowerCase() : undefined, // backend filter: position
          },
        })

        const payload: any = res.data
        const raw =
          payload?.data ??
          payload?.employees ??
          payload?.items ??
          []

        const list: Employee[] = Array.isArray(raw)
          ? raw.map((e: any) => ({
              _id: e._id,
              firstName: e.firstName,
              lastName: e.lastName,
              email: e.email,
              phone: e.phone,
              role: String(e.position || e.role || "employee").toUpperCase() === "ADMIN" ? "ADMIN" : "EMPLOYEE",
              createdAt: e.createdAt ?? e.hireDate ?? new Date().toISOString(),
            }))
          : []

        setRows(list)
        setTotal(Number(payload?.total ?? payload?.count ?? 0))
      } catch (e: any) {
        if (e.name !== "CanceledError") {
          setRows([])
          setError(e?.response?.data?.message || "Failed to load employees.")
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [page, limit, sortBy, order, role, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1
  const showingTo = Math.min(total, page * limit)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/api/employees/${id}`)
      // Optimistic update
      const nextTotal = Math.max(0, total - 1)
      const nextRows = rows.filter((r) => r._id !== id)
      setRows(nextRows)
      setTotal(nextTotal)

      // If we deleted the last item on the page and there are previous pages, go back a page
      const isPageEmptyAfterDelete = nextRows.length === 0 && page > 1
      const prevPageLastIndex = (page - 1) * limit
      if (isPageEmptyAfterDelete && nextTotal <= prevPageLastIndex) {
        pushQuery({ page: page - 1 })
      } else {
        // refresh same page to keep counts in sync (optional)
        // pushQuery({ page })
      }

      // toast?.({ title: "Employee deleted", description: "The employee was removed successfully." })
    } catch (e: any) {
      // toast?.({ title: "Delete failed", description: e?.response?.data?.message || "Could not delete employee.", variant: "destructive" })
      setError(e?.response?.data?.message || "Delete failed.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Employees</h1>
            <p className="text-muted-foreground">Manage your team members</p>
          </div>
          <Button asChild>
            <Link href="/employees/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>Search and manage all your employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") pushQuery({ q: searchInput, page: 1 })
                  }}
                  className="pl-8"
                />
              </div>

              <div className="flex gap-2">
                <Select
                  value={role}
                  onValueChange={(v) => pushQuery({ role: v, page: 1 })}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortValue}
                  onValueChange={(v) => {
                    const [field, dir] = v.split(":")
                    pushQuery({ sortBy: field, order: dir, page: 1 })
                  }}
                >
                  <SelectTrigger className="w-[190px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt:desc">Newest first</SelectItem>
                    <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                    <SelectItem value="lastName:asc">Last name A→Z</SelectItem>
                    <SelectItem value="lastName:desc">Last name Z→A</SelectItem>
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
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading employees…
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : !Array.isArray(rows) || rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((emp) => (
                      <TableRow key={emp._id}>
                        <TableCell className="font-medium">
                          {emp.firstName} {emp.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={emp.role === "ADMIN" ? "default" : "secondary"}>
                            {emp.role === "ADMIN" ? "Admin" : "Employee"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {emp.email && <div className="text-sm">{emp.email}</div>}
                            {emp.phone && <div className="text-sm text-muted-foreground">{emp.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(emp.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/employees/${emp._id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/employees/${emp._id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>

                            {/* Delete with confirm */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingId === emp._id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete employee?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. The employee will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(emp._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deletingId === emp._id ? (
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
                  <>Showing {showingFrom} to {showingTo} of {total} employees</>
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
