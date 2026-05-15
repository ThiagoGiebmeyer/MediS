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
- Integração com Gemini para classificação de imagens
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

### 3. **IA** (Google Gemini)
Motor de análise por Gemini para classificação de fases de crescimento da soja.

**Fases identificadas:**
- **Vegetativas:** VE (emergência), VC (cotilédone), V1-V3 (folhas), Vn (múltiplas folhas)
- **Reprodutivas:** R1-R3 (floração), R4-R6 (desenvolvimento de vagens), R7-R8 (maturação)

**Estrutura de pastas:**
```
ia/
└── (legado opcional) arquivos antigos de treino, caso ainda existam no projeto
```

**Configuração:**
- API Key do Gemini configurada no backend

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
- **Provedor:** Google Gemini API
- **Processamento:** envio da imagem em base64 para o modelo
- **Saída:** fase de crescimento, confiança e resumo em JSON

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
- Chave válida do Gemini API
- Acesso de saída HTTPS para `generativelanguage.googleapis.com`

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
GEMINI_API_KEY=sua_chave_do_gemini
GEMINI_MODEL=gemini-2.5-flash
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

## Licença

Este projeto é de uso acadêmico e não possui licença comercial definida.

## Contato

Para dúvidas ou sugestões sobre o projeto MediS, entre em contato através do repositório.

---

**Desenvolvido como projeto acadêmico de monitoramento agrícola com IA.**
