"use client";

import { useEffect, useState } from "react";
import {
  type AppThemeId,
  appThemeStorageKey,
  appThemes,
  defaultAppTheme,
  isAppThemeId,
} from "@/features/theme/themes";
import "./themeSelector.scss";
import Select from "@/components/ui/Select/Select";

const readDocumentTheme = (): AppThemeId => {
  const documentTheme = document.documentElement.dataset.theme;

  return isAppThemeId(documentTheme) ? documentTheme : defaultAppTheme;
};

const applyTheme = (theme: AppThemeId) => {
  document.documentElement.dataset.theme = theme;

  try {
    window.localStorage.setItem(appThemeStorageKey, theme);
  } catch {
    // The visual preference still works when storage is unavailable.
  }
};

export default function ThemeSelector() {
  const [theme, setTheme] = useState<AppThemeId>(defaultAppTheme);

  useEffect(() => {
    setTheme(readDocumentTheme());

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== appThemeStorageKey || !isAppThemeId(event.newValue)) {
        return;
      }

      document.documentElement.dataset.theme = event.newValue;
      setTheme(event.newValue);
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <div className="themeSelector">
      <span>Theme</span>
      <Select
        options={appThemes.map(({ id, label }) => ({ value: id, label }))}
        onChange={(nextTheme) => {
          if (isAppThemeId(nextTheme)) {
            setTheme(nextTheme);
            applyTheme(nextTheme);
          }
        }}
        size="sm"
        value={theme}
      />
    </div>
  );
}
