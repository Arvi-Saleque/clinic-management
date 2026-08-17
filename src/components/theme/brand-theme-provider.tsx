"use client";

import * as React from "react";

/**
 * Registry of available brand palettes. To add a new one:
 *   1. Create src/styles/themes/<key>.css following clinical-trust.css's
 *      variable names (--brand-*, --accent-*, --neutral-*, status colors).
 *   2. Import it in globals.css next to the clinical-trust import, scoped
 *      under `[data-brand="<key>"]` (clinical-trust.css already shows the
 *      pattern via the `:root, [data-brand="clinical-trust"]` selector).
 *   3. Add { key: "<key>", label: "..." } below.
 * No component code needs to change — every component reads semantic
 * tokens (bg-primary, text-foreground, ...), not brand-specific values.
 */
export const BRAND_THEMES = [
  { key: "clinical-luxury", label: "Clinical Luxury" },
  { key: "clinical-trust", label: "Clinical Trust" },
] as const;

export type BrandThemeKey = (typeof BRAND_THEMES)[number]["key"];

const DEFAULT_BRAND: BrandThemeKey = "clinical-luxury";
const STORAGE_KEY = "clinic-brand-theme";

type BrandThemeContextValue = {
  brand: BrandThemeKey;
  setBrand: (brand: BrandThemeKey) => void;
};

const BrandThemeContext = React.createContext<BrandThemeContextValue | null>(null);

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrandState] = React.useState<BrandThemeKey>(DEFAULT_BRAND);

  React.useEffect(() => {
    // Reads an external system (localStorage) on mount — can't run during
    // render (no window on the server) and there's nothing to derive this
    // from props/state, so an effect is the correct tool here.
    const stored = window.localStorage.getItem(STORAGE_KEY) as BrandThemeKey | null;
    if (stored && BRAND_THEMES.some((t) => t.key === stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBrandState(stored);
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-brand", brand);
  }, [brand]);

  const setBrand = React.useCallback((next: BrandThemeKey) => {
    setBrandState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = React.useMemo(() => ({ brand, setBrand }), [brand, setBrand]);

  return <BrandThemeContext.Provider value={value}>{children}</BrandThemeContext.Provider>;
}

export function useBrandTheme() {
  const ctx = React.useContext(BrandThemeContext);
  if (!ctx) throw new Error("useBrandTheme must be used within BrandThemeProvider");
  return ctx;
}
