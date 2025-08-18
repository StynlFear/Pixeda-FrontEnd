// app/companies/new/page.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import CompanyForm, { CompanyFormValues } from "@/app/companies/components/CompanyForm"

export default function NewCompanyPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function sanitizePayload(values: CompanyFormValues) {
    const payload: Record<string, any> = {
      name: values.name?.trim(),
      cui: values.cui?.trim() || undefined,
      defaultFolderPath: values.defaultFolderPath?.trim() || undefined,
      description: values.description?.trim() || undefined,
    }

    // drop undefined
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
    return payload
  }

  async function handleSubmit(values: CompanyFormValues) {
    try {
      setSubmitting(true)
      setError(null)
      const payload = sanitizePayload(values)
      const res = await api.post("/api/companies", payload)
      const created = res.data?.data || res.data
      router.push(`/companies/${created._id}`)
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Failed to create company.")
    } finally {
      setSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Companies", href: "/companies" },
    { label: "New Company" },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">New Company</h1>
          <p className="text-muted-foreground">Create a new company record</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Enter the details for the new company</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyForm
              submitting={submitting}
              error={error}
              submitLabel="Create Company"
              cancelHref="/companies"
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
