import Link from "next/link";

const OPERATING_CARDS = [
  {
    title: "Sensoriamento vivo",
    text: "Totens conectados enviam leituras contínuas para a nuvem em ciclos definidos por você.",
  },
  {
    title: "Análise com contexto",
    text: "A imagem da coleta é combinada com temperatura e umidade para decisões técnicas mais rápidas.",
  },
  {
    title: "Gestão territorial",
    text: "Mapa, dashboard e relatórios compartilham a mesma base de dados do cultivo.",
  },
];

const FLOW_STEPS = [
  "Conecte o totem via Bluetooth e finalize no Wi-Fi",
  "Defina intervalo e localização da coleta",
  "Acompanhe os registros no dashboard em tempo real",
  "Transforme histórico em ações com relatórios e alertas",
];

const MICRO_CARDS = [
  {
    label: "Operação",
    title: "Cadastre e ajuste totems",
    text: "Fluxo guiado para novo equipamento, edição de parâmetros e gestão de campo.",
  },
  {
    label: "Visibilidade",
    title: "Painel de leitura contínua",
    text: "Entenda o comportamento ambiental por período com clareza visual.",
  },
  {
    label: "Inteligência",
    title: "Análises com evidência",
    text: "Resumo, confiança e sinais observados em cada imagem processada.",
  },
  {
    label: "Planejamento",
    title: "Relatórios acionáveis",
    text: "Consolide intervalos, anomalias e histórico para apoiar o manejo.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(3,105,161,0.25),rgba(6,78,59,0.2),rgba(2,6,23,0.95))]" />
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="absolute inset-0">
        <div className="-top-52 right-0 float-slow absolute bg-primary/25 blur-3xl rounded-full w-[32rem] h-[32rem]" />
        <div className="top-1/2 -left-32 float-slow absolute bg-emerald-400/20 blur-3xl rounded-full w-96 h-96" />
        <div className="right-1/3 -bottom-24 float-slow absolute bg-cyan-400/15 blur-3xl rounded-full w-80 h-80" />
      </div>

      <header className="z-10 relative flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 mx-auto px-6 pt-8 max-w-6xl fade-in">
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center bg-primary/90 shadow-lg shadow-primary/30 rounded-2xl w-11 h-11 font-black text-on-primary text-lg">M</div>
          <div>
            <p className="text-muted text-xs uppercase tracking-[0.35em]">MediS Platform</p>
            <p className="text-muted text-xs">Monitoramento agrícola orientado por dados</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="bg-card/65 hover:bg-card px-5 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/sign-up"
            className="bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 px-5 py-2 rounded-full font-semibold text-on-primary text-sm transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </header>

      <main className="z-10 relative flex flex-col gap-16 mx-auto px-6 pt-14 pb-24 max-w-6xl">
        <section className="items-center gap-8 grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="fade-up" style={{ animationDelay: "0.05s" }}>
            <span className="inline-flex items-center gap-2 bg-card/70 px-4 py-2 border border-border rounded-full font-semibold text-muted text-[11px] uppercase tracking-[0.35em]">
              <span className="bg-primary rounded-full w-2 h-2" />
              Ecossistema MediS
            </span>
            <h1 className="mt-6 max-w-3xl font-semibold text-foreground text-4xl sm:text-5xl leading-tight">
              Da coleta no totem à decisão no campo, tudo no mesmo fluxo operacional.
            </h1>
            <p className="mt-5 max-w-2xl text-muted text-base sm:text-lg">
              O MediS integra monitoramento ambiental, imagens e análise inteligente para transformar dados de cultivo em ação prática.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/sign-up"
                className="bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 px-6 py-3 rounded-full font-semibold text-on-primary text-sm transition-colors"
              >
                Começar agora
              </Link>
              <Link
                href="/login"
                className="bg-card/70 hover:bg-card px-6 py-3 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
              >
                Já tenho acesso
              </Link>
            </div>
            <div className="gap-4 grid sm:grid-cols-3 mt-8">
              {OPERATING_CARDS.map((card) => (
                <article key={card.title} className="bg-card/80 backdrop-blur-sm p-4 border border-border rounded-2xl glow-panel">
                  <p className="font-semibold text-foreground text-sm">{card.title}</p>
                  <p className="mt-2 text-muted text-xs leading-relaxed">{card.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="bg-card/85 shadow-2xl backdrop-blur-md p-6 sm:p-7 border border-border rounded-3xl glow-panel">
              <p className="font-semibold text-muted text-xs uppercase tracking-[0.3em]">Fluxo de operação</p>
              <h2 className="mt-3 font-semibold text-foreground text-2xl">Jornada orientada para resultado</h2>
              <div className="space-y-3 mt-6">
                {FLOW_STEPS.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 bg-card-alt/65 px-4 py-3 border border-border/70 rounded-2xl">
                    <span className="flex justify-center items-center bg-primary/15 mt-0.5 rounded-full w-6 h-6 font-bold text-primary text-xs shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-foreground text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
              <div className="gap-3 grid sm:grid-cols-2 mt-6">
                <div className="bg-primary/10 px-4 py-3 border border-primary/30 rounded-2xl">
                  <p className="font-semibold text-primary text-sm">Dados contínuos</p>
                  <p className="mt-1 text-muted text-xs">Leituras enviadas automaticamente ao backend.</p>
                </div>
                <div className="bg-primary/10 px-4 py-3 border border-primary/30 rounded-2xl">
                  <p className="font-semibold text-primary text-sm">Rastreabilidade</p>
                  <p className="mt-1 text-muted text-xs">Cada análise aponta origem, horário e contexto.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fade-up" style={{ animationDelay: "0.23s" }}>
          <div className="gap-4 grid lg:grid-cols-4 sm:grid-cols-2">
            {MICRO_CARDS.map((card) => (
              <article
                key={card.title}
                className="group relative bg-card/80 backdrop-blur-sm p-5 border border-border rounded-3xl overflow-hidden transition-transform hover:-translate-y-1 duration-300"
              >
                <div className="-top-14 -right-14 absolute bg-primary/20 group-hover:opacity-100 blur-2xl rounded-full w-28 h-28 opacity-70 transition-opacity duration-300" />
                <p className="font-semibold text-muted text-[10px] uppercase tracking-[0.28em]">{card.label}</p>
                <p className="mt-2 font-semibold text-foreground text-lg leading-tight">{card.title}</p>
                <p className="mt-3 text-muted text-sm leading-relaxed">{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="bg-card/85 shadow-2xl backdrop-blur-md p-8 sm:p-10 border border-border rounded-3xl text-center glow-panel">
            <p className="font-semibold text-muted text-xs uppercase tracking-[0.35em]">Comece agora</p>
            <h2 className="mt-4 font-semibold text-foreground text-3xl sm:text-4xl">
              Estruture seu cultivo com decisões baseadas em evidência.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-muted text-sm sm:text-base">
              Crie sua conta e integre seus totems para acompanhar cada coleta com clareza, consistência e resposta rápida.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-7">
              <Link
                href="/sign-up"
                className="bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 px-6 py-3 rounded-full font-semibold text-on-primary text-sm transition-colors"
              >
                Criar conta MediS
              </Link>
              <Link
                href="/login"
                className="bg-card/70 hover:bg-card px-6 py-3 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
              >
                Entrar na plataforma
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
