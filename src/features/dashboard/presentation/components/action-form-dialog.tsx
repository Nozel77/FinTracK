"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

type ActionFormFieldType =
  | "text"
  | "number"
  | "date"
  | "email"
  | "textarea"
  | "select";

type ActionFormFieldOption = {
  label: string;
  value: string;
};

export type ActionFormDialogField = {
  name: string;
  label: string;
  type?: ActionFormFieldType;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  description?: string;
  options?: ActionFormFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  formatThousands?: boolean;
};

export type ActionFormValues = Record<string, string>;

type ActionFormDialogProps = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  title: string;
  description?: string;
  fields: ActionFormDialogField[];
  submitLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  closeOnSubmit?: boolean;
  errorMessage?: string;
  onSubmitAction: (values: ActionFormValues) => Promise<void> | void;
};

export function ActionFormDialog({
  open,
  onOpenChangeAction,
  title,
  description,
  fields,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  busy = false,
  closeOnSubmit = true,
  errorMessage,
  onSubmitAction,
}: ActionFormDialogProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formattedValues, setFormattedValues] = useState<
    Record<string, string>
  >({});

  const handleFormattedInputChange = (fieldName: string, rawValue: string) => {
    setFormattedValues((previous) => ({
      ...previous,
      [fieldName]: formatThousands(rawValue),
    }));
  };

  const validateValues = (values: ActionFormValues) => {
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      const currentValue = (values[field.name] ?? "").trim();
      if (field.required && !currentValue) {
        nextErrors[field.name] = `${field.label} wajib diisi.`;
      }
    }

    return nextErrors;
  };

  const toValues = (form: HTMLFormElement): ActionFormValues => {
    const formData = new FormData(form);

    return fields.reduce<ActionFormValues>((acc, field) => {
      const rawValue = formData.get(field.name);
      const asString = typeof rawValue === "string" ? rawValue : "";

      if (field.formatThousands) {
        const currentFormatted = formattedValues[field.name] ?? asString;
        acc[field.name] = normalizeThousandsInput(currentFormatted);
        return acc;
      }

      acc[field.name] = asString;
      return acc;
    }, {});
  };

  const onSubmitFormAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const values = toValues(form);

    const nextErrors = validateValues(values);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await onSubmitAction(values);
      if (closeOnSubmit) onOpenChangeAction(false);
    } catch {
      // Parent screen controls global message/error feedback.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChangeAction={(nextOpen) => !busy && onOpenChangeAction(nextOpen)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <form onSubmit={onSubmitFormAction} className="space-y-3">
          {fields.map((field) => {
            const fieldId = `action-form-${field.name}`;
            const fieldError = fieldErrors[field.name];
            const useThousandsFormat =
              field.formatThousands &&
              (field.type === undefined ||
                field.type === "text" ||
                field.type === "number");

            return (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={fieldId}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>

                {field.type === "textarea" ? (
                  <textarea
                    id={fieldId}
                    name={field.name}
                    defaultValue=""
                    placeholder={field.placeholder ?? field.defaultValue}
                    disabled={busy}
                    className={cn(
                      "min-h-24 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={fieldId}
                    name={field.name}
                    defaultValue=""
                    disabled={busy}
                    className={cn(
                      "flex h-10 w-full cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:border-primary",
                    )}
                  >
                    <option value="">
                      {field.placeholder ??
                        field.defaultValue ??
                        `Pilih ${field.label}`}
                    </option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : useThousandsFormat ? (
                  <Input
                    id={fieldId}
                    name={field.name}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    pattern="[0-9.]*"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={formattedValues[field.name] ?? ""}
                    placeholder={field.placeholder ?? field.defaultValue}
                    disabled={busy}
                    onChange={(event) =>
                      handleFormattedInputChange(field.name, event.target.value)
                    }
                  />
                ) : (
                  <Input
                    id={fieldId}
                    name={field.name}
                    type={field.type ?? "text"}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    defaultValue=""
                    placeholder={field.placeholder ?? field.defaultValue}
                    disabled={busy}
                  />
                )}

                {field.description ? (
                  <p className="text-xs text-muted">{field.description}</p>
                ) : null}
                {fieldError ? (
                  <p className="text-xs text-red-400">{fieldError}</p>
                ) : null}
              </div>
            );
          })}

          {errorMessage ? (
            <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChangeAction(false)}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Memproses..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function normalizeThousandsInput(value: string): string {
  return value.replace(/\./g, "").replace(/\D/g, "").trim();
}

function formatThousands(value: string): string {
  const digitsOnly = normalizeThousandsInput(value);
  if (!digitsOnly) return "";
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
