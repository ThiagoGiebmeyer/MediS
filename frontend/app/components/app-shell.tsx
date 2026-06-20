"use client";

import {
  BarChart3,
  Bell,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Microscope,
  Settings2,
  UserRound,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo } from "react";

import ThemeControls from "@/app/components/theme-controls";

type ShellNavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
};

const PUBLIC_ROUTES = ["/", "/login", "/sign-up", "/forgot-password"];

const NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Visão geral e métricas",
  },
  {
    href: "/analyses",
    label: "Análises",
    icon: Microscope,
    description: "Resultados e histórico",
  },
  {
    href: "/totems",
    label: "Totens",
    icon: Wifi,
    description: "Cadastro e conexões",
  },
  {
    href: "/reports",
    label: "Relatórios",
    icon: ClipboardList,
    description: "Exportações e sínteses",
  },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = useMemo(
    () =>
      PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      ),
    [pathname],
  );

  if (isPublicRoute) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] bg-background min-h-screen text-foreground">
      <aside className="hidden lg:top-0 lg:sticky lg:flex lg:flex-col bg-card/60 backdrop-blur-xl border-border/80 border-r lg:h-screen">
        <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center bg-primary rounded-2xl w-11 h-11 font-bold text-on-primary">
              M
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-[0.35em]">
                ediS
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                    isActive
                      ? "bg-primary text-on-primary shadow-lg"
                      : "bg-transparent text-foreground hover:bg-card-alt border border-transparent hover:border-border"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center rounded-xl w-10 h-10 ${isActive ? "bg-white/15" : "bg-card-alt"}`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block font-semibold text-sm">
                      {item.label}
                    </span>
                    <span
                      className={`block text-[11px] ${isActive ? "text-on-primary/80" : "text-muted"}`}
                    >
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    className={`${isActive ? "text-on-primary/80" : "text-muted group-hover:text-foreground"}`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="bg-card/80 p-4 border border-border rounded-3xl">
            <div className="flex flex-col gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-3 bg-background hover:bg-card-alt px-4 py-3 border border-border rounded-2xl transition-colors"
              >
                <UserRound size={16} className="text-primary" />
                <span className="font-semibold text-sm">Perfil</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 bg-background hover:bg-card-alt px-4 py-3 border border-border rounded-2xl text-left transition-colors hover:cursor-pointer"
              >
                <LogOut size={16} className="text-red-400" />
                <span className="font-semibold text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="lg:hidden flex justify-between items-center gap-4 bg-card/70 backdrop-blur px-4 sm:px-6 py-4 border-border border-b">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex justify-center items-center bg-primary rounded-2xl w-10 h-10 font-bold text-on-primary shrink-0">
              M
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted uppercase tracking-[0.35em]">
                MediS
              </p>
              <p className="font-semibold text-foreground text-sm truncate">
                Painel principal
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-full font-semibold text-foreground text-sm"
          >
            <UserRound size={16} /> Perfil
          </Link>
        </div>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
