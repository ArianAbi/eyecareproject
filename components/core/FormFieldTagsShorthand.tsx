// @/components/core/FormFieldTagsSelect.tsx
"use client"

import { X } from "lucide-react"
import { Control, Controller, FieldValues, Path } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { colorOptionsType, colorSelectMap } from "./FormFieldColorSelectShorthand"

type Option = {
    label: string
    value: string
    color?: string
}

interface FormFieldTagsSelectProps<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>
    control: Control<TFieldValues>
    label: string
    options: Option[]
    placeholder?: string
    description?: string
    disabled?: boolean
    className?: string
}

export function FormFieldTagsShorthand<TFieldValues extends FieldValues>({
    name,
    control,
    label,
    options,
    placeholder = "افزودن تگ",
    description,
    disabled = false,
    className,
}: FormFieldTagsSelectProps<TFieldValues>) {
    const id = `form-${name}`

    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => {
                const selected: string[] = field.value ?? []
                const remaining = options.filter((o) => !selected.includes(o.value))

                const add = (value: string | null) => {
                    if (!value) return
                    if (!selected.includes(value)) {
                        field.onChange([...selected, value])
                    }
                }

                const remove = (value: string) => {
                    field.onChange(selected.filter((v) => v !== value))
                }

                return (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="text-xs" htmlFor={id}>
                            {label}
                        </FieldLabel>

                        <Select
                            // reset the select's internal value after each pick so the same
                            // item can be re-selected later without needing to change first
                            value=""
                            onValueChange={add}
                            disabled={disabled || remaining.length === 0}
                        >
                            <SelectTrigger
                                id={id}
                                aria-invalid={fieldState.invalid}
                                className={cn("w-full", className ?? "text-xs")}
                            >
                                <SelectValue
                                    placeholder={
                                        remaining.length === 0 && options.length > 0
                                            ? "همه تگ‌ها اضافه شدند"
                                            : placeholder
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {remaining.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                        className="text-xs"
                                    >
                                       {opt.color && <div className={cn("size-4 rounded-full",colorSelectMap[opt.color as colorOptionsType['value']])}></div>}
                                        <div>
                                            {opt.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selected.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {selected.map((value) => {
                                    const opt = options.find((o) => o.value === value)
                                    if (!opt) return null
                                    return (
                                        <Badge
                                            key={value}
                                            variant="secondary"
                                            className={cn("gap-1 font-normal",opt.color ? colorSelectMap[opt.color as colorOptionsType["value"]] : '')}
                                        >
                                            {opt.label}
                                            <button
                                                type="button"
                                                onClick={() => remove(value)}
                                                disabled={disabled}
                                                className="cursor-pointer rounded-full hover:bg-muted-foreground/20 disabled:pointer-events-none"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </Badge>
                                    )
                                })}
                            </div>
                        )}

                        {description && !fieldState.invalid && (
                            <p className="text-muted-foreground text-sm">{description}</p>
                        )}
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )
            }}
        />
    )
}