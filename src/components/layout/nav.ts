import {
  ArrowLeftRight,
  Gauge,
  LayoutDashboard,
  PieChart,
  Repeat,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When set, a section label is rendered above this item in the sidebar. */
  sectionStart?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/revenus", label: "Revenus", icon: TrendingUp },
  { href: "/depenses", label: "Dépenses", icon: TrendingDown },
  { href: "/statistiques", label: "Statistiques", icon: PieChart },
  { href: "/budgets", label: "Budgets", icon: Gauge, sectionStart: "Planification" },
  { href: "/objectifs", label: "Objectifs", icon: Target },
  { href: "/recurrences", label: "Récurrences", icon: Repeat },
  { href: "/profil", label: "Profil", icon: User, sectionStart: "Compte" },
];
