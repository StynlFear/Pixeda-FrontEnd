// app/clients/new/page.tsx
"use client"
import { useRouter } from "next/navigation"
import * as React from "react"
import api from "@/lib/axios"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ClientForm, { ClientFormValues } from "../components/ClientForm"

export default function NewClientPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(values: ClientFormValues) {
    try {
      setSubmitting(true)
      await api.post("/api/clients", values)
      router.push("/clients")
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Failed to create client.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout breadcrumbs={[{label:"Dashboard",href:"/dashboard"},{label:"Clients",href:"/clients"},{label:"New"}]}>
      <Card>
        <CardHeader><CardTitle>New Client</CardTitle></CardHeader>
        <CardContent>
          <ClientForm submitting={submitting} error={error} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </AppLayout>
  )
}
