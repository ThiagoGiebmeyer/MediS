"use client";

import { useEffect, useMemo, useState } from "react";

const THEME_KEY = "medis-theme";
const PRIMARY_KEY = "medis-primary";

type ThemeMode = "light" | "dark";

type ColorPreset = {
  id: string;
  name: string;
  primary: string;
  primaryDark: string;
};

const COLOR_PRESETS: ColorPreset[] = [
  { id: "ocean", name: "Oceano", primary: "#2563eb", primaryDark: "#1d4ed8" },
  { id: "jade", name: "Jade", primary: "#10b981", primaryDark: "#059669" },
  { id: "amber", name: "Ambar", primary: "#f59e0b", primaryDark: "#d97706" },
  { id: "rose", name: "Rose", primary: "#e11d48", primaryDark: "#be123c" },
  { id: "slate", name: "Slate", primary: "#0f766e", primaryDark: "#115e59" }
];

const getSystemTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme: ThemeMode, preset: ColorPreset) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.setProperty("--primary", preset.primary);
  root.style.setProperty("--primary-dark", preset.primaryDark);
};

type ThemeControlsProps = {
  variant?: "floating" | "inline";
  alwaysOpen?: boolean;
};

export default function ThemeControls({ variant = "floating", alwaysOpen = false }: ThemeControlsProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [primaryId, setPrimaryId] = useState<string>(COLOR_PRESETS[0].id);
  const [isOpen, setIsOpen] = useState(false);

  const activePreset = useMemo(() => {
    return COLOR_PRESETS.find((preset) => preset.id === primaryId) || COLOR_PRESETS[0];
  }, [primaryId]);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const storedPrimary = localStorage.getItem(PRIMARY_KEY);

    const initialTheme = storedTheme || getSystemTheme();
    const initialPrimary = storedPrimary || COLOR_PRESETS[0].id;

    setTheme(initialTheme);
    setPrimaryId(initialPrimary);
    applyTheme(initialTheme, COLOR_PRESETS.find((preset) => preset.id === initialPrimary) || COLOR_PRESETS[0]);
  }, []);

  useEffect(() => {
    applyTheme(theme, activePreset);
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(PRIMARY_KEY, activePreset.id);
  }, [theme, activePreset]);

  const containerClasses =
    variant === "inline"
      ? "relative"
      : "fixed right-6 top-6 z-50";

  const shouldShowPanel = variant === "inline" ? true : isOpen;

  return (
    <div className={containerClasses}>
      {variant === "floating" && !alwaysOpen && (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="theme-popover"
          className="flex justify-center items-center bg-card/80 shadow-sm backdrop-blur border border-border hover:border-primary rounded-full w-9 h-9 font-semibold text-foreground text-xs transition-colors"
          title="Tema e cor"
        >
          T
        </button>
      )}
      {shouldShowPanel && (
        <div
          id="theme-popover"
          className="bg-card/95 shadow-lg backdrop-blur mt-3 p-3 border border-border rounded-2xl w-full"
        >
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            className="flex justify-between items-center gap-3 bg-background hover:bg-card-alt px-3 py-2 border border-border rounded-xl w-full font-semibold text-foreground text-sm transition-colors"
          >
            <span>Tema</span>
            <span className="text-primary">{theme === "dark" ? "Escuro" : "Claro"}</span>
          </button>
          <div className="flex items-center gap-2 mt-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={`Cor ${preset.name}`}
                onClick={() => setPrimaryId(preset.id)}
                className={`h-7 w-7 rounded-full border ${primaryId === preset.id ? "border-foreground" : "border-border"}`}
                style={{ backgroundColor: preset.primary }}
                aria-label={`Selecionar cor ${preset.name}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
