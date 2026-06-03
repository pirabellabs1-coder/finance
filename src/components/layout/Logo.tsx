import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] text-white shadow-sm">
        <Wallet className="h-5 w-5" />
      </div>
      <span className="text-lg font-bold tracking-tight text-foreground">
        Finance
      </span>
    </div>
  );
}
