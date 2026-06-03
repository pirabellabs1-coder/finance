import {
  Banknote,
  Briefcase,
  Car,
  CircleDollarSign,
  Gamepad2,
  HeartPulse,
  HelpCircle,
  Home,
  Laptop,
  Package,
  Repeat,
  TrendingUp,
  Utensils,
  Wifi,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  banknote: Banknote,
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  "circle-dollar": CircleDollarSign,
  utensils: Utensils,
  car: Car,
  home: Home,
  wifi: Wifi,
  "heart-pulse": HeartPulse,
  gamepad: Gamepad2,
  repeat: Repeat,
  package: Package,
};

export function CategoryGlyph({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = ICONS[icon] ?? HelpCircle;
  return <Icon className={className} />;
}
