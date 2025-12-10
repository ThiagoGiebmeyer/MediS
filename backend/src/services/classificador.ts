import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const classificarImagem = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const filename = `${uuidv4()}.jpg`;
    const tempDir = path.join(__dirname, "..", "temp");
    const filepath = path.join(tempDir, filename);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(filepath, buffer);

    const scriptPath = path.join(
      __dirname,
      "../../../ia/classifySingleImage.py"
    );
    const python = spawn("python", [scriptPath, filepath]);

    let result = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("Inconsistência do Python:", data.toString());
    });

    python.on("close", (code) => {
      fs.unlinkSync(filepath);
      if (code === 0) {
        const lines = result.trim().split("\n");
        const lastLine = lines[lines.length - 1].trim();
        resolve(lastLine);
      } else {
        reject(new Error("Inconsistência ao classificar imagem"));
      }
    });
  });
};
