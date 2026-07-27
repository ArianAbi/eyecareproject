"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BoxIcon, ChevronDown, type LucideIcon } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SidebarNavItem {
  title: string
  path: string
}

export interface SidebarNavGroup {
  group_title: string
  icon: LucideIcon
  items: SidebarNavItem[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data: SidebarNavGroup[]
  header?: React.ReactNode
}

export function CustomSidebar({ data, header, ...props }: AppSidebarProps) {
  return (
    <Sidebar dir="rtl" side="right" collapsible="icon" {...props}>
      {header && <SidebarHeader>{header}</SidebarHeader>}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.map((group, index) =>
                group.items.length > 1 ? (
                  <SidebarNavCollapsibleGroup key={group.group_title || index} group={group} />
                ) : (
                  <SidebarNavSingleItem key={group.items[0]?.path ?? index} group={group} />
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

// ---------------------------------------------------------------------------
// Single item (no sub-menu) — label falls back to the first item's title
// ---------------------------------------------------------------------------

function SidebarNavSingleItem({ group }: { group: SidebarNavGroup }) {
  const pathname = usePathname()
  const item = group.items[0]
  const Icon = group.icon
  const isActive = pathname === item.path

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} tooltip={item.title}
        render={
          <Link href={item.path}>
            <Icon />
            <span>{item.title}</span>
          </Link>
        }>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// ---------------------------------------------------------------------------
// Collapsible group — label is group_title, expands to a submenu
// ---------------------------------------------------------------------------

function SidebarNavCollapsibleGroup({ group }: { group: SidebarNavGroup }) {
  const pathname = usePathname()
  const Icon = group.icon
  const isGroupActive = group.items.some((item) => item.path === pathname)

  return (
    <Collapsible
      defaultOpen={isGroupActive}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton isActive={isGroupActive} tooltip={group.group_title}>
            <Icon />
            <span>{group.group_title}</span>
            <ChevronDown className="mr-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarMenuButton>
        }
      />
      <CollapsibleContent>
        <SidebarMenuSub>
          {group.items.map((item) => {
            const isActive = pathname === item.path
            return (
              <SidebarMenuSubItem key={item.path + item.title}>
                <SidebarMenuSubButton isActive={isActive}
                  render={
                    <Link href={item.path}>
                      <span>{item.title}</span>
                    </Link>
                  }>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

export const AdminSidebarData = [
  {
    group_title: "محصولات",
    icon: BoxIcon,
    items: [
      {
        title: "لیست محصولات",
        path: `/admin/products`
      },
      {
        title: "افزودن محصول",
        path: `/admin/products`
      }
    ]
  }
] 