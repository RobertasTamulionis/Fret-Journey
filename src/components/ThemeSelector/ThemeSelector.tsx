"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import {
  type AppThemeId,
  appThemeStorageKey,
  appThemes,
  defaultAppTheme,
  isAppThemeId,
} from "@/features/theme/themes";
import "./themeSelector.scss";

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

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextTheme = event.target.value;

    if (!isAppThemeId(nextTheme)) {
      return;
    }

    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <label className="themeSelector">
      <span>Theme</span>
      <select onChange={handleChange} value={theme}>
        {appThemes.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
