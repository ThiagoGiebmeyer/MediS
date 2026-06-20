"use client";

import { login } from "@/services/index";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  const goToRegister = () => {
    router.push("/sign-up");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);

      if (response.error) {
        toast.error(response.data.messageError || "Inconsistência ao fazer login.");
        return;
      }

      const token = response.data[0].token;

      localStorage.setItem("token", token);

      router.push("/dashboard");
    } catch (err: any) {
      if (err.response) {
        toast.error(err.response.data.messageError || "Inconsistência ao fazer login.");
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
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(2,6,23,0.84),rgba(6,78,59,0.35),rgba(14,116,144,0.28))]" />
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-0">
        <div className="-top-36 right-0 float-slow absolute bg-primary/25 blur-3xl rounded-full w-[28rem] h-[28rem]" />
        <div className="top-1/2 -left-24 float-slow absolute bg-emerald-400/20 blur-3xl rounded-full w-80 h-80" />
      </div>

      <div className="z-10 relative flex items-center mx-auto px-6 py-10 max-w-6xl min-h-screen">
        <div className="gap-8 grid lg:grid-cols-[1.08fr_0.92fr] w-full">
          <aside className="flex flex-col justify-center gap-7 fade-up">
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center bg-primary/90 shadow-lg shadow-primary/30 rounded-2xl w-11 h-11 font-black text-on-primary text-lg">M</div>
              <div>
                <p className="text-muted text-sm uppercase tracking-[0.3em]">MediS</p>
                <p className="text-muted text-xs">Central de cultivo conectado</p>
              </div>
            </div>
            <span className="bg-card/70 px-4 py-2 border border-border rounded-full w-fit font-semibold text-muted text-[11px] uppercase tracking-[0.35em]">
              Ambiente operacional
            </span>
            <h1 className="font-semibold text-foreground text-4xl sm:text-5xl leading-tight">
              Entre e veja cada talhão em um painel vivo.
            </h1>
            <p className="max-w-xl text-muted text-sm sm:text-base">
              Acompanhe totems, leituras e análises de forma contínua. O login leva você direto para o estado atual do campo.
            </p>
            <div className="gap-3 grid sm:grid-cols-2">
              {[
                { title: "Status imediato", description: "Temperatura e umidade em destaque" },
                { title: "Mapa ativo", description: "Totens posicionados em contexto" },
                { title: "Rastro técnico", description: "Histórico completo das coletas" },
                { title: "Ações rápidas", description: "Cadastro e ajustes no mesmo fluxo" },
              ].map((item) => (
                <div key={item.title} className="bg-card/80 backdrop-blur-sm px-4 py-3 border border-border/80 rounded-2xl">
                  <p className="font-semibold text-foreground text-sm">{item.title}</p>
                  <p className="mt-1 text-muted text-xs">{item.description}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={goToRegister}
              className="bg-card/70 hover:bg-card mt-1 px-5 py-2 border border-border hover:border-primary rounded-full w-fit font-semibold text-foreground hover:text-primary text-sm transition-colors"
            >
              Criar nova conta
            </button>
          </aside>

          <main className="fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="bg-card/85 shadow-2xl backdrop-blur-md p-8 sm:p-10 border border-border rounded-3xl glow-panel">
              <div className="mb-7">
                <p className="font-semibold text-muted text-xs uppercase tracking-[0.35em]">Acesso seguro</p>
                <h2 className="mt-3 font-semibold text-foreground text-3xl">Login no MediS</h2>
                <p className="mt-2 text-muted text-sm">Use seu e-mail e senha para continuar.</p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-muted text-sm">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                    placeholder="Digite seu e-mail"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className="text-muted text-sm">Senha</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                    placeholder="Digite sua senha"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark mt-2 px-4 py-3 rounded-xl font-semibold text-on-primary transition-colors cursor-pointer"
                >
                  Entrar
                </button>
              </form>

              <div className="flex flex-wrap justify-between items-center gap-3 mt-6 text-muted text-sm">
                <button
                  type="button"
                  onClick={goToRegister}
                  className="font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  Não tenho conta
                </button>
                <Link href="/forgot-password" className="hover:underline">Esqueci minha senha</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
