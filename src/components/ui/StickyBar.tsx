import { cn } from "@/lib/cn";

/** Pins its children to the bottom of the viewport so primary CTAs (Apply, Publish) are always reachable. */
export function StickyBar({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur pb-[calc(env(safe-area-inset-bottom)+0.75rem)] dark:border-neutral-800 dark:bg-neutral-900/95",
        className
      )}
    >
      {children}
    </div>
  );
}
