import { cn } from "@/lib/utils";

// Shared inline error-surface (design decision 4): a calm message rendered in
// place — no toast, no exclamation marks. Every later slice reuses this for
// honest, non-blocking error states (FR-SHELL-03, NFR-OBS-01).
//
// Server component: it renders static markup with no interactivity.

export interface NoticeProps {
  /** The calm, user-facing message (sourced from `lib/i18n`). */
  children: React.ReactNode;
  className?: string;
}

export function Notice({ children, className }: NoticeProps) {
  return (
    <div
      role="status"
      className={cn(
        "mx-auto w-full max-w-md rounded-md border border-border bg-muted px-4 py-3 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
