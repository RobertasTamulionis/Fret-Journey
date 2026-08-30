import type { ReactNode } from "react";
import AppNavigation from "@/components/AppNavigation/AppNavigation";
import ThemeSelector from "@/components/ThemeSelector/ThemeSelector";
import "./appShell.scss";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="appShell">
      <a className="appShell__skipLink" href="#main-content">
        Skip to content
      </a>
      <header className="appShell__header">
        <div className="appShell__navigation">
          <AppNavigation />
        </div>
        <ThemeSelector />
      </header>
      <main className="appShell__surface" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
