"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BanknoteArrowUp, BoxIcon, ChevronDown, Clock, CreditCardPlus, Globe, Hammer, LayoutDashboard, LayoutList, List, PieChartIcon, ReceiptIcon, TicketIcon, User, UserIcon, type LucideIcon } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { SidebarDataType } from "@/types/sidebar-data"
import { useApprovalCount, useOrderCount } from "@/app/admin/AdminProviders"
import { toast } from "../ui/toast"

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
  items: SidebarNavItem[],
  badgeFn?: SidebarDataType['menus'][0]['badgeFn']
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data: SidebarDataType
  header?: React.ReactNode
  footer?: boolean,
  admin: boolean
}

export function CustomSidebar({ data, admin = false, header, footer = false, ...props }: AppSidebarProps) {
  return (
    <Sidebar dir="rtl" side="right" collapsible="icon" {...props}>
      {header && <SidebarHeader>{header}</SidebarHeader>}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.menus.map((group, index) =>
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

      {data.footer && footer && admin && <SidebarFooter>
        <SidebarFooterItem key={data.footer.path}
          title={data.footer.title}
          icon={data.footer.icon}
          path={data.footer.path}
        />
      </SidebarFooter>}
    </Sidebar >
  )
}

// ---------------------------------------------------------------------------
// Single item (no sub-menu) — label falls back to the first item's title
// ---------------------------------------------------------------------------

function SidebarBadge({ badgeFn }: { badgeFn?: () => number | null }) {
  if (!badgeFn) return

  const count = badgeFn()

  if (!count) return

  if (count <= 0) return

  return <div className="grid place-items-center min-w-4 h-4 px-1 text-xs text-white rounded-full bg-red-500 z-50 absolute right-0.5 top-0">
    {count}
  </div>
}

function SidebarNavSingleItem({ group }: { group: SidebarNavGroup }) {
  const pathname = usePathname()
  const item = group.items[0]
  const Icon = group.icon
  const isActive = pathname === item.path

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} tooltip={item.title}
        render={
          <Link href={item.path} className="relative overflow-visible">
            <SidebarBadge badgeFn={group.badgeFn} />

            <Icon />
            <span>{item.title}</span>
          </Link>
        }>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarFooterItem({ title, icon, path }: { title: string, icon: LucideIcon, path: string }) {
  const pathname = usePathname()
  const Icon = icon
  const isActive = pathname === path

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} tooltip={title}
        render={
          <Link href={path} className="relative">
            <Icon />
            <span>{title}</span>
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
  const [open, setOpen] = React.useState(isGroupActive)

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton isActive={isGroupActive} tooltip={group.group_title} className="relative overflow-visible">
            <SidebarBadge badgeFn={group.badgeFn} />

            <Icon />
            <span>{group.group_title}</span>
            <ChevronDown className="mr-auto transition-transform -rotate-90 " />
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


export const AdminSidebarData: SidebarDataType = {
  menus: [
    {
      group_title: "داشبورد",
      icon: LayoutDashboard,
      items: [
        {
          title: "داشبورد",
          path: `/admin/`
        }
      ]
    },
    { group_title: "گزارش مالی", icon: BanknoteArrowUp, items: [{ title: "گزارش مالی", path: "/admin/financial" }] },
    { group_title: "آمار ورودی سایت", icon: PieChartIcon, items: [{ title: "آمار ورودی سایت", path: "/admin/analytics" }] },
    { group_title: "تیکت‌ها", icon: TicketIcon, items: [{ title: "تیکت‌ها", path: "/admin/tickets" }] },
    { group_title: "گزارش فعالیت‌ها", icon: List, items: [{ title: "گزارش فعالیت‌ها", path: "/admin/logs" }] },
    {
      group_title: "مدیریت کاربران",
      icon: User,
      badgeFn: useApprovalCount,
      items: [
        {
          title: "مدیریت کاربران",
          path: `/admin/users`
        }
      ]
    },
    {
      group_title: "سفارش ها",
      icon: Clock,
      items: [
        {
          title: "سفارش ها",
          path: `/admin/orders`
        }
      ],
      badgeFn: useOrderCount
    },
    {
      group_title: "دسته بندی ها",
      icon: LayoutList,
      items: [
        {
          title: "دسته بندی کلی",
          path: `/admin/master-category`
        },
        {
          title: "دسته بندی محصولات",
          path: `/admin/product-category`
        }
      ]
    },
    {
      group_title: "محصولات",
      icon: BoxIcon,
      items: [
        {
          title: "لیست محصولات",
          path: `/admin/products`
        },
        {
          title: "تگ ها",
          path: `/admin/products/tags`
        }
      ]
    },
    {
      group_title: "صورتحساب ها",
      icon: BanknoteArrowUp,
      items: [
        {
          title: "صورتحساب ها",
          path: `/admin/invoices`
        }
      ]
    }
  ],
  footer: {
    title: "صفحه اصلی",
    icon: Globe,
    path: "/"
  }
}

export const UserSidebarData: SidebarDataType = {
  menus: [
    { group_title: "خانه", icon: Globe, items: [{ title: "خانه", path: "/" }] },
    { group_title: "پروفایل", icon: UserIcon, items: [{ title: "پروفایل", path: "/profile" }] },
    {
      group_title: "سفارش عدسی",
      icon: ReceiptIcon,
      items: [
        {
          title: "سفارش عدسی",
          path: `/glasslens-order`
        }
      ]
    },
    { group_title: "پشتیبانی", icon: ReceiptIcon, items: [{ title: "پشتیبانی و تیکت‌ها", path: "/tickets" }] },
    {
      group_title: "سفارش ها",
      icon: List,
      items: [
        {
          title: "سفارش ها",
          path: `/orders`
        }
      ]
    },
    {
      group_title: "افزایش موجودی",
      icon: CreditCardPlus,
      items: [
        {
          title: "افزایش موجودی",
          path: `/invoices?addCreditOpen=true`
        }
      ]
    },
    {
      group_title: "صورتحساب ها",
      icon: BanknoteArrowUp,
      items: [
        {
          title: "صورتحساب ها",
          path: `/invoices`
        }
      ]
    }
  ],
  footer: {
    title: "مدیریت",
    icon: Hammer,
    path: `/admin`
  }
}
