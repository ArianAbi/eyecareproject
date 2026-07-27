export interface SidebarDataType {
  group_title: string        // shown only if items.length > 1, otherwise items[0].title is shown
  icon: LucideIcon            // lucide-react icon component
  items: {
    title:string,
    path:string
  }[]     // if length === 1 -> single link, if > 1 -> collapsible
}[]