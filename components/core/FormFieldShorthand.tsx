"use client"
// components/form-field.tsx
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface BaseFormFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

interface InputFieldProps<TFieldValues extends FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  as?: "input";
  type?: React.HTMLInputTypeAttribute;
}

interface TextareaFieldProps<TFieldValues extends FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  as: "textarea";
  rows?: number;
}

type FormFieldProps<TFieldValues extends FieldValues> =
  | InputFieldProps<TFieldValues>
  | TextareaFieldProps<TFieldValues>;

export function FormFieldShorthand<TFieldValues extends FieldValues>(
  props: FormFieldProps<TFieldValues>
) {
  const {
    name,
    control,
    label,
    placeholder,
    autoComplete = "off",
    description,
    disabled = false,
    className,
  } = props;

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

          {props.as === "textarea" ? (
            <Textarea
              className={className ?? "text-xs"}
              {...field}
              id={id}
              rows={props.rows}
              aria-invalid={fieldState.invalid}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
            />
          ) : (
            <Input
              className={className ?? "text-xs"}
              {...field}
              id={id}
              type={props.type ?? "text"}
              aria-invalid={fieldState.invalid}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
            />
          )}

          {description && !fieldState.invalid && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}