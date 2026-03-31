"use client";

import { analisarImagem } from "@/services/analise";
import { Camera, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

interface AnaliseResult {
  fase_crescimento: string;
  confianca: number;
  timestamp: string;
}

interface AnaliseImagemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnaliseImagemModal({
  isOpen,
  onClose,
}: AnaliseImagemModalProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnaliseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Não foi possível acessar a câmera.");
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    context.drawImage(videoRef.current, 0, 0);

    const imageData = canvasRef.current.toDataURL("image/jpeg");
    setPreviewImage(imageData);

    stopCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalise = async () => {
    if (!previewImage) return;

    setIsAnalysing(true);
    const toastId = toast.loading("Analisando imagem...");

    try {
      // Converter base64 para Blob
      const response = await fetch(previewImage);
      const blob = await response.blob();
      const file = new File([blob], "analysis.jpg", { type: "image/jpeg" });

      const resultado = await analisarImagem(file);

      toast.dismiss(toastId);

      if (!resultado.error && resultado.data) {
        setResult(resultado.data);
        toast.success("Análise concluída!");
      } else {
        toast.error(resultado.messageError || "Erro na análise.");
      }
    } catch (err) {
      console.error("Erro ao analisar:", err);
      toast.dismiss(toastId);
      toast.error("Erro ao analisar imagem.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const resetModal = () => {
    setPreviewImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur p-4">
      <div className="bg-card/95 shadow-2xl border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto glow-panel">
        {/* Header */}
        <div className="top-0 sticky flex justify-between items-center bg-card/80 p-6 border-border border-b">
          <div>
            <h2 className="font-semibold text-foreground text-2xl">
              Análise em Tempo Real
            </h2>
            <p className="mt-1 text-muted text-sm">
              Tire uma foto ou envie uma imagem para análise
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-card-alt p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X className="text-muted hover:text-foreground" size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Resultado */}
          {result && (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 mb-6 p-6 border border-primary/20 rounded-2xl">
              <div className="space-y-4">
                <div>
                  <p className="text-muted text-sm uppercase tracking-[0.2em]">
                    Fase de Crescimento
                  </p>
                  <p className="mt-2 font-semibold text-foreground text-3xl">
                    {result.fase_crescimento}
                  </p>
                </div>

                <div className="gap-4 grid grid-cols-2">
                  <div>
                    <p className="text-muted text-sm">Confiança</p>
                    <div className="bg-background mt-2 p-2 rounded-lg text-center">
                      <span className="font-semibold text-primary text-lg">
                        {(result.confianca * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted text-sm">Analisado em</p>
                    <div className="bg-background mt-2 p-2 rounded-lg text-center">
                      <span className="font-semibold text-foreground text-xs">
                        {new Date(result.timestamp).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetModal}
                  className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg w-full font-semibold text-on-primary transition-colors cursor-pointer"
                >
                  Analisar Outra Imagem
                </button>
              </div>
            </div>
          )}

          {/* Câmera */}
          {isCapturing && !previewImage && (
            <div className="space-y-4 mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="bg-background rounded-2xl w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="flex flex-1 justify-center items-center gap-2 bg-primary hover:bg-primary-dark px-4 py-3 rounded-lg font-semibold text-on-primary transition-colors cursor-pointer"
                >
                  <Camera size={18} />
                  Capturar Foto
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-card hover:bg-card-alt px-4 py-3 border border-border rounded-lg font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewImage && !isCapturing && (
            <div className="space-y-4 mb-6">
              <div className="bg-background rounded-2xl overflow-hidden">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-auto"
                />
              </div>
              <button
                onClick={handleAnalise}
                disabled={isAnalysing}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 px-4 py-3 rounded-lg w-full font-semibold text-on-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isAnalysing ? "Analisando..." : "Analisar Imagem"}
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                className="bg-card hover:bg-card-alt px-4 py-2 border border-border rounded-lg w-full font-semibold text-foreground transition-colors cursor-pointer"
              >
                Remover Imagem
              </button>
            </div>
          )}

          {/* Opções de Upload */}
          {!isCapturing && !previewImage && !result && (
            <div className="gap-4 grid grid-cols-2">
              <button
                onClick={startCamera}
                className="group flex flex-col justify-center items-center gap-3 bg-gradient-to-br from-primary/20 hover:from-primary/30 to-primary/10 hover:to-primary/15 p-6 border border-primary/30 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="bg-primary/20 group-hover:bg-primary/30 p-3 rounded-xl transition-colors">
                  <Camera
                    size={24}
                    className="text-primary group-hover:text-primary"
                  />
                </div>
                <span className="font-semibold text-foreground text-sm text-center">
                  Câmera
                </span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col justify-center items-center gap-3 bg-gradient-to-br from-primary/20 hover:from-primary/30 to-primary/10 hover:to-primary/15 p-6 border border-primary/30 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="bg-primary/20 group-hover:bg-primary/30 p-3 rounded-xl transition-colors">
                  <Upload
                    size={24}
                    className="text-primary group-hover:text-primary"
                  />
                </div>
                <span className="font-semibold text-foreground text-sm text-center">
                  Galeria
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
