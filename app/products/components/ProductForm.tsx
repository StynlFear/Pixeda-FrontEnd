"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

export type ProductFormValues = {
  type?: string
  productName: string
  productCode: string
  description?: string
  price?: number
}

type ProductFormProps = {
  defaultValues?: Partial<ProductFormValues>
  submitting?: boolean
  error?: string | null
  submitLabel?: string
  cancelHref?: string
  onCancel?: () => void
  onSubmit: (values: ProductFormValues) => void | Promise<void>

  /** Dropdown options for Type; leave empty to show a plain input */
  typeOptions?: string[]
  /** If true, shows a "Custom…" option that reveals a text input */
  allowCustomType?: boolean
  className?: string
}

const CUSTOM_VALUE = "__CUSTOM__"

export default function ProductForm({
  defaultValues,
  submitting = false,
  error,
  submitLabel = "Save Product",
  cancelHref = "/products",
  onCancel,
  onSubmit,
  typeOptions = [],
  allowCustomType = true,
  className,
}: ProductFormProps) {
  const [form, setForm] = React.useState({
    type: defaultValues?.type ?? "",
    productName: defaultValues?.productName ?? "",
    productCode: defaultValues?.productCode ?? "",
    description: defaultValues?.description ?? "",
    price: defaultValues?.price !== undefined && defaultValues?.price !== null
      ? String(defaultValues?.price)
      : "",
  })
  const [localError, setLocalError] = React.useState<string | null>(null)
  const [typeMode, setTypeMode] = React.useState<"select" | "input">(
    typeOptions.length > 0 ? "select" : "input"
  )
  const [selectValue, setSelectValue] = React.useState<string>(() => {
    if (!typeOptions.length) return ""
    if (allowCustomType && form.type && !typeOptions.includes(form.type)) {
      // prefill as custom if default value not in list
      return CUSTOM_VALUE
    }
    return form.type || ""
  })

  React.useEffect(() => {
    // keep in sync when defaults change (e.g., editing)
    setForm({
      type: defaultValues?.type ?? "",
      productName: defaultValues?.productName ?? "",
      productCode: defaultValues?.productCode ?? "",
      description: defaultValues?.description ?? "",
      price:
        defaultValues?.price !== undefined && defaultValues?.price !== null
          ? String(defaultValues?.price)
          : "",
    })
    setTypeMode(typeOptions.length > 0 ? "select" : "input")
    setSelectValue(() => {
      if (!typeOptions.length) return ""
      if (allowCustomType && defaultValues?.type && !typeOptions.includes(defaultValues.type)) {
        return CUSTOM_VALUE
      }
      return defaultValues?.type || ""
    })
  }, [defaultValues, typeOptions, allowCustomType])

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    // Validation
    if (!form.productName.trim()) return setLocalError("Product name is required.")

    const numericPrice =
      form.price.trim() === "" ? undefined : Number(parseFloat(form.price.replace(",", ".")))
    if (numericPrice !== undefined && (isNaN(numericPrice) || numericPrice < 0)) {
      return setLocalError("Price must be a positive number.")
    }

    const finalType =
      typeMode === "select"
        ? (selectValue === CUSTOM_VALUE ? form.type.trim() : selectValue)
        : form.type.trim()

    await onSubmit({
      type: finalType || undefined,
      productName: form.productName.trim(),
      productCode: form.productCode.trim(),
      description: form.description?.trim() || undefined,
      price: numericPrice,
    })
  }

  return (
    <form onSubmit={handleSubmit} className={["space-y-6", className].filter(Boolean).join(" ")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Type (optional)</label>

          {typeOptions.length > 0 ? (
            <>
              <Select
                value={selectValue}
                onValueChange={(v) => {
                  if (allowCustomType && v === CUSTOM_VALUE) {
                    setTypeMode("input")
                    setSelectValue(CUSTOM_VALUE)
                    return
                  }
                  setSelectValue(v)
                  setForm((f) => ({ ...f, type: v }))
                }}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                  {allowCustomType && <SelectItem value={CUSTOM_VALUE}>Custom…</SelectItem>}
                </SelectContent>
              </Select>

              {allowCustomType && typeMode === "input" && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter custom type"
                    value={form.type}
                    onChange={onChange("type")}
                    disabled={submitting}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTypeMode("select")
                        setSelectValue("")
                        setForm((f) => ({ ...f, type: "" }))
                      }}
                    >
                      Use dropdown
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Input
              placeholder="Type (e.g., Stickers, Flyers)"
              value={form.type}
              onChange={onChange("type")}
              disabled={submitting}
            />
          )}
        </div>

        {/* Product name */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="productName">
            Product name *
          </label>
          <Input
            id="productName"
            value={form.productName}
            onChange={onChange("productName")}
            placeholder="Large Vinyl Banner"
            required
            disabled={submitting}
            autoFocus
          />
        </div>

        {/* Product code */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="productCode">
            Product code *
          </label>
          <Input
            id="productCode"
            value={form.productCode}
            onChange={onChange("productCode")}
            placeholder="BAN-VINYL-L"
            required
            disabled={submitting}
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="description">
            Description (optional)
          </label>
          <Textarea
            id="description"
            value={form.description}
            onChange={onChange("description")}
            placeholder="Short description about materials, size, print specifics…"
            disabled={submitting}
            rows={4}
          />
        </div>

        {/* Price */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="price">
            Price (optional)
          </label>
          <Input
            id="price"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={form.price}
            onChange={onChange("price")}
            placeholder="e.g., 149.99"
            disabled={submitting}
          />
        </div>
      </div>

      {(localError || error) && <p className="text-sm text-red-500">{localError || error}</p>}

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
