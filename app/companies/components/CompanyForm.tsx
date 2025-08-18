"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type CompanyFormValues = {
  name: string;
  cui?: string;
  defaultFolderPath?: string;
  description?: string;
};

type CompanyFormProps = {
  defaultValues?: Partial<CompanyFormValues>;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  cancelHref?: string;
  onCancel?: () => void;
  onSubmit: (values: CompanyFormValues) => void | Promise<void>;
  className?: string;
};

export default function CompanyForm({
  defaultValues,
  submitting = false,
  error,
  submitLabel = "Save Company",
  cancelHref = "/companies",
  onCancel,
  onSubmit,
  className,
}: CompanyFormProps) {
  const [name, setName] = React.useState(defaultValues?.name ?? "");
  const [cui, setCui] = React.useState(defaultValues?.cui ?? "");
  const [defaultFolderPath, setDefaultFolderPath] = React.useState(
    defaultValues?.defaultFolderPath ?? ""
  );
  const [description, setDescription] = React.useState(
    defaultValues?.description ?? ""
  );
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError("Company name is required.");
      return;
    }

    await onSubmit({
      name: name.trim(),
      cui: cui.trim() || undefined,
      defaultFolderPath: defaultFolderPath.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="md:col-span-2">
          <Label htmlFor="name" className="mb-1 block">
            Company Name *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
            autoFocus
            placeholder="Pixeda SRL"
          />
        </div>

        {/* CUI */}
        <div>
          <Label htmlFor="cui" className="mb-1 block">
            CUI
          </Label>
          <Input
            id="cui"
            value={cui}
            onChange={(e) => setCui(e.target.value)}
            disabled={submitting}
            placeholder="RO12345678"
          />
        </div>

        {/* Default Folder Path */}
        <div>
          <Label htmlFor="defaultFolderPath" className="mb-1 block">
            Default Folder Path
          </Label>
          <Input
            id="defaultFolderPath"
            value={defaultFolderPath}
            onChange={(e) => setDefaultFolderPath(e.target.value)}
            disabled={submitting}
            placeholder="\\\\server\\companies\\pixeda"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description" className="mb-1 block">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            placeholder="Brief description of the company..."
            rows={3}
          />
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
