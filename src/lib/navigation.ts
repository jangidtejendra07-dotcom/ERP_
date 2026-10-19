import {
  LayoutDashboard, Box, GitBranch, Tags, ShoppingCart, Receipt,
  CreditCard, Undo2, BarChart3, FileText, Truck, Users, type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", href: "/inventory", icon: Box },
  { label: "Branches", href: "/branches", icon: GitBranch },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Point of Sale (POS)", href: "/pos", icon: ShoppingCart },
  { label: "Sales", href: "/sales", icon: Receipt },
  { label: "Credits Sales", href: "/credit-sales", icon: CreditCard },
  { label: "Returns", href: "/returns", icon: Undo2 },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Vendors", href: "/vendors", icon: Truck },
  { label: "Users", href: "/users", icon: Users },
];