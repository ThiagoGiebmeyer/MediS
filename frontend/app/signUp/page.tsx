"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { register } from "@/services/index";

export default function Register() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !sobrenome || !email || !password) {
      toast.error("Por favor, preencha todos os campos.");
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

      router.push("/");

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
    <div className="flex justify-center items-center bg-background min-h-screen font-sans">
      <main className="flex flex-col items-center bg-background sm:bg-card shadow-2xl sm:shadow-primary p-8 rounded-xl w-full max-w-md">

        <div className="flex sm:flex-row flex-col gap-0 sm:gap-2 mb-8">
          <h1 className="font-bold text-primary-dark text-3xl text-center">MediS</h1>
          <h1 className="hidden sm:block mt-2 text-muted text-sm text-center">|</h1>
          <p className="mt-2 text-muted text-sm text-center">Crie sua conta para continuar</p>
        </div>

        {/* Mensagem de erro removida, agora via toast */}

        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>

          {/* Nome */}
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

          {/* Sobrenome */}
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

          {/* Email */}
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

          {/* Senha */}
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

          <button
            type="submit"
            className="bg-primary-dark hover:bg-primary mt-4 px-4 py-2 rounded-lg font-semibold text-background transition-colors cursor-pointer"
          >
            Criar conta
          </button>
        </form>

        <div className="mt-6 text-muted text-sm">
          Já tem conta? <a href="/" className="text-primary hover:underline">Entrar</a>
        </div>
      </main>
    </div>
  );
}
