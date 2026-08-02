"use client"
// components/core/FormFieldSelectShorthand.tsx
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

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = options.find(opt => opt.value === field.value);

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
              <SelectTrigger id={id} className="text-xs" aria-invalid={fieldState.invalid}>
                <SelectValue placeholder={placeholder}>
                  {selected ? selected.label : placeholder}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {options.map(opt => (
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