"use client"
// components/form-switch-field.tsx
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface FormSwitchFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function FormFieldSwitchShorthand<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  disabled = false,
}: FormSwitchFieldProps<TFieldValues>) {
  const id = `form-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          orientation="horizontal"
          className="flex flex-col items-center justify-between w-fit"
        >
          <div className="space-y-0.5 ">
            <FieldLabel className="text-xs" htmlFor={id}>
              {label}
            </FieldLabel>
            {description && !fieldState.invalid && (
              <FieldDescription className="text-muted-foreground text-sm">
                {description}
              </FieldDescription>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
          <Switch
            id={id}
            checked={field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
          />
        </Field>
      )}
    />
  );
}