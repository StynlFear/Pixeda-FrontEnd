"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

export type Role = "ADMIN" | "EMPLOYEE"

export type EmployeeFormValues = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: Role
  password?: string
  confirmPassword?: string
}

type EmployeeFormProps = {
  defaultValues?: Partial<EmployeeFormValues>
  submitting?: boolean
  error?: string | null
  submitLabel?: string
  cancelHref?: string            // if provided, Cancel is a <Link>
  onCancel?: () => void          // else call onCancel()
  onSubmit: (values: Omit<EmployeeFormValues, "confirmPassword">) => void | Promise<void>
  includePasswordFields?: boolean // show + require password on create (default true)
  className?: string
}

export default function EmployeeForm({
  defaultValues,
  submitting = false,
  error,
  submitLabel = "Save Employee",
  cancelHref = "/employees",
  onCancel,
  onSubmit,
  includePasswordFields = true,
  className,
}: EmployeeFormProps) {
  const [form, setForm] = React.useState<EmployeeFormValues>({
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? "",
    email: defaultValues?.email ?? "",
    phone: defaultValues?.phone ?? "",
    role: (defaultValues?.role as Role) ?? "EMPLOYEE",
    password: "",
    confirmPassword: "",
  })
  const [localError, setLocalError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setForm((prev) => ({
      ...prev,
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      role: (defaultValues?.role as Role) ?? "EMPLOYEE",
      // keep password fields empty when defaults change
      password: "",
      confirmPassword: "",
    }))
  }, [defaultValues])

  const onChange =
    (key: keyof EmployeeFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    // Basic validation
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return setLocalError("First name and Last name are required.")
    }
    if (!form.email.trim()) {
      return setLocalError("Email is required.")
    }
    // Password validation:
    if (includePasswordFields || form.password || form.confirmPassword) {
      if ((form.password?.length || 0) < 6) {
        return setLocalError("Password must be at least 6 characters.")
      }
      if (form.password !== form.confirmPassword) {
        return setLocalError("Passwords do not match.")
      }
    }

    await onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || undefined,
      role: form.role,
      password: form.password ? form.password : undefined, // omit if empty
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
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email *</label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={onChange("email")}
            placeholder="john.doe@pixeda.ro"
            required
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

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Role *</label>
          <Select
            value={form.role}
            onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}
            disabled={submitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {includePasswordFields && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">Password *</label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={onChange("password")}
                placeholder="••••••••"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm password *</label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={onChange("confirmPassword")}
                placeholder="••••••••"
                required
                disabled={submitting}
              />
            </div>
          </>
        )}

        {!includePasswordFields && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">New password (optional)</label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={onChange("password")}
                placeholder="Leave blank to keep current"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm new password</label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={onChange("confirmPassword")}
                placeholder="Repeat new password"
                disabled={submitting}
              />
            </div>
          </>
        )}
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
