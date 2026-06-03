import { initials } from "@/lib/format";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Avatar({
  user,
  className,
}: {
  user: User | null;
  className?: string;
}) {
  if (user?.avatar) {
    // Avatars are stored as data URLs, so a plain <img> is the right tool here.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={user.avatar}
        alt=""
        className={cn("h-9 w-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary",
        className,
      )}
    >
      {user ? initials(user.firstName, user.lastName) : "?"}
    </div>
  );
}
