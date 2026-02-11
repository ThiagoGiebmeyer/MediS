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
    router.push("/signup");
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
      <div className="absolute inset-0">
        <div className="-top-40 -right-24 float-slow absolute bg-primary/20 blur-3xl rounded-full w-96 h-96" />
        <div className="top-1/3 -left-28 float-slow absolute bg-cyan-400/20 blur-3xl rounded-full w-72 h-72" />
      </div>

      <div className="z-10 relative flex items-center mx-auto px-6 py-10 max-w-6xl min-h-screen">
        <div className="gap-10 grid lg:grid-cols-[1.1fr_0.9fr] w-full">
          <aside className="flex flex-col justify-center gap-6 fade-up">
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center bg-primary rounded-2xl w-10 h-10 font-bold text-on-primary">M</div>
              <div>
                <p className="text-muted text-sm uppercase tracking-[0.3em]">MediS</p>
                <p className="text-muted text-xs">Monitoramento inteligente</p>
              </div>
            </div>
            <h1 className="font-semibold text-foreground text-4xl sm:text-5xl">Bem-vindo de volta</h1>
            <p className="text-muted text-sm sm:text-base">
              Entre para acompanhar a evolução das coletas, revisar alertas e manter o cultivo sob controle.
            </p>
            <div className="gap-3 grid sm:grid-cols-2">
              {["Painel em tempo real", "Alertas inteligentes", "Historico completo", "Controle de totens"].map((item) => (
                <div key={item} className="bg-card/70 px-4 py-3 border border-border rounded-2xl font-semibold text-foreground text-sm">
                  {item}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={goToRegister}
              className="px-4 py-2 border border-border hover:border-primary rounded-full w-fit font-semibold text-foreground hover:text-primary text-sm transition-colors"
            >
              Criar nova conta
            </button>
          </aside>

          <main className="fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="bg-card/80 shadow-2xl p-8 sm:p-10 border border-border rounded-3xl glow-panel">
              <div className="mb-8">
                <p className="font-semibold text-muted text-xs uppercase tracking-[0.35em]">Login</p>
                <h2 className="mt-3 font-semibold text-foreground text-2xl">Acesse sua conta</h2>
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
                  className="bg-primary hover:bg-primary-dark mt-2 px-4 py-2 rounded-lg font-semibold text-on-primary transition-colors cursor-pointer"
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
