import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { cn } from "@/lib/utils"

const EMPTY_VALUE = "__dagon_empty__"

export function DagonSelect({
  value,
  onChange,
  placeholder = "Selecciona",
  options = [],
  disabled = false,
  className,
  triggerStyle,
  contentClassName,
  contentStyle,
}) {
  const normalizedValue = value === undefined || value === null || value === ""
    ? EMPTY_VALUE
    : String(value)

  return (
    <Select
      value={normalizedValue}
      onValueChange={(nextValue) => onChange?.(nextValue === EMPTY_VALUE ? "" : nextValue)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn("min-h-10 rounded-xl border px-3 text-sm font-semibold shadow-none", className)}
        style={triggerStyle}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn("z-[80] rounded-xl border shadow-2xl", contentClassName)}
        style={contentStyle}
      >
        <SelectItem value={EMPTY_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem
            key={String(option.value)}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { EMPTY_VALUE as DAGON_SELECT_EMPTY_VALUE }
