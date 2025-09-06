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
import api from "@/lib/axios"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, X, Trash2 } from "lucide-react"

export type ProductFormValues = {
  type?: string
  // Legacy single material; kept for backward-compat when backend still expects a string
  material?: string
  // New: multiple materials
  materials?: string[]
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
  /** Dropdown options for Material; leave empty to show a plain input */
  materialOptions?: string[]
  /** If true, shows a "Custom…" option that reveals a text input */
  allowCustomMaterial?: boolean
  className?: string
}

const CUSTOM_VALUE = "__CUSTOM__"

// Materials now come from API; keep no static defaults

type MaterialItem = { id?: string; name: string }

export default function ProductForm({
  defaultValues,
  submitting = false,
  error,
  submitLabel = "Save Product",
  cancelHref = "/products",
  onCancel,
  onSubmit,
  typeOptions,
  allowCustomType = true,
  materialOptions,
  allowCustomMaterial = true,
  className,
}: ProductFormProps) {
  // Resolve stable option arrays once per prop change
  const resolvedTypeOptions = React.useMemo(() => (typeOptions ?? []), [typeOptions])
  // Materials fetched from API
  const [materials, setMaterials] = React.useState<MaterialItem[]>(() =>
    (materialOptions ?? []).map((n) => ({ name: n }))
  )
  const [materialsLoading, setMaterialsLoading] = React.useState<boolean>(false)
  const [createMaterialLoading, setCreateMaterialLoading] = React.useState<boolean>(false)
  const [materialError, setMaterialError] = React.useState<string | null>(null)
  const [deletingMaterial, setDeletingMaterial] = React.useState<string | null>(null) // id
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null)
  const [pendingDeleteName, setPendingDeleteName] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    type: defaultValues?.type ?? "",
    // input for custom material text field
    material: defaultValues?.material ?? "",
    productName: defaultValues?.productName ?? "",
    productCode: defaultValues?.productCode ?? "",
    description: defaultValues?.description ?? "",
    price: defaultValues?.price !== undefined && defaultValues?.price !== null
      ? String(defaultValues?.price)
      : "",
  })
  const [localError, setLocalError] = React.useState<string | null>(null)
  const [typeMode, setTypeMode] = React.useState<"select" | "input">(
    resolvedTypeOptions.length > 0 ? "select" : "input"
  )
  // Multi-select materials: keep a popover combobox always; fallback to comma input when no list is available
  const [materialsPopoverOpen, setMaterialsPopoverOpen] = React.useState(false)
  const initialSelectedMaterials = React.useMemo(() => {
    const arr = (defaultValues?.materials && Array.isArray(defaultValues.materials))
      ? defaultValues.materials
      : (defaultValues?.material ? [defaultValues.material] : [])
    return Array.from(new Set(arr.filter(Boolean).map((s) => String(s))))
  }, [defaultValues?.materials, defaultValues?.material])
  const [selectedMaterials, setSelectedMaterials] = React.useState<string[]>(initialSelectedMaterials)
  const [selectValue, setSelectValue] = React.useState<string>(() => {
    if (!resolvedTypeOptions.length) return ""
    const initialType = defaultValues?.type ?? ""
    if (allowCustomType && initialType && !resolvedTypeOptions.includes(initialType)) {
      // prefill as custom if default value not in list
      return CUSTOM_VALUE
    }
    return initialType || ""
  })
  // for free-text creation in popover/input
  const [materialQuery, setMaterialQuery] = React.useState<string>("")

  React.useEffect(() => {
    // keep in sync when defaults change (e.g., editing)
    setForm({
      type: defaultValues?.type ?? "",
      material: defaultValues?.material ?? "",
      productName: defaultValues?.productName ?? "",
      productCode: defaultValues?.productCode ?? "",
      description: defaultValues?.description ?? "",
      price:
        defaultValues?.price !== undefined && defaultValues?.price !== null
          ? String(defaultValues?.price)
          : "",
    })
    setTypeMode(resolvedTypeOptions.length > 0 ? "select" : "input")
    // Update selected materials from defaults
    const nextSelected = (defaultValues?.materials && Array.isArray(defaultValues.materials))
      ? defaultValues.materials
      : (defaultValues?.material ? [defaultValues.material] : [])
    setSelectedMaterials(Array.from(new Set((nextSelected || []).filter(Boolean))))

    // Update select values
    const newTypeSelectValue = (() => {
      if (!resolvedTypeOptions.length) return ""
      if (allowCustomType && defaultValues?.type && !resolvedTypeOptions.includes(defaultValues.type)) {
        return CUSTOM_VALUE
      }
      return defaultValues?.type || ""
    })()
    setSelectValue(newTypeSelectValue)
  }, [
    defaultValues,
    resolvedTypeOptions,
    allowCustomType,
    materials,
    allowCustomMaterial,
  ])

  // Load materials from API
  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setMaterialsLoading(true)
        setMaterialError(null)
        const res = await api.get("/api/materials")
        const payload = res.data
        // Try common shapes: array, {items}, {materials}, {data}
        const raw = Array.isArray(payload)
          ? payload
          : (payload?.items ?? payload?.materials ?? payload?.data ?? [])
        const list: MaterialItem[] = (Array.isArray(raw) ? raw : [])
          .map((it: any) => {
            if (typeof it === "string") return { name: it } as MaterialItem
            if (it && typeof it === "object") {
              const id = it._id ?? it.id ?? undefined
              const name = it.name ?? it.label ?? ""
              return name ? ({ id, name } as MaterialItem) : null
            }
            return null
          })
          .filter(Boolean) as MaterialItem[]

        // Ensure defaults exist in list for selection display
        const defaults = [
          ...(defaultValues?.materials ?? []),
          ...(defaultValues?.material ? [defaultValues.material] : []),
        ].filter(Boolean) as string[]
        const augmented = [...list]
        for (const nm of defaults) {
          if (!augmented.some((m) => m.name === nm)) augmented.push({ name: nm })
        }
        if (!cancelled) {
          setMaterials(augmented)
          // If we had no materials before, switch to select
          // ensure defaults appear in the list
          // selected materials already synced in previous effect
        }
      } catch (e: any) {
        if (!cancelled) {
          setMaterialError(e?.response?.data?.message || e?.message || "Failed to load materials.")
        }
      } finally {
        if (!cancelled) setMaterialsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createMaterial(nameRaw: string): Promise<MaterialItem | null> {
    const name = nameRaw.trim()
    if (!name) return null
    try {
      setCreateMaterialLoading(true)
      setMaterialError(null)
      const res = await api.post("/api/materials", { name })
      const created = res.data?.data ?? res.data?.material ?? res.data
      const createdName = typeof created === "string" ? created : (created?.name ?? created?.label ?? name)
      const createdId = typeof created === "object" ? (created?._id ?? created?.id) : undefined
      const newItem: MaterialItem = { id: createdId, name: createdName }
      // Update local list and select it
      setMaterials((prev) => {
        const prevList = prev || []
        if (prevList.some((m) => m.name === createdName)) return prevList
        return [...prevList, newItem]
      })
      setSelectedMaterials((prev) => Array.from(new Set([...(prev || []), createdName])))
      setForm((f) => ({ ...f, material: "" }))
      setMaterialQuery("")
      setMaterialsPopoverOpen(false)
      return newItem
    } catch (e: any) {
      setMaterialError(e?.response?.data?.message || e?.message || "Failed to create material.")
      return null
    } finally {
      setCreateMaterialLoading(false)
    }
  }

  async function deleteMaterialById(id: string, name?: string) {
    const targetId = id?.trim()
    if (!targetId) return
    try {
      setDeletingMaterial(targetId)
      setMaterialError(null)
      await api.delete(`/api/materials/${encodeURIComponent(targetId)}`)
      setMaterials((prev) => (prev || []).filter((m) => m.id !== targetId && m.name !== name))
      if (name) {
        setSelectedMaterials((prev) => (prev || []).filter((m) => m !== name))
        if (form.material.trim() === name) setForm((f) => ({ ...f, material: "" }))
      }
    } catch (e: any) {
      setMaterialError(e?.response?.data?.message || e?.message || "Failed to delete material.")
    } finally {
      setDeletingMaterial(null)
    }
  }

  const onChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let value = e.target.value
      
      // Special handling for price field to allow both comma and period
      if (key === "price") {
        // Allow only numbers, comma, and period
        value = value.replace(/[^0-9,.]/g, "")
        // Ensure only one decimal separator
        const commaIndex = value.indexOf(",")
        const periodIndex = value.indexOf(".")
        
        if (commaIndex !== -1 && periodIndex !== -1) {
          // If both exist, keep the last one entered
          if (commaIndex > periodIndex) {
            value = value.replace(".", "")
          } else {
            value = value.replace(",", "")
          }
        }
      }
      
      setForm((f) => ({ ...f, [key]: value }))
    }

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

    // Build final materials array (multi-select) - names first
    const manual = form.material.trim()
    const finalMaterialsNames = Array.from(new Set([
      ...selectedMaterials,
      ...(manual ? [manual] : []),
    ].filter(Boolean)))

    // Map names -> ids, creating missing materials if allowed
    const materialIds: string[] = []
    for (const name of finalMaterialsNames) {
      const existing = materials.find((m) => m.name === name)
      if (existing?.id) {
        materialIds.push(existing.id)
        continue
      }
      if (allowCustomMaterial) {
        const created = await createMaterial(name)
        if (created?.id) {
          materialIds.push(created.id)
        } else {
          // If creation failed or no id returned, stop and show error
          return setLocalError(`Failed to create material "${name}". Please create it first or select an existing material.`)
        }
      } else {
        return setLocalError(`Material "${name}" must be selected from the list.`)
      }
    }

    await onSubmit({
      type: finalType || undefined,
      // Preserve legacy single material as first ID
      material: materialIds.length ? materialIds[0] : undefined,
      // New field: array of IDs
      materials: materialIds.length ? materialIds : undefined,
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

          {resolvedTypeOptions.length > 0 ? (
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
                  {resolvedTypeOptions.map((opt) => (
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

        {/* Materials (multi-select) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Materials (optional)</label>

          {/* Selected chips */}
          {selectedMaterials.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedMaterials.map((m) => (
                <Badge key={m} variant="secondary" className="pr-1">
                  <span className="mr-1">{m}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMaterials((prev) => prev.filter((x) => x !== m))}
                    className="inline-flex items-center text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${m}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {materials.length > 0 ? (
            <div className="flex items-start gap-2">
              <Popover open={materialsPopoverOpen} onOpenChange={setMaterialsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={materialsPopoverOpen}
                    className="w-full justify-between"
                    disabled={submitting || materialsLoading}
                  >
                    {selectedMaterials.length > 0 ? `${selectedMaterials.length} selected` : "Select materials"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search materials…" value={materialQuery} onValueChange={setMaterialQuery} />
                    <CommandList>
                      <CommandEmpty>
                        {allowCustomMaterial && materialQuery.trim() ? (
                          <div className="p-3 text-sm">
                            No materials found. Press Enter to create “{materialQuery.trim()}”.
                          </div>
                        ) : (
                          <div className="p-3 text-sm">No materials found.</div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {materials.map((opt) => {
                          const selected = selectedMaterials.includes(opt.name)
                          const isDeleting = !!opt.id && deletingMaterial === opt.id
                          return (
                            <CommandItem
                              key={opt.id ?? opt.name}
                              value={opt.name}
                              onSelect={() => {
                                setSelectedMaterials((prev) =>
                                  prev.includes(opt.name) ? prev.filter((x) => x !== opt.name) : [...prev, opt.name]
                                )
                              }}
                            >
                              <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                              <span className="flex-1 truncate pr-2">{opt.name}</span>
                <button
                                type="button"
                                className="ml-auto inline-flex items-center text-red-500 hover:text-red-600 disabled:opacity-50"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (opt.id) {
                                    setPendingDeleteId(opt.id)
                                    setPendingDeleteName(opt.name)
                                    setConfirmDeleteOpen(true)
                                  }
                                }}
                                disabled={isDeleting || submitting || materialsLoading || !opt.id}
                                aria-label={`Delete ${opt.name}`}
                                title={opt.id ? `Delete ${opt.name}` : "Deletion unavailable"}
                              >
                                {isDeleting ? (
                                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                  </svg>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </CommandItem>
                          )
                        })}
                        {allowCustomMaterial && materialQuery.trim() && !materials.some((m) => m.name === materialQuery.trim()) && (
                          <CommandItem
                            value={`__create__${materialQuery.trim()}`}
                            onSelect={async () => {
                              await createMaterial(materialQuery.trim())
                            }}
                          >
                            Create “{materialQuery.trim()}”
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Quick-add custom text */}
              {allowCustomMaterial && (
                <div className="flex-1 min-w-[220px] flex gap-2">
                  <Input
                    placeholder="Type new material and hit Enter"
                    value={form.material}
                    onChange={onChange("material")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        if (form.material.trim()) createMaterial(form.material)
                      }
                    }}
                    disabled={submitting || createMaterialLoading}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => form.material.trim() && createMaterial(form.material)}
                    disabled={submitting || createMaterialLoading || !form.material.trim()}
                  >
                    {createMaterialLoading ? "Adding…" : "Add material"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Fallback when no materials list is available: comma-separated input
            <div className="flex gap-2">
              <Input
                placeholder="Materials (comma-separated)"
                value={form.material}
                onChange={(e) => {
                  const v = e.target.value
                  setForm((f) => ({ ...f, material: v }))
                  const arr = v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                  setSelectedMaterials(Array.from(new Set(arr)))
                }}
                disabled={submitting || createMaterialLoading}
              />
              {allowCustomMaterial && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => form.material.trim() && createMaterial(form.material.split(',').slice(-1)[0] || form.material)}
                  disabled={submitting || createMaterialLoading || !form.material.trim()}
                >
                  {createMaterialLoading ? "Adding…" : "Add material"}
                </Button>
              )}
            </div>
          )}
          {materialError && (
            <p className="text-xs text-red-500 mt-2">{materialError}</p>
          )}
        </div>

        {/* Confirm delete dialog */}
        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete material?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteName ? `This will permanently remove “${pendingDeleteName}” from the materials list.` : "This will permanently remove the material from the list."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!deletingMaterial}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (pendingDeleteId) {
                    await deleteMaterialById(pendingDeleteId, pendingDeleteName || undefined)
                    setConfirmDeleteOpen(false)
                    setPendingDeleteId(null)
                    setPendingDeleteName(null)
                  }
                }}
                disabled={!pendingDeleteId || !!deletingMaterial}
              >
                {deletingMaterial ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
            Product code (optional)
          </label>
          <Input
            id="productCode"
            value={form.productCode}
            onChange={onChange("productCode")}
            placeholder="BAN-VINYL-L"
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
            inputMode="decimal"
            value={form.price}
            onChange={onChange("price")}
            placeholder="e.g., 149,99 or 149.99"
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
