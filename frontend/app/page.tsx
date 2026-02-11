import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div className="-top-40 -right-24 float-slow absolute bg-primary/20 blur-3xl rounded-full w-96 h-96" />
        <div className="top-1/3 -left-28 float-slow absolute bg-cyan-400/20 blur-3xl rounded-full w-72 h-72" />
        <div className="right-1/3 bottom-0 float-slow absolute bg-emerald-400/10 blur-3xl rounded-full w-80 h-80" />
      </div>

      <header className="z-10 relative flex justify-between items-center mx-auto px-6 pt-8 max-w-6xl fade-in">
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center bg-primary rounded-2xl w-10 h-10 font-bold text-on-primary">M</div>
          <div>
            <p className="text-muted text-sm uppercase tracking-[0.3em]">MediS</p>
            <p className="text-muted text-xs">Monitoramento inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-full font-semibold text-on-primary text-sm transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </header>

      <main className="z-10 relative flex flex-col gap-16 mx-auto px-6 pt-16 pb-24 max-w-6xl">
        <section className="items-center gap-10 grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6 fade-up" style={{ animationDelay: "0.05s" }}>
            <span className="bg-card px-4 py-2 border border-border rounded-full w-fit font-semibold text-muted text-xs uppercase tracking-[0.35em]">
              Plataforma MediS
            </span>
            <h1 className="font-semibold text-foreground text-4xl sm:text-5xl leading-tight">
              Monitore o crescimento das plantas em tempo real com análises preditivas e imagens de alta precisão.
            </h1>
            <p className="text-muted text-base sm:text-lg">
              O MediS combina sensores ambientais, imagens e inteligência artificial para apoiar decisão agrícola. Receba dados de temperatura e umidade, acompanhe históricos e visualize a evolução do cultivo em um painel único.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="bg-primary hover:bg-primary-dark px-6 py-3 rounded-full font-semibold text-on-primary text-sm transition-colors"
              >
                Acessar plataforma
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
              >
                Criar minha conta
              </Link>
            </div>
            <div className="gap-4 grid sm:grid-cols-3">
              {[
                "Sensores conectados",
                "Dashboards dinâmicos",
                "Relatórios inteligentes"
              ].map((item) => (
                <div key={item} className="bg-card/80 shadow-lg p-4 border border-border rounded-2xl glow-panel">
                  <p className="font-semibold text-foreground text-sm">{item}</p>
                  <p className="mt-2 text-muted text-xs">Dados sincronizados com o totem em poucos segundos.</p>
                </div>
              ))}
            </div>
          </div>

          <div className="gap-4 grid sm:grid-cols-2 fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="bg-card/80 shadow-xl p-6 border border-border rounded-3xl glow-panel">
              <p className="font-semibold text-muted text-xs uppercase tracking-[0.3em]">Tempo real</p>
              <p className="mt-4 font-semibold text-foreground text-2xl">Imagens + dados ambientais</p>
              <p className="mt-3 text-muted text-sm">Capture fotos periódicas e correlacione com temperatura e umidade para entender a saúde do cultivo.</p>
            </div>
            <div className="bg-card/80 shadow-xl p-6 border border-border rounded-3xl glow-panel">
              <p className="font-semibold text-muted text-xs uppercase tracking-[0.3em]">Operacao</p>
              <p className="mt-4 font-semibold text-foreground text-2xl">Totem inteligente</p>
              <p className="mt-3 text-muted text-sm">Configuração via Bluetooth e Wi-Fi para enviar leituras automáticas para a nuvem.</p>
            </div>
            <div className="sm:col-span-2 bg-card/80 shadow-xl p-6 border border-border rounded-3xl glow-panel">
              <p className="font-semibold text-muted text-xs uppercase tracking-[0.3em]">IA aplicada</p>
              <p className="mt-4 font-semibold text-foreground text-2xl">Diagnóstico assistido</p>
              <p className="mt-3 text-muted text-sm">Classifique fases de crescimento e gere alertas preventivos para suportar o manejo agronômico.</p>
            </div>
          </div>
        </section>

        <section className="gap-6 grid lg:grid-cols-[1.1fr_0.9fr] fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-col gap-4">
            <p className="font-semibold text-muted text-xs uppercase tracking-[0.3em]">Tour guiado</p>
            <h2 className="font-semibold text-foreground text-3xl sm:text-4xl">Siga o fluxo do MediS em minutos</h2>
            <p className="text-muted text-sm sm:text-base">
              Um caminho claro do sensor até a decisão. Cada etapa entrega dados confiáveis e visualização moderna para acelerar o manejo.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "1. Conecte o totem via Bluetooth",
                "2. Envie leituras com imagem",
                "3. Analise tendências no dashboard",
                "4. Gere relatorios e alertas"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-card/70 px-4 py-3 border border-border rounded-2xl">
                  <div className="bg-primary rounded-full w-2 h-2" />
                  <p className="font-semibold text-foreground text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="gap-4 grid sm:grid-cols-2">
            {[
              { title: "Totem", text: "Captura imagens e dados ambientais em intervalos definidos." },
              { title: "Pipeline", text: "Upload seguro, validado e pronto para processamento." },
              { title: "Dashboards", text: "Gráficos e mapas atualizados a cada coleta." },
              { title: "Insights", text: "Históricos e comparativos para decisão rápida." }
            ].map((card) => (
              <div
                key={card.title}
                className="group relative bg-card/70 shadow-lg p-5 border border-border rounded-3xl overflow-hidden transition-transform hover:-translate-y-1 duration-300 glow-panel"
              >
                <div className="-top-12 -right-12 absolute bg-primary/20 group-hover:opacity-100 blur-2xl rounded-full w-28 h-28 transition-opacity duration-300" />
                <p className="font-semibold text-foreground text-lg">{card.title}</p>
                <p className="mt-2 text-muted text-sm">{card.text}</p>
                <div className="bg-card-alt mt-4 rounded-full w-full h-1">
                  <div className="bg-primary rounded-full w-2/3 group-hover:w-full h-1 transition-all duration-500" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="gap-6 grid lg:grid-cols-3 fade-up" style={{ animationDelay: "0.25s" }}>
          {[
            { title: "Conecte", text: "Sincronize o totem MediS e configure intervalos de coleta sob medida." },
            { title: "Analise", text: "Explore graficos, mapas e comparativos para descobrir padroes." },
            { title: "Decida", text: "Transforme dados em acoes com relatorios e alertas inteligentes." }
          ].map((item) => (
            <div key={item.title} className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl glow-panel">
              <p className="font-semibold text-foreground text-lg">{item.title}</p>
              <p className="mt-3 text-muted text-sm">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col items-center gap-4 bg-card/80 shadow-xl p-10 border border-border rounded-3xl text-center glow-panel fade-up" style={{ animationDelay: "0.3s" }}>
          <p className="font-semibold text-muted text-xs uppercase tracking-[0.3em]">Bem-vindo ao MediS</p>
          <h2 className="font-semibold text-foreground text-3xl sm:text-4xl">Controle total do cultivo em um único painel</h2>
          <p className="max-w-2xl text-muted text-sm sm:text-base">
            Crie sua conta, cadastre seus totens e acompanhe a evolução do cultivo com dados confiáveis e visualizações modernas.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary-dark px-6 py-3 rounded-full font-semibold text-on-primary text-sm transition-colors"
            >
              Quero experimentar
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
