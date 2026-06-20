"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { register } from "@/services/index";

export default function Register() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !sobrenome || !email || !password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    setLoading(true);

    try {
      const response = await register(email, password, nome, sobrenome);

      if (response.error || response.data?.error) {
        toast.error(response.messageError || response.data?.messageError || "Inconsistência ao cadastrar.");
        return;
      }

      toast.success("Cadastro realizado com sucesso!");

      router.push("/login");

    } catch (err: any) {
      if (err.response) {
        toast.error(err.response.data.messageError || "Inconsistência ao cadastrar.");
      } else {
        toast.error("Falha ao conectar ao servidor.");
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
      return;
    }

    setLoading(false);

  }, [router]);


  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-primary-dark border-b-2 rounded-full w-16 h-16 animate-spin"></div>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(8,47,73,0.35),rgba(7,89,133,0.2),rgba(20,83,45,0.35),rgba(2,6,23,0.92))]" />
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-0">
        <div className="-top-40 -right-20 float-slow absolute bg-cyan-400/25 blur-3xl rounded-full w-96 h-96" />
        <div className="-bottom-12 -left-32 float-slow absolute bg-emerald-400/20 blur-3xl rounded-full w-80 h-80" />
      </div>

      <div className="z-10 relative flex items-center mx-auto px-6 py-10 max-w-6xl min-h-screen">
        <div className="gap-8 grid lg:grid-cols-[0.98fr_1.02fr] w-full">
          <main className="fade-up">
            <div className="bg-card/85 shadow-2xl backdrop-blur-md p-8 sm:p-10 border border-border rounded-3xl glow-panel">
              <div className="mb-7">
                <p className="font-semibold text-muted text-xs uppercase tracking-[0.35em]">Primeiro acesso</p>
                <h2 className="mt-3 font-semibold text-foreground text-3xl">Criar conta MediS</h2>
                <p className="mt-2 text-muted text-sm">Ative seu ambiente de monitoramento em poucos passos.</p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="gap-4 grid sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-muted text-sm">Nome</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                      placeholder="Digite seu nome"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-muted text-sm">Sobrenome</label>
                    <input
                      type="text"
                      value={sobrenome}
                      onChange={(e) => setSobrenome(e.target.value)}
                      className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                      placeholder="Digite seu sobrenome"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-muted text-sm">E-mail</label>
                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                    placeholder="Digite seu e-mail"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-muted text-sm">Senha</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                    placeholder="Digite sua senha"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-muted text-sm">Confirmar senha</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                    placeholder="Confirme sua senha"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark mt-2 px-4 py-3 rounded-xl font-semibold text-on-primary transition-colors cursor-pointer"
                >
                  Criar conta
                </button>
              </form>

              <div className="mt-6 text-muted text-sm">
                Já tem conta? <Link href="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
              </div>
            </div>
          </main>

          <aside className="flex flex-col justify-center gap-6 fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center bg-primary/90 shadow-lg shadow-primary/30 rounded-2xl w-11 h-11 font-black text-on-primary text-lg">M</div>
              <div>
                <p className="text-muted text-sm uppercase tracking-[0.3em]">MediS</p>
                <p className="text-muted text-xs">Onboarding do produtor</p>
              </div>
            </div>
            <span className="bg-card/70 px-4 py-2 border border-border rounded-full w-fit font-semibold text-muted text-[11px] uppercase tracking-[0.35em]">
              Setup guiado
            </span>
            <h2 className="font-semibold text-foreground text-3xl sm:text-4xl leading-tight">
              Estruture seu monitoramento com identidade e contexto.
            </h2>
            <p className="max-w-xl text-muted text-sm sm:text-base">
              Após o cadastro você já entra pronto para configurar totems, mapear áreas e acompanhar leituras com rastreabilidade.
            </p>
            <div className="gap-3 grid sm:grid-cols-2">
              {[
                { title: "Conta base", description: "Dados de acesso e identidade" },
                { title: "Mapa inicial", description: "Latitude e longitude dos pontos" },
                { title: "Operação", description: "Cadastros de totem e intervalos" },
                { title: "Inteligência", description: "Análises e tendências em minutos" },
              ].map((item) => (
                <div key={item.title} className="bg-card/80 backdrop-blur-sm px-4 py-3 border border-border/80 rounded-2xl">
                  <p className="font-semibold text-foreground text-sm">{item.title}</p>
                  <p className="mt-1 text-muted text-xs">{item.description}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
