// lib/lens-filter.ts

interface LensOption {
  label: string;
  value: string;
}

function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}
export function lensFilter(option: LensOption, query: string): boolean {
  const trimmed = query.trim();
  const sign = trimmed.startsWith("-") ? "-" : trimmed.startsWith("+") ? "+" : null;
  if (sign) {
    const optionSign = option.value.startsWith("-") ? "-" : option.value.startsWith("+") ? "+" : null;
    if (sign !== optionSign) return false;
  }

  const q = digitsOnly(trimmed);
  if (!q) return true;

  return digitsOnly(option.value).startsWith(q);
}