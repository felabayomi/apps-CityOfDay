import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ColorTheme } from "@shared/schema";

interface ActiveThemeProviderProps {
  children: React.ReactNode;
}

// Default theme colors to use as fallback
const DEFAULT_THEME = {
  heroGradientStart: "#0038A8",
  heroGradientEnd: "#008ED6", 
  accentBarBackground: "#F2AF00",
  accentBarText: "#000000",
  cardBadgeBackground: "#0038A8", 
  cardBadgeText: "#FFFFFF",
  headerBackground: "#002455",
  headerText: "#FFFFFF",
};

export function ActiveThemeProvider({ children }: ActiveThemeProviderProps) {
  // Fetch active theme from public API
  const { data: activeTheme } = useQuery<ColorTheme | null>({
    queryKey: ["/api/color-themes/active"],
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Apply theme colors as CSS variables whenever theme changes
  useEffect(() => {
    const theme = activeTheme || DEFAULT_THEME;
    
    // Apply CSS variables to document root
    const root = document.documentElement;
    root.style.setProperty('--hero-gradient-start', theme.heroGradientStart);
    root.style.setProperty('--hero-gradient-end', theme.heroGradientEnd);
    root.style.setProperty('--accent-bar-bg', theme.accentBarBackground);
    root.style.setProperty('--accent-bar-text', theme.accentBarText);
    root.style.setProperty('--badge-bg', theme.cardBadgeBackground);
    root.style.setProperty('--badge-text', theme.cardBadgeText);
    root.style.setProperty('--header-bg', theme.headerBackground);
    root.style.setProperty('--header-text', theme.headerText);
    
    console.log('Applied theme:', (theme as any)?.name || 'Default Theme', theme);
  }, [activeTheme]);

  return <>{children}</>;
}