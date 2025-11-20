import multer from "multer";
import path from "path";
import fs from "fs";

// --- CORREÇÃO: Salvar na raiz do projeto, FORA de /src ---
const uploadDir = path.join(process.cwd(), "uploads");

console.log("--- MULTER CONFIG ---");
console.log("Pasta de Destino:", uploadDir);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Pasta 'uploads' criada na raiz.");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage: storage });