# MediS - Sistema de Monitoramento Agrícola Inteligente

Plataforma web para monitoramento e análise de cultivos de soja utilizando inteligência artificial, sensores IoT e visualização geográfica em tempo real.

## Visão Geral

O MediS é uma solução completa que integra hardware (totens com sensores), backend (API REST), frontend (dashboard web) e análise por IA para auxiliar agricultores no acompanhamento de plantações de soja. O sistema permite:

- Monitoramento de temperatura e umidade via sensores em campo
- Visualização geográfica das áreas de plantio
- Análise de imagens para identificação de fases de crescimento da soja
- Filtros por período e histórico de leituras
- Interface moderna e responsiva

## Arquitetura do Sistema

O projeto é dividido em quatro componentes principais:

### 1. **Frontend** (Next.js + React)
Interface do usuário construída com Next.js 14 e React 19. Utiliza Tailwind CSS para estilização e componentes reutilizáveis.

**Principais funcionalidades:**
- Dashboard com gráficos de temperatura e umidade (Recharts)
- Mapa geográfico interativo das áreas de plantio
- Sistema de autenticação com JWT
- Temas personalizáveis (5 paletas de cores)
- Modal de análise de imagens com captura por câmera ou upload
- Filtros de data com presets rápidos (7/30/90 dias)

**Estrutura de pastas:**
```
frontend/
├── app/
│   ├── components/     # Componentes reutilizáveis
│   ├── dashboard/      # Página principal
│   ├── profile/        # Perfil do usuário
│   ├── login/          # Autenticação
│   └── signup/         # Cadastro
├── services/           # Clients da API
├── types/              # Definições TypeScript
└── utils/              # Funções auxiliares
```

### 2. **Backend** (Node.js + Express + MongoDB)
API RESTful que gerencia autenticação, dados de sensores e análise de imagens.

**Principais funcionalidades:**
- Autenticação JWT com middleware de autorização
- Gerenciamento de usuários e totens
- Armazenamento de leituras de sensores com timestamps
- Upload e processamento de imagens para análise
- Integração com serviço Python de classificação
- Validação com Joi e sanitização de dados

**Estrutura de pastas:**
```
backend/
├── src/
│   ├── config/         # Configurações (DB, JWT, Multer, Swagger)
│   ├── controllers/    # Lógica de negócio
│   ├── database/
│   │   └── models/     # Modelos Mongoose
│   ├── middlewares/    # Autenticação e validações
│   ├── routes/         # Definição de rotas
│   └── services/       # Serviços externos (classificador IA)
└── temp/               # Arquivos temporários (gitignored)
```

### 3. **IA** (Python + TensorFlow)
Modelo de deep learning para classificação de fases de crescimento da soja.

**Fases identificadas:**
- **Vegetativas:** VE (emergência), VC (cotilédone), V1-V3 (folhas), Vn (múltiplas folhas)
- **Reprodutivas:** R1-R3 (floração), R4-R6 (desenvolvimento de vagens), R7-R8 (maturação)

**Estrutura de pastas:**
```
ia/
├── classify-single-image.py  # Script de inferência
├── generate-and-train.py     # Treinamento do modelo
├── download-dataset.py       # Geração de dataset sintético
├── utils/
│   └── preprocess.py         # Pré-processamento de imagens
├── models/                   # Modelo treinado (.h5)
├── datasets/                 # Imagens para treinamento
└── venv/                     # Ambiente virtual Python
```

### 4. **Totem** (Arduino C++)
Firmware para ESP32 com câmera e sensores DHT22 que envia dados via WiFi.

**Hardware utilizado:**
- ESP32-CAM (captura de imagens)
- Sensor DHT22 (temperatura e umidade)
- GPS (coordenadas geográficas)

## Tecnologias Utilizadas

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI/UX:** React 19, Tailwind CSS 3
- **Gráficos:** Recharts 3.4
- **Ícones:** Lucide React
- **HTTP:** Axios com interceptors JWT
- **Notificações:** React Hot Toast
- **Mapas:** Leaflet (via dynamic import)

### Backend
- **Runtime:** Node.js 18+ com TypeScript
- **Framework:** Express.js
- **Banco de dados:** MongoDB + Mongoose ODM
- **Autenticação:** JWT (jsonwebtoken + bcrypt)
- **Upload:** Multer (memoryStorage para análise)
- **Validação:** Joi
- **Documentação:** Swagger/OpenAPI
- **Dev tools:** ts-node-dev, nodemon

### IA
- **ML Framework:** TensorFlow 2.15+ / Keras
- **Processamento:** NumPy, OpenCV, Pillow
- **Modelo:** CNN (Convolutional Neural Network)
- **Entrada:** Imagens 224x224 RGB
- **Saída:** 14 classes (fases de crescimento)

### IoT
- **Plataforma:** Arduino IDE / PlatformIO
- **Microcontrolador:** ESP32
- **Protocolos:** HTTP/REST, WiFi 802.11

## Requisitos de Ambiente

### Frontend
```json
{
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
}
```

### Backend
```json
{
  "node": ">=18.0.0",
  "mongodb": ">=5.0.0"
}
```

### IA
```
Python: 3.10, 3.11 ou 3.12 (TensorFlow não suporta 3.13+)
pip: >=23.0
```

## Instalação e Configuração

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/MediS.git
cd MediS
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Criar arquivo `.env` na raiz do backend:
```env
DB_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/medis
JWT_SECRET=sua_chave_secreta_segura_aqui
PORT=3001
USE_MOCK_CLASSIFIER=true  # Mudar para false após treinar modelo
```

Iniciar servidor:
```bash
npm run dev
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

Criar arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost
NEXT_PUBLIC_API_PORT=3001
```

Iniciar aplicação:
```bash
npm run dev
```

### 4. Configurar IA

**Instalar Python 3.12 (recomendado):**
```bash
# Windows (com Chocolatey)
choco install python312

# macOS (com Homebrew)
brew install python@3.12

# Linux (Ubuntu/Debian)
sudo apt install python3.12 python3.12-venv
```

**Configurar ambiente virtual:**
```bash
cd ia
python3.12 -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate
```

**Instalar dependências:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Gerar dataset e treinar modelo:**
```bash
# Gerar 420 imagens sintéticas
python download-dataset.py

# Treinar modelo (5 épocas, ~3-5 min)
python generate-and-train.py
```

**Ativar modelo no backend:**
Editar `backend/.env`:
```env
USE_MOCK_CLASSIFIER=false
```

Reiniciar o backend.

## Executando o Projeto

Com todos os componentes configurados:

1. **Backend:** `cd backend && npm run dev` (porta 3001)
2. **Frontend:** `cd frontend && npm run dev` (porta 3000)
3. **IA:** Ambiente virtual deve estar ativado para o backend usar

Acessar: http://localhost:3000

## Estrutura de Dados

### Usuário
```typescript
{
  _id: ObjectId,
  nome: string,
  sobrenome: string,
  email: string (único),
  senha: string (hash bcrypt),
  criado_em: Date,
  alterado_em: Date
}
```

### Totem
```typescript
{
  _id: ObjectId,
  nome: string,
  localizacao: { latitude: number, longitude: number },
  status: 'ativo' | 'inativo',
  usuario_id: ObjectId (ref: Usuario)
}
```

### Leitura de Sensor
```typescript
{
  _id: ObjectId,
  totem_id: ObjectId (ref: Totem),
  temperatura: number,
  umidade: number,
  timestamp: Date
}
```

### Análise de Imagem
```typescript
{
  fase_crescimento: 'VE' | 'VC' | 'V1' | ... | 'R8',
  confianca: number (0-1),
  timestamp: Date
}
```

## Fluxo de Análise de Imagem

1. Usuário captura foto via câmera ou faz upload
2. Frontend envia imagem como FormData para `/api/analise`
3. Backend valida (tipo JPEG/PNG, tamanho máx 15MB)
4. Imagem é salva temporariamente em buffer
5. Script Python `classify-single-image.py` é executado
6. Modelo CNN processa imagem 224x224
7. Resultado (fase + confiança) retorna ao frontend
8. Arquivo temporário é deletado

## Modo Mock (Desenvolvimento)

Para desenvolvimento sem modelo treinado:
```env
USE_MOCK_CLASSIFIER=true
```

Retorna fases aleatórias válidas para testes da interface.

## Segurança

- Senhas com hash bcrypt (salt rounds: 10)
- JWT com expiração configurável
- Middleware de autenticação em rotas protegidas
- Sanitização de inputs do usuário
- Validação de tipos de arquivo (whitelist)
- CORS configurado para origens permitidas
- Variáveis sensíveis em `.env` (gitignored)

## Roadmap

- [ ] Previsão de pragas e doenças
- [ ] Notificações push para alertas
- [ ] Exportação de relatórios em PDF
- [ ] Integração com APIs meteorológicas
- [ ] Suporte a outras culturas (milho, trigo)
- [ ] App mobile (React Native)
- [ ] Dashboard administrativo
- [ ] Machine learning para predição de colheita

## Licença

Este projeto é de uso acadêmico e não possui licença comercial definida.

## Contato

Para dúvidas ou sugestões sobre o projeto MediS, entre em contato através do repositório.

---

**Desenvolvido como projeto acadêmico de monitoramento agrícola com IA.**
