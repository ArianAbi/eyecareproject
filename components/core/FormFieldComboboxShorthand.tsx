"use client"

import { useRef } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";

interface ComboboxOption {
  label: string;
  value: string;
}

interface FormFieldComboboxShorthandProps<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  options: ComboboxOption[];
  placeholder?: string;
  emptyText?: string;
  description?: string;
  emptySnapValue?: string,
  disabled?: boolean;
  ltr?: boolean;
  filter?: (option: ComboboxOption, query: string) => boolean;
}

function getNextFocusableElement(current: HTMLElement): HTMLElement | null {
  const focusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.tabIndex !== -1 &&
      el.offsetParent !== null
  );

  const index = focusable.indexOf(current);
  if (index > -1 && index + 1 < focusable.length) {
    return focusable[index + 1];
  }
  return null;
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
  ltr = false,
  filter
}: FormFieldComboboxShorthandProps<TFieldValues>) {
  const id = `form-${name}`;
  const inputRef = useRef<HTMLInputElement>(null);
  // tracks whether a value was actually committed on this close
  // (vs. Escape/click-outside), so we only redirect focus on real selection
  const justSelectedRef = useRef(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = options.find((o) => o.value === field.value) ?? null;

        return (
          <Field data-invalid={fieldState.invalid}>
            {label && <FieldLabel className="text-xs" htmlFor={id}>
              {label}
            </FieldLabel>}

            <Combobox
              items={options}
              value={selected}
              onValueChange={(option: ComboboxOption | null) => {
                if (option) {
                  justSelectedRef.current = true;
                  field.onChange(option.value);
                }
              }}
              onOpenChange={(open: boolean) => {
                if (!open && justSelectedRef.current) {
                  justSelectedRef.current = false;

                  // wait a tick so Base UI's own internal focus-return
                  // (input) happens first, then override it
                  requestAnimationFrame(() => {
                    if (inputRef.current) {
                      const next = getNextFocusableElement(inputRef.current);
                      next?.focus();
                    }
                  });
                }
              }}
              itemToStringValue={(option: ComboboxOption) => option.label}
              disabled={disabled}
              filter={filter}
              autoHighlight
            >
              <ComboboxInput
                ref={inputRef}
                id={id}
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                onBlur={field.onBlur}
                onFocus={(e) => e.currentTarget.select()}
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
            {fieldState.invalid && fieldState.error && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        );
      }}
    />
  );
}