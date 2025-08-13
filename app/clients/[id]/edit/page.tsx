// app/clients/[id]/edit/page.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import ClientForm, { ClientFormValues } from "@/app/clients/components/ClientForm"

type Props = { params: { id: string } }

export default function EditClientPage({ params }: Props) {
  const { id } = params
  const router = useRouter()

  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [client, setClient] = React.useState<ClientFormValues | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await api.get(`/api/clients/${id}`)
        const c = res.data?.data || res.data
        const values: ClientFormValues = {
          firstName: c?.firstName ?? "",
          lastName: c?.lastName ?? "",
          email: c?.email ?? "",
          companyName: c?.companyName ?? "",
          companyCode: c?.companyCode ?? "",
          phone: c?.phone ?? "",
          folderPath: c?.folderPath ?? "",
        }
        if (!cancelled) setClient(values)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.message || e.message || "Failed to load client.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  function sanitizePayload(values: ClientFormValues) {
    // remove fields that are empty strings, null, or undefined (prevents unique:null issues)
    const payload: Record<string, any> = { ...values }
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "" || payload[k] === null || payload[k] === undefined) {
        delete payload[k]
      }
    })
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
      // surface duplicate/validation messages if backend sends them
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
              defaultValues={client ?? undefined}
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
