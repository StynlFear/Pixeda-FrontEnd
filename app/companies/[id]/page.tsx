// app/companies/[id]/page.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import api from "@/lib/axios"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, ArrowLeft, Eye, ExternalLink } from "lucide-react"

type Company = {
  _id: string
  name: string
  cui?: string
  defaultFolderPath?: string
  description?: string
  createdAt: string
  updatedAt: string
}

// --- MOCK DATA (shown when ?mock=1) ---
const MOCK_COMPANY: Company = {
  _id: "66b88d7f7f9a0b12a1234567",
  name: "Pixeda SRL",
  cui: "RO12345678",
  defaultFolderPath: "\\\\server\\companies\\pixeda",
  description: "Technology and software development company",
  createdAt: "2024-08-11T09:15:39.000Z",
  updatedAt: "2024-08-15T14:22:10.000Z",
}

type Props = { params: { id: string } }

export default function CompanyPage({ params }: Props) {
  const { id } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMock = searchParams?.get("mock") === "1"

  const [company, setCompany] = React.useState<Company | null>(null)
  const [loading, setLoading] = React.useState(!isMock)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isMock) {
      setCompany(MOCK_COMPANY)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const res = await api.get(`/api/companies/${id}`)
        const c = res.data?.data || res.data
        if (!cancelled) setCompany(c)
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || e.message || "Failed to load company.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, isMock])

  async function handleDelete() {
    if (!company) return
    try {
      await api.delete(`/api/companies/${company._id}`)
      router.push("/companies")
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Failed to delete company.")
    }
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Companies", href: "/companies" },
    { label: company?.name || "Company" },
  ]

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading company...</p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <Button variant="outline" asChild>
                <Link href="/companies">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Companies
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  if (!company) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Company not found.</p>
              <Button variant="outline" asChild>
                <Link href="/companies">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Companies
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">{company.name}</h1>
            <p className="text-muted-foreground">Company details</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/companies">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/companies/${company._id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete company?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The company "{company.name}" will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Company identification and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{company.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">CUI</label>
                <p className="text-sm">{company.cui || <span className="text-muted-foreground">Not provided</span>}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{company.description || <span className="text-muted-foreground">No description</span>}</p>
              </div>
            </CardContent>
          </Card>

          {/* File System */}
          <Card>
            <CardHeader>
              <CardTitle>File System</CardTitle>
              <CardDescription>Default folder configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Default Folder Path</label>
                <p className="text-sm font-mono break-all">
                  {company.defaultFolderPath || <span className="text-muted-foreground">Not configured</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>System information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(company.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{new Date(company.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Orders placed for this company</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyOrdersTable companyId={company._id} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

// Mock data for orders - replace with actual API call when backend is ready
type Order = {
  _id: string
  orderNumber: string
  clientName: string
  clientId: string
  status: "pending" | "in-progress" | "completed" | "cancelled"
  totalAmount: number
  createdAt: string
  description?: string
}

const MOCK_ORDERS: Order[] = [
  {
    _id: "order_001",
    orderNumber: "ORD-2024-001",
    clientName: "Laura Golofca",
    clientId: "client_001",
    status: "completed",
    totalAmount: 2500.00,
    createdAt: "2024-08-15T10:30:00Z",
    description: "Website redesign project"
  },
  {
    _id: "order_002", 
    orderNumber: "ORD-2024-002",
    clientName: "Andrei Popescu",
    clientId: "client_002",
    status: "in-progress",
    totalAmount: 1800.00,
    createdAt: "2024-08-12T14:20:00Z",
    description: "Mobile app development"
  },
  {
    _id: "order_003",
    orderNumber: "ORD-2024-003", 
    clientName: "Maria Ionescu",
    clientId: "client_003",
    status: "pending",
    totalAmount: 3200.00,
    createdAt: "2024-08-10T09:15:00Z",
    description: "E-commerce platform setup"
  },
  {
    _id: "order_004",
    orderNumber: "ORD-2024-004",
    clientName: "Cristian Dumitrescu", 
    clientId: "client_004",
    status: "completed",
    totalAmount: 950.00,
    createdAt: "2024-08-08T16:45:00Z",
    description: "Logo design and branding"
  },
  {
    _id: "order_005",
    orderNumber: "ORD-2024-005",
    clientName: "Elena Radu",
    clientId: "client_005", 
    status: "cancelled",
    totalAmount: 1200.00,
    createdAt: "2024-08-05T11:30:00Z",
    description: "SEO optimization package"
  }
]

function getStatusColor(status: Order["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "in-progress":
      return "bg-blue-100 text-blue-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function getStatusLabel(status: Order["status"]) {
  switch (status) {
    case "completed":
      return "Completed"
    case "in-progress":
      return "In Progress"
    case "pending":
      return "Pending"
    case "cancelled":
      return "Cancelled"
    default:
      return status
  }
}

type CompanyOrdersTableProps = {
  companyId: string
}

function CompanyOrdersTable({ companyId }: CompanyOrdersTableProps) {
  // In a real implementation, you would fetch orders for this company
  // For now, we'll show mock data
  const orders = MOCK_ORDERS

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No orders found for this company.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell className="font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{order.clientName}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/clients/${order.clientId}`}>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={order.description}>
                    {order.description || <span className="text-muted-foreground">-</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {order.totalAmount.toLocaleString('ro-RO', { 
                      style: 'currency', 
                      currency: 'RON' 
                    })}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orders/${order._id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {orders.length} order{orders.length !== 1 ? 's' : ''} for this company
        </p>
        <Button variant="outline" asChild>
          <Link href={`/orders?company=${companyId}`}>
            View All Orders
          </Link>
        </Button>
      </div>
    </div>
  )
}
