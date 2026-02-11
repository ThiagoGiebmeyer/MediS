"use client";

import { requestPasswordReset } from "@/services";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      toast.error("Informe seu e-mail.");
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordReset(email);
      if (response.error) {
        toast.error(response.messageError || "Inconsistência ao solicitar recuperação.");
        return;
      }
      setSubmitted(true);
      toast.success("Se o e-mail existir, enviaremos as instruções.");
    } catch (err: any) {
      toast.error("Falha ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="-top-40 -right-24 float-slow absolute bg-primary/20 blur-3xl rounded-full w-96 h-96" />
        <div className="bottom-0 -left-32 float-slow absolute bg-emerald-400/10 blur-3xl rounded-full w-80 h-80" />
      </div>

      <div className="z-10 relative flex items-center mx-auto px-6 py-10 max-w-4xl min-h-screen">
        <div className="w-full">
          <div className="bg-card/80 shadow-2xl p-8 sm:p-10 border border-border rounded-3xl glow-panel fade-up">
            <div className="mb-6">
              <p className="font-semibold text-muted text-xs uppercase tracking-[0.35em]">Recuperação</p>
              <h1 className="mt-3 font-semibold text-foreground text-3xl sm:text-4xl">Recupere sua senha</h1>
              <p className="mt-2 text-muted text-sm sm:text-base">
                Informe seu e-mail para receber instruções de redefinição. Se a conta existir, enviaremos o passo a passo.
              </p>
            </div>

            {submitted ? (
              <div className="bg-card/70 p-6 border border-border rounded-2xl">
                <p className="font-semibold text-foreground text-sm">Solicitacao enviada</p>
                <p className="mt-2 text-muted text-sm">
                  Verifique sua caixa de entrada e spam. Se não receber, tente novamente em alguns minutos.
                </p>
                <Link
                  href="/login"
                  className="inline-flex mt-4 px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
                >
                  Voltar ao login
                </Link>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-muted text-sm">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                    placeholder="Digite seu e-mail"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary-dark disabled:opacity-60 mt-2 px-4 py-2 rounded-lg font-semibold text-on-primary transition-colors cursor-pointer"
                >
                  {loading ? "Enviando..." : "Enviar instruções"}
                </button>

                <Link
                  href="/login"
                  className="font-semibold text-primary hover:text-primary-dark text-sm transition-colors"
                >
                  Voltar ao login
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
