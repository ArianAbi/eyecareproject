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

  const parsedInitialValue = initialValue ? JSON.parse(initialValue) : null

  const [selected, setSelected] = useState<UserOption>({
    label: parsedInitialValue ? parsedInitialValue.label ?? '' : '',
    value: parsedInitialValue ? parsedInitialValue.value ?? '' : '',
  })

  useEffect(() => {
    if (query.trim() === "") {
      setOptions([])
      return
    }

    setLoading(true)

    const timeoutId = setTimeout(async () => {
      try {
        const result = await ADMIN_SearchUserAction(query)
        const mapped: UserOption[] = result.map((user) => ({
          label: user.username,
          value: user.id,
        }))
        setOptions(mapped)
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [query])


  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const params = new URLSearchParams(searchParams.toString())

  function ClearParamKey() {
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

        if (paramKey && option) {

          if (option) {
            params.set(paramKey, JSON.stringify(option))
          } else {
            params.delete(paramKey)
          }

          setSelected(option)

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

          <button onClick={ClearParamKey} className="border size-4 grid place-items-center hover:bg-white/20 rounded-full">
            <XIcon size={12} />
          </button>
        }
      </Label>

      <ComboboxInput
        placeholder={placeholder}
        className="text-xs"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
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