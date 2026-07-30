"use client"
// components/core/FormFieldComboboxShorthand.tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface ComboboxOption {
  label: string;
  value: string;
}

interface FormFieldComboboxShorthandProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  options: ComboboxOption[];
  placeholder?: string;
  emptyText?: string;
  description?: string;
  disabled?: boolean;
}

export function FormFieldComboboxShorthand<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder = "انتخاب کنید",
  emptyText = "موردی یافت نشد",
  description,
  disabled = false,
}: FormFieldComboboxShorthandProps<TFieldValues>) {
  const id = `form-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel className="text-xs" htmlFor={id}>
            {label}
          </FieldLabel>

          <Combobox
            items={options}
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <ComboboxInput
              id={id}
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
              onBlur={field.onBlur}
              className="text-xs"
            />
            <ComboboxContent>
              <ComboboxEmpty>{emptyText}</ComboboxEmpty>
              <ComboboxList>
                {(item: ComboboxOption) => (
                  <ComboboxItem key={item.value} value={item.value} className="text-xs">
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {description && !fieldState.invalid && (
            <FieldDescription className="text-muted-foreground text-sm">
              {description}
            </FieldDescription>
          )}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}