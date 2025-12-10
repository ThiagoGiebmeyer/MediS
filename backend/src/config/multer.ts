import multer from "multer";
import path from "path";
import fs from "fs";

// Caminho absoluto para a pasta uploads
const uploadDir = path.resolve(__dirname, "..", "..", "uploads");

// Garante que a pasta existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Salva com nome temporário seguro
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    // Ex: temp_172839123.jpg
    cb(null, `temp_${uniqueSuffix}${ext}`);
  },
});

export const multerConfig = {
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo inválido. Apenas imagens."));
    }
  },
};

export const upload = multer(multerConfig);