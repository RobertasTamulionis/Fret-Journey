import type { ReactNode } from "react";
import AppNavigation from "@/components/AppNavigation/AppNavigation";
import RouteTransition from "@/components/AppShell/RouteTransition";
import MusicalContextBar from "@/components/MusicalContextBar/MusicalContextBar";
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
      <MusicalContextBar />
      <main className="appShell__surface" id="main-content" tabIndex={-1}>
        <RouteTransition>{children}</RouteTransition>
      </main>
    </div>
  );
}
