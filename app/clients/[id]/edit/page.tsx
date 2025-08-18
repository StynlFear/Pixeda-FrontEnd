// app/clients/[id]/edit/page.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import ClientForm, { ClientFormValues } from "@/app/clients/components/ClientForm"
import type { CompanyOption } from "@/app/clients/components/ClientForm"

type Props = { params: { id: string } }

export default function EditClientPage({ params }: Props) {
  const { id } = params
  const router = useRouter()

  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [clientDefaults, setClientDefaults] = React.useState<Partial<ClientFormValues> | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const res = await api.get(`/api/clients/${id}`)
        const c = res.data?.data || res.data

        // c.companies can be an array of ObjectIds or populated Company docs
        const companies: CompanyOption[] = Array.isArray(c?.companies)
          ? c.companies.map((co: any) =>
              typeof co === "string"
                ? ({ _id: co, name: "…" } as CompanyOption)
                : ({
                    _id: co._id,
                    name: co.name,
                    cui: co.cui,
                    defaultFolderPath: co.defaultFolderPath,
                    description: co.description,
                  } as CompanyOption)
            )
          : []

        const values: Partial<ClientFormValues> = {
          firstName: c?.firstName ?? "",
          lastName: c?.lastName ?? "",
          email: c?.email ?? "",
          phone: c?.phone ?? "",
          whatsapp: c?.whatsapp ?? "",
          defaultFolderPath: c?.defaultFolderPath ?? "",
          // pass both so the form shows chips AND has ids
          companyIds: companies.map((x) => x._id),
          // @ts-expect-error — our ClientForm accepts `companies` in defaultValues for chip labels
          companies,
        }

        if (!cancelled) setClientDefaults(values)
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.message || e.message || "Failed to load client.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  function sanitizePayload(values: ClientFormValues) {
    const payload: Record<string, any> = {
      firstName: values.firstName?.trim(),
      lastName: values.lastName?.trim(),
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      whatsapp: values.whatsapp?.trim() || undefined,
      defaultFolderPath: values.defaultFolderPath?.trim() || undefined,
      // IMPORTANT: backend expects `companies` (array of ObjectId strings)
      companies: values.companyIds ?? [],
    }

    // drop undefined
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
    return payload
  }

  async function handleSubmit(values: ClientFormValues) {
    try {
      setSubmitting(true)
      const payload = sanitizePayload(values)
      await api.put(`/api/clients/${id}`, payload)
      router.push(`/clients/${id}`)
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Failed to update client.")
    } finally {
      setSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clients", href: "/clients" },
    { label: "Edit" },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Client</CardTitle>
          <CardDescription>Update client information</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <ClientForm
              defaultValues={clientDefaults ?? undefined}
              submitting={submitting}
              error={error}
              submitLabel="Save changes"
              cancelHref={`/clients/${id}`}
              onSubmit={handleSubmit}
            />
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}
