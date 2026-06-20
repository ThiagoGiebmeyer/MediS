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
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [primaryId, setPrimaryId] = useState<string>(COLOR_PRESETS[0].id);
  const [isOpen, setIsOpen] = useState(false);

  const activePreset = useMemo(() => {
    return COLOR_PRESETS.find((preset) => preset.id === primaryId) || COLOR_PRESETS[0];
  }, [primaryId]);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const storedPrimary = localStorage.getItem(PRIMARY_KEY);

    const initialTheme = storedTheme || "dark";
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
      : "fixed right-3 top-3 sm:right-6 sm:top-6 z-50";

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

      {(alwaysOpen || shouldShowPanel) && (
        <div
          id="theme-popover"
          className={[
            "bg-card/90 backdrop-blur p-3 border border-border rounded-2xl shadow-lg",
            variant === "floating" ? "mt-2 w-64" : "w-full",
          ].join(" ")}
        >
          <p className="font-semibold text-foreground text-xs uppercase tracking-[0.2em]">
            Aparencia
          </p>

          <div className="gap-2 grid grid-cols-2 mt-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={[
                "px-3 py-2 rounded-xl border text-sm font-semibold transition-colors",
                theme === "light"
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-foreground hover:border-primary",
              ].join(" ")}
            >
              Claro
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={[
                "px-3 py-2 rounded-xl border text-sm font-semibold transition-colors",
                theme === "dark"
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-foreground hover:border-primary",
              ].join(" ")}
            >
              Escuro
            </button>
          </div>

          <p className="mt-4 font-semibold text-muted text-xs uppercase tracking-[0.2em]">
            Cor principal
          </p>

          <div className="gap-2 grid grid-cols-5 mt-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setPrimaryId(preset.id)}
                title={preset.name}
                aria-label={`Selecionar cor ${preset.name}`}
                className={[
                  "rounded-full h-8 w-8 border-2 transition-transform",
                  primaryId === preset.id
                    ? "border-foreground scale-110"
                    : "border-transparent hover:scale-105",
                ].join(" ")}
                style={{ backgroundColor: preset.primary }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
