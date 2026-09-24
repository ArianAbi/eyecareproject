/** Count individual lenses: one for OD-only items, two for paired items. */
export function calculateOrderCount(items: readonly { odOnly: boolean }[]): number {
  return items.reduce((count, item) => count + (item.odOnly ? 1 : 2), 0);
}
