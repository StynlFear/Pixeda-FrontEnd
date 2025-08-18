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

type Company = {
  _id: string
  name: string
  cui?: string
  defaultFolderPath?: string
  description?: string
}

type Client = {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  whatsapp?: string
  defaultFolderPath?: string
  companies: (Company | string)[]
  createdAt: string
  updatedAt: string
}

// --- MOCK DATA (shown when ?mock=1) ---
const MOCK_CLIENT: Client = {
  _id: "66b88d7f7f9a0b12a1234567",
  firstName: "Laura",
  lastName: "Golofca",
  email: "laura@pixeda.ro",
  phone: "+40 723 123 456",
  whatsapp: "+40 723 123 456",
  defaultFolderPath: "\\\\server\\clients\\pixeda\\golofca-laura",
  companies: [
    { _id: "66b8c0f1f9e9d01234567890", name: "Pixeda SRL", cui: "RO12345678" },
    { _id: "66b8c0f1f9e9d01234567891", name: "Grafix Media" },
  ],
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

        const res = await api.get(`/api/clients/${id}`)
        const data = (res.data?.data ?? res.data) as Client

        // Ensure companies is an array
        if (!cancelled) setClient({ ...data, companies: Array.isArray(data.companies) ? data.companies : [] })
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
    return () => { cancelled = true }
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

  // Helper: normalize companies for rendering (handles ObjectId strings)
  const normalizedCompanies: Company[] = React.useMemo(() => {
    const raw = client?.companies ?? []
    return raw.map((c: Company | string) =>
      typeof c === "string" ? ({ _id: c, name: "…" } as Company) : c
    )
  }, [client])

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
              <CardDescription>Contact & affiliations</CardDescription>
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

                <div>
                  <div className="text-sm text-muted-foreground">WhatsApp</div>
                  <div className="text-base">
                    {client.whatsapp ? (
                      <a className="underline" href={`tel:${client.whatsapp}`}>{client.whatsapp}</a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm text-muted-foreground">Personal folder path</div>
                  <div className="text-base">
                    {client.defaultFolderPath || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>

                {/* Companies */}
                <div className="md:col-span-2">
                  <div className="text-sm text-muted-foreground mb-1">Companies</div>
                  {normalizedCompanies.length ? (
                    <div className="flex flex-wrap gap-2">
                      {normalizedCompanies.map((co) => (
                        <Link key={co._id} href={`/companies/${co._id}`} className="group">
                          <Badge className="bg-gray-800 text-gray-100 hover:bg-gray-700 transition-colors">
                            <span className="mr-1">{co.name}</span>
                            {co.cui ? <span className="opacity-70">({co.cui})</span> : null}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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
