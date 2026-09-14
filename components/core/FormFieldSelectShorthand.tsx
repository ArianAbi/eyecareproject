"use client"
// components/core/FormFieldSelectShorthand.tsx
import { useRef } from "react";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface SelectOption {
  label: string;
  value: string;
}

interface FormFieldSelectShorthandProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  disabled?: boolean;
}

// finds the next focusable element in DOM/tab order after `current` and focuses it
function focusNextElement(current: HTMLElement) {
  const focusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.tabIndex !== -1 &&
      el.offsetParent !== null // excludes hidden elements
  );

  const index = focusable.indexOf(current);
  if (index > -1 && index + 1 < focusable.length) {
    focusable[index + 1].focus();
  }
}

export function FormFieldSelectShorthand<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder = "انتخاب کنید",
  description,
  disabled = false,
}: FormFieldSelectShorthandProps<TFieldValues>) {
  const id = `form-${name}`;
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = options.find((opt) => opt.value === field.value);

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs" htmlFor={id}>
              {label}
            </FieldLabel>

            <Select
              value={field.value ?? ""}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                ref={triggerRef}
                id={id}
                className="text-xs"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={placeholder}>
                  {selected ? selected.label : placeholder}
                </SelectValue>
              </SelectTrigger>

              <SelectContent
                onSelect={() => {
                  // prevent Radix's default: refocusing the trigger button
                  // e.preventDefault();

                  if (triggerRef.current) {
                    focusNextElement(triggerRef.current);
                  }
                }}
              >
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {description && !fieldState.invalid && (
              <FieldDescription className="text-muted-foreground text-sm">
                {description}
              </FieldDescription>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}