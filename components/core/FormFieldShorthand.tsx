// components/form-field.tsx
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface FormFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  description?: string;
}

export function FormFieldShorthand<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = "text",
  autoComplete = "off",
  description,
}: FormFieldProps<TFieldValues>) {
  const id = `form-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel className="text-xs" htmlFor={id}>{label}</FieldLabel>
          <Input
          className="text-xs"
            {...field}
            id={id}
            type={type}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
          {description && !fieldState.invalid && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}