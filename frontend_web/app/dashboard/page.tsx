"use client";

import {
  BarChart2,
  Bluetooth,
  Cog,
  Loader2,
  Lock,
  Map as MapIcon,
  Paperclip,
  Plus,
  RefreshCcw,
  Wifi,
  Check,
  MapPin,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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

import { getDashboardData } from "@/services/dashboard";
import { postNewTotem } from "@/services/totem";
import { Totem } from "@/types";
import { isTokenExpired } from "@/utils";
import dynamic from 'next/dynamic';

// --- HELPER: Gerar ObjectId do MongoDB no Frontend ---
const generateMongoObjectId = () => {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
    return (Math.random() * 16 | 0).toString(16);
  }).toLowerCase();
};

// --- MANUAL TYPE DEFINITIONS ---
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface BluetoothRemoteGATTService extends EventTarget {
  device: BluetoothDevice;
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface Navigator {
  bluetooth: {
    requestDevice(options?: any): Promise<BluetoothDevice>;
  };
}

// --- Types ---
interface Measurement {
  temperatura: number;
  umidade: number;
  criado_em: string;
}

interface DashboardDataItem {
  totem: Totem;
  coletas: Measurement[];
}

interface WifiNetwork {
  ssid: string;
  rssi: number;
  secure: boolean;
}

// --- CONSTANTES DE CONEXÃO ---
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

// --- Sub-component: Add Totem Modal ---
interface AddTotemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customId: string) => void; // Atualizado para receber ID
  name: string;
  setName: (value: string) => void;
  latitude: string;
  setLatitude: (value: string) => void;
  longitude: string;
  setLongitude: (value: string) => void;
  intervalo: string;
  setIntervalo: (value: string) => void;
  isLoadingLocation: boolean;
  onGetLocation: () => void;
}

const AddTotemModal = ({
  isOpen,
  onClose,
  onSave,
  name,
  setName,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  intervalo,
  setIntervalo,
  isLoadingLocation,
  onGetLocation
}: AddTotemModalProps) => {
  const [step, setStep] = useState<"bluetooth" | "wifi" | "connecting_wifi" | 'details'>("bluetooth");
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [wifiList, setWifiList] = useState<WifiNetwork[]>([]);
  const [selectedWifi, setSelectedWifi] = useState<WifiNetwork | null>(null);
  const [wifiPassword, setWifiPassword] = useState("");
  const [isSendingWifi, setIsSendingWifi] = useState(false);

  // ID Gerado para este novo Totem
  const [generatedTotemId, setGeneratedTotemId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep("bluetooth");
      setConnectedDevice(null);
      setSelectedWifi(null);
      setWifiPassword("");
      setWifiList([]);
      setIsSendingWifi(false);
      setShowPassword(false);
      // Gera um ID novo sempre que abre o modal
      setGeneratedTotemId(generateMongoObjectId());
    }
  }, [isOpen]);

  // 1. Função para Conectar Bluetooth e Ler Lista
  const handleScanBluetooth = async () => {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        toast.error("Web Bluetooth não suportado neste navegador.");
        return;
      }

      setIsConnecting(true);

      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }]
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Falha no servidor GATT");

      setConnectedDevice(device);
      toast.success(`Conectado ao hardware: ${device.name}`);

      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

      // Delay para garantir scan do ESP32
      await new Promise(resolve => setTimeout(resolve, 15000));

      const value = await characteristic.readValue();
      const decoder = new TextDecoder('utf-8');
      const jsonString = decoder.decode(value);

      console.log("Recebido do Totem:", jsonString);

      try {
        // Verifica se veio um status de conexão ao invés de lista
        // (Caso o ESP32 já estivesse conectado anteriormente)
        const parsed = JSON.parse(jsonString);
        if (parsed.status === "connected") {
          toast.success("Totem já está conectado!");
          setStep("details");
        } else {
          const networks: WifiNetwork[] = parsed;
          networks.sort((a, b) => b.rssi - a.rssi);
          setWifiList(networks);
          setStep("wifi");
        }
      } catch (e) {
        console.error("JSON inválido:", jsonString);
        toast.error("Erro ao ler lista de Wi-Fi. Tente novamente.");
      }

    } catch (error: any) {
      console.error(error);
      if (error.name !== 'NotFoundError') {
        setConnectedDevice(null);
        toast.error("Erro de conexão Bluetooth.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // 2. Função para Enviar Configuração (Incluindo ID)
  const handleSendWifiConfig = async () => {
    if (!selectedWifi || !connectedDevice || !connectedDevice.gatt?.connected) {
      toast.error("Dispositivo desconectado.");
      return;
    }

    // Valida intervalo antes de enviar
    let intervalInt = 1; // Padrão
    try {
      // Recalcula expressão se necessário (ex: usuário digitou e não saiu do campo)
      const sanitized = intervalo.replace(/x/gi, "*");
      if (/^[0-9+\-*/\s]*$/.test(sanitized)) {
        const calc = Function(`return ${sanitized || '60'}`)();
        if (!isNaN(calc)) intervalInt = Math.abs(Math.min(calc, 1440));
      }
    } catch { }

    if (intervalInt < 1) {
      toast.error("Intervalo inválido.");
      return;
    }

    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

    try {
      setIsSendingWifi(true);
      setStep("connecting_wifi");

      const server = connectedDevice.gatt;
      const service = await server.getPrimaryService(SERVICE_UUID);
      characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

      const handleCharacteristicValueChanged = (event: any) => {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const responseStr = decoder.decode(value);
        console.log("Feedback do Totem:", responseStr);

        try {
          const response = JSON.parse(responseStr);

          if (response.status === "connected") {
            toast.success("Totem conectado e configurado!");
            cleanup();
            setStep("details");
          } else if (response.status === "error" || response.status === "fail") {
            toast.error("Falha: Senha incorreta ou erro de rede.");
            cleanup();
            setStep("wifi");
          }
        } catch (e) { }
      };

      const cleanup = () => {
        if (characteristic) {
          characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
          characteristic.stopNotifications().catch(() => { });
        }
        setIsSendingWifi(false);
      };

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

      // --- PAYLOAD COMPLETO (Com totem_id) ---
      const payload = JSON.stringify({
        ssid: selectedWifi.ssid.trim(),
        password: wifiPassword.trim(),
        interval: 1,
        totem_id: generatedTotemId.trim(),
        ip: process.env.NEXT_PUBLIC_API_URL,
        port: process.env.NEXT_PUBLIC_API_PORT
      });

      const encoder = new TextEncoder();
      await characteristic.writeValue(encoder.encode(payload));

    } catch (error) {
      console.error(error);
      toast.error("Erro de comunicação.");
      setStep("wifi");
      setIsSendingWifi(false);
    }
  };

  function handleIntervaloChange() {
    const raw = intervalo;
    const sanitized = raw.replace(/x/gi, "*");
    if (!/^[0-9+\-*/\s]*$/.test(sanitized)) return;
    let result = sanitized;
    try {
      const calculated = Function(`return ${sanitized || ''}`)();
      if (!isNaN(calculated)) {
        const limited = Math.abs(Math.min(calculated, 1440));
        result = limited.toString();
      }
    } catch { }
    setIntervalo(result);
  }

  if (!isOpen) return null;

  return (
    <div className="z-999 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-card shadow-2xl p-6 border border-border rounded-xl w-full max-w-lg animate-in duration-300 fade-in zoom-in">

        {/* STEP 1: BLUETOOTH */}
        {step === "bluetooth" && (
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 mb-4 p-4 rounded-full">
              {connectedDevice ? <Wifi size={48} className="text-blue-600" /> : <Bluetooth size={48} className="text-blue-600" />}
            </div>
            <h2 className="mb-2 font-bold text-foreground text-2xl">Configurar novo Totem</h2>

            {/* Debug visual do ID (opcional) */}
            <span className="mb-2 font-mono text-[10px] text-gray-400">ID: {generatedTotemId}</span>

            {connectedDevice ? (
              <p className="flex items-center gap-1 mb-4 text-yellow-600 text-xs">
                <AlertCircle size={12} /> Isso pode levar até 15 segundos.
              </p>
            ) : (
              <p className="mb-6 text-muted text-sm">
                Ative o Bluetooth do seu dispositivo. Clique abaixo para buscar totens próximos.
              </p>
            )}

            <button
              onClick={handleScanBluetooth}
              disabled={isConnecting}
              className="flex justify-center items-center gap-2 bg-card hover:bg-primary-dark disabled:opacity-50 px-4 py-2 border border-primary-dark rounded-lg w-full font-semibold text-text-button hover:text-text transition-colors cursor-pointer"
            >
              {isConnecting ? (
                <><Loader2 className="animate-spin" /> {connectedDevice ? "Buscando redes Wi-Fi..." : "Conectando..."}</>
              ) : (
                <>Buscar Dispositivos</>
              )}
            </button>
            {!connectedDevice && (
              <button onClick={onClose} className="mt-4 font-medium text-muted hover:text-foreground text-sm transition-colors cursor-pointer">
                Cancelar
              </button>
            )}
          </div>
        )}

        {/* STEP 2: WIFI SELECTION */}
        {step === "wifi" && (
          <div className="flex flex-col">
            <h2 className="flex items-center gap-2 mb-4 font-bold text-foreground text-xl">
              <Wifi className="text-blue-600" /> Selecione o Wi-Fi
            </h2>

            <div className="bg-background mb-4 border border-border rounded-lg max-h-48 overflow-y-auto no-scrollbar">
              {wifiList.length === 0 ? (
                <div className="p-4 text-muted text-sm text-center">Nenhuma rede encontrada.</div>
              ) : (
                wifiList.slice(0, 8).map((wifi, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedWifi(wifi)}
                    className={`flex items-center justify-between p-3 cursor-pointer border-b border-border last:border-0 hover:bg-primary/10 transition-colors ${selectedWifi?.ssid === wifi.ssid ? 'bg-primary-50 border-l-4 border-l-primary' : ''}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Wifi size={18} className={wifi.rssi > -60 ? "text-green-600" : "text-muted"} />
                      <span className="font-medium text-foreground text-sm truncate">{wifi.ssid}</span>
                    </div>
                    {wifi.secure && <Lock size={14} className="text-muted" />}
                  </div>
                ))
              )}
            </div>

            {selectedWifi && (
              <div className="slide-in-from-top-2 mb-4 animate-in fade-in">
                <label className="font-bold text-muted text-xs uppercase">Senha da rede <strong>{selectedWifi?.ssid}</strong></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="bg-input-bg px-4 py-2 pr-10 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full text-input-text"
                    placeholder="Digite a senha..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="top-1/2 right-3 absolute text-muted hover:text-foreground -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <button onClick={onClose} className="px-4 py-2 font-semibold text-muted hover:text-foreground">Cancelar</button>
              <button
                onClick={handleSendWifiConfig}
                disabled={!selectedWifi || isSendingWifi}
                className="flex justify-center items-center gap-2 bg-card hover:bg-primary-dark disabled:opacity-50 px-4 py-2 border border-primary-dark rounded-lg font-semibold text-text-button hover:text-text transition-colors cursor-pointer"
              >
                {isSendingWifi ? <Loader2 className="animate-spin" size={18} /> : "Conectar"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONNECTING (LOADING) */}
        {step === "connecting_wifi" && (
          <div className="flex flex-col items-center py-8 text-center animate-in fade-in">
            <div className="bg-blue-100 mb-4 p-4 rounded-full">
              <Loader2 size={48} className="text-blue-600 animate-spin" />
            </div>
            <h2 className="font-bold text-foreground text-xl">Conectando Totem ao Wi-Fi...</h2>
            <span className="mb-2 font-mono text-[10px] text-gray-400">ID: {generatedTotemId}</span>
            <p className="mt-2 max-w-xs text-muted text-sm">
              Aguarde a confirmação...
            </p>
            <p className="flex items-center gap-1 mt-4 text-yellow-600 text-xs">
              <AlertCircle size={12} /> Isso pode levar até 15 segundos.
            </p>
          </div>
        )}

        {/* STEP 4: DETAILS (FINAL FORM) */}
        {step === "details" && (
          <div className="animate-in fade-in">
            <header className="flex flex-col items-center gap-4 mb-2 pb-2 border-border border-b">
              <h1 className="font-bold text-primary-dark text-3xl text-center">Novo totem</h1>
            </header>

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-muted text-sm">Nome do Totem</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                placeholder='Ex: Totem no milharal'
              />
            </div>

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-muted text-sm">Intervalo entre coletas (minutos)</label>
              <input
                value={intervalo}
                onChange={(e) => setIntervalo(e.target.value.toUpperCase())}
                onBlur={handleIntervaloChange}
                className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                placeholder="Ex: 60"
              />
            </div>

            <div className="gap-4 grid grid-cols-2 lg:grid-cols-1 w-full">
              <div className="flex flex-col gap-1 mb-4 w-full">
                <label className="text-muted text-sm">Latitude</label>
                <input
                  disabled
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="bg-background mt-1 px-3 py-2 border border-border rounded-lg w-full disabled:text-gray-500"
                  placeholder='...'
                />
              </div>
              <div className="flex flex-col gap-1 mb-4 w-full">
                <label className="text-muted text-sm">Longitude</label>
                <input
                  disabled
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="bg-background mt-1 px-3 py-2 border border-border rounded-lg w-full disabled:text-gray-500"
                  placeholder='...'
                />
              </div>
            </div>

            <button
              onClick={onGetLocation}
              disabled={isLoadingLocation}
              className="flex justify-center items-center gap-2 bg-card hover:bg-primary-dark disabled:opacity-50 mt-4 px-4 py-2 border border-primary-dark rounded-lg w-full font-semibold text-text-button hover:text-text transition-colors cursor-pointer"
            >
              <MapPin />
              {isLoadingLocation ? "Coletando..." : "Coletar localização atual"}
            </button>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="hover:bg-red-600 px-4 py-2 rounded-lg font-semibold text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              {/* Botão Salvar usa o ID gerado */}
              <button
                onClick={() => onSave(generatedTotemId)}
                className="items-center gap-2 bg-card hover:bg-primary-dark px-4 py-2 border border-primary-dark rounded-lg w-[50%] font-semibold text-text-button hover:text-text transition-colors cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---
export default function Dashboard() {
  const router = useRouter();
  const MapContainer = dynamic(() => import("./RealMap"), { ssr: false });

  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTotemModalOpen, setIsAddTotemModalOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [viewMode, setViewMode] = useState<"charts" | "map" | "reports">("charts");

  // Data State
  const [dashboardData, setDashboardData] = useState<DashboardDataItem[]>([]);
  const [totems, setTotems] = useState<Totem[]>([]);
  const [selectedTotemId, setSelectedTotemId] = useState<string>("");

  // Form State
  const [newTotemName, setNewTotemName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [intervalo, setIntervalo] = useState("");

  // ... (Helpers de média e gráficos mantidos iguais) ...
  const selectedMeasurements = useMemo(() => {
    if (!Array.isArray(dashboardData)) return [];

    return dashboardData.find((item) => item.totem._id === selectedTotemId)?.coletas || [];
  }, [dashboardData, selectedTotemId]);

  const averageTemperature = useMemo(() => {
    if (selectedMeasurements.length === 0) return "-";
    const total = selectedMeasurements.reduce((acc, cur) => acc + cur.temperatura, 0);
    return (total / selectedMeasurements.length).toFixed(1) + " °C";
  }, [selectedMeasurements]);

  const averageHumidity = useMemo(() => {
    if (selectedMeasurements.length === 0) return "-";
    const total = selectedMeasurements.reduce((acc, cur) => acc + cur.umidade, 0);
    return (total / selectedMeasurements.length).toFixed(1) + "%";
  }, [selectedMeasurements]);

  const temperatureChartData = useMemo(() => {
    return selectedMeasurements.map((c) => ({
      value: c.temperatura,
      timestamp: new Date(c.criado_em).toLocaleString(),
    }));
  }, [selectedMeasurements]);

  const humidityChartData = useMemo(() => {
    return selectedMeasurements.map((c) => ({
      value: c.umidade,
      timestamp: new Date(c.criado_em).toLocaleString(),
    }));
  }, [selectedMeasurements]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardData();
      if (!data?.length) {
        setDashboardData([]);
        setTotems([]);
        setSelectedTotemId("");
      } else {
        setDashboardData(data);
        setTotems(data.map((item: any) => item.totem));
        setSelectedTotemId(prev => {
          const exists = data.find((d: any) => d.totem._id === prev);
          return exists ? prev : (data[0]?.totem?._id || "");
        });
      }
    } catch (err: any) {
      console.log(err)
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isTokenExpired()) {
      localStorage.removeItem("token");
      router.push("/");
      return;
    }
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!isAddTotemModalOpen) {
      setNewTotemName("");
      setLatitude("");
      setLongitude("");
      setIntervalo("");
    }
  }, [isAddTotemModalOpen]);

  // --- Handler de Criação com ID Customizado ---
  const handleCreateTotem = async (customId?: string) => {
    try {
      if (!newTotemName) {
        toast.error("O nome do totem é obrigatório.");
        return;
      }

      const payload: any = {
        nome: newTotemName.toLocaleUpperCase(),
        latitude: latitude,
        longitude: longitude,
        intervalo_coleta: Number(intervalo) || 60
      };

      // Se veio do modal com ID gerado, usa ele.
      if (customId) {
        payload._id = customId;
      }

      const newTotem = await postNewTotem(payload);

      // Se a API retorna o objeto criado, pode ser que venha em array ou objeto
      const totemAdicionado = Array.isArray(newTotem) ? newTotem : [newTotem];

      setTotems((prev) => [...prev, ...totemAdicionado]);
      toast.success("Totem cadastrado com sucesso!");
      setIsAddTotemModalOpen(false);
    } catch (error: any) {
      toast.error("Erro ao cadastrar: " + error);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada.");
      return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setIsLoadingLocation(false);
      },
      () => {
        toast.error("Erro ao obter localização.");
        setIsLoadingLocation(false);
      }
    );
  };

  const handleLogout = () => {
    setIsLoading(true);
    localStorage.removeItem("token");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-primary-dark border-b-2 rounded-full w-16 h-16 animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <AddTotemModal
        isOpen={isAddTotemModalOpen}
        onClose={() => setIsAddTotemModalOpen(false)}
        onSave={handleCreateTotem} // Passa a função atualizada
        name={newTotemName}
        setName={setNewTotemName}
        latitude={latitude}
        setLatitude={setLatitude}
        longitude={longitude}
        setLongitude={setLongitude}
        intervalo={intervalo}
        setIntervalo={setIntervalo}
        isLoadingLocation={isLoadingLocation}
        onGetLocation={handleGetLocation}
      />

      <div className="relative flex justify-center items-center bg-background w-full min-h-screen overflow-auto font-sans">
        {viewMode === 'charts' && (
          <button
            onClick={() => setIsAddTotemModalOpen(true)}
            className="lg:hidden right-4 bottom-4 z-50 fixed flex justify-center items-center bg-primary-dark hover:bg-primary shadow rounded-xl w-12 h-12 text-text text-2xl sm:text-5xl transition-colors cursor-pointer"
          >
            <Plus className='text-text-button' />
          </button>
        )}

        {isMenuOpen && (
          <div className="lg:hidden z-50 fixed inset-0 bg-black/40" onClick={() => setIsMenuOpen(false)}></div>
        )}

        <div className="flex flex-row justify-center items-center gap-6 w-full h-full">
          {/* Sidebar Menu */}
          <div className={`
              bg-card shadow-sm lg:shadow-primary pt-8 px-4 rounded-xl 
              h-screen lg:h-[90vh] flex flex-col justify-between z-50
              transition-transform duration-300 ease-in-out
              fixed lg:static top-0 left-0 
              w-[70vw] sm:w-[50vw] md:w-[30vw] lg:w-[9vw]
              ${isMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
            <div>
              <header className="flex flex-col items-center gap-4 mb-6 pb-6 border-border border-b">
                <div className="lg:pb-1 w-full">
                  <h1 className="font-bold text-primary-dark text-3xl text-center">MediS</h1>
                </div>
              </header>
            </div>

            <div className="flex flex-col items-center gap-4 h-full">
              <button onClick={() => setViewMode('charts')} className="flex flex-row items-center gap-2 hover:bg-primary px-4 py-2 rounded-lg w-full font-semibold text-text-button hover:text-text transition-colors cursor-pointer">
                <BarChart2 size={16} className='text-button' /> Dashboard
              </button>
              <button disa onClick={() => {
                if (totems.length === 0) {
                  toast.error("Nenhum totem cadastrado.");
                  return;
                }
                setViewMode('map')
              }
              } className="flex flex-row items-center gap-2 hover:bg-primary px-4 py-2 rounded-lg w-full font-semibold text-text-button hover:text-text transition-colors cursor-pointer">
                <MapIcon size={16} className='text-button' /> Mapa
              </button>
              <button onClick={() => setViewMode('reports')} className="flex flex-row items-center gap-2 hover:bg-primary px-4 py-2 rounded-lg w-full font-semibold text-text-button hover:text-text transition-colors cursor-pointer">
                <Paperclip size={16} className='text-button' /> Relatórios
              </button>
            </div>

            <button className="hover:bg-red-600 mb-2 px-4 py-2 rounded-lg w-full font-semibold text-text-button transition-colors cursor-pointer" onClick={handleLogout}>
              Sair
            </button>
          </div>

          {/* Main Content */}
          <main className="flex flex-col bg-card shadow-sm lg:shadow-primary p-4 sm:p-8 rounded-xl w-screen lg:w-[85%] h-screen lg:h-[90vh] overflow-auto">
            <header className="flex justify-between items-center mb-6 pb-6 border-border border-b">
              <div className="flex justify-between items-center gap-3 w-full">
                <div className="flex flex-row items-center gap-2">
                  <button onClick={() => setIsMenuOpen(true)} className="lg:hidden bg-card shadow rounded-lg text-3xl cursor-pointer">☰</button>
                  {viewMode === 'charts' ? (
                    <>
                      <h1 className="font-bold text-primary-dark text-3xl">Totens</h1>
                      <h1 className="text-muted text-sm">|</h1>
                      <p className="text-muted text-sm">Últimos 7 dias</p>
                    </>
                  ) : viewMode === 'map' ? (
                    <h1 className="font-bold text-primary-dark text-3xl">Totens</h1>
                  ) : (
                    <h1 className="font-bold text-primary-dark text-3xl">Relatórios</h1>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {viewMode === 'charts' ? (
                    <button onClick={() => setIsAddTotemModalOpen(true)} className="hidden lg:block items-center gap-2 bg-card hover:bg-primary-dark px-4 py-2 border border-primary-dark rounded-lg w-full font-semibold text-text-button hover:text-text transition-colors cursor-pointer">
                      + Totem
                    </button>
                  ) : (viewMode === 'map' || viewMode === 'reports') ? (
                    <button onClick={() => setViewMode('charts')} className="block items-center gap-2 bg-card hover:bg-primary-dark px-4 py-2 border border-primary-dark rounded-lg w-full font-semibold text-text-button hover:text-text transition-colors cursor-pointer">
                      Voltar
                    </button>
                  ) : <></>}

                  {viewMode === 'charts' && (
                    <button onClick={fetchDashboardData} className="items-center gap-2 bg-card hover:bg-primary-dark px-4 py-2 border border-primary-dark rounded-lg font-semibold text-text-button hover:text-text transition-colors cursor-pointer" title="Atualizar dados">
                      <RefreshCcw className='items-center font-semibold text-text-button hover:text-text transition-colors cursor-pointer' />
                    </button>
                  )}
                </div>
              </div>
            </header>

            {viewMode === 'charts' ? (
              <>
                <section className="gap-4 grid grid-cols-1 sm:grid-cols-3">
                  <div className="flex flex-col items-start bg-background shadow p-6 rounded-lg w-full">
                    <span className="mb-2 text-muted text-sm">Totem</span>
                    <div className="relative w-full">
                      {
                        totems.length === 0 ? (
                          <span className="font-bold text-foreground text-2xl">-</span>
                        ) : (
                          <>
                            <select value={selectedTotemId} onChange={(e) => setSelectedTotemId(e.target.value)} className="bg-background focus:border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-background w-full font-bold text-foreground text-2xl appearance-none cursor-pointer">
                              {totems.map((t) => <option key={t._id} value={t._id}>{t.nome?.toUpperCase() || ''}</option>)}
                            </select>
                            <div className="right-0 absolute inset-y-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </>
                        )
                      }


                    </div>
                  </div>
                  <div className="flex flex-col items-start bg-background shadow p-6 rounded-lg">
                    <span className="mb-2 text-muted text-sm">Temperatura média</span>
                    <span className="font-bold text-foreground text-2xl">{averageTemperature}</span>
                    <div className="bg-linear-to-r from-yellow-400 to-red-500 mt-3 rounded-full w-full h-1.5"></div>
                  </div>
                  <div className="flex flex-col items-start bg-background shadow p-6 rounded-lg">
                    <span className="mb-2 text-muted text-sm">Umidade média</span>
                    <span className="font-bold text-foreground text-2xl">{averageHumidity}</span>
                    <div className="bg-linear-to-r from-cyan-300 to-cyan-700 mt-3 rounded-full w-full h-1.5"></div>
                  </div>
                </section>

                <h2 className="flex flex-row items-center gap-2 mt-8 mb-4 font-semibold text-foreground text-xl text-center">
                  <BarChart2 size={20} className="text-primary" /> Histórico de Coletas
                </h2>

                {humidityChartData.length === 0 && temperatureChartData.length === 0 ? (
                  <div className="flex flex-col justify-center items-center gap-4 h-full">
                    {
                      totems.length === 0 ? (
                        <span className="mb-2 text-muted text-sm text-center">Nenhum totem cadastrado. Adicione um novo totem para começar a coletar dados.</span>
                      ) : (
                        <span className="mb-2 text-muted text-sm text-center">Nenhum registro coletado pelo totem...</span>
                      )
                    }
                  </div>
                ) : (
                  <section className="gap-8 grid grid-cols-1 lg:grid-cols-2 w-full min-h-0 grow">
                    <div className="flex flex-col w-full h-[250px] lg:h-full min-h-0">
                      <span className="mb-2 text-muted text-sm">Temperatura (ºC)</span>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={temperatureChartData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip labelFormatter={(label) => `Hora: ${label}`} />
                          <Line type="monotone" dataKey="value" stroke="#FACC15" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col w-full h-[250px] lg:h-full min-h-0">
                      <span className="mb-2 text-muted text-sm">Umidade (%)</span>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={humidityChartData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip labelFormatter={(label) => `Hora: ${label}`} />
                          <Line type="monotone" dataKey="value" stroke="#13cde6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}
              </>
            ) : viewMode === 'map' ? (
              <div className="w-full h-full"><MapContainer totems={totems} /></div>
            ) : viewMode === 'reports' ? (
              <div className="w-full h-full"></div>
            ) : null}
          </main>
        </div>
      </div>
    </>
  );
}