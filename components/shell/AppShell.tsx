import { TopBar } from "@/components/shell/TopBar";
import { Footer } from "@/components/shell/Footer";

// App shell (FR-SHELL-01): one shared chrome — top bar, a single <main> content
// region, and a footer. The <main> is a responsive grid (FR-SHELL-02): one
// column below 768px, two columns from 768px (Tailwind `md:`) through 1279px,
// three columns at 1280px and wider (Tailwind `xl:`). Tailwind's default
// breakpoints are md=768px and xl=1280px, matching the spec exactly.
//
// Server component: composes static chrome around its children.

export interface AppShellProps {
  children: React.ReactNode;
  /** Slot for the live clock, forwarded to the top bar (top-clock slice). */
  clock?: React.ReactNode;
}

export function AppShell({ children, clock }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <TopBar clock={clock} />
      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-8 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </main>
      <Footer />
    </div>
  );
}
