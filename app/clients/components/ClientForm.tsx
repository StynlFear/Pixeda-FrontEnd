"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type ClientFormValues = {
  firstName: string
  lastName: string
  email?: string
  companyName?: string
  companyCode?: string
  phone?: string
  folderPath?: string
}

type ClientFormProps = {
  defaultValues?: Partial<ClientFormValues>
  submitting?: boolean
  error?: string | null
  submitLabel?: string
  cancelHref?: string           // if set, Cancel is a <Link>; otherwise calls onCancel()
  onCancel?: () => void
  onSubmit: (values: ClientFormValues) => void | Promise<void>
  className?: string
}

export default function ClientForm({
  defaultValues,
  submitting = false,
  error,
  submitLabel = "Save Client",
  cancelHref = "/clients",
  onCancel,
  onSubmit,
  className,
}: ClientFormProps) {
  const [form, setForm] = React.useState<ClientFormValues>({
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? "",
    email: defaultValues?.email ?? "",
    companyName: defaultValues?.companyName ?? "",
    companyCode: defaultValues?.companyCode ?? "",
    phone: defaultValues?.phone ?? "",
    folderPath: defaultValues?.folderPath ?? "",
  })
  const [localError, setLocalError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // keep in sync if defaultValues change (e.g., edit page data load)
    setForm({
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      email: defaultValues?.email ?? "",
      companyName: defaultValues?.companyName ?? "",
      companyCode: defaultValues?.companyCode ?? "",
      phone: defaultValues?.phone ?? "",
      folderPath: defaultValues?.folderPath ?? "",
    })
  }, [defaultValues])

  const onChange =
    (key: keyof ClientFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setLocalError("First name and Last name are required.")
      return
    }

    await onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email?.trim() || undefined,
      companyName: form.companyName?.trim() || undefined,
      companyCode: form.companyCode?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      folderPath: form.folderPath?.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className={["space-y-6", className].filter(Boolean).join(" ")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="firstName">First name *</label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={onChange("firstName")}
            placeholder="John"
            required
            disabled={submitting}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="lastName">Last name *</label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={onChange("lastName")}
            placeholder="Doe"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email (optional)</label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={onChange("email")}
            placeholder="john.doe@example.com"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone (optional)</label>
          <Input
            id="phone"
            value={form.phone}
            onChange={onChange("phone")}
            placeholder="+40 7xx xxx xxx"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="companyName">Company (optional)</label>
          <Input
            id="companyName"
            value={form.companyName}
            onChange={onChange("companyName")}
            placeholder="Pixeda SRL"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="companyCode">Company code (optional)</label>
          <Input
            id="companyCode"
            value={form.companyCode}
            onChange={onChange("companyCode")}
            placeholder="RO12345678"
            disabled={submitting}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="folderPath">Folder path (optional)</label>
          <Input
            id="folderPath"
            value={form.folderPath}
            onChange={onChange("folderPath")}
            placeholder="\\\\server\\clients\\pixeda"
            disabled={submitting}
          />
        </div>
      </div>

      {(localError || error) && (
        <p className="text-sm text-red-500">{localError || error}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button variant="outline" type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : (
          <Button variant="outline" type="button" asChild>
            <Link href={cancelHref}>Cancel</Link>
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
