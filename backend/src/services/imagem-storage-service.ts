import fs from "fs";
import path from "path";

const uploadDir = path.resolve(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "") || "img";

export const salvarBufferEmUploads = async (params: {
  buffer: Buffer;
  originalname?: string;
  prefixo?: string;
}) => {
  const { buffer, originalname = "upload.jpg", prefixo = "img" } = params;
  const ext = path.extname(originalname).toLowerCase() || ".jpg";
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const nomeArquivo = `${sanitize(prefixo)}_${ts}_${Math.round(Math.random() * 1e9)}${ext}`;
  const absPath = path.join(uploadDir, nomeArquivo);

  await fs.promises.writeFile(absPath, buffer);

  return {
    nomeArquivo,
    caminhoRelativo: `uploads/${nomeArquivo}`,
    caminhoAbsoluto: absPath,
  };
};
