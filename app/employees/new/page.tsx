"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import EmployeeForm, { EmployeeFormValues } from "../components/EmployeeForm"
import api from "@/lib/axios"
import { useToast } from "@/components/ui/use-toast"

type PositionApi = "admin" | "employee"

export default function NewEmployeePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(values: Omit<EmployeeFormValues, "confirmPassword">) {
    try {
      setSubmitting(true)
      setError(null)

      const positionLower = (values.role as string).toLowerCase() as PositionApi

      const payload: {
        firstName: string
        lastName: string
        email: string
        position: PositionApi
        password: string
        phone?: string
      } = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        position: positionLower,   // "admin" | "employee"  (lowercase)
        password: values.password || "",
        ...(values.phone ? { phone: values.phone } : {}),
      }

      await api.post("/api/employees", payload)

      toast({ title: "Employee created", description: `${values.firstName} ${values.lastName} added.` })
      router.push("/employees")
      router.refresh()
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 409) setError("An employee with this email already exists.")
      else if (status === 422) setError(e?.response?.data?.message || "Validation failed.")
      else setError(e?.response?.data?.message || e?.message || "Failed to create employee.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Employees", href: "/employees" },
      { label: "New" }
    ]}>
      <Card>
        <CardHeader><CardTitle>New Employee</CardTitle></CardHeader>
        <CardContent>
          <EmployeeForm
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            includePasswordFields
          />
        </CardContent>
      </Card>
    </AppLayout>
  )
}
