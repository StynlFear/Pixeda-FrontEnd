"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import EmployeeForm, { EmployeeFormValues } from "../../components/EmployeeForm"

export default function NewEmployeePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(values: Omit<EmployeeFormValues, "confirmPassword">) {
    try {
      setSubmitting(true)
      // TODO: call your API later
      router.push("/employees")
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Failed to create employee.")
    } finally { setSubmitting(false) }
  }

  return (
    <AppLayout breadcrumbs={[{label:"Dashboard",href:"/dashboard"},{label:"Employees",href:"/employees"},{label:"New"}]}>
      <Card>
        <CardHeader><CardTitle>New Employee</CardTitle></CardHeader>
        <CardContent>
         <EmployeeForm
  defaultValues={{ firstName:"John", lastName:"Doe", email:"john@pixeda.ro", role:"EMPLOYEE" }}
  submitting={submitting}
  error={error}
  submitLabel="Save changes"
  includePasswordFields={false}
  onSubmit={handleSubmit}
/>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
