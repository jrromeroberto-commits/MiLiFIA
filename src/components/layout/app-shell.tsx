import type { ReactNode } from "react";
import { Navigation } from "@/components/layout/navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <Navigation />
      <main className="mx-auto w-full max-w-[96rem] px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10 lg:pt-9">
        {children}
      </main>
    </div>
  );
}
