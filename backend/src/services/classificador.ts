import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Lista de fases de crescimento possíveis
const GROWTH_PHASES = [
  "VE", "VC", "V1", "V2", "V3", "Vn",
  "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"
];

// Mock para testes sem TensorFlow
const USAR_MOCK = process.env.USE_MOCK_CLASSIFIER === "true";

export const classificarImagem = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Se usar mock (para testes), retorna uma fase aleatória
    if (USAR_MOCK) {
      console.log("[MOCK] Simulando classificação com IA...");
      const faseAleatoria = GROWTH_PHASES[Math.floor(Math.random() * GROWTH_PHASES.length)];
      console.log("[MOCK] Fase retornada:", faseAleatoria);
      return resolve(faseAleatoria);
    }

    // Validação do buffer
    if (!buffer || !Buffer.isBuffer(buffer)) {
      console.error("Buffer inválido:", typeof buffer, buffer);
      return reject(new Error("Buffer da imagem é inválido"));
    }

    console.log("Buffer recebido:", buffer.length, "bytes");

    const filename = `${uuidv4()}.jpg`;
    const tempDir = path.join(__dirname, "..", "temp");
    const filepath = path.join(tempDir, filename);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      fs.writeFileSync(filepath, buffer);
      console.log("Arquivo salvo em:", filepath);
    } catch (err: any) {
      console.error("Erro ao salvar arquivo:", err);
      return reject(new Error(`Erro ao salvar arquivo: ${err.message}`));
    }

    const scriptPath = path.join(
      __dirname,
      "../../../ia/classify-single-image.py"
    );

    console.log("Iniciando Python com script:", scriptPath);
    console.log("Argumento:", filepath);

    // Usar Python do venv em vez da versão global
    const pythonExe = path.join(
      __dirname,
      "../../../ia/venv/Scripts/python.exe"
    );

    const python = spawn(pythonExe, [scriptPath, filepath]);

    let result = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error("Inconsistência do Python:", data.toString());
    });

    python.on("close", (code) => {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.warn("Não foi possível deletar arquivo temporário:", filepath);
      }

      if (code === 0) {
        const lines = result.trim().split("\n");
        const lastLine = lines[lines.length - 1].trim();
        console.log("Resultado da classificação:", lastLine);
        resolve(lastLine);
      } else {
        console.error("Python retornou código:", code);
        console.error("Erro:", errorOutput);
        reject(new Error(`Python retornou erro (código ${code}): ${errorOutput}`));
      }
    });

    python.on("error", (err) => {
      console.error("Erro ao executar Python:", err);
      reject(new Error(`Erro ao executar Python: ${err.message}`));
    });
  });
};
