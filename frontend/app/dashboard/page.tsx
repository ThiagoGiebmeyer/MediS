"use client";

import {
  AlertCircle,
  BarChart2,
  Bluetooth,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Map as MapIcon,
  MapPin,
  Paperclip,
  Plus,
  RefreshCcw,
  Sparkles,
  Wifi,
  X
} from 'lucide-react';
import Link from "next/link";
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

import { getDashboardData, postNewTotem } from "@/services/index";
import { Totem } from "@/types";
import { isTokenExpired } from "@/utils";
import dynamic from 'next/dynamic';
import AnaliseImagemModal from "@/app/components/AnaliseImagemModal";

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
  imagem: string;
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
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID]
      });

      const server = await device.gatt?.connect();
      console.log(device.name || device.id);
      if (!server) throw new Error("Falha no servidor GATT");

      setConnectedDevice(device);
      toast.success(`Conectado!`);

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
        toast.error("Inconsistência ao ler lista de Wi-Fi. Tente novamente.");
      }

    } catch (error: any) {
      console.error(error);
      if (error.name !== 'NotFoundError') {
        setConnectedDevice(null);
        toast.error("Inconsistência de conexão Bluetooth.");
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
      toast.error("Inconsistência de comunicação.");
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
              className={`
              flex justify-center items-center gap-2 
              bg-card hover:bg-primary-dark 
              disabled:pointer-events-none
              disabled:opacity-50
              px-4 py-2 border border-primary-dark rounded-lg 
              w-full font-semibold text-text-button hover:text-text 
              transition-colors cursor-pointer disabled:cursor-not-allowed
            `}
            >

              {isConnecting ? (
                <div className='flex flex-row gap-4'>
                  <div className="flex justify-center items-center">
                    <div className="border-primary-dark border-b-2 rounded-full w-4 h-4 animate-spin"></div>
                  </div>
                  {connectedDevice ? "Buscando redes Wi-Fi..." : "Conectando..."}
                </div>
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
                    disabled={!selectedWifi || !selectedWifi?.secure}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="bg-input-bg px-4 py-2 pr-10 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full text-input-text"
                    placeholder="Digite a senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="top-1/2 right-3 absolute text-muted hover:text-foreground transition-colors\ -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <button onClick={onClose} className="px-4 py-2 font-semibold text-muted hover:text-foreground transition-colors cursor-pointer">Cancelar</button>
              <button
                onClick={handleSendWifiConfig}
                disabled={!selectedWifi || isSendingWifi}
                className="flex justify-center items-center gap-2 bg-card hover:bg-primary-dark disabled:opacity-50 px-4 py-2 border border-primary-dark rounded-lg font-semibold text-text-button hover:text-text transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isSendingWifi ?
                  <div className="flex justify-center items-center min-h-screen">
                    <div className="border-primary-dark border-b-2 rounded-full w-4 h-4 animate-spin"></div>
                  </div>
                  : "Conectar"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONNECTING (LOADING) */}
        {step === "connecting_wifi" && (
          <div className="flex flex-col items-center py-8 text-center animate-in fade-in">
            <div className="mb-4 p-4 rounded-full">
              <div className="border-primary-dark border-b-2 rounded-full w-16 h-16 animate-spin"></div>
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

            <div className="flex flex-row gap-4 w-full">
              <div className="flex flex-col gap-1 mb-4 w-full">
                <label className="text-muted text-sm">Latitude</label>
                <input
                  disabled
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="bg-background mt-1 px-3 py-2 border border-border rounded-lg w-full disabled:text-gray-500"
                  placeholder=''
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
                  placeholder=''
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

const ViewImageModal = ({ isOpen, onClose, data }) => {
  const [index, setIndex] = useState(0);

  // Reseta o index quando o modal abre
  useEffect(() => {
    if (isOpen) setIndex(0);
  }, [isOpen]);

  if (!isOpen || !data || data.length === 0) return null;

  const currentItem = data[index];

  // Construção da URL (Ajuste conforme sua lógica de backend)
  // Remove barra inicial se houver para evitar //
  const cleanPath = currentItem.image.startsWith('/') ? currentItem.image.slice(1) : currentItem.image;
  const imgUrl = `http://${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_API_PORT}/${cleanPath}`;

  // Formatação da data (Ex: 10/12/2025 às 14:30)
  const formattedDate = new Date(currentItem.timestamp).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  // Funções de navegação (com stopPropagation para não fechar o modal ao clicar na seta)
  const handlePrev = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev === 0 ? data.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev === data.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className="z-[999] fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 w-full h-full transition-all"
      onClick={onClose} // Fecha ao clicar no fundo escuro
    >
      <div
        // 🛑 stopPropagation impede que cliques aqui dentro fechem o modal
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col bg-card shadow-2xl p-6 border border-border rounded-xl w-[90%] max-w-4xl h-auto max-h-[90vh] animate-in duration-300 fade-in zoom-in"
      >

        {/* Header: Botão Fechar */}
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="hover:bg-muted p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>

        {/* Área Principal: Navegação + Imagem */}
        <div className="flex flex-row flex-1 justify-between items-center gap-4 w-full overflow-hidden">

          {/* Seta Esquerda */}
          <button
            onClick={handlePrev}
            className="hover:bg-muted p-2 rounded-full font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Container da Imagem Centralizado */}
          <div className='relative flex flex-1 justify-center items-center w-full h-full overflow-hidden'>
            {/* Adicionei max-h-[60vh] para garantir que cabe na tela */}
            <img
              src={imgUrl}
              alt={`Registro de ${formattedDate}`}
              className="shadow-sm rounded-md w-auto max-w-full h-auto max-h-[60vh] object-contain"
            />
          </div>

          {/* Seta Direita */}
          <button
            onClick={handleNext}
            className="hover:bg-muted p-2 rounded-full font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Footer: Data */}
        <p className="mt-4 w-full text-muted text-sm text-center">Coletado em {formattedDate}</p>

      </div>
    </div>
  );
};
// --- Main Component ---
export default function Dashboard() {
  const router = useRouter();
  const MapContainer = dynamic(() => import("@/app/components/RealMap"), { ssr: false });

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTotemModalOpen, setIsAddTotemModalOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isOpenImgModal, setIsOpenImgModal] = useState(false);
  const [isAnaliseImagemOpen, setIsAnaliseImagemOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"charts" | "map" | "reports">("charts");

  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
      image: c.imagem
    }));
  }, [selectedMeasurements]);

  const humidityChartData = useMemo(() => {
    return selectedMeasurements.map((c) => ({
      value: c.umidade,
      timestamp: new Date(c.criado_em).toLocaleString(),
      image: c.imagem
    }));
  }, [selectedMeasurements]);

  const rangeLabel = useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const defaultStart = start.toISOString().slice(0, 10);
    const defaultEnd = today.toISOString().slice(0, 10);

    if (appliedStart && appliedEnd) {
      if (appliedStart === defaultStart && appliedEnd === defaultEnd) {
        return "7 dias";
      }
      return `${appliedStart} - ${appliedEnd}`;
    }

    if (appliedStart || appliedEnd) {
      return `${appliedStart || "..."} - ${appliedEnd || "..."}`;
    }

    return "7 dias";
  }, [appliedStart, appliedEnd]);

  const buildFilterParams = (start?: string, end?: string) => {
    const params: { start?: string; end?: string } = {};
    if (start) params.start = start;
    if (end) params.end = end;
    return params;
  };

  const fetchDashboardData = useCallback(async (override?: { start?: string; end?: string }) => {
    try {
      setIsLoading(true);
      const params = override ?? buildFilterParams(appliedStart, appliedEnd);
      const response = await getDashboardData(Object.keys(params).length ? params : undefined);

      if (response.error) {
        toast.error(response.messageError || "Inconsistência ao carregar dados.");
        setDashboardData([]);
        setTotems([]);
        setSelectedTotemId("");
        return;
      }

      const data = response.data || [];

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
      toast.error("Inconsistência ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }, [router, appliedStart, appliedEnd]);

  useEffect(() => {
    if (isTokenExpired()) {
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const startValue = start.toISOString().slice(0, 10);
    const endValue = end.toISOString().slice(0, 10);
    setFilterStart(startValue);
    setFilterEnd(endValue);
    setAppliedStart(startValue);
    setAppliedEnd(endValue);
    fetchDashboardData({ start: startValue, end: endValue });
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
      toast.error("Inconsistência ao cadastrar: " + error);
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
        toast.error("Inconsistência ao obter localização.");
        setIsLoadingLocation(false);
      }
    );
  };

  const applyFilter = () => {
    const params = buildFilterParams(filterStart, filterEnd);
    setAppliedStart(filterStart);
    setAppliedEnd(filterEnd);
    fetchDashboardData(Object.keys(params).length ? params : undefined);
    setIsFilterModalOpen(false);
  };

  const clearFilter = () => {
    setFilterStart("");
    setFilterEnd("");
    setAppliedStart("");
    setAppliedEnd("");
    fetchDashboardData(undefined);
    setIsFilterModalOpen(false);
  };

  const applyQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startValue = start.toISOString().slice(0, 10);
    const endValue = end.toISOString().slice(0, 10);
    setFilterStart(startValue);
    setFilterEnd(endValue);
    setAppliedStart(startValue);
    setAppliedEnd(endValue);
    fetchDashboardData({ start: startValue, end: endValue });
    setIsFilterModalOpen(false);
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

  const CustomTooltip = ({ active, payload, leftText, rightTect }) => {
    if (!active || !payload || !payload.length) return null;
    const value = payload[0].payload.value;
    const date = payload[0].payload.timestamp;

    return (
      <div
        className="hidden lg:block items-center gap-2 bg-card hover:bg-primary-dark px-4 py-2 border border-primary-dark rounded-lg w-full font-semibold text-text-button hover:text-text transition-colors cursor-pointer">
        {leftText}{value}{rightTect} <p>{String(date)}</p>
      </div>
    );
  };

  return (
    <>
      <AddTotemModal
        isOpen={isAddTotemModalOpen}
        onClose={() => setIsAddTotemModalOpen(false)}
        onSave={handleCreateTotem}
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

      <ViewImageModal
        isOpen={isOpenImgModal}
        onClose={() => setIsOpenImgModal(false)}
        data={temperatureChartData}
      />

      <AnaliseImagemModal
        isOpen={isAnaliseImagemOpen}
        onClose={() => setIsAnaliseImagemOpen(false)}
      />

      {isFilterModalOpen && (
        <div className="z-[999] fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card/90 shadow-2xl p-6 border border-border rounded-3xl w-full max-w-lg glow-panel">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-semibold text-muted text-xs uppercase tracking-[0.3em]">Filtro</p>
                <h2 className="mt-2 font-semibold text-foreground text-xl">Selecionar período</h2>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-3 py-1 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="gap-4 grid sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-muted text-xs uppercase tracking-[0.2em]">Inicio</label>
                <input
                  type="date"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="bg-background px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-muted text-xs uppercase tracking-[0.2em]">Fim</label>
                <input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="bg-background px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => applyQuickRange(days)}
                  className="px-3 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-xs transition-colors cursor-pointer"
                >
                  {days} dias
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={applyFilter}
                className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-full font-semibold text-on-primary text-xs transition-colors cursor-pointer"
              >
                Aplicar
              </button>
              <button
                onClick={clearFilter}
                className="px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-xs transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-background min-h-screen text-foreground">
        <div className="flex flex-col mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl min-h-screen">
          <header className="flex flex-col gap-4 bg-card/80 shadow-lg mb-6 p-4 sm:p-6 border border-border rounded-3xl glow-panel">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center bg-primary rounded-2xl w-10 h-10 font-bold text-on-primary">M</div>
                <div>
                  <p className="text-muted text-xs uppercase tracking-[0.3em]">Centro de controle</p>
                  <h1 className="font-semibold text-foreground text-2xl">MediS Dashboard</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors cursor-pointer"
                >
                  Perfil
                </Link>
                {viewMode === "charts" && (
                  <button
                    onClick={() => setIsAddTotemModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary px-4 py-2 border border-primary rounded-full font-semibold text-primary hover:text-on-primary text-sm transition-colors cursor-pointer"
                  >
                    <Plus size={16} /> Novo totem
                  </button>
                )}
                {viewMode === "charts" && (
                  <button
                    onClick={fetchDashboardData}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors cursor-pointer"
                    title="Atualizar dados"
                  >
                    <RefreshCcw size={16} /> Atualizar
                  </button>
                )}
                {viewMode === "charts" && (
                  <button
                    onClick={() => setIsAnaliseImagemOpen(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 hover:from-purple-700 to-pink-600 hover:to-pink-700 px-4 py-2 rounded-full font-semibold text-on-primary text-sm transition-colors cursor-pointer"
                    title="Análise com IA"
                  >
                    <Sparkles size={16} /> Analisar IA
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-red-400 rounded-full font-semibold text-foreground hover:text-red-500 text-sm transition-colors cursor-pointer"
                >
                  Sair
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "charts", label: "Dashboard", icon: BarChart2 },
                { key: "map", label: "Mapa", icon: MapIcon },
                { key: "reports", label: "Relatórios", icon: Paperclip }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = viewMode === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (item.key === "map" && totems.length === 0) {
                        toast.error("Nenhum totem cadastrado.");
                        return;
                      }
                      setViewMode(item.key as typeof viewMode);
                    }}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-on-primary"
                        : "border border-border text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    <Icon size={16} /> {item.label}
                  </button>
                );
              })}
            </div>

          </header>

          {viewMode === "charts" && (
            <div className="flex flex-col gap-6">
              <section className="gap-4 grid md:grid-cols-3">
                <div className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl glow-panel">
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-sm">Totem ativo</span>
                    <button
                      onClick={() => setIsFilterModalOpen(true)}
                      className="bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full font-semibold text-primary text-xs transition-colors cursor-pointer"
                    >
                      {rangeLabel}
                    </button>
                  </div>
                  <div className="relative mt-4">
                    {totems.length === 0 ? (
                      <span className="font-semibold text-foreground text-2xl">-</span>
                    ) : (
                      <>
                        <select
                          value={selectedTotemId}
                          onChange={(e) => setSelectedTotemId(e.target.value)}
                          className="bg-background px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary w-full font-semibold text-foreground text-lg appearance-none"
                        >
                          {totems.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.nome?.toUpperCase() || ""}
                            </option>
                          ))}
                        </select>
                        <div className="right-0 absolute inset-y-0 flex items-center pr-3 text-muted pointer-events-none">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl glow-panel">
                  <span className="text-muted text-sm">Temperatura média</span>
                  <p className="mt-3 font-semibold text-foreground text-3xl">{averageTemperature}</p>
                  <div className="bg-card-alt mt-4 rounded-full w-full h-2">
                    <div className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 rounded-full w-3/4 h-2" />
                  </div>
                </div>

                <div className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl glow-panel">
                  <span className="text-muted text-sm">Umidade média</span>
                  <p className="mt-3 font-semibold text-foreground text-3xl">{averageHumidity}</p>
                  <div className="bg-card-alt mt-4 rounded-full w-full h-2">
                    <div className="bg-gradient-to-r from-cyan-200 via-cyan-400 to-sky-500 rounded-full w-2/3 h-2" />
                  </div>
                </div>
              </section>

              <section className="gap-6 grid lg:grid-cols-2">
                <div className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl glow-panel">
                  <div className="flex items-center gap-2 mb-4 font-semibold text-foreground text-sm">
                    <BarChart2 size={16} className="text-primary" /> Temperatura (ºC)
                  </div>
                  {temperatureChartData.length === 0 ? (
                    <div className="flex justify-center items-center h-[280px] text-muted text-sm">
                      Nenhum registro coletado pelo totem...
                    </div>
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={temperatureChartData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip content={<CustomTooltip leftText={"Temperatura: "} rightTect={'ºC'} />} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#FACC15"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{
                              r: 6,
                              style: { cursor: "pointer" },
                              onClick: () => setIsOpenImgModal(true)
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-card/80 shadow-lg p-5 border border-border rounded-3xl glow-panel">
                  <div className="flex items-center gap-2 mb-4 font-semibold text-foreground text-sm">
                    <BarChart2 size={16} className="text-primary" /> Umidade (%)
                  </div>
                  {humidityChartData.length === 0 ? (
                    <div className="flex justify-center items-center h-[280px] text-muted text-sm">
                      Nenhum registro coletado pelo totem...
                    </div>
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={humidityChartData} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip content={<CustomTooltip leftText={"Umidade: "} rightTect={'%'} />} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#13cde6"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{
                              r: 6,
                              style: { cursor: "pointer" },
                              onClick: () => setIsOpenImgModal(true)
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {viewMode === "map" && (
            <div className="bg-card/80 shadow-lg p-4 border border-border rounded-3xl glow-panel">
              <div className="flex items-center gap-2 mb-4 font-semibold text-foreground text-sm">
                <MapIcon size={16} className="text-primary" /> Visão geográfica dos totens
              </div>
              <div className="border border-border rounded-2xl w-full h-[70vh] overflow-hidden">
                <MapContainer totems={totems} />
              </div>
            </div>
          )}

          {viewMode === "reports" && (
            <div className="gap-6 grid lg:grid-cols-3">
              {[
                { title: "Resumo semanal", text: "Consolide leituras por período e compare ambientes." },
                { title: "Indicadores-chave", text: "Acompanhe tendencias de temperatura e umidade." },
                { title: "Exportação", text: "Gere relatórios e compartilhe resultados." }
              ].map((item) => (
                <div key={item.title} className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl glow-panel">
                  <p className="font-semibold text-foreground text-lg">{item.title}</p>
                  <p className="mt-3 text-muted text-sm">{item.text}</p>
                  <div className="mt-6 p-4 border border-border border-dashed rounded-2xl text-muted text-xs">
                    Em breve: configuracoes detalhadas e filtros avancados.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}