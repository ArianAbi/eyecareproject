"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BanknoteArrowUp,
  BoxIcon,
  BookOpen,
  ChevronDown,
  Eye,
  Clock,
  BadgePercent,
  Globe,
  Hammer,
  Settings,
  LayoutDashboard,
  LayoutList,
  List,
  PieChartIcon,
  ReceiptIcon,
  TicketIcon,
  User,
  UserIcon,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarDataType } from "@/types/sidebar-data";
import styles from "./CustomSidebar.module.css";
import {
  useApprovalCount,
  useCreditInvoiceCount,
  useOpenTicketCount,
  useOrderCount,
} from "@/app/admin/AdminProviders";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SidebarNavItem {
  title: string;
  path: string;
}

export interface SidebarNavGroup {
  group_title: string;
  icon: LucideIcon;
  items: SidebarNavItem[];
  badgeFn?: SidebarDataType["menus"][0]["badgeFn"];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  menu: "admin" | "user";
  header?: React.ReactNode;
  footer?: boolean;
  admin: boolean;
}

export function CustomSidebar({
  menu,
  admin = false,
  header,
  footer = false,
  ...props
}: AppSidebarProps) {
  const data = menu === "admin" ? AdminSidebarData : UserSidebarData;
  const pathname = usePathname();
  const sections = [...data.menus].sort((a, b) => a.order - b.order).reduce<{ title: string; menus: SidebarDataType["menus"] }[]>((result, group) => {
    const section = result.find((entry) => entry.title === group.section);
    if (section) section.menus.push(group);
    else result.push({ title: group.section, menus: [group] });
    return result;
  }, []);
  return (
    <Sidebar dir="rtl" side="right" collapsible="icon" {...props}>
      <SidebarHeader className={styles.header}>
        <Link
          href={menu === "admin" ? "/admin" : "/"}
          className={styles.brand}
          aria-label="ICN"
        >
          <span className={styles.brandIcon}>
            <Eye aria-hidden="true" />
          </span>
          <span className={styles.brandText}>
            <strong>{header || "ICN"}</strong>
            <span>{menu === "admin" ? "پنل مدیریت" : "حساب کاربری"}</span>
          </span>
        </Link>
        {/* <SidebarTrigger className={styles.toggle} title="باز و بسته کردن منو" /> */}
      </SidebarHeader>
      <SidebarContent className={styles.content}>
        {sections.map((section) => (
          <SidebarGroup key={section.title} className={styles.section}>
            <SidebarGroupLabel className={styles.sectionLabel}>
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.menus.map((group, index) =>
                    group.items.length > 1 ? (
                      <SidebarNavCollapsibleGroup
                        key={group.group_title + pathname}
                        group={group}
                      />
                    ) : (
                      <SidebarNavSingleItem
                        key={group.items[0]?.path ?? index}
                        group={group}
                      />
                    ),
                  )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />

      {data.footer && footer && admin && (
        <SidebarFooter className={styles.footer}>
          <SidebarMenu>
            <SidebarFooterItem
              key={data.footer.path}
              title={data.footer.title}
              icon={data.footer.icon}
              path={data.footer.path}
            />
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

function isRouteActive(pathname: string, path: string) {
  const route = path.replace(/\/$/, "") || "/";
  return (
    pathname === route ||
    (route !== "/" && route !== "/admin" && pathname.startsWith(route + "/"))
  );
}

// ---------------------------------------------------------------------------
// Single item (no sub-menu) — label falls back to the first item's title
// ---------------------------------------------------------------------------

function SidebarBadge({ badgeFn }: { badgeFn?: () => number | null }) {
  if (!badgeFn) return;

  const count = badgeFn();

  if (!count) return;

  if (count <= 0) return;

  return <span className={styles.badge}>{count.toLocaleString("fa-IR")}</span>;
}

function SidebarNavSingleItem({ group }: { group: SidebarNavGroup }) {
  const pathname = usePathname();
  const item = group.items[0];
  const Icon = group.icon;
  const isActive = isRouteActive(pathname, item.path);

  const sidebar = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={styles.menuButton}
        isActive={isActive}
        tooltip={{ children: item.title, side: "left" }}
        onClick={() => {
          if (sidebar.isMobile) {
            sidebar.toggleSidebar();
          }
        }}
        render={
          <Link href={item.path} aria-current={isActive ? "page" : undefined}>
            <Icon />
            <span className={styles.label}>{item.title}</span>
            <SidebarBadge badgeFn={group.badgeFn} />
          </Link>
        }
      ></SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarFooterItem({
  title,
  icon,
  path,
}: {
  title: string;
  icon: LucideIcon;
  path: string;
}) {
  const pathname = usePathname();
  const sidebar = useSidebar();
  const Icon = icon;
  const isActive = pathname === path;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={styles.menuButton}
        isActive={isActive}
        tooltip={{ children: title, side: "left" }}
        onClick={() => {
          if (sidebar.isMobile) sidebar.setOpenMobile(false);
        }}
        render={
          <Link href={path} className="relative">
            <Icon />
            <span>{title}</span>
          </Link>
        }
      ></SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ---------------------------------------------------------------------------
// Collapsible group — label is group_title, expands to a submenu
// ---------------------------------------------------------------------------

function SidebarNavCollapsibleGroup({ group }: { group: SidebarNavGroup }) {
  const pathname = usePathname();
  const Icon = group.icon;
  const sidebar = useSidebar();
  const isGroupActive = group.items.some((item) =>
    isRouteActive(pathname, item.path),
  );
  const [open, setOpen] = React.useState(isGroupActive);

  return (
    <Collapsible
      open={open}
      onOpenChange={(nextOpen) => {
        if (!sidebar.isMobile && sidebar.state === "collapsed") {
          sidebar.setOpen(true);
          setOpen(true);
        } else setOpen(nextOpen);
      }}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            isActive={isGroupActive}
            tooltip={{ children: group.group_title, side: "left" }}
            className={styles.menuButton}
          >
            <Icon />
            <span className={styles.label}>{group.group_title}</span>
            <SidebarBadge badgeFn={group.badgeFn} />
            <ChevronDown
              className={styles.chevron}
              style={{ transform: open ? "rotate(0deg)" : "rotate(90deg)" }}
            />
          </SidebarMenuButton>
        }
      />
      <CollapsibleContent>
        <SidebarMenuSub className={styles.submenu}>
          {group.items.map((item) => {
            const isActive =
              isRouteActive(pathname, item.path) &&
              !group.items.some(
                (other) =>
                  other.path.length > item.path.length &&
                  isRouteActive(pathname, other.path),
              );
            return (
              <SidebarMenuSubItem key={item.path + item.title}>
                <SidebarMenuSubButton
                  className={styles.subButton}
                  isActive={isActive}
                  onClick={() => {
                    if (sidebar.isMobile) sidebar.setOpenMobile(false);
                  }}
                  render={
                    <Link
                      href={item.path}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span>{item.title}</span>
                    </Link>
                  }
                ></SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

const AdminSidebarData: SidebarDataType = {
  menus: [
    {
      section: "محتوا", order: 7,
      group_title: "وبلاگ",
      icon: BookOpen,
      items: [
        { title: "مقاله‌های وبلاگ", path: "/admin/blog" },
        { title: "دسته‌ها و برچسب‌ها", path: "/admin/blog/terms" },
      ],
    },
    {
      section: "کاتالوگ محصولات", order: 6,
      group_title: "کدهای تخفیف",
      icon: BadgePercent,
      items: [{ title: "کدهای تخفیف", path: "/admin/discounts" }],
    },
    {
      section: "مدیریت اصلی", order: 0,
      group_title: "داشبورد",
      icon: LayoutDashboard,
      items: [
        {
          title: "داشبورد",
          path: `/admin/`,
        },
      ],
    },
    {
      section: "گزارش‌ها و آمار", order: 8,
      group_title: "گزارش مالی",
      icon: BanknoteArrowUp,
      items: [{ title: "گزارش مالی", path: "/admin/financial" }],
    },
    {
      section: "گزارش‌ها و آمار", order: 9,
      group_title: "آمار ورودی سایت",
      icon: PieChartIcon,
      items: [{ title: "آمار ورودی سایت", path: "/admin/analytics" }],
    },
    {
      section: "پشتیبانی و تنظیمات", order: 11,
      group_title: "تیکت‌ها",
      icon: TicketIcon,
      badgeFn: useOpenTicketCount,
      items: [{ title: "تیکت‌ها", path: "/admin/tickets" }],
    },
    {
      section: "گزارش‌ها و آمار", order: 10,
      group_title: "گزارش فعالیت‌ها",
      icon: List,
      items: [{ title: "گزارش فعالیت‌ها", path: "/admin/logs" }],
    },
    {
      section: "مدیریت اصلی", order: 2,
      group_title: "مدیریت کاربران",
      icon: User,
      badgeFn: useApprovalCount,
      items: [
        {
          title: "مدیریت کاربران",
          path: `/admin/users`,
        },
      ],
    },
    {
      section: "مدیریت اصلی", order: 1,
      group_title: "سفارش ها",
      icon: Clock,
      items: [
        {
          title: "سفارش ها",
          path: `/admin/orders`,
        },
        {
          title: "ثبت سفارش برای کاربر",
          path: "/admin/glasslens-order",
        },
      ],
      badgeFn: useOrderCount,
    },
    {
      section: "کاتالوگ محصولات", order: 5,
      group_title: "دسته بندی ها",
      icon: LayoutList,
      items: [
        {
          title: "دسته بندی کلی",
          path: `/admin/master-category`,
        },
        {
          title: "دسته بندی محصولات",
          path: `/admin/product-category`,
        },
      ],
    },
    {
      section: "کاتالوگ محصولات", order: 4,
      group_title: "محصولات",
      icon: BoxIcon,
      items: [
        {
          title: "لیست محصولات",
          path: `/admin/products`,
        },
        {
          title: "تگ ها",
          path: `/admin/products/tags`,
        },
      ],
    },
    {
      section: "مدیریت اصلی", order: 3,
      group_title: "صورتحساب ها",
      icon: BanknoteArrowUp,
      badgeFn: useCreditInvoiceCount,
      items: [
        {
          title: "صورتحساب ها",
          path: `/admin/invoices`,
        },
      ],
    },
    {
      section: "پشتیبانی و تنظیمات", order: 12,
      group_title: "تنظیمات",
      icon: Settings,
      items: [{ title: "تنظیمات", path: "/admin/settings" }],
    },
  ],
  footer: {
    title: "صفحه اصلی",
    icon: Globe,
    path: "/",
  },
};

const UserSidebarData: SidebarDataType = {
  menus: [
    { section: "حساب کاربری", order: 0, group_title: "خانه", icon: Globe, items: [{ title: "خانه", path: "/" }] },
    {
      section: "حساب کاربری", order: 2,
      group_title: "مجله",
      icon: BookOpen,
      items: [{ title: "مقالات و اخبار", path: "/blog" }],
    },
    {
      section: "حساب کاربری", order: 1,
      group_title: "پروفایل",
      icon: UserIcon,
      items: [{ title: "پروفایل", path: "/profile" }],
    },
    {
      section: "سفارش‌ها و پرداخت‌ها", order: 3,
      group_title: "سفارش عدسی",
      icon: ReceiptIcon,
      items: [
        {
          title: "سفارش عدسی",
          path: `/glasslens-order`,
        },
      ],
    },
    {
      section: "پشتیبانی", order: 6,
      group_title: "پشتیبانی",
      icon: ReceiptIcon,
      items: [{ title: "پشتیبانی و تیکت‌ها", path: "/tickets" }],
    },
    {
      section: "سفارش‌ها و پرداخت‌ها", order: 4,
      group_title: "سفارش ها",
      icon: List,
      items: [
        {
          title: "پیگیری سفارش ها",
          path: `/orders`,
        },
      ],
    },
    {
      section: "سفارش‌ها و پرداخت‌ها", order: 5,
      group_title: "مالی",
      icon: BanknoteArrowUp,
      items: [
        {
          title: "تارخچه مالی",
          path: `/financial`,
        },
        { title: "صورتحساب‌ها", path: `/invoices` },
        {
          title: "افزایش موجودی",
          path: `/invoices?addCreditOpen=true`,
        },
      ],
    },
  ],
  footer: {
    title: "مدیریت",
    icon: Hammer,
    path: `/admin`,
  },
};
