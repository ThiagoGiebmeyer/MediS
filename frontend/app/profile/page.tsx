"use client";

import ThemeControls from "@/app/components/ThemeControls";
import { getProfile } from "@/services";
import Link from "next/link";
import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  criado_em?: string;
  alterado_em?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getProfile();
        if (!response.error) {
          setProfile(response.data || null);
        }
      } catch {
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="-top-40 -right-24 float-slow absolute bg-primary/20 blur-3xl rounded-full w-96 h-96" />
        <div className="bottom-0 -left-32 float-slow absolute bg-emerald-400/10 blur-3xl rounded-full w-80 h-80" />
      </div>

      <div className="z-10 relative flex flex-col gap-6 mx-auto px-6 py-10 max-w-5xl min-h-screen">
        <header className="flex flex-wrap justify-between items-center gap-4 bg-card/80 shadow-lg p-6 border border-border rounded-3xl glow-panel">
          <div>
            <p className="text-muted text-xs uppercase tracking-[0.3em]">Perfil</p>
            <h1 className="mt-2 font-semibold text-foreground text-3xl">Sua conta MediS</h1>
            <p className="mt-2 text-muted text-sm">Gerencie preferências de tema e visualize dados básicos da sessão.</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
          >
            Voltar ao dashboard
          </Link>
        </header>

        <section className="gap-6 grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl glow-panel">
            <h2 className="font-semibold text-foreground text-lg">Dados do usuário</h2>
            {isLoading ? (
              <div className="mt-4 text-muted text-sm">Carregando dados...</div>
            ) : (
              <div className="gap-3 grid mt-4 text-muted text-sm">
                <div className="flex justify-between items-center bg-card/70 px-4 py-3 border border-border rounded-2xl">
                  <span>ID do usuário</span>
                  <span className="font-semibold text-foreground">{profile?.id || "-"}</span>
                </div>
                <div className="flex justify-between items-center bg-card/70 px-4 py-3 border border-border rounded-2xl">
                  <span>Nome completo</span>
                  <span className="font-semibold text-foreground">
                    {profile ? `${profile.nome} ${profile.sobrenome}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-card/70 px-4 py-3 border border-border rounded-2xl">
                  <span>E-mail</span>
                  <span className="font-semibold text-foreground">{profile?.email || "-"}</span>
                </div>
                <div className="flex justify-between items-center bg-card/70 px-4 py-3 border border-border rounded-2xl">
                  <span>Criado em</span>
                  <span className="font-semibold text-foreground">
                    {profile?.criado_em ? new Date(profile.criado_em).toLocaleString("pt-BR") : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-card/70 px-4 py-3 border border-border rounded-2xl">
                  <span>Atualizado em</span>
                  <span className="font-semibold text-foreground">
                    {profile?.alterado_em ? new Date(profile.alterado_em).toLocaleString("pt-BR") : "-"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl glow-panel">
            <h2 className="font-semibold text-foreground text-lg">Tema e cor principal</h2>
            <p className="mt-2 text-muted text-sm">Escolha o modo claro/escuro e a cor que personaliza o painel.</p>
            <div className="mt-4">
              <ThemeControls variant="inline" alwaysOpen />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
