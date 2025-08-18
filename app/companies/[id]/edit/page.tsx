// app/companies/[id]/edit/page.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import CompanyForm, { CompanyFormValues } from "@/app/companies/components/CompanyForm"

type Props = { params: { id: string } }

export default function EditCompanyPage({ params }: Props) {
  const { id } = params
  const router = useRouter()

  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [companyDefaults, setCompanyDefaults] = React.useState<Partial<CompanyFormValues> | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const res = await api.get(`/api/companies/${id}`)
        const c = res.data?.data || res.data

        const values: Partial<CompanyFormValues> = {
          name: c?.name ?? "",
          cui: c?.cui ?? "",
          defaultFolderPath: c?.defaultFolderPath ?? "",
          description: c?.description ?? "",
        }

        if (!cancelled) setCompanyDefaults(values)
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
  }, [id])

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
      const payload = sanitizePayload(values)
      await api.put(`/api/companies/${id}`, payload)
      router.push(`/companies/${id}`)
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Failed to update company.")
    } finally {
      setSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Companies", href: "/companies" },
    { label: companyDefaults?.name || "Company", href: `/companies/${id}` },
    { label: "Edit" },
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

  if (error && !companyDefaults) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500 text-center">{error}</p>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Edit Company</h1>
          <p className="text-muted-foreground">Update company information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Update the details for this company</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyForm
              defaultValues={companyDefaults || undefined}
              submitting={submitting}
              error={error}
              submitLabel="Update Company"
              cancelHref={`/companies/${id}`}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
