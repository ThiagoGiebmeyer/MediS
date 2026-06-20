"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MapPin,
  PencilLine,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Wifi,
} from "lucide-react";

import {
  deleteTotem,
  getTotems,
  postNewTotem,
  updateTotem,
} from "@/services/totem";
import { NewTotemDTO, Totem } from "@/types/totem";
import { isTokenExpired } from "@/utils";

const MapContainer = dynamic(() => import("@/app/components/real-map"), {
  ssr: false,
});

const generateMongoObjectId = () => {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    "xxxxxxxxxxxxxxxx"
      .replace(/[x]/g, () => ((Math.random() * 16) | 0).toString(16))
      .toLowerCase()
  );
};

const normalizeTotemHost = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) return "";

  try {
    const parsed = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `http://${trimmed}`,
    );

    return parsed.hostname;
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "");
  }
};

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

interface BluetoothRemoteGATTService extends EventTarget {
  device: BluetoothDevice;
  getCharacteristic(
    characteristic: string | number,
  ): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(
    service: string | number,
  ): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface WifiNetwork {
  ssid: string;
  rssi: number;
  secure: boolean;
}

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

type EditFormState = {
  nome: string;
  latitude: string;
  longitude: string;
  intervalo_coleta: string;
};

const initialEditForm: EditFormState = {
  nome: "",
  latitude: "",
  longitude: "",
  intervalo_coleta: "60",
};

interface AddTotemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customId: string) => Promise<void> | void;
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
  onGetLocation,
}: AddTotemModalProps) => {
  const [step, setStep] = useState<
    "details" | "bluetooth" | "wifi" | "connecting_wifi"
  >("details");
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [wifiList, setWifiList] = useState<WifiNetwork[]>([]);
  const [selectedWifi, setSelectedWifi] = useState<WifiNetwork | null>(null);
  const [wifiPassword, setWifiPassword] = useState("");
  const [isSendingWifi, setIsSendingWifi] = useState(false);
  const [generatedTotemId, setGeneratedTotemId] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep("details");
      setConnectedDevice(null);
      setSelectedWifi(null);
      setWifiPassword("");
      setWifiList([]);
      setIsSendingWifi(false);
      setShowPassword(false);
      setGeneratedTotemId(generateMongoObjectId());
    }
  }, [isOpen]);

  const getNormalizedInterval = () => {
    const sanitized = intervalo.replace(/x/gi, "*");
    if (!/^[0-9+\-*/\s]*$/.test(sanitized)) return null;

    try {
      const calc = Function(`return ${sanitized || "60"}`)();
      if (isNaN(calc)) return null;
      return Math.max(1, Math.min(1440, Math.floor(Math.abs(calc))));
    } catch {
      return null;
    }
  };

  const handleContinueToBluetooth = () => {
    if (!name.trim()) {
      toast.error("Informe o nome do totem antes de continuar.");
      return;
    }

    if (!latitude || !longitude) {
      toast.error("Colete a localização antes de continuar.");
      return;
    }

    const intervalInt = getNormalizedInterval();
    if (!intervalInt) {
      toast.error("Intervalo inválido.");
      return;
    }

    setIntervalo(String(intervalInt));
    setStep("bluetooth");
  };

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
        optionalServices: [SERVICE_UUID],
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Falha no servidor GATT");

      setConnectedDevice(device);
      toast.success("Conectado!");

      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic =
        await service.getCharacteristic(CHARACTERISTIC_UUID);

      await new Promise((resolve) => setTimeout(resolve, 15000));
      const value = await characteristic.readValue();
      const decoder = new TextDecoder("utf-8");
      const jsonString = decoder.decode(value);

      const parsed = JSON.parse(jsonString);
      if (parsed.status === "connected") {
        toast.success("Totem já está conectado!");
        Promise.resolve(onSave(generatedTotemId)).catch(() => {
          toast.error("Falha ao salvar cadastro do totem.");
        });
      } else {
        const networks: WifiNetwork[] = parsed;
        networks.sort((a, b) => b.rssi - a.rssi);
        setWifiList(networks);
        setStep("wifi");
      }
    } catch (error: any) {
      if (error?.name !== "NotFoundError") {
        setConnectedDevice(null);
        toast.error("Inconsistência de conexão Bluetooth.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendWifiConfig = async () => {
    if (!selectedWifi || !connectedDevice || !connectedDevice.gatt?.connected) {
      toast.error("Dispositivo desconectado.");
      return;
    }

    const intervalInt = getNormalizedInterval();

    if (!intervalInt) {
      toast.error("Intervalo inválido.");
      return;
    }

    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    let finished = false;

    try {
      setIsSendingWifi(true);
      setStep("connecting_wifi");

      const server = connectedDevice.gatt;
      const service = await server.getPrimaryService(SERVICE_UUID);
      characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

      const handleCharacteristicValueChanged = (event: any) => {
        if (finished) return;

        const value = event.target.value;
        const decoder = new TextDecoder("utf-8");
        const responseStr = decoder.decode(value);

        try {
          const response = JSON.parse(responseStr);

          if (response.status === "connected") {
            finished = true;
            toast.success("Totem conectado e configurado!");
            cleanup();
            Promise.resolve(onSave(generatedTotemId)).catch(() => {
              toast.error("Falha ao salvar cadastro do totem.");
            });
          } else if (
            response.status === "error" ||
            response.status === "fail"
          ) {
            finished = true;
            toast.error("Falha: senha incorreta ou erro de rede.");
            cleanup();
            setStep("wifi");
          }
        } catch {}
      };

      const cleanup = () => {
        if (characteristic) {
          characteristic.removeEventListener(
            "characteristicvaluechanged",
            handleCharacteristicValueChanged,
          );
          characteristic.stopNotifications().catch(() => {});
        }
        setIsSendingWifi(false);
      };

      await characteristic.startNotifications();
      characteristic.addEventListener(
        "characteristicvaluechanged",
        handleCharacteristicValueChanged,
      );

      const payload = JSON.stringify({
        ssid: selectedWifi.ssid.trim(),
        password: wifiPassword.trim(),
        interval: intervalInt,
        totem_id: generatedTotemId.trim(),
        totem_name: name.trim().toUpperCase(),
        latitude: latitude.trim(),
        longitude: longitude.trim(),
        ip: normalizeTotemHost(
          process.env.NEXT_PUBLIC_API_URL_TOTEM || "http://192.168.3.211",
        ),
        port: process.env.NEXT_PUBLIC_API_PORT || 3001,
      });

      const encoder = new TextEncoder();
      await characteristic.writeValue(encoder.encode(payload));
    } catch {
      toast.error("Inconsistência de comunicação.");
      setStep("wifi");
      setIsSendingWifi(false);
    }
  };

  const handleIntervaloChange = () => {
    const raw = intervalo;
    const sanitized = raw.replace(/x/gi, "*");
    if (!/^[0-9+\-*/\s]*$/.test(sanitized)) return;

    let result = sanitized;
    try {
      const calculated = Function(`return ${sanitized || ""}`)();
      if (!isNaN(calculated)) {
        const limited = Math.abs(Math.min(calculated, 1440));
        result = limited.toString();
      }
    } catch {}

    setIntervalo(result);
  };

  if (!isOpen) return null;

  return (
    <div className="z-999 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 transition-all">
      <div className="bg-card shadow-2xl p-4 sm:p-6 border border-border rounded-xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in duration-300 fade-in zoom-in">
        {step === "details" && (
          <div className="animate-in fade-in">
            <header className="flex flex-col items-center gap-4 mb-2 pb-2 border-border border-b">
              <h1 className="font-bold text-primary-dark text-3xl text-center">
                Novo totem
              </h1>
            </header>

            <span className="block mb-3 font-mono text-[10px] text-gray-400 text-center">
              ID: {generatedTotemId}
            </span>

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-muted text-sm">Nome do Totem</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                placeholder="Ex: Totem no milharal"
              />
            </div>

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-muted text-sm">
                Intervalo entre coletas (minutos)
              </label>
              <input
                value={intervalo}
                onChange={(e) => setIntervalo(e.target.value.toUpperCase())}
                onBlur={handleIntervaloChange}
                className="bg-input-bg px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-input-text"
                placeholder="Ex: 60"
              />
            </div>

            <div className="flex sm:flex-row flex-col gap-4 w-full">
              <div className="flex flex-col gap-1 mb-4 w-full">
                <label className="text-muted text-sm">Latitude</label>
                <input
                  disabled
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="bg-background mt-1 px-3 py-2 border border-border rounded-lg w-full disabled:text-gray-500"
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
              <button
                onClick={handleContinueToBluetooth}
                className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg w-full sm:w-1/2 font-semibold text-on-primary transition-colors cursor-pointer"
              >
                Continuar (Bluetooth)
              </button>
            </div>
          </div>
        )}

        {step === "bluetooth" && (
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 mb-4 p-4 rounded-full">
              <Wifi size={48} className="text-blue-600" />
            </div>
            <h2 className="mb-2 font-bold text-foreground text-2xl">
              Configurar novo Totem
            </h2>
            <span className="mb-2 font-mono text-[10px] text-gray-400">
              ID: {generatedTotemId}
            </span>

            {connectedDevice ? (
              <p className="flex items-center gap-1 mb-4 text-yellow-600 text-xs">
                <AlertCircle size={12} /> Isso pode levar alguns segundos.
              </p>
            ) : (
              <p className="mb-6 text-muted text-sm">
                Ative o Bluetooth do seu dispositivo e busque o totem próximo.
              </p>
            )}

            <button
              onClick={handleScanBluetooth}
              disabled={isConnecting}
              className="flex justify-center items-center gap-2 bg-card hover:bg-primary-dark disabled:opacity-50 px-4 py-2 border border-primary-dark rounded-lg w-full font-semibold text-text-button hover:text-text transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <div className="flex items-center gap-3">
                  <div className="border-primary-dark border-b-2 rounded-full w-4 h-4 animate-spin"></div>
                  {connectedDevice
                    ? "Buscando redes Wi-Fi..."
                    : "Conectando..."}
                </div>
              ) : (
                "Buscar Dispositivos"
              )}
            </button>
            <div className="flex justify-between gap-3 mt-4 w-full">
              <button
                onClick={() => setStep("details")}
                className="font-medium text-muted hover:text-foreground text-sm transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={onClose}
                className="font-medium text-muted hover:text-foreground text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {step === "wifi" && (
          <div className="flex flex-col">
            <h2 className="flex items-center gap-2 mb-4 font-bold text-foreground text-xl">
              <Wifi className="text-blue-600" /> Selecione o Wi-Fi
            </h2>

            <div className="bg-background mb-4 border border-border rounded-lg max-h-40 sm:max-h-48 overflow-y-auto no-scrollbar">
              {wifiList.length === 0 ? (
                <div className="p-4 text-muted text-sm text-center">
                  Nenhuma rede encontrada.
                </div>
              ) : (
                wifiList.slice(0, 8).map((wifi, idx) => (
                  <div
                    key={`${wifi.ssid}-${idx}`}
                    onClick={() => setSelectedWifi(wifi)}
                    className={`flex items-center justify-between p-3 cursor-pointer border-b border-border last:border-0 hover:bg-primary/10 transition-colors ${selectedWifi?.ssid === wifi.ssid ? "bg-primary-50 border-l-4 border-l-primary" : ""}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Wifi
                        size={18}
                        className={
                          wifi.rssi > -60 ? "text-green-600" : "text-muted"
                        }
                      />
                      <span className="font-medium text-foreground text-sm truncate">
                        {wifi.ssid}
                      </span>
                    </div>
                    {wifi.secure && <Lock size={14} className="text-muted" />}
                  </div>
                ))
              )}
            </div>

            {selectedWifi && (
              <div className="slide-in-from-top-2 mb-4 animate-in fade-in">
                <label className="font-bold text-muted text-xs uppercase">
                  Senha da rede <strong>{selectedWifi.ssid}</strong>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={wifiPassword}
                    disabled={!selectedWifi.secure}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="bg-input-bg px-4 py-2 pr-10 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full text-input-text"
                    placeholder="Digite a senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="top-1/2 right-3 absolute text-muted hover:text-foreground transition-colors -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setStep("bluetooth")}
                className="px-4 py-2 font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleSendWifiConfig}
                disabled={!selectedWifi || isSendingWifi}
                className="flex justify-center items-center gap-2 bg-card hover:bg-primary-dark disabled:opacity-50 px-4 py-2 border border-primary-dark rounded-lg font-semibold text-text-button hover:text-text transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isSendingWifi ? (
                  <div className="border-primary-dark border-b-2 rounded-full w-4 h-4 animate-spin"></div>
                ) : (
                  "Conectar"
                )}
              </button>
            </div>
          </div>
        )}

        {step === "connecting_wifi" && (
          <div className="flex flex-col items-center py-8 text-center animate-in fade-in">
            <div className="mb-4 p-4 rounded-full">
              <div className="border-primary-dark border-b-2 rounded-full w-16 h-16 animate-spin"></div>
            </div>
            <h2 className="font-bold text-foreground text-xl">
              Conectando Totem ao Wi-Fi...
            </h2>
            <span className="mb-2 font-mono text-[10px] text-gray-400">
              ID: {generatedTotemId}
            </span>
            <p className="mt-2 max-w-xs text-muted text-sm">
              Aguarde a confirmação e o cadastro do totem...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TotemsPage() {
  const router = useRouter();
  const [totems, setTotems] = useState<Totem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingTotemId, setEditingTotemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(initialEditForm);

  const [isAddTotemModalOpen, setIsAddTotemModalOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [newTotemName, setNewTotemName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [intervalo, setIntervalo] = useState("60");

  const filteredTotems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return totems;
    return totems.filter((totem) => {
      return [totem.nome, totem.latitude, totem.longitude]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [search, totems]);

  const mappableTotems = useMemo(() => {
    return filteredTotems.filter((totem) => {
      const lat = Number(totem.latitude);
      const lng = Number(totem.longitude);
      return (
        Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
      );
    });
  }, [filteredTotems]);

  const loadTotens = async () => {
    setIsLoading(true);
    try {
      const response = await getTotems();
      if (response.error) {
        if (/token|autenticado|unauthorized|não autorizado/i.test(response.messageError || "")) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        toast.error(
          response.messageError || "Não foi possível carregar os totens.",
        );
        return;
      }
      setTotems(response.data || []);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        toast.error("Sessão expirada. Faça login novamente.");
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      toast.error(
        error?.response?.data?.messageError || "Falha ao carregar os totens.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isTokenExpired()) {
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    loadTotens();
  }, [router]);

  useEffect(() => {
    if (!isAddTotemModalOpen) {
      setNewTotemName("");
      setLatitude("");
      setLongitude("");
      setIntervalo("60");
    }
  }, [isAddTotemModalOpen]);

  const resetEditForm = () => {
    setEditingTotemId(null);
    setEditForm(initialEditForm);
  };

  const handleEdit = (totem: Totem) => {
    setEditingTotemId(totem._id);
    setEditForm({
      nome: totem.nome || "",
      latitude: totem.latitude || "",
      longitude: totem.longitude || "",
      intervalo_coleta: String(totem.intervalo_coleta ?? 60),
    });
  };

  const handleUpdateTotem = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingTotemId) {
      toast.error("Selecione um totem para editar.");
      return;
    }

    if (!editForm.nome.trim()) {
      toast.error("Informe o nome do totem.");
      return;
    }

    setIsSaving(true);

    const payload: Partial<NewTotemDTO> = {
      nome: editForm.nome.trim().toUpperCase(),
      latitude: editForm.latitude.trim(),
      longitude: editForm.longitude.trim(),
      intervalo_coleta: Number(editForm.intervalo_coleta) || 60,
    };

    try {
      const updated = await updateTotem(editingTotemId, payload);
      setTotems((current) =>
        current.map((totem) =>
          totem._id === editingTotemId ? updated[0] : totem,
        ),
      );
      toast.success("Totem atualizado com sucesso.");
      resetEditForm();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.messageError ||
          "Não foi possível salvar o totem.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (totem: Totem) => {
    const confirmed = window.confirm(`Remover o totem ${totem.nome}?`);
    if (!confirmed) return;

    try {
      await deleteTotem(totem._id);
      setTotems((current) => current.filter((item) => item._id !== totem._id));
      if (editingTotemId === totem._id) {
        resetEditForm();
      }
      toast.success("Totem removido com sucesso.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.messageError ||
          "Não foi possível remover o totem.",
      );
    }
  };

  const handleCreateTotem = async (customId?: string) => {
    try {
      if (!newTotemName) {
        toast.error("O nome do totem é obrigatório.");
        return;
      }

      const payload: NewTotemDTO = {
        nome: newTotemName.toUpperCase(),
        latitude,
        longitude,
        intervalo_coleta: Number(intervalo) || 60,
      };

      if (customId) {
        payload._id = customId;
      }

      const created = await postNewTotem(payload);
      const addedTotens = Array.isArray(created) ? created : [created as any];
      setTotems((prev) => [...addedTotens, ...prev]);

      toast.success("Totem cadastrado com sucesso!");
      setIsAddTotemModalOpen(false);
    } catch {
      toast.error("Inconsistência ao cadastrar totem.");
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
      },
    );
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
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

      <div className="px-4 sm:px-6 lg:px-8 py-6 w-full min-h-screen">
        <section className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl glow-panel">
          <div className="flex lg:flex-row flex-col lg:justify-between lg:items-end gap-6">
            <div className="max-w-3xl">
              <p className="text-[10px] text-muted uppercase tracking-[0.35em]">
                Totens
              </p>
              <h1 className="mt-3 font-semibold text-foreground text-3xl sm:text-4xl">
                Gestão de totens
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadTotens}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
              >
                <RefreshCcw size={16} /> Atualizar
              </button>
            </div>
          </div>
        </section>

        <div className="gap-6 grid xl:grid-cols-[1.2fr_0.8fr] mt-6">
          <section className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl glow-panel">
            <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  className="top-1/2 left-3 absolute text-muted -translate-y-1/2"
                  size={16}
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome ou localização"
                  className="bg-background py-3 pr-4 pl-10 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary w-full text-foreground text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddTotemModalOpen(true)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark px-4 py-2 rounded-full font-semibold text-on-primary text-sm transition-colors"
              >
                <Plus size={16} /> Novo totem
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-16 text-muted text-sm">
                <Loader2 className="mr-3 animate-spin" size={18} /> Carregando
                totens...
              </div>
            ) : filteredTotems.length === 0 ? (
              <div className="py-16 text-muted text-sm text-center">
                Nenhum totem cadastrado.
              </div>
            ) : (
              <div className="border border-border rounded-3xl overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-card-alt/60 text-muted text-xs uppercase tracking-[0.12em]">
                    <tr>
                      <th className="px-4 py-4 text-left">Totem</th>
                      <th className="px-4 py-4 text-left">Localização</th>
                      <th className="px-4 py-4 text-left">Intervalo</th>
                      <th className="px-4 py-4 text-left">Atualizado</th>
                      <th className="px-4 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTotems.map((totem) => (
                      <tr
                        key={totem._id}
                        className="hover:bg-card-alt/50 border-border border-t transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex justify-center items-center bg-primary/10 rounded-2xl w-10 h-10 text-primary">
                              <Wifi size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {totem.nome}
                              </p>
                              <p className="text-muted text-xs break-all">
                                {totem._id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-primary" />
                            <span>
                              {totem.latitude || "-"}, {totem.longitude || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-foreground">
                          {totem.intervalo_coleta} min
                        </td>
                        <td className="px-4 py-4 text-muted text-xs">
                          {totem.alterado_em
                            ? new Date(totem.alterado_em).toLocaleString(
                                "pt-BR",
                              )
                            : "-"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(totem)}
                              className="inline-flex items-center gap-2 px-3 py-2 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-xs transition-colors"
                            >
                              <PencilLine size={14} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(totem)}
                              className="inline-flex items-center gap-2 px-3 py-2 border border-border hover:border-red-400 rounded-full font-semibold text-foreground hover:text-red-500 text-xs transition-colors"
                            >
                              <Trash2 size={14} /> Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="bg-card/80 shadow-lg p-6 border border-border rounded-3xl h-fit glow-panel">
            <div className="flex items-center gap-2 mb-6 font-semibold text-foreground text-lg">
              <PencilLine size={18} className="text-primary" /> Editar totem
            </div>

            {!editingTotemId ? (
              <p className="text-muted text-sm leading-relaxed">
                Selecione um registro na tabela para editar os dados do totem.
              </p>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={handleUpdateTotem}
              >
                <div className="flex flex-col gap-2">
                  <label className="text-muted text-xs uppercase tracking-[0.2em]">
                    Nome
                  </label>
                  <input
                    value={editForm.nome}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        nome: event.target.value,
                      }))
                    }
                    className="bg-background px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                    placeholder="Ex: Totem da área norte"
                  />
                </div>

                <div className="gap-4 grid sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-muted text-xs uppercase tracking-[0.2em]">
                      Latitude
                    </label>
                    <input
                      value={editForm.latitude}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          latitude: event.target.value,
                        }))
                      }
                      className="bg-background px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      placeholder="-23.123456"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-muted text-xs uppercase tracking-[0.2em]">
                      Longitude
                    </label>
                    <input
                      value={editForm.longitude}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          longitude: event.target.value,
                        }))
                      }
                      className="bg-background px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      placeholder="-46.123456"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-muted text-xs uppercase tracking-[0.2em]">
                    Intervalo de coleta
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.intervalo_coleta}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        intervalo_coleta: event.target.value,
                      }))
                    }
                    className="bg-background px-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                    placeholder="60"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex flex-1 justify-center items-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-60 px-4 py-3 rounded-full font-semibold text-on-primary text-sm transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : null}
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    onClick={resetEditForm}
                    className="px-4 py-3 border border-border hover:border-primary rounded-full font-semibold text-foreground hover:text-primary text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        <section className="bg-card/80 shadow-lg mt-6 p-6 border border-border rounded-3xl glow-panel">
          <div className="mb-4">
            <p className="text-muted text-xs uppercase tracking-[0.2em]">
              Mapa
            </p>
            <h2 className="mt-2 font-semibold text-foreground text-xl">
              Localização dos totens listados
            </h2>
          </div>

          {mappableTotems.length === 0 ? (
            <div className="flex justify-center items-center bg-background border border-border rounded-2xl h-80 text-muted text-sm text-center">
              Nenhum totem com latitude/longitude válida para exibir no mapa.
            </div>
          ) : (
            <div className="h-80 sm:h-105 overflow-hidden">
              <MapContainer totems={mappableTotems} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
