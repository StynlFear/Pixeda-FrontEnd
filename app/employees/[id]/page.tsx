"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

type Role = "ADMIN" | "EMPLOYEE"

type Employee = {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role: Role
  createdAt?: string
  updatedAt?: string
}

// ---- MOCK FALLBACK (used only when no real data is available) ----
const MOCK_EMPLOYEE: Employee = {
  _id: "66b8ea2e8f0a2b001234abcd",
  firstName: "Florin",
  lastName: "Golofca",
  email: "florin@pixeda.ro",
  phone: "+40 723 000 111",
  role: "EMPLOYEE",
  createdAt: "2025-08-01T09:12:34.000Z",
  updatedAt: "2025-08-10T15:45:00.000Z",
}

export default function ViewEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  // If/when you wire an API, load into this state:
  const [employee, setEmployee] = React.useState<Employee | null>(null)

  // Choose what to display: real data if present; otherwise mock
  const display: Employee = employee ?? MOCK_EMPLOYEE
  const usingMock = employee == null

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Employees", href: "/employees" },
    { label: "View" },
  ]

  async function handleDelete() {
    // No API yet — just go back to the list
    router.push("/employees")
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              {display.firstName} {display.lastName}
            </h1>
            <p className="text-muted-foreground">Employee details</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/employees">Back</Link>
            </Button>
            <Button asChild>
              <Link href={`/employees/${display._id}/edit`}>Edit</Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this employee?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {usingMock
                      ? "Demo mode: no actual API call will be made."
                      : "This action cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {usingMock && (
          <div className="text-xs text-muted-foreground">
            Showing mock data (no backend wired yet).
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Contact and role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Full name</div>
                <div className="text-base font-medium">
                  {display.firstName} {display.lastName}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="text-base">
                  <Badge variant={display.role === "ADMIN" ? "default" : "secondary"}>
                    {display.role === "ADMIN" ? "Admin" : "Employee"}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="text-base">
                  {display.email ? (
                    <a className="underline" href={`mailto:${display.email}`}>{display.email}</a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="text-base">
                  {display.phone ? (
                    <a className="underline" href={`tel:${display.phone}`}>{display.phone}</a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-base">
                  {display.createdAt ? new Date(display.createdAt).toLocaleString() : "—"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last updated</div>
                <div className="text-base">
                  {display.updatedAt ? new Date(display.updatedAt).toLocaleString() : "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
