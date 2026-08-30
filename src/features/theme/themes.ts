export const appThemes = [
  { id: "graphite", label: "Graphite" },
  { id: "light", label: "Light" },
  { id: "ember", label: "Ember" },
] as const;

export type AppThemeId = (typeof appThemes)[number]["id"];

export const defaultAppTheme: AppThemeId = "graphite";
export const appThemeStorageKey = "fret-journey-theme";

export const isAppThemeId = (value: unknown): value is AppThemeId =>
  typeof value === "string" && appThemes.some(({ id }) => id === value);

export const createThemeBootstrapScript = (): string => `
  (() => {
    try {
      const storedTheme = window.localStorage.getItem(${JSON.stringify(appThemeStorageKey)});
      const themes = ${JSON.stringify(appThemes.map(({ id }) => id))};

      if (storedTheme && themes.includes(storedTheme)) {
        document.documentElement.dataset.theme = storedTheme;
      }
    } catch {}
  })();
`;
