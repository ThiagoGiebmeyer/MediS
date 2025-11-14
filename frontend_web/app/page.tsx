"use client";

import { login } from "@/services/login";
import axios from "axios";
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError("");

    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);

      if (response.error) {
        toast.error(response.data.messageError || "Erro ao fazer login.");
        return;
      }

      const token = response.data[0].token;

      // salva o token
      toast.success("Sucesso!");
      localStorage.setItem("token", token);

      router.push("/dashboard");

    } catch (err: any) {
      if (err.response) {
        toast.error(err.response.data.messageError || "Erro ao fazer login.");
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
    <div className="flex justify-center items-center bg-background min-h-screen font-sans">
      <main className="flex flex-col items-center bg-background sm:bg-card shadow-2xl sm:shadow-primary p-8 rounded-xl w-full max-w-md">
        <div className="flex sm:flex-row flex-col gap-0 sm:gap-2 mb-8">
          <h1 className="font-bold text-primary-dark text-3xl text-center">MediS</h1>
          <h1 className="hidden sm:block mt-2 text-muted text-sm text-center">|</h1>
          <p className="mt-2 text-muted text-sm text-center">Faça login para continuar</p>
        </div>

        {/* Mensagem de erro removida, agora via toast */}

        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
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
            className="bg-primary-dark hover:bg-input-text mt-4 px-4 py-2 rounded-lg font-semibold text-background transition-colors cursor-pointer"
          >
            Entrar
          </button>
        </form>
        <button
          type="button"
          onClick={goToRegister}
          className="mt-2 px-4 py-2 rounded-lg w-[50%] font-semibold text-input-text hover:text-primary transition-colors cursor-pointer"
        >
          Registrar
        </button>

        <div className="mt-6 text-muted text-sm">
          Esqueceu a senha? <a href="#" className="text-primary hover:underline">Recuperar</a>
        </div>

      </main>
    </div>
  );
}
