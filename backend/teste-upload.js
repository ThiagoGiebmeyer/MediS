const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// 1. Configura pasta de uploads na raiz
const uploadDir = path.join(__dirname, 'uploads_teste');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// 2. Configura Multer Simples
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `teste_${Date.now()}.jpg`)
});
const upload = multer({ storage });

// 3. Middleware de Debug para ver se os bytes estão chegando
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] Requisição recebida: ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// 4. Rota EXATA que o ESP32 está chamando
// Caminho: /api/totem/reading/upload
const router = express.Router();
router.post('/totem/reading/upload', upload.single('image'), (req, res) => {
  console.log('--- DENTRO DA ROTA ---');
  if (req.file) {
    console.log('✅ SUCESSO! Arquivo salvo em:', req.file.path);
    console.log('Tamanho:', req.file.size);
    return res.status(200).json({ status: 'ok', id: 'teste123' });
  } else {
    console.log('❌ ERRO: Multer rodou, mas req.file está vazio.');
    // Se o body chegou, vamos printar pra ver o que tem
    console.log('Body recebido:', req.body);
    return res.status(400).json({ error: 'No file' });
  }
});

app.use('/api', router);

// 5. Tratamento de erros do Multer
app.use((err, req, res, next) => {
  console.error('🔥 ERRO NO SERVIDOR:', err.message);
  res.status(500).json({ error: err.message });
});

// Inicia ouvindo em TODOS os IPs
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SERVIDOR DE TESTE RODANDO EM http://0.0.0.0:${PORT}`);
  console.log(`📂 Salvando arquivos em: ${uploadDir}`);
  console.log('Aguardando ESP32...');
});