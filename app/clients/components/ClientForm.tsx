"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { Plus, Search, X } from "lucide-react";

export type CompanyOption = {
  _id: string;
  name: string;
  cui?: string;
  defaultFolderPath?: string;
  description?: string;
};

export type ClientFormValues = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  defaultFolderPath?: string;
  companies: string[]; // <- what we actually submit to backend
};

// For editing, you might want to pass preselected companies with names:
type ClientDefaultValues = Omit<ClientFormValues, "companies"> & {
  companies?: CompanyOption[]; // used to prefill chips
  companyIds?: string[]; // optional if you don't have names yet
};

type ClientFormProps = {
  defaultValues?: Partial<ClientDefaultValues>;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  cancelHref?: string;
  onCancel?: () => void;
  onSubmit: (values: ClientFormValues) => void | Promise<void>;
  className?: string;
};

function useDebouncedValue<T>(value: T, delay = 300) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
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
  const initialSelected: CompanyOption[] = defaultValues?.companies ?? []; // prefilled with names
  const initialIds = new Set(
    defaultValues?.companyIds ?? initialSelected.map((c) => c._id)
  );

  const [firstName, setFirstName] = React.useState(
    defaultValues?.firstName ?? ""
  );
  const [lastName, setLastName] = React.useState(defaultValues?.lastName ?? "");
  const [email, setEmail] = React.useState(defaultValues?.email ?? "");
  const [phone, setPhone] = React.useState(defaultValues?.phone ?? "");
  const [whatsapp, setWhatsapp] = React.useState(defaultValues?.whatsapp ?? "");
  const [defaultFolderPath, setDefaultFolderPath] = React.useState(
    defaultValues?.defaultFolderPath ?? ""
  );

  const [selectedCompanies, setSelectedCompanies] = React.useState<
    CompanyOption[]
  >(
    initialSelected.length
      ? initialSelected
      : (defaultValues?.companyIds ?? []).map((id) => ({ _id: id, name: "…" }))
  );
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleRemoveCompany = (id: string) =>
    setSelectedCompanies((prev) => prev.filter((c) => c._id !== id));

  const companyIds = React.useMemo(
    () => selectedCompanies.map((c) => c._id),
    [selectedCompanies]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setLocalError("First name and Last name are required.");
      return;
    }

    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      defaultFolderPath: defaultFolderPath.trim() || undefined,
      companies: companyIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Names */}
        <div>
          <Label htmlFor="firstName" className="mb-1 block">
            First name *
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={submitting}
            autoFocus
            placeholder="John"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="mb-1 block">
            Last name *
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={submitting}
            placeholder="Doe"
          />
        </div>

        {/* Contact */}
        <div>
          <Label htmlFor="email" className="mb-1 block">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            placeholder="john.doe@example.com"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="mb-1 block">
            Phone
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            placeholder="+40 7xx xxx xxx"
          />
        </div>

        <div>
          <Label htmlFor="whatsapp" className="mb-1 block">
            WhatsApp
          </Label>
          <Input
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            disabled={submitting}
            placeholder="+40 7xx xxx xxx"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="defaultFolderPath" className="mb-1 block">
            Personal folder path
          </Label>
          <Input
            id="defaultFolderPath"
            value={defaultFolderPath}
            onChange={(e) => setDefaultFolderPath(e.target.value)}
            disabled={submitting}
            placeholder="\\\\server\\clients\\john-doe"
          />
        </div>

        {/* Companies (multi-select + create) */}
        <div className="md:col-span-2 space-y-2">
          <Label className="block">Companies</Label>
          <CompanyMultiSelect
            value={selectedCompanies}
            onChange={setSelectedCompanies}
            disabled={submitting}
          />

          {!!selectedCompanies.length && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedCompanies.map((c) => (
                <Badge
                  key={c._id}
                  className="bg-gray-800 text-gray-100 hover:bg-gray-700 pr-1"
                >
                  <span className="mr-1">{c.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${c.name}`}
                    onClick={() => handleRemoveCompany(c._id)}
                    className="inline-flex items-center"
                    disabled={submitting}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {(localError || error) && (
        <p className="text-sm text-red-500">{localError || error}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
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
  );
}

/* ---------------------------
   CompanyMultiSelect
---------------------------- */

type CompanyMultiSelectProps = {
  value: CompanyOption[];
  onChange: (v: CompanyOption[]) => void;
  disabled?: boolean;
};

function CompanyMultiSelect({
  value,
  onChange,
  disabled,
}: CompanyMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 300);

  const [options, setOptions] = React.useState<CompanyOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  // Fetch companies
  React.useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      try {
        // Adjust params to your listCompanies validator (page/limit/sort/search)
        const res = await api.get("/api/companies", {
          params: { page: 1, limit: 10, search: debounced || undefined },
        });
        // Expecting { data: CompanyOption[], ... } or { items: CompanyOption[] }
        const list: CompanyOption[] =
          res.data?.items ?? res.data?.data ?? res.data ?? [];
        if (!ignore) setOptions(list);
      } catch (e) {
        if (!ignore) setOptions([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [debounced]);

  const selectedIds = React.useMemo(
    () => new Set(value.map((v) => v._id)),
    [value]
  );

  const toggleSelect = (opt: CompanyOption) => {
    if (selectedIds.has(opt._id)) {
      onChange(value.filter((v) => v._id !== opt._id));
    } else {
      onChange([...value, opt]);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full justify-start"
            >
              <Search className="mr-2 h-4 w-4" />
              {value.length ? `Selected: ${value.length}` : "Select companies"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[420px]" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search companies…"
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                {loading ? (
                  <CommandEmpty>Searching…</CommandEmpty>
                ) : (
                  <>
                    <CommandEmpty>No companies found.</CommandEmpty>
                    <CommandGroup heading={debounced ? `Results` : "Recent"}>
                      {options.map((opt) => (
                        <CommandItem
                          key={opt._id}
                          value={opt._id}
                          onSelect={() => toggleSelect(opt)}
                          className="flex items-center justify-between"
                        >
                          <span>{opt.name}</span>
                          {selectedIds.has(opt._id) && (
  <Badge className="bg-gray-800 text-gray-100 hover:bg-gray-700">Selected</Badge>
)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setCreateOpen(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          New company
        </Button>
      </div>

      <CreateCompanyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(created) => {
          onChange([...value, created]);
        }}
      />
    </>
  );
}

/* ---------------------------
   CreateCompanyDialog
---------------------------- */

type CreateCompanyDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (company: CompanyOption) => void;
};

function CreateCompanyDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCompanyDialogProps) {
  const [name, setName] = React.useState("");
  const [cui, setCui] = React.useState("");
  const [defaultFolderPath, setDefaultFolderPath] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setName("");
    setCui("");
    setDefaultFolderPath("");
    setDescription("");
    setError(null);
  };

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/api/companies", {
        name: name.trim(),
        cui: cui.trim() || undefined,
        defaultFolderPath: defaultFolderPath.trim() || undefined,
        description: description.trim() || undefined,
      });
      const created: CompanyOption = res.data?.data ?? res.data;
      if (!created?._id) throw new Error("Invalid response from server.");
      onCreated(created);
      onOpenChange(false);
      reset();
    } catch (e: any) {
      setError(
        e?.response?.data?.error || e?.message || "Failed to create company."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New company</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="c-name" className="mb-1 block">
              Name *
            </Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pixeda SRL"
            />
          </div>
          <div>
            <Label htmlFor="c-cui" className="mb-1 block">
              CUI
            </Label>
            <Input
              id="c-cui"
              value={cui}
              onChange={(e) => setCui(e.target.value)}
              placeholder="RO12345678"
            />
          </div>
          <div>
            <Label htmlFor="c-folder" className="mb-1 block">
              Default folder path
            </Label>
            <Input
              id="c-folder"
              value={defaultFolderPath}
              onChange={(e) => setDefaultFolderPath(e.target.value)}
              placeholder="\\server\\companies\\pixeda"
            />
          </div>
          <div>
            <Label htmlFor="c-desc" className="mb-1 block">
              Description
            </Label>
            <Input
              id="c-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this company…"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
