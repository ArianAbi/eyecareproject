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
import { Dispatch, SetStateAction } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface SelectOption {
    label: string;
    value: string;
}

interface FormFieldSelectShorthandProps<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    control: Control<TFieldValues>;
    label: string;
    placeholder?: string;
    description?: string;
    disabled?: boolean;
}


const colorOptions = [
    { label: "Gray", value: "gray" },
    { label: "Red", value: "red" },
    { label: "Emerald", value: "emerald" },
    { label: "Cyan", value: "cyan" },
    { label: "Blue", value: "blue" },
    { label: "Purple", value: "purple" },
    { label: "Amber", value: "amber" },
    { label: "Taupe", value: "taupe" },
    { label: "Transparent", value: "transparent" },
] as const

export type colorOptionsType = typeof colorOptions[number]

export const colorSelectMap = {
    gray: "bg-gray-500",
    red: "bg-red-500",
    emerald: "bg-emerald-500",
    cyan: "bg-cyan-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    taupe:"bg-taupe-500",
    amber: "bg-amber-500",
    transparent: "bg-transparent"
} as const

export function FormFieldColorSelectShorthand<TFieldValues extends FieldValues>({
    name,
    control,
    label,
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
                const selected = colorOptions.find(opt => opt.value === field.value);

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
                                {colorOptions.map(opt => (
                                    <SelectItem
                                        value={opt.value}
                                        className={`flex px-2 justify-between w-full`}
                                        key={opt.value}
                                    >
                                        <div className={`rounded-full size-4 ${colorSelectMap[opt.value]}`}></div>

                                        <span>{opt.label}</span>
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

export function ColorSelect(
    {
        value,
        onChange,
        defaultValue="gray",
        disabled=false
    }: {
        value: string,
        onChange: (e:string | null)=>void,
        defaultValue?:string
        disabled?:boolean
    }
) {

    return <Select
        value={value}
        onValueChange={(e=>onChange(e))}
        defaultValue={defaultValue}
        disabled={disabled}
    >
        <SelectTrigger className="text-xs">
            <SelectValue placeholder={"انتخاب رنگ"}>
                {value ? value : "انتخاب رنگ"}
            </SelectValue>
        </SelectTrigger>
        <SelectContent>
            {colorOptions.map(opt => (
                <SelectItem
                    value={opt.value}
                    className={`flex px-2 justify-between w-full`}
                    key={opt.value}
                >
                    <div className={`rounded-full size-4 ${colorSelectMap[opt.value]}`}></div>

                    <span>{opt.label}</span>
                </SelectItem>
            ))}
        </SelectContent>
    </Select>

}