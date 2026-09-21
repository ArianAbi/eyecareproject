export interface SidebarDataType {
  menus: {
    group_title: string        // shown only if items.length > 1, otherwise items[0].title is shown
    icon: LucideIcon            // lucide-react icon component
    items: {
      title: string,
      path: string
      badgeFn?: () => number | null
    }[]     // if length === 1 -> single link, if > 1 -> collapsible
    badgeFn?: () => number | null
  }[],
  footer?: {
    title: string
    icon: LucideIcon
    path: string
  }
}
