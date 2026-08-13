"use client"

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

// ...props interface unchanged...

export function FormFieldComboboxShorthand<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder = "انتخاب کنید",
  emptyText = "موردی یافت نشد",
  description,
  disabled = false,
  ltr = false
}: FormFieldComboboxShorthandProps<TFieldValues>) {
  const id = `form-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        // find the full option object matching the stored id
        const selected = options.find((o) => o.value === field.value) ?? null;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-xs" htmlFor={id}>
              {label}
            </FieldLabel>

            <Combobox
              items={options}
              value={selected}
              onValueChange={(option: ComboboxOption | null) =>
                field.onChange(option?.value ?? "")
              }
              itemToStringValue={(option: ComboboxOption) => option.label}
              disabled={disabled}
            >
              <ComboboxInput
                id={id}
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                onBlur={field.onBlur}
                style={ltr ? { direction: "ltr" } : {}}
                className="text-xs"
              />
              <ComboboxContent>
                <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                <ComboboxList>
                  {(item: ComboboxOption) => (
                    <ComboboxItem
                      key={item.value}
                      value={item}
                      className="text-xs"
                      style={ltr ? { direction: "ltr" } : {}}
                    >
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
        );
      }}
    />
  );
}