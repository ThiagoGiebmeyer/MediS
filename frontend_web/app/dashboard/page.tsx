
"use client";
import { getDashboardData } from "@/services/dashboard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";


export default function Dashboard() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(false);
  const [totemData, setTotemData] = useState<any[]>([]);
  const [totens, setTotens] = useState<any[]>([]);
  const [selectedTotem, setSelectedTotem] = useState<string>("");
  const [loading, setLoading] = useState(true);

  function getTotemName(): string {
    return totens.find((t: any) => t._id === selectedTotem)?.nome || "";
  }

  function getSelectedColetas() {
    return totemData.find((t: any) => t.totem._id === selectedTotem)?.coletas || [];
  }

  function getMediaTemp(): string {
    const coletas = getSelectedColetas();
    if (coletas.length === 0) return "-";
    const avg = coletas.reduce((acc: number, cur: any) => acc + cur.temperatura, 0) / coletas.length;
    return avg.toFixed(1) + " °C";
  }

  function getMediaUmidade(): string {
    const coletas = getSelectedColetas();
    if (coletas.length === 0) return "-";
    const avg = coletas.reduce((acc: number, cur: any) => acc + cur.umidade, 0) / coletas.length;
    return avg.toFixed(1) + "%";
  }

  function getTempData() {
    return getSelectedColetas().map((c: any) => ({
      valor: c.temperatura,
      timestamp: new Date(c.criado_em).toLocaleString()
    }));
  }

  function getUmidadeData() {
    return getSelectedColetas().map((c: any) => ({
      valor: c.umidade,
      timestamp: new Date(c.criado_em).toLocaleString()
    }));
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Não autorizado.");
      router.push("/");
      return;
    }
    async function load() {
      try {
        const data = await getDashboardData(token);
        setTotemData(data);
        setTotens(data.map((t: any) => t.totem));
        setSelectedTotem(data[0]?.totem._id || "");
      } catch (err) {
        if (err.response) {
          toast.error(err.response.data.messageError || "Erro ao carregar dados do dashboard.");
        } else {
          toast.error("Falha ao conectar ao servidor.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-primary-dark border-b-2 rounded-full w-16 h-16 animate-spin"></div>
      </div>
    );

  return (
    <div className="relative flex justify-center items-center bg-background w-full min-h-screen overflow-auto font-sans">

      {/* BOTÃO MOBILE */}
      <button
        onClick={() => setOpenMenu(true)}
        className="lg:hidden right-4 bottom-4 z-50 fixed flex justify-center items-center bg-primary-dark hover:bg-primary shadow border border-border rounded-xl w-12 h-12 text-background text-2xl sm:text-5xl transition-colors cursor-pointer"
      >
        +
      </button>

      {/* OVERLAY MOBILE */}
      {openMenu && (
        <div
          className="lg:hidden z-40 fixed inset-0 bg-black/40"
          onClick={() => setOpenMenu(false)}
        ></div>
      )}

      {/* WRAPPER QUE CENTRALIZA MENU + MAIN */}
      <div className="flex flex-row justify-center items-center gap-6 w-full h-full">

        {/* MENU LATERAL */}
        <div
          className={`
            bg-card shadow-sm lg:shadow-primary p-8 rounded-xl 
            h-screen lg:h-[90vh] flex flex-col justify-between z-50
            transition-transform duration-300 ease-in-out
            fixed lg:static top-0 left-0 
            w-[70vw] sm:w-[50vw] md:w-[30vw] lg:w-[9vw]
            ${openMenu ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div>
            <header className="flex flex-col items-center gap-4 mb-6 pb-6 border-border border-b">
              <div className="lg:pb-1 w-full">
                <h1 className="font-bold text-primary-dark text-3xl text-center">
                  MediS
                </h1>
              </div>
            </header>
          </div>

          <div className="flex flex-col items-center gap-4 h-full">
            <button
              type="submit"
              className="hover:bg-primary px-4 py-2 rounded-lg w-full font-semibold text-input-text hover:text-background transition-colors cursor-pointer"
            >
              Relátorios
            </button>
          </div>

          <button
            className="hover:bg-red-600 mb-2 px-4 py-2 rounded-lg w-full font-semibold text-white transition-colors cursor-pointer"
            onClick={() => {
              setLoading(true);
              localStorage.removeItem("token");
              router.push("/");
            }}
          >
            Logout
          </button>
        </div>

        {/* MAIN */}
        <main className="flex flex-col bg-card shadow-sm lg:shadow-primary p-4 sm:p-8 rounded-xl w-screen lg:w-[85%] h-screen lg:h-[90vh] overflow-auto">
          <header className="flex justify-between items-center mb-6 pb-6 border-border border-b">
            <div className="flex lg:justify-between items-center gap-3 lg:w-full">

              {/* BOTÃO MOBILE - MENU */}
              <button
                onClick={() => setOpenMenu(true)}
                className="lg:hidden bg-card shadow rounded-lg text-3xl cursor-pointer"
              >
                ☰
              </button>

              <div className="flex flex-row items-center gap-2">
                <h1 className="font-bold text-primary-dark text-3xl">Totens</h1>
                <h1 className="text-muted text-sm">|</h1>
                <p className="text-muted text-sm">Últimos 7 dias</p>
              </div>
              <button className="hidden lg:block bg-primary-dark hover:bg-primary px-4 py-2 rounded-lg font-semibold text-background transition-colors cursor-pointer ounded-lg">
                + Totem
              </button>
            </div>
          </header>

          {/* CARDS */}
          <section className="gap-4 grid grid-cols-1 sm:grid-cols-3">
            <div className="flex flex-col items-start bg-background shadow p-6 rounded-lg w-full">
              <span className="mb-2 text-muted text-sm">Totem</span>
              <div className="relative w-full">
                <select
                  value={selectedTotem}
                  onChange={e => setSelectedTotem(e.target.value)}
                  className="bg-background focus:border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-background w-full font-bold text-foreground text-2xl appearance-none cursor-pointer"
                >
                  {totens.map((t: any) => (
                    <option key={t._id} value={t._id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
                <div className="right-0 absolute inset-y-0 flex items-center pr-3 pointer-events-none">
                  {/* Ícone de seta */}
                  <svg
                    className="w-5 h-5 text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start bg-background shadow p-6 rounded-lg">
              <span className="mb-2 text-muted text-sm">Temperatura média</span>
              <span className="font-bold text-foreground text-2xl">{getMediaTemp()}</span>
            </div>
            <div className="flex flex-col items-start bg-background shadow p-6 rounded-lg">
              <span className="mb-2 text-muted text-sm">Umidade média</span>
              <span className="font-bold text-foreground text-2xl">{getMediaUmidade()}</span>
            </div>
          </section>

          <h2 className="mt-8 mb-4 font-semibold text-foreground text-xl">
            Últimos dados
          </h2>

          {/* GRAFICOS */}
          <section className="gap-8 grid grid-cols-1 lg:grid-cols-2 w-full min-h-0 grow">

            {/* Gráfico Temperatura */}
            <div className="flex flex-col w-full h-[250px] lg:h-full min-h-0">
              <span className="mb-2 text-muted text-sm">Temperatura</span>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getTempData()}
                  margin={{ top: 10, right: 0, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => `Hora: ${label}`} />
                  <Line type="monotone" dataKey="valor" stroke="#FACC15" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico Umidade */}
            <div className="flex flex-col w-full h-[250px] lg:h-full min-h-0">
              <span className="mb-2 text-muted text-sm">Umidade</span>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getUmidadeData()}
                  margin={{ top: 10, right: 0, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => `Hora: ${label}`} />
                  <Line type="monotone" dataKey="valor" stroke="#13cde6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </section>
        </main>

      </div>
    </div>
  );
}
