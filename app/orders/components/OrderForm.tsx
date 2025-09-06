"use client";
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button as Button3 } from "@/components/ui/button";
import { Input as Input3 } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select as Select4,
  SelectContent as SelectContent4,
  SelectItem as SelectItem4,
  SelectTrigger as SelectTrigger4,
  SelectValue as SelectValue4,
} from "@/components/ui/select";
import {
  Card as Card5,
  CardContent as CardContent5,
  CardHeader as CardHeader5,
  CardTitle as CardTitle5,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { PlusCircle, X, ChevronDown, ChevronRight } from "lucide-react";
import ClientAutocomplete, { type ClientSelection } from "@/app/orders/components/client-autocomplete";
import ProductPicker from "@/app/orders/components/product-picker";
import ClientForm, {
  type ClientFormValues,
} from "@/app/clients/components/ClientForm";
import ProductForm, {
  type ProductFormValues,
} from "@/app/products/components/ProductForm";
import api from "@/lib/axios";

// ------------------ enums & helpers ------------------
const STAGES = [
  "TO_DO",
  "GRAPHICS",
  "PRINTING",
  "CUTTING",
  "FINISHING",
  "PACKING",
  "DONE",
  "STANDBY",
  "CANCELLED",
] as const;
type Stage = (typeof STAGES)[number];

const stageLabel = (s: Stage) =>
  s[0] + s.slice(1).toLowerCase().replace(/_/g, " ");

type EmployeeLite = {
  _id: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
};
const fullName = (e: EmployeeLite) =>
  `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim();

// ------------------ schema ------------------
const schema = z.object({
  dueDate: z.string().min(1, "Due date required"),
  receivedThrough: z.enum([
    "FACEBOOK",
    "WHATSAPP",
    "PHONE",
    "IN_PERSON",
    "EMAIL",
  ]),
  status: z
    .enum(["TO_DO", "READY_TO_BE_TAKEN", "IN_EXECUTION", "IN_PAUSE", "IN_PROGRESS", "DONE", "CANCELLED"])
    .default("TO_DO"),
  customer: z.string().min(1, "Select a client"),
  customerCompany: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        product: z.string().min(1, "Product is required"),
        productNameSnapshot: z.string().min(1, "Product name is required"),
        descriptionSnapshot: z.string().optional(),
        priceSnapshot: z.number().optional(),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        itemStatus: z.enum(STAGES).default("TO_DO"),
        attachments: z.array(z.string()).optional().default([]),
        graphicsImage: z.union([z.instanceof(File), z.string(), z.null(), z.undefined()]).optional(),
        finishedProductImage: z.union([z.instanceof(File), z.string(), z.null(), z.undefined()]).optional(),
        textToPrint: z.string().optional(),
        editableFilePath: z.string().optional(),
        printingFilePath: z.string().optional(),
        disabledStages: z.array(z.string()).optional().default([]),
        assignments: z.array(
          z.object({
            stage: z.enum(STAGES),
            assignedTo: z.string().optional(), // Make assignedTo optional to allow empty assignments
            stageNotes: z.string().optional(),
          })
        ).optional().default([]), // Make assignments array optional
      })
    )
    .min(1, "Add at least one product"),
});

export type OrderFormValues = z.infer<typeof schema>;

// ------------------ main ------------------
export default function OrderForm({
  defaults,
  onSubmit,
  submitting,
  error,
  currentUserId, // NEW: cine e “eu” (default assignee)
}: {
  defaults?: Partial<OrderFormValues>;
  onSubmit: (values: OrderFormValues | FormData) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
  currentUserId?: string; // dacă nu vine, încercăm să-l detectăm din /api/me
}) {
  const [resolvedMe] = React.useState<string | undefined>(currentUserId);
  const [employees, setEmployees] = React.useState<EmployeeLite[]>([]);

  // fetch me if not provided

  // fetch employees for assignee dropdowns
  React.useEffect(() => {
    let ignore = false;
    async function loadEmployees() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const res = await api.get(`${process.env.NEXT_PUBLIC_API_BASE_URL!}api/employees`, {
          // trimite header-ul dacă ai JWT; dacă nu, rămâne fără
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          // dacă backendul tău NU suportă acești parametri, scoate-i
          params: { limit: 100, page: 1 },
        });

        const raw = Array.isArray(res.data)
          ? res.data
          : res.data?.data ?? res.data?.employees ?? res.data?.items ?? [];

        if (!ignore) {
          const list = (raw as any[]).map((e) => ({
            _id: e._id,
            firstName: e.firstName,
            lastName: e.lastName,
            isActive: e.isActive,
          }));
          setEmployees(list);
        }
      } catch (e) {
        if (!ignore) setEmployees([]);
      }
    }
    loadEmployees();
    return () => {
      ignore = true;
    };
  }, []);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dueDate: defaults?.dueDate || new Date().toISOString().slice(0, 10),
      receivedThrough: (defaults?.receivedThrough as any) || "IN_PERSON",
      status: (defaults?.status as any) || "TO_DO",
      customer: defaults?.customer || "",
      customerCompany: defaults?.customerCompany || "",
      priority: (defaults?.priority as any) || "NORMAL",
      description: defaults?.description || "",
      items: (defaults as any)?.items || [],
    },
  });

  // Reset form when defaults change (for edit mode)
  React.useEffect(() => {
    if (defaults && Object.keys(defaults).length > 0) {
      form.reset({
        dueDate: defaults.dueDate || new Date().toISOString().slice(0, 10),
        receivedThrough: (defaults.receivedThrough as any) || "IN_PERSON",
        status: (defaults.status as any) || "TO_DO",
        customer: defaults.customer || "",
        customerCompany: defaults.customerCompany || "",
        priority: (defaults.priority as any) || "NORMAL",
        description: defaults.description || "",
        items: (defaults as any)?.items || [],
      });
    }
  }, [defaults, form]);

  const items = form.watch("items");

  // State to track which products are collapsed
  const [collapsedItems, setCollapsedItems] = React.useState<Set<number>>(
    new Set()
  );
  // Collapsible states per item for subsections
  const [collapsedWorkflow, setCollapsedWorkflow] = React.useState<Set<number>>(new Set());
  const [collapsedImages, setCollapsedImages] = React.useState<Set<number>>(new Set());
  const [collapsedAssignments, setCollapsedAssignments] = React.useState<Set<number>>(new Set());

  // Default: subsections collapsed. Recompute only when items count changes (avoids fighting user toggles on edits)
  const prevItemsLenRef = React.useRef<number>(items?.length ?? 0);
  React.useEffect(() => {
    const len = items?.length ?? 0;
    if (len !== prevItemsLenRef.current) {
      const allIdx = new Set(Array.from({ length: len }, (_, i) => i));
      setCollapsedWorkflow(allIdx);
      setCollapsedImages(new Set(allIdx));
      setCollapsedAssignments(new Set(allIdx));
      prevItemsLenRef.current = len;
    }
  }, [items?.length]);
  const handleSubmit = form.handleSubmit(async (vals) => {
    const me = resolvedMe || "";

    // Extract customer info from the new format
    let customerId = "";
    let customerCompanyId: string | undefined;
    
    try {
      if (vals.customer) {
        const selection = JSON.parse(vals.customer);
        customerId = selection.clientId;
        customerCompanyId = selection.companyId;
      }
    } catch {
      // Fallback for old format
      customerId = vals.customer;
    }

    // Create FormData for file uploads
    const formData = new FormData();
    
    // Add basic order fields
    formData.append('dueDate', vals.dueDate);
    formData.append('receivedThrough', vals.receivedThrough);
    formData.append('status', vals.status);
    formData.append('customer', customerId);
    if (customerCompanyId) {
      formData.append('customerCompany', customerCompanyId);
    }
    formData.append('priority', vals.priority);
    if (vals.description) {
      formData.append('description', vals.description);
    }

    // Process items and add each field to FormData individually
    vals.items.forEach((item, itemIndex) => {
      // If item is cancelled, no assignments needed
      let assignments: { stage: Stage; assignedTo: string; stageNotes?: string }[] = [];
      if (item.itemStatus !== "CANCELLED") {
        // Get disabled stages for this specific item
        const itemDisabledStages = (item.disabledStages || []) as Stage[];
        const availableStages = STAGES.filter(
          (s) => !itemDisabledStages.includes(s)
        );

        // Stages that don't need employee assignments
        const stagesRequiringAssignment = availableStages.filter(
          (s) => s !== "CANCELLED" && s !== "DONE" && s !== "STANDBY"
        );

        // Build assignments map
        const map = new Map<
          Stage,
          { assignedTo: string; stageNotes?: string }
        >();
        for (const a of item.assignments || []) {
          const isStageRequired = stagesRequiringAssignment.some(s => s === a.stage);
          if (isStageRequired && a.assignedTo && a.assignedTo.trim()) { // Check if assignedTo is not empty
            map.set(a.stage, {
              assignedTo: a.assignedTo,
              stageNotes: a.stageNotes,
            });
          }
        }

        // Default assignments for missing stages (only if we have a user ID)
        if (me && me.trim()) {
          for (const s of stagesRequiringAssignment) {
            if (!map.has(s)) map.set(s, { assignedTo: me, stageNotes: "" });
          }
        }

        assignments = Array.from(
          map,
          ([stage, { assignedTo, stageNotes }]) => ({
            stage,
            assignedTo,
            stageNotes,
          })
        );
      }

      // Add each item field to FormData
      formData.append(`items[${itemIndex}][product]`, item.product);
      formData.append(`items[${itemIndex}][productNameSnapshot]`, item.productNameSnapshot);
      formData.append(`items[${itemIndex}][descriptionSnapshot]`, item.descriptionSnapshot || "");
      if (item.priceSnapshot !== undefined) {
        formData.append(`items[${itemIndex}][priceSnapshot]`, item.priceSnapshot.toString());
      }
      formData.append(`items[${itemIndex}][quantity]`, item.quantity.toString());
      formData.append(`items[${itemIndex}][itemStatus]`, item.itemStatus);
      formData.append(`items[${itemIndex}][textToPrint]`, item.textToPrint || "");
      formData.append(`items[${itemIndex}][editableFilePath]`, item.editableFilePath || "");
      formData.append(`items[${itemIndex}][printingFilePath]`, item.printingFilePath || "");
      
      // Handle arrays
      if (item.attachments && item.attachments.length > 0) {
        item.attachments.forEach((attachment, attachIndex) => {
          formData.append(`items[${itemIndex}][attachments][${attachIndex}]`, attachment);
        });
      }
      
      if (item.disabledStages && item.disabledStages.length > 0) {
        item.disabledStages.forEach((stage, stageIndex) => {
          formData.append(`items[${itemIndex}][disabledStages][${stageIndex}]`, stage);
        });
      }
      
      // Handle assignments
      assignments.forEach((assignment, assignIndex) => {
        formData.append(`items[${itemIndex}][assignments][${assignIndex}][stage]`, assignment.stage);
        formData.append(`items[${itemIndex}][assignments][${assignIndex}][assignedTo]`, assignment.assignedTo);
        if (assignment.stageNotes) {
          formData.append(`items[${itemIndex}][assignments][${assignIndex}][stageNotes]`, assignment.stageNotes);
        }
      });

      // Handle file uploads for this item
      if (item.graphicsImage && item.graphicsImage instanceof File) {
        formData.append(`items[${itemIndex}][graphicsImage]`, item.graphicsImage);
      }
      
      if (item.finishedProductImage && item.finishedProductImage instanceof File) {
        formData.append(`items[${itemIndex}][finishedProductImage]`, item.finishedProductImage);
      }
    });

    // Call onSubmit with FormData instead of plain object
    await onSubmit(formData as any);
  });
  // helper: build default assignments for an item (all enabled stages except CANCELLED, DONE, and STANDBY -> me)
  const makeDefaultAssignments = React.useCallback((itemDisabledStages: string[] = []) => {
    const me = resolvedMe || "";
    return STAGES.filter(
      (s) => !itemDisabledStages.includes(s) && s !== "CANCELLED" && s !== "DONE" && s !== "STANDBY"
    ).map((s) => ({
      stage: s,
      assignedTo: me,
      stageNotes: "",
    }));
  }, [resolvedMe]);

  async function addProduct(p: any) {
    const next = [
      {
        product: p._id,
        productNameSnapshot: p.productName,
        descriptionSnapshot: p.description || "",
        priceSnapshot: typeof p.price === "number" ? p.price : undefined,
        quantity: 1,
        itemStatus: "TO_DO" as const,
        attachments: [],
        graphicsImage: undefined, // Optional - added later in graphics stage
        finishedProductImage: undefined, // Optional - added later in finishing stage
        textToPrint: "",
        editableFilePath: "",
        printingFilePath: "",
        disabledStages: [],
        assignments: [], // Start with empty assignments - user can fill them later
      },
      ...items,
    ];
    form.setValue("items", next, { shouldDirty: true });
  }

  const toggleItemCollapse = (index: number) => {
    setCollapsedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleWorkflowCollapse = (index: number) => {
    setCollapsedWorkflow((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleImagesCollapse = (index: number) => {
    setCollapsedImages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAssignmentsCollapse = (index: number) => {
    setCollapsedAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      {/* Display form validation errors */}
      {Object.keys(form.formState.errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 text-sm font-medium mb-2">Please fix the following errors:</div>
          <ul className="text-red-700 text-sm space-y-1">
            {Object.entries(form.formState.errors).map(([field, error]) => (
              <li key={field}>
                <strong>{field}:</strong> {error?.message?.toString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------- Order Details ---------------- */}
      <Card5>
        <CardHeader5>
          <CardTitle5>Order Details</CardTitle5>
        </CardHeader5>
        <CardContent5 className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Due date</label>
            <Input3 type="date" {...form.register("dueDate")} />
            {form.formState.errors.dueDate && (
              <div className="text-red-500 text-xs mt-1">
                {form.formState.errors.dueDate.message}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Received through
            </label>
            <Select4
              value={form.watch("receivedThrough")}
              onValueChange={(v) => form.setValue("receivedThrough", v as any)}
            >
              <SelectTrigger4>
                <SelectValue4 />
              </SelectTrigger4>
              <SelectContent4>
                <SelectItem4 value="FACEBOOK">Facebook</SelectItem4>
                <SelectItem4 value="WHATSAPP">WhatsApp</SelectItem4>
                <SelectItem4 value="PHONE">Phone</SelectItem4>
                <SelectItem4 value="IN_PERSON">In person</SelectItem4>
                <SelectItem4 value="EMAIL">Email</SelectItem4>
              </SelectContent4>
            </Select4>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Status</label>
            <Select4
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as any)}
            >
              <SelectTrigger4>
                <SelectValue4 />
              </SelectTrigger4>
              <SelectContent4>
                <SelectItem4 value="TO_DO">To do</SelectItem4>
                <SelectItem4 value="READY_TO_BE_TAKEN">Ready to be taken</SelectItem4>
                <SelectItem4 value="IN_EXECUTION">In execution</SelectItem4>
                <SelectItem4 value="IN_PAUSE">In pause</SelectItem4>
                <SelectItem4 value="IN_PROGRESS">In progress</SelectItem4>
                <SelectItem4 value="DONE">Done</SelectItem4>
                <SelectItem4 value="CANCELLED">Cancelled</SelectItem4>
              </SelectContent4>
            </Select4>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Customer</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <ClientAutocomplete
                  value={form.watch("customer")}
                  onChange={(selection) =>
                    form.setValue("customer", JSON.stringify(selection), { shouldDirty: true })
                  }
                />
                {form.formState.errors.customer && (
                  <div className="text-red-500 text-xs mt-1">
                    {form.formState.errors.customer.message}
                  </div>
                )}
              </div>
              {/* NEW: Create Client as MODAL */}
              <CreateClientModal
                onCreated={(clientId) => {
                  // When creating a new client, default to physical person
                  const selection = {
                    clientId,
                    companyId: undefined,
                    displayName: "New Client (Physical Person)",
                    isPhysicalPerson: true
                  };
                  form.setValue("customer", JSON.stringify(selection), { shouldDirty: true })
                }}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Priority</label>
            <Select4
              value={form.watch("priority")}
              onValueChange={(v) => form.setValue("priority", v as any)}
            >
              <SelectTrigger4>
                <SelectValue4 />
              </SelectTrigger4>
              <SelectContent4>
                <SelectItem4 value="LOW">Low</SelectItem4>
                <SelectItem4 value="NORMAL">Normal</SelectItem4>
                <SelectItem4 value="HIGH">High</SelectItem4>
                <SelectItem4 value="URGENT">Urgent</SelectItem4>
              </SelectContent4>
            </Select4>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-muted-foreground">Description</label>
            <Textarea rows={3} {...form.register("description")} />
          </div>
        </CardContent5>
      </Card5>

      {/* ---------------- Products ---------------- */}
      <Card5>
        <CardHeader5>
          <CardTitle5>Products</CardTitle5>
        </CardHeader5>
        <CardContent5 className="space-y-6">
          {/* Product actions */}
          <div className="flex gap-2">
            <AddProductModal onPick={addProduct} />
            <CreateProductModal onCreated={addProduct} />
          </div>

          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No products yet. Click "Add product" to select existing or "New product" to create a new one.
            </div>
          )}
          
          {form.formState.errors.items && (
            <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded p-3">
              <strong>Products required:</strong> {form.formState.errors.items.message}
            </div>
          )}

          {items.map((it, idx) => {
            // Get disabled stages for this specific item
            const itemDisabledStages = (it.disabledStages || []) as Stage[];
            const availableStages = STAGES.filter(
              (s) => !itemDisabledStages.includes(s)
            );
            const isCollapsed = collapsedItems.has(idx);
            return (
              <div key={idx} className="rounded border">
                {/* Product Header - Always Visible */}
                <div className="p-3 flex items-center justify-between bg-gray-50/50 border-b">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleItemCollapse(idx)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <div className="font-medium">{it.productNameSnapshot}</div>
                    <div className="text-sm text-muted-foreground">
                      (Qty: {it.quantity}, Status: {stageLabel(it.itemStatus)})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      form.setValue(
                        "items",
                        items.filter((_, i) => i !== idx),
                        { shouldDirty: true }
                      )
                    }
                    className="text-sm text-muted-foreground hover:text-red-500 inline-flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </button>
                </div>

                {/* Product Details - Collapsible */}
                {!isCollapsed && (
                  <div className="p-3 space-y-3">
                    <div className="grid md:grid-cols-12 gap-4">
                      {/* LEFT: price, qty, status */}
                      <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="col-span-2 md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            Price (snapshot)
                          </label>
                          <Input3
                            type="number"
                            step="0.01"
                            value={it.priceSnapshot ?? ""}
                            onChange={(e) => {
                              const v =
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value);
                              form.setValue(
                                `items.${idx}.priceSnapshot` as any,
                                v,
                                { shouldDirty: true }
                              );
                            }}
                          />
                        </div>

                        <div className="col-span-1 md:col-span-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Quantity
                          </label>
                          <Input3
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) =>
                              form.setValue(
                                `items.${idx}.quantity` as any,
                                Number(e.target.value),
                                { shouldDirty: true }
                              )
                            }
                          />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Item status
                          </label>
                          <Select4
                            value={it.itemStatus}
                            onValueChange={(v) => {
                              form.setValue(
                                `items.${idx}.itemStatus` as any,
                                v as any,
                                { shouldDirty: true }
                              );
                              // Clear assignments if status becomes CANCELLED
                              if (v === "CANCELLED") {
                                form.setValue(
                                  `items.${idx}.assignments` as any,
                                  [],
                                  { shouldDirty: true }
                                );
                              }
                            }}
                          >
                            <SelectTrigger4>
                              <SelectValue4 />
                            </SelectTrigger4>
                            <SelectContent4>
                              {availableStages.map((s) => (
                                <SelectItem4 key={s} value={s}>
                                  {stageLabel(s)}
                                </SelectItem4>
                              ))}
                            </SelectContent4>
                          </Select4>
                        </div>
                      </div>

                      {/* RIGHT: description snapshot (taller textarea) */}
                      <div className="md:col-span-8">
                        <label className="text-xs font-medium text-muted-foreground">
                          Description (snapshot)
                        </label>
                        <Textarea
                          rows={6}
                          className="resize-y min-h-[140px]"
                          value={it.descriptionSnapshot ?? ""}
                          onChange={(e) =>
                            form.setValue(
                              `items.${idx}.descriptionSnapshot` as any,
                              e.target.value,
                              { shouldDirty: true }
                            )
                          }
                        />
                      </div>

                      {/* FULL WIDTH: text to print */}
                      <div className="md:col-span-12">
                        <label className="text-xs font-medium text-muted-foreground">
                          Text to print (per order item)
                        </label>
                        <Textarea
                          rows={7}
                          className="resize-y min-h-[160px]"
                          placeholder={`e.g.\nDimensiune: 90 mm / 250 mm\nCulori: Crem, auriu\n...\n— plus the exact invitation text —`}
                          value={(it as any).textToPrint ?? ""}
                          onChange={(e) =>
                            form.setValue(
                              `items.${idx}.textToPrint` as any,
                              e.target.value,
                              { shouldDirty: true }
                            )
                          }
                        />
                      </div>

                      {/* NEW: File paths */}
                      <div className="md:col-span-6">
                        <label className="text-xs font-medium text-muted-foreground">
                          Editable file path
                        </label>
                        <Input3
                          type="text"
                          placeholder="e.g. /files/editable/invitation_template.psd"
                          value={(it as any).editableFilePath ?? ""}
                          onChange={(e) =>
                            form.setValue(
                              `items.${idx}.editableFilePath` as any,
                              e.target.value,
                              { shouldDirty: true }
                            )
                          }
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="text-xs font-medium text-muted-foreground">
                          Printing file path
                        </label>
                        <Input3
                          type="text"
                          placeholder="e.g. /files/print-ready/invitation_final.pdf"
                          value={(it as any).printingFilePath ?? ""}
                          onChange={(e) =>
                            form.setValue(
                              `items.${idx}.printingFilePath` as any,
                              e.target.value,
                              { shouldDirty: true }
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* Per-Product Workflow Configuration (collapsible) */}
                    <div className="space-y-3 p-3 rounded-md border bg-background">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Workflow Configuration</div>
                          {itemDisabledStages.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Skipped: {itemDisabledStages.map(s => stageLabel(s)).join(", ")}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleWorkflowCollapse(idx)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Toggle workflow configuration"
                        >
                          {collapsedWorkflow.has(idx) ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {!collapsedWorkflow.has(idx) && (
                        <>
                          <div className="text-sm text-muted-foreground">
                            Select stages to skip for this product
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {STAGES.filter(s => s !== "TO_DO" && s !== "DONE" && s !== "CANCELLED" && s !== "STANDBY").map((stage) => {
                              const isDisabled = itemDisabledStages.includes(stage);
                              return (
                                <label key={stage} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isDisabled}
                                    onChange={(e) => {
                                      const currentDisabled = (it.disabledStages || []) as string[];
                                      const newDisabled = e.target.checked
                                        ? [...currentDisabled, stage]
                                        : currentDisabled.filter(s => s !== stage);
                                      
                                      form.setValue(
                                        `items.${idx}.disabledStages` as any,
                                        newDisabled,
                                        { shouldDirty: true }
                                      );
                                      
                                      // Remove assignments for disabled stage
                                      if (e.target.checked) {
                                        const currentAssignments = it.assignments || [];
                                        const updatedAssignments = currentAssignments.filter(a => a.stage !== stage);
                                        form.setValue(
                                          `items.${idx}.assignments` as any,
                                          updatedAssignments,
                                          { shouldDirty: true }
                                        );
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">Skip {stageLabel(stage)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* NEW: Image uploads (collapsible) */}
                    <div className="p-3 rounded-md border bg-background">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Images</div>
                        <button
                          type="button"
                          onClick={() => toggleImagesCollapse(idx)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Toggle images section"
                        >
                          {collapsedImages.has(idx) ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {!collapsedImages.has(idx) && (
                        <div className="mt-3 grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              Graphics Image (optional)
                            </label>
                            <div className="space-y-2">
                              <Input3
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || undefined;
                                  form.setValue(
                                    `items.${idx}.graphicsImage` as any,
                                    file,
                                    { shouldDirty: true }
                                  );
                                }}
                              />
                              {(it as any).graphicsImage && (
                                <div className="flex items-center justify-between text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                                  <span>Selected: {(it as any).graphicsImage.name || 'Graphics image'}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      form.setValue(
                                        `items.${idx}.graphicsImage` as any,
                                        undefined,
                                        { shouldDirty: true }
                                      );
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              Finished Product Image (optional)
                            </label>
                            <div className="space-y-2">
                              <Input3
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || undefined;
                                  form.setValue(
                                    `items.${idx}.finishedProductImage` as any,
                                    file,
                                    { shouldDirty: true }
                                  );
                                }}
                              />
                              {(it as any).finishedProductImage && (
                                <div className="flex items-center justify-between text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                                  <span>Selected: {(it as any).finishedProductImage.name || 'Finished product image'}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      form.setValue(
                                        `items.${idx}.finishedProductImage` as any,
                                        undefined,
                                        { shouldDirty: true }
                                      );
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* -------- NEW: Stage assignments grid (collapsible) -------- */}
                    {it.itemStatus !== "CANCELLED" && (
                      <div className="p-3 rounded-md border bg-background">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">Stage assignments</div>
                            {itemDisabledStages.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Skipped: {itemDisabledStages.map(s => stageLabel(s)).join(", ")}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleAssignmentsCollapse(idx)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Toggle stage assignments"
                          >
                            {collapsedAssignments.has(idx) ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {!collapsedAssignments.has(idx) && (
                          <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {availableStages
                              .filter((stage) => stage !== "CANCELLED" && stage !== "DONE" && stage !== "STANDBY")
                              .map((stage) => {
                                // ensure each stage exists in assignments
                                const assIdx = it.assignments.findIndex(
                                  (a) => a.stage === stage
                                );
                                const current =
                                  assIdx >= 0
                                    ? it.assignments[assIdx].assignedTo || ""
                                    : "";
                                const currentNotes =
                                  assIdx >= 0
                                    ? it.assignments[assIdx].stageNotes || ""
                                    : "";
                                if (assIdx < 0) {
                                  // lazily add default if missing - but with empty assignedTo
                                  const clone = [
                                    ...it.assignments,
                                    {
                                      stage,
                                      assignedTo: "", // Start with empty assignment
                                      stageNotes: "",
                                    },
                                  ];
                                  form.setValue(
                                    `items.${idx}.assignments` as any,
                                    clone,
                                    { shouldDirty: true }
                                  );
                                }
                                return (
                                  <div
                                    key={stage}
                                    className="border rounded p-2 space-y-2 text-sm"
                                  >
                                    <div className="space-y-1">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        {stageLabel(stage)}
                                      </span>
                                      <AssigneeSelect
                                        employees={employees}
                                        value={current}
                                        onChange={(uid) => {
                                          const next = [
                                            ...form.getValues(
                                              `items.${idx}.assignments` as any
                                            ),
                                          ];
                                          const i = next.findIndex(
                                            (a: any) => a.stage === stage
                                          );
                                          if (i >= 0)
                                            next[i] = {
                                              stage,
                                              assignedTo: uid,
                                              stageNotes: next[i].stageNotes || "",
                                            };
                                          else
                                            next.push({
                                              stage,
                                              assignedTo: uid,
                                              stageNotes: "",
                                            });
                                          form.setValue(
                                            `items.${idx}.assignments` as any,
                                            next,
                                            { shouldDirty: true }
                                          );
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <Input3
                                        className="text-xs"
                                        placeholder={`${
                                          stage === "PRINTING"
                                            ? "350gr mat paper"
                                            : stage === "CUTTING"
                                            ? "10x15cm"
                                            : stage === "FINISHING"
                                            ? "UV coating"
                                            : "Notes..."
                                        }`}
                                        value={currentNotes}
                                        onChange={(e) => {
                                          const next = [
                                            ...form.getValues(
                                              `items.${idx}.assignments` as any
                                            ),
                                          ];
                                          const i = next.findIndex(
                                            (a: any) => a.stage === stage
                                          );
                                          if (i >= 0)
                                            next[i] = {
                                              stage,
                                              assignedTo: next[i].assignedTo,
                                              stageNotes: e.target.value,
                                            };
                                          else
                                            next.push({
                                              stage,
                                              assignedTo: "", // Allow empty assignment
                                              stageNotes: e.target.value,
                                            });
                                          form.setValue(
                                            `items.${idx}.assignments` as any,
                                            next,
                                            { shouldDirty: true }
                                          );
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}

                    {it.itemStatus === "CANCELLED" && (
                      <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded border">
                        Item is cancelled - no stage assignments needed.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end">
            <Button3 type="submit" disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Saving…
                </span>
              ) : (
                "Save Order"
              )}
            </Button3>
          </div>
        </CardContent5>
      </Card5>
    </form>
  );
}

/* ==================== Create Client MODAL (shadcn) ==================== */
function CreateClientModal({ onCreated }: { onCreated: (clientId: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(values: ClientFormValues) {
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post("/api/clients", values);
      const clientId = res?.data?._id;
      if (clientId) {
        onCreated(clientId);
        setOpen(false);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create client.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button3 type="button" variant="outline" className="shrink-0">
          New client
        </Button3>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Client</DialogTitle>
        </DialogHeader>
        <ClientForm
          submitting={submitting}
          error={error || undefined}
          submitLabel="Create"
          cancelHref={undefined}
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Create Product MODAL (shadcn) ==================== */
function CreateProductModal({ onCreated }: { onCreated: (product: any) => void }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formKey, setFormKey] = React.useState(0);

  // Memoized stable props to prevent useEffect from constantly firing
  const stableTypeOptions = React.useMemo(() => [], []);
  const stableAllowCustomType = React.useMemo(() => true, []);

  // Reset error and form key when modal opens
  React.useEffect(() => {
    if (open) {
      setError(null);
      setFormKey(prev => prev + 1); // Force form re-render
    }
  }, [open]);

  async function handleSubmit(values: ProductFormValues) {
    try {
      setSubmitting(true);
      setError(null);
      const payload: any = {
        ...values,
        material: values.material || (values.materials && values.materials[0]) || undefined,
        materials: values.materials && values.materials.length ? values.materials : undefined,
      };
      const res = await api.post("/api/products", payload);
      const product = res?.data;
      if (product) {
        onCreated(product);
        setOpen(false);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button3 type="button" variant="outline" className="shrink-0">
          New product
        </Button3>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
        </DialogHeader>
        {open && (
          <ProductForm
            key={`create-product-${formKey}`}
            typeOptions={stableTypeOptions}
            allowCustomType={stableAllowCustomType}
            submitting={submitting}
            error={error || undefined}
            submitLabel="Create"
            cancelHref={undefined}
            onCancel={() => setOpen(false)}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Add Product MODAL ==================== */
function AddProductModal({ onPick }: { onPick: (p: any) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex justify-between">
        <DialogTrigger asChild>
          <Button3
            type="button"
            variant="secondary"
            className="inline-flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" /> Add product
          </Button3>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <ProductPicker
            onPick={(p) => {
              onPick(p);
              setOpen(false);
            }}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button3 type="button" variant="outline">
                Close
              </Button3>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Assignee Select (combobox) ==================== */
function AssigneeSelect({
  employees,
  value,
  onChange,
}: {
  employees: EmployeeLite[];
  value?: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = employees.find((e) => e._id === value);

  return (
    <div className="w-full">
      <Button3
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        {selected ? fullName(selected) : "Select employee (optional)…"}
      </Button3>

      {open && (
        <div className="relative">
          <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover p-0 shadow-md">
            <Command>
              <CommandInput placeholder="Search employee…" />
              <CommandList>
                <CommandEmpty>No employee found.</CommandEmpty>
                <CommandGroup>
                  {/* Add option to clear selection */}
                  <CommandItem
                    value="clear-selection"
                    onSelect={() => {
                      onChange(""); // Set to empty string
                      setOpen(false);
                    }}
                  >
                    <span className="text-muted-foreground italic">No assignment</span>
                  </CommandItem>
                  {employees.map((e) => {
                    // valoare UNICĂ pt. cmdk (id + nume, ca să fie și căutabilă)
                    const cmdValue = `${fullName(e)} ${e._id}`;
                    return (
                      <CommandItem
                        key={e._id}
                        value={cmdValue}
                        onSelect={() => {
                          onChange(e._id); // trimitem DOAR id-ul real
                          setOpen(false);
                        }}
                      >
                        {/* afișăm doar numele, ca înainte */}
                        {fullName(e)}
                        {/* mic suffix pt. diferențiere vizuală când există duplicate */}
                        <span className="ml-2 text-xs text-muted-foreground">
                          #{e._id.slice(-4)}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>
      )}
    </div>
  );
}
