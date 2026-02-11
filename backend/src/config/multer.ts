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
    fileSize: 15 * 1024 * 1024, // 15MB
    files: 1,
    fields: 10,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = new Set([
      "image/jpeg",
      "image/pjpeg",
      "image/png",
    ]);
    const allowedExts = new Set([".jpg", ".jpeg", ".png"]);
    const ext = path.extname(file.originalname || "").toLowerCase();

    if (!allowedMimes.has(file.mimetype) || !allowedExts.has(ext)) {
      cb(new Error("Tipo de arquivo inválido. Envie JPG ou PNG."));
      return;
    }

    cb(null, true);
  },
};

export const upload = multer(multerConfig);