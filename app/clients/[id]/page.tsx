// app/clients/[id]/page.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import api from "@/lib/axios"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Client = {
  _id: string
  firstName: string
  lastName: string
  email?: string
  companyName?: string
  companyCode?: string
  phone?: string
  folderPath?: string
  createdAt: string
  updatedAt: string
}

// --- MOCK DATA (shown when ?mock=1) ---
const MOCK_CLIENT: Client = {
  _id: "66b88d7f7f9a0b12a1234567",
  firstName: "Laura",
  lastName: "Golofca",
  email: "laura@pixeda.ro",
  companyName: "Pixeda SRL",
  companyCode: "RO12345678",
  phone: "+40 723 123 456",
  folderPath: "\\\\server\\clients\\pixeda\\golofca-laura",
  createdAt: "2025-08-01T09:12:34.000Z",
  updatedAt: "2025-08-10T15:45:00.000Z",
}

export default function ViewClientPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const useMock = searchParams.get("mock") === "1"

  const [loading, setLoading] = React.useState(true)
  const [client, setClient] = React.useState<Client | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clients", href: "/clients" },
    { label: "View" },
  ]

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)

        if (useMock) {
          if (!cancelled) {
            setClient(MOCK_CLIENT)
            setLoading(false)
          }
          return
        }

        // Using our Axios instance (lib/axios) so baseURL + token are handled
        const res = await api.get(`/api/clients/${id}`)
        // Your OpenAPI shows 200 -> Client directly. Still guard for {data} just in case.
        const data = (res.data?.data ?? res.data) as Client

        if (!cancelled) setClient(data)
      } catch (e: any) {
        if (!cancelled) {
          const msg =
            e?.response?.status === 404
              ? "Client not found."
              : e?.response?.data?.message || e.message || "Failed to load client."
          setError(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, useMock])

  async function handleDelete() {
    try {
      if (useMock) {
        router.push("/clients")
        return
      }
      setDeleting(true)
      await api.delete(`/api/clients/${id}`)
      router.push("/clients")
      router.refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Failed to delete client.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription className="text-red-500">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/clients">Back to Clients</Link>
            </Button>
          </CardContent>
        </Card>
      ) : !client ? (
        <Card>
          <CardHeader><CardTitle>Client not found</CardTitle></CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link href="/clients">Back to Clients</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-muted-foreground">Client details</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline"><Link href="/clients">Back</Link></Button>
              <Button asChild><Link href={`/clients/${client._id}/edit${useMock ? "?mock=1" : ""}`}>Edit</Link></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this client?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. {useMock ? "Demo mode: no actual API call will be made." : ""}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                      Confirm delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Contact and company information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Full name</div>
                  <div className="text-base font-medium">
                    {client.firstName} {client.lastName}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Company</div>
                  <div className="text-base">
                    {client.companyName ? (
                      <Badge variant="secondary">{client.companyName}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Company code</div>
                  <div className="text-base">
                    {client.companyCode || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="text-base">
                    {client.email ? (
                      <a className="underline" href={`mailto:${client.email}`}>{client.email}</a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="text-base">
                    {client.phone ? (
                      <a className="underline" href={`tel:${client.phone}`}>{client.phone}</a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm text-muted-foreground">Folder path</div>
                  <div className="text-base">
                    {client.folderPath || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="text-base">{new Date(client.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last updated</div>
                  <div className="text-base">{new Date(client.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button asChild variant="secondary">
              <Link href={`/orders/new?clientId=${client._id}${useMock ? "&mock=1" : ""}`}>
                Create Order for this client
              </Link>
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
