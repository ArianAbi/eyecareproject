// components/core/UserSearchCombobox.tsx
"use client"

import { useEffect, useState } from "react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Loader2, XIcon } from "lucide-react"
import { ADMIN_SearchUserAction } from "@/lib/actions/admin.users.actions"
import { Label } from "../ui/label"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface UserOption {
  label: string // username, shown in input/list
  value: string // id, actually returned
}

export function AdminUserSearchFilter({
  initialValue,
  onSelect,
  paramKey,
  placeholder = "نام کاربر یا شماره...",
  disabled = false,
}: {
  initialValue?: string,
  value?: string | null // selected user's id
  onSelect?: (userId: string | null) => void,
  paramKey?: string,
  placeholder?: string
  disabled?: boolean
}) {
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(false)

  let parsedInitialValue: UserOption | null = null
  try {
    const value = JSON.parse(initialValue ?? "null")
    if (typeof value?.value === "string" && typeof value?.label === "string") parsedInitialValue = value
  } catch { /* Ignore malformed URLs. */ }

  const [selected, setSelected] = useState<UserOption>({
    label: parsedInitialValue ? parsedInitialValue.label ?? '' : '',
    value: parsedInitialValue ? parsedInitialValue.value ?? '' : '',
  })

  useEffect(() => {
    if (query.trim() === "") return
    let active = true

    const timeoutId = setTimeout(async () => {
      try {
        const result = await ADMIN_SearchUserAction(query)
        if (!active) return
        const mapped: UserOption[] = result.map((user) => ({
          label: user.username,
          value: user.id,
        }))
        setOptions(mapped)
      } catch {
        if (active) setOptions([])
      } finally {
        if (active) setLoading(false)
      }
    }, 400)

    return () => { active = false; clearTimeout(timeoutId) }
  }, [query])


  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const params = new URLSearchParams(searchParams.toString())
  for (const page of ["page", "pendingPage", "restPage"]) params.delete(page)

  function ClearParamKey() {
    setSelected({ label: '', value: '' })
    setQuery('')
    setOptions([])
    setLoading(false)
    onSelect?.(null)
    if (paramKey) {
      params.delete(paramKey)
      setSelected({
        label:'',
        value:''
      })
      router.push(`${pathname}?${params.toString()}`)
    }

  }

  return (
    <Combobox
      items={options}
      value={selected}
      autoHighlight
      onValueChange={(option: UserOption | null) => {

        setSelected(option ?? { label: '', value: '' })
        if (paramKey) {

          if (option) {
            params.set(paramKey, JSON.stringify(option))
          } else {
            params.delete(paramKey)
          }

          router.push(`${pathname}?${params.toString()}`)
        }

        if (onSelect) {
          onSelect(option ? option.value : null)
        }
      }}
      itemToStringValue={(option: UserOption) => option.label}
      disabled={disabled}
      filter={() => true}
    >
      <Label className="text-xs">
        <span>
          نام کاربری یا شماره
        </span>

        {selected.value &&

          <button type="button" disabled={disabled} aria-label="پاک کردن کاربر" onClick={ClearParamKey} className="border size-4 grid place-items-center hover:bg-white/20 rounded-full">
            <XIcon size={12} />
          </button>
        }
      </Label>

      <ComboboxInput
        placeholder={placeholder}
        className="text-xs"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setQuery(e.target.value)
          setLoading(e.target.value.trim() !== '')
          if (!e.target.value.trim()) setOptions([])
        }}
      />

      <ComboboxContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <>
            <ComboboxEmpty>
              {query.trim() === "" ? "برای جستجو تایپ کنید" : "کاربری یافت نشد"}
            </ComboboxEmpty>
            <ComboboxList>
              {(item: UserOption) => (
                <ComboboxItem key={item.value} value={item} className="text-xs">
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </>
        )}
      </ComboboxContent>
    </Combobox>
  )
}
