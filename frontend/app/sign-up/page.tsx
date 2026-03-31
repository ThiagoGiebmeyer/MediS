"use client";

import { useEffect, useState } from "react";
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

      if (response.data.error) {
        toast.error(response.data.messageError || "Inconsistência ao cadastrar.");
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
      <div className="absolute inset-0">
        <div className="-top-40 -right-24 float-slow absolute bg-primary/20 blur-3xl rounded-full w-96 h-96" />
        <div className="bottom-0 -left-32 float-slow absolute bg-emerald-400/10 blur-3xl rounded-full w-80 h-80" />
      </div>

      <div className="z-10 relative flex items-center mx-auto px-6 py-10 max-w-6xl min-h-screen">
        <div className="gap-10 grid lg:grid-cols-[0.95fr_1.05fr] w-full">
          <main className="fade-up">
            <div className="bg-card/80 shadow-2xl p-8 sm:p-10 border border-border rounded-3xl glow-panel">
              <div className="mb-8">
                <p className="font-semibold text-muted text-xs uppercase tracking-[0.35em]">Cadastro</p>
                <h2 className="mt-3 font-semibold text-foreground text-2xl">Crie sua conta MediS</h2>
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
                  className="bg-primary hover:bg-primary-dark mt-2 px-4 py-2 rounded-lg font-semibold text-on-primary transition-colors cursor-pointer"
                >
                  Criar conta
                </button>
              </form>

              <div className="mt-6 text-muted text-sm">
                Ja tem conta? <a href="/login" className="text-primary hover:underline">Entrar</a>
              </div>
            </div>
          </main>

          <aside className="flex flex-col justify-center gap-6 fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center bg-primary rounded-2xl w-10 h-10 font-bold text-on-primary">M</div>
              <div>
                <p className="text-muted text-sm uppercase tracking-[0.3em]">MediS</p>
                <p className="text-muted text-xs">Primeiro acesso</p>
              </div>
            </div>
            <h2 className="font-semibold text-foreground text-3xl sm:text-4xl">Configure seu ambiente em poucos minutos</h2>
            <p className="text-muted text-sm sm:text-base">
              Cadastre-se para habilitar dashboards, cadastro de totens e relatorios inteligentes.
            </p>
            <div className="gap-3 grid">
              {["Onboarding rápido", "Controle de usuários", "Visão geográfica", "Indicadores-chave"].map((item) => (
                <div key={item} className="bg-card/70 px-4 py-3 border border-border rounded-2xl font-semibold text-foreground text-sm">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
