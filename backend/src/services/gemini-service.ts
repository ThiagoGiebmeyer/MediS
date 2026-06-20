import fs from "fs";
import crypto from "crypto";
import path from "path";

export type AnaliseGeminiResultado = {
  cultura: string;
  fase_crescimento: string;
  confianca: number;
  justificativa_confianca: string;
  resumo: string;
  sinais_observados: string[];
  resposta_bruta: string;
  modelo: string;
  prompt_versao: string;
};

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

type GeminiContent = {
  role?: string;
  parts: GeminiPart[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GeminiAnalysisPayload = {
  cultura?: unknown;
  fase_crescimento?: unknown;
  confianca?: unknown;
  justificativa_confianca?: unknown;
  resumo?: unknown;
  sinais_observados?: unknown;
};

const GROWTH_PHASES = [
  "VE",
  "VC",
  "V1",
  "V2",
  "V3",
  "Vn",
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
];

const UNKNOWN_PHASE_TOKENS = new Set([
  "DESCONHECIDO",
  "UNKNOWN",
  "NA",
  "N/A",
  "INDEFINIDO",
  "INCONCLUSIVO",
]);

const GEMINI_API_KEY = String(
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "",
).trim();
const GEMINI_MODEL = String(
  process.env.GEMINI_MODEL || "gemini-2.5-flash",
).trim();

const GEMINI_ANALYSIS_MODE = process.env.GEMINI_ANALYSIS_MODE;

const IS_FAKE_ANALYSIS_MODE = GEMINI_ANALYSIS_MODE === "fake";

const PROMPT_VERSION = IS_FAKE_ANALYSIS_MODE
  ? "soja-fake-v1-2026-04-27"
  : "soja-dev-v4-2026-06-20";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: [
    "cultura",
    "fase_crescimento",
    "confianca",
    "justificativa_confianca",
    "resumo",
    "sinais_observados",
  ],
  properties: {
    cultura: { type: "STRING" },
    fase_crescimento: { type: "STRING" },
    confianca: { type: "NUMBER" },
    justificativa_confianca: { type: "STRING" },
    resumo: { type: "STRING" },
    sinais_observados: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
} as const;

const ANALISE_PROMPT_DEV = [
  "Você é um especialista em agronomia e visão computacional, focado exclusivamente em soja.",

  "Tarefa:",
  "Analise a imagem e determine a fase de crescimento da soja com base em características visuais.",
  "Considere apenas soja. Se a imagem não trouxer evidências suficientes de soja, mantenha a melhor inferência possível com confiança baixa.",

  "Regras de saída (obrigatórias):",
  "- Responda APENAS com JSON válido.",
  "- Não use markdown, crases, comentários ou texto fora do JSON.",
  "- Retorne o JSON em uma única linha.",
  "- Use exatamente as chaves especificadas, sem adicionar ou remover campos.",

  "Formato obrigatório:",
  "{",
  '  "cultura": "soja",',
  '  "fase_crescimento": "VE|VC|V1|V2|V3|Vn|R1|R2|R3|R4|R5|R6|R7|R8|desconhecido",',
  '  "confianca": 0.0,',
  '  "justificativa_confianca": "frase curta explicando por que a confiança está nesse nível",',
  '  "resumo": "descrição curta em português",',
  '  "sinais_observados": ["folhas trifolioladas", "flores", "vagens"]',
  "}",

  "Critérios de análise:",
  "- Considere número de folhas trifolioladas, porte, presença de flores, vagens ou sementes.",
  "- Estágios V = vegetativo, R = reprodutivo.",
  "- Use Vn quando não for possível determinar o número exato de folhas.",
  "- Baseie-se apenas no que é visível na imagem.",
  "- Se houver vagens/pods visíveis, trate a imagem como fase reprodutiva (R) e não retorne 'desconhecido'.",
  "- Se houver vagens bem formadas ou sementes em enchimento, prefira R4, R5 ou R6 conforme a evidência visual.",
  "- Se houver apenas vagens visíveis sem detalhes suficientes, use R3 de forma conservadora.",

  "Confiabilidade:",
  "- 'confianca' deve ser um número entre 0.0 e 1.0.",
  "- Alta confiança: imagem clara e características evidentes.",
  "- Média: alguns sinais presentes, mas não conclusivos.",
  "- Baixa: imagem ambígua ou incompleta.",
  "- 'justificativa_confianca' deve explicar em 1 frase curta por que o nível de confiança foi atribuído.",
  "- Relacione a justificativa com evidências visuais, ausência de detalhes ou ambiguidades da imagem.",

  "Fallback obrigatório:",
  "- Se não for possível determinar com segurança:",
  '- Use "fase_crescimento": "Vn"',
  "- Defina 'confianca' menor ou igual a 0.3",

  "Resumo:",
  "- Máximo de 1 frase.",
  "- Justifique com base em evidências visuais (ex: presença de folhas, flores, etc).",
].join("\n");

const ANALISE_PROMPT_FAKE = [
  "Modo FAKE de análise: gere dados de teste realistas com anomalias ocasionais.",
  "Tarefa:",
  "Simule um diagnóstico agrícola factível baseado na imagem. Gere variação aleatória mas COERENTE. NÃO retorne 'desconhecido' — sempre escolha uma fase válida (VE-V3, Vn, ou R1-R8).",
  "",
  "Instruções de geração:",
  "1. ANOMALIAS ocasionais (10-20% dos casos): exemplo, reportar lesões, desnutrição, clorose.",
  "2. FASES variadas: distribuir aleatoriamente entre todas as fases válidas.",
  "3. CONFIANÇA realista: variar entre 0.4 e 0.95 (nunca muito certa, nunca incerta demais).",
  "4. SINAIS coerentes: adaptar sinais observados à fase escolhida.",
  "5. NUNCA retornar 'desconhecido' — sempre inferir uma fase.",
  "6. RESUMO conciso: máximo 1 frase, justificativa breve.",
  "",
  "Fases de exemplo:",
  "- Vegetativo (VE, VC, V1-V3): folhas iniciais, sem flores/vagens.",
  "- Indeterminado (Vn): quando não há clareza.",
  "- Reprodutivo (R1-R8): flores iniciais até colheita.",
  "",
  "Regras de saída (obrigatórias):",
  "- Responda APENAS com JSON válido.",
  "- Não use markdown, crases, comentários ou texto fora do JSON.",
  "- Retorne o JSON em uma única linha.",
  "- Use exatamente as chaves especificadas, sem adicionar ou remover campos.",
  "",
  "Formato obrigatório:",
  "{",
  '  "cultura": "soja",',
  '  "fase_crescimento": "VE|VC|V1|V2|V3|Vn|R1|R2|R3|R4|R5|R6|R7|R8",',
  '  "confianca": número entre 0.4 e 0.95,',
  '  "justificativa_confianca": "frase curta sobre por que a confiança foi atribuída",',
  '  "resumo": "descrição coerente, máx 1 frase, em português",',
  '  "sinais_observados": ["sinal1", "sinal2", "sinal3"]',
  "}",
].join("\n");

if (IS_FAKE_ANALYSIS_MODE) {
  console.warn("⚠️ Modo FAKE de análise ativado (GEMINI_ANALYSIS_MODE=fake)");
} else {
  console.log("✅ Modo REAL de análise ativado (GEMINI_ANALYSIS_MODE=real)");
}

const ANALISE_PROMPT = IS_FAKE_ANALYSIS_MODE
  ? ANALISE_PROMPT_FAKE
  : ANALISE_PROMPT_DEV;

const FAKE_VEGETATIVE_PHASES = ["VE", "VC", "V1", "V2", "V3", "Vn"] as const;
const FAKE_REPRODUCTIVE_PHASES = [
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
] as const;

const FAKE_SIGNAL_BANK: Record<string, string[]> = {
  VE: ["plântula emergida", "cotilédones visíveis", "folhas iniciais"],
  VC: ["primeiras folhas verdadeiras", "caules jovens", "dossel baixo"],
  V1: [
    "uma folha trifoliolada",
    "crescimento vegetativo inicial",
    "folhagem jovem",
  ],
  V2: ["duas folhas trifolioladas", "porte baixo", "folhas bem formadas"],
  V3: [
    "três folhas trifolioladas",
    "canópia em expansão",
    "folhas trifolioladas visíveis",
  ],
  Vn: [
    "vegetativo sem contagem precisa",
    "folhagem em desenvolvimento",
    "estrutura vegetativa indefinida",
  ],
  R1: ["flores iniciais", "botões florais", "início reprodutivo"],
  R2: [
    "flores abertas",
    "flores brancas visíveis",
    "transição para fase reprodutiva",
  ],
  R3: [
    "vagens pequenas",
    "início de formação de vagens",
    "flores remanescentes",
  ],
  R4: [
    "vagens em desenvolvimento",
    "enchimento inicial",
    "estrutura reprodutiva ativa",
  ],
  R5: [
    "vagens em enchimento",
    "grãos se formando",
    "fase reprodutiva avançada",
  ],
  R6: ["grãos em enchimento", "vagens bem formadas", "maturação avançando"],
  R7: ["maturação inicial", "folhas amarelando", "vagens maduras"],
  R8: ["maturação final", "senescência", "colheita próxima"],
};

const FAKE_ANOMALIES = [
  "leve clorose",
  "pequenas manchas foliares",
  "estresse hídrico leve",
  "sinais discretos de desnutrição",
];

const pickByIndex = <T>(items: readonly T[], index: number) =>
  items[index % items.length];

const gerarAnaliseFakeLocal = (buffer: Buffer): AnaliseGeminiResultado => {
  const hashHex = crypto.createHash("sha256").update(buffer).digest("hex");
  const hashNumber = Number.parseInt(hashHex.slice(0, 8), 16);
  const vegetative = hashNumber % 100 < 60;

  const phase = vegetative
    ? pickByIndex(FAKE_VEGETATIVE_PHASES, hashNumber)
    : pickByIndex(FAKE_REPRODUCTIVE_PHASES, hashNumber);

  const baseSignals = [...(FAKE_SIGNAL_BANK[phase] || FAKE_SIGNAL_BANK.Vn)];
  const anomalyIndex = hashNumber % 100;
  const hasAnomaly = anomalyIndex >= 78;

  if (hasAnomaly) {
    baseSignals.unshift(pickByIndex(FAKE_ANOMALIES, hashNumber >> 3));
  }

  const sinaisObservados = baseSignals.slice(0, 3);
  const confianca = Number(((55 + (hashNumber % 36)) / 100).toFixed(2));
  const justificativaConfianca = hasAnomaly
    ? `Confiança moderada porque a imagem é coerente, mas traz sinais discretos de anomalia e menos detalhe visual.`
    : phase.startsWith("R")
      ? `Confiança boa porque as vagens e o padrão reprodutivo estão visíveis na imagem.`
      : `Confiança moderada porque a estrutura vegetativa é visível, mas a contagem exata de folhas ainda não está totalmente nítida.`;
  const resumo = hasAnomaly
    ? `Imagem de soja em ${phase}, com ${sinaisObservados[0]} e ${sinaisObservados[1] || sinaisObservados[0]}.`
    : `Imagem de soja em ${phase}, com ${sinaisObservados[0]} como principal evidência visual.`;

  const rawPayload = {
    cultura: "soja",
    fase_crescimento: phase,
    confianca,
    justificativa_confianca: justificativaConfianca,
    resumo,
    sinais_observados: sinaisObservados,
  };

  return {
    cultura: "soja",
    fase_crescimento: phase,
    confianca,
    justificativa_confianca: justificativaConfianca,
    resumo,
    sinais_observados: sinaisObservados,
    resposta_bruta: JSON.stringify(rawPayload),
    modelo: GEMINI_MODEL,
    prompt_versao: PROMPT_VERSION,
  };
};

const ensureGeminiConfigured = () => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Defina a chave da API do Gemini no ambiente.",
    );
  }
};

const parseJsonFromText = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Resposta vazia do Gemini");
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  const jsonText =
    firstBrace >= 0 && lastBrace >= 0
      ? candidate.slice(firstBrace, lastBrace + 1)
      : candidate;

  return JSON.parse(jsonText);
};

const sanitizeGeminiText = (text: string) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced?.[1] || trimmed).trim();
};

const extractTextBetween = (
  text: string,
  startIndex: number,
  endMarkers: RegExp[],
) => {
  let endIndex = text.length;

  for (const marker of endMarkers) {
    const remaining = text.slice(startIndex + 1);
    const match = remaining.match(marker);
    if (!match || match.index === undefined) {
      continue;
    }

    const candidateEnd = startIndex + 1 + match.index;
    if (candidateEnd > startIndex && candidateEnd < endIndex) {
      endIndex = candidateEnd;
    }
  }

  return text.slice(startIndex, endIndex).trim();
};

const extractStringField = (text: string, field: string) => {
  const regex = new RegExp(
    `"${field}"\\s*:\\s*(?:"((?:\\\\.|[^"\\\\])*)"|([^,}\\n]+))`,
    "i",
  );
  const match = text.match(regex);
  const value = match?.[1] || match?.[2] || "";
  return String(value).replace(/^"|"$/g, "").trim();
};

const extractSummaryField = (text: string) => {
  const keyMatch = text.match(/"resumo"\s*:/i);
  if (!keyMatch || keyMatch.index === undefined) {
    return "";
  }

  const startIndex = keyMatch.index + keyMatch[0].length;
  const summarySlice = text.slice(startIndex).trim();
  const extracted = extractTextBetween(summarySlice, 0, [
    /,\s*"sinais_observados"\s*:/i,
    /}\s*$/i,
  ]);

  return extracted.replace(/^"|"$/g, "").trim();
};

const extractSignalsField = (text: string) => {
  const regex = /"sinais_observados"\s*:\s*\[([\s\S]*?)\]/i;
  const match = text.match(regex);
  if (!match?.[1]) {
    return [] as string[];
  }

  return match[1]
    .split(",")
    .map((item) => item.replace(/^\s*"|"\s*$/g, "").trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);
};

const recoverAnalysisPayload = (text: string): GeminiAnalysisPayload => ({
  cultura: extractStringField(text, "cultura") || "soja",
  fase_crescimento:
    extractStringField(text, "fase_crescimento") || "desconhecido",
  confianca: extractStringField(text, "confianca") || 0,
  justificativa_confianca:
    extractStringField(text, "justificativa_confianca") ||
    "A confiança foi inferida a partir das evidências visuais disponíveis na imagem.",
  resumo: extractSummaryField(text),
  sinais_observados: extractSignalsField(text),
});

const normalizeJustificativaConfianca = (value: unknown, confidence: number) => {
  const raw = String(value || "").trim();

  if (raw) {
    return raw;
  }

  if (confidence >= 0.75) {
    return "A confiança é alta porque a imagem apresenta evidências visuais claras para a classificação.";
  }

  if (confidence >= 0.45) {
    return "A confiança é moderada porque há sinais visuais úteis, mas com alguma limitação de detalhe.";
  }

  return "A confiança é baixa porque a imagem tem evidências visuais limitadas ou ambíguas.";
};

const normalizePhase = (value: unknown) => {
  const rawInput = String(value || "").trim();

  if (!rawInput) {
    return "desconhecido";
  }

  const rawUpper = rawInput.toUpperCase();
  const normalized = rawUpper === "VN" ? "Vn" : rawUpper;

  if (GROWTH_PHASES.includes(normalized)) {
    return normalized;
  }

  if (UNKNOWN_PHASE_TOKENS.has(rawUpper)) {
    return "desconhecido";
  }

  return "desconhecido";
};

const normalizeConfidence = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  if (numeric > 1) {
    return Math.max(0, Math.min(1, numeric / 100));
  }

  return Math.max(0, Math.min(1, numeric));
};

const normalizeSignals = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);
};

const inferPhaseFromSignals = (signals: string[], summary: string) => {
  const haystack = [summary, ...signals].join(" ").toLowerCase();

  if (/(seed|sement|grão|grao|enchimento|filled)/i.test(haystack)) {
    return "R5";
  }

  if (/(vagem|vagens|pod|pods)/i.test(haystack)) {
    return "R3";
  }

  if (/(flor|flores|flower|flowers)/i.test(haystack)) {
    return "R1";
  }

  return "desconhecido";
};

const mimeTypeFromPath = (filepath: string) => {
  const ext = path.extname(filepath).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
};

const buildGeminiPayload = (
  base64Image: string,
  mimeType: string,
): {
  contents: GeminiContent[];
  generationConfig: Record<string, unknown>;
} => {
  const temperature = IS_FAKE_ANALYSIS_MODE ? 0.7 : 0.2;

  if (IS_FAKE_ANALYSIS_MODE) {
    console.warn(
      "⚠️ Gerando respostas FAKE (GEMINI_ANALYSIS_MODE=fake): usando temperature=" +
        temperature,
    );
  } else {
    console.log(
      "ℹ️ Gerando respostas DEV (GEMINI_ANALYSIS_MODE=dev): usando temperature=" +
        temperature,
    );
  }

  return {
    contents: [
      {
        role: "user",
        parts: [
          { text: ANALISE_PROMPT },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      topK: 1,
      topP: 0.95,
      maxOutputTokens: 1024,
      thinkingConfig: {
        thinkingBudget: 0,
      },
      responseMimeType: "application/json",
      responseSchema: GEMINI_RESPONSE_SCHEMA,
    },
  };
};

const executarGemini = async (
  buffer: Buffer,
  mimeType: string,
): Promise<AnaliseGeminiResultado> => {
  ensureGeminiConfigured();

  if (IS_FAKE_ANALYSIS_MODE) {
    return gerarAnaliseFakeLocal(buffer);
  }

  const payload = buildGeminiPayload(buffer.toString("base64"), mimeType);
  const response = await fetch(
    `${GEMINI_ENDPOINT}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const respostaBruta = await response.text();

  if (!response.ok) {
    throw new Error(
      `Gemini retornou erro HTTP ${response.status}: ${respostaBruta}`,
    );
  }

  let parsedResponse: GeminiResponse | null = null;

  try {
    parsedResponse = JSON.parse(respostaBruta) as GeminiResponse;
  } catch {
    parsedResponse = null;
  }

  const text =
    parsedResponse?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

  const rawText = sanitizeGeminiText(text || respostaBruta);

  if (parsedResponse?.candidates?.[0] && rawText && respostaBruta.includes("MAX_TOKENS")) {
    console.warn("Gemini respondeu com finishReason MAX_TOKENS; a saída pode estar truncada.");
  }

  if (!rawText.trim()) {
    throw new Error("Gemini não retornou conteúdo textual para análise.");
  }

  let parsed: GeminiAnalysisPayload | null = null;

  try {
    parsed = parseJsonFromText(rawText) as GeminiAnalysisPayload;
  } catch {
    parsed = recoverAnalysisPayload(rawText);
  }

  const parsedCulture = String(parsed?.cultura || "soja").trim() || "soja";
  const parsedConfidence = normalizeConfidence(parsed?.confianca);
  const parsedConfidenceJustification = normalizeJustificativaConfianca(
    parsed?.justificativa_confianca,
    parsedConfidence,
  );
  const parsedSignals = normalizeSignals(parsed?.sinais_observados);
  const parsedSummary = String(
    parsed?.resumo || "Sem resumo fornecido pelo modelo.",
  ).trim();
  const parsedPhase = (() => {
    const normalizedPhase = normalizePhase(parsed?.fase_crescimento);
    if (normalizedPhase !== "desconhecido") {
      return normalizedPhase;
    }

    return inferPhaseFromSignals(parsedSignals, parsedSummary);
  })();

  return {
    cultura: parsedCulture,
    fase_crescimento: parsedPhase,
    confianca: parsedConfidence,
    justificativa_confianca: parsedConfidenceJustification,
    resumo: parsedSummary,
    sinais_observados: parsedSignals,
    resposta_bruta: rawText,
    modelo: GEMINI_MODEL,
    prompt_versao: PROMPT_VERSION,
  };
};

export const classificarImagemPorArquivo = async (
  filepath: string,
): Promise<AnaliseGeminiResultado> => {
  if (!filepath || !fs.existsSync(filepath)) {
    throw new Error("Arquivo da imagem não encontrado para classificação");
  }

  const buffer = await fs.promises.readFile(filepath);
  return executarGemini(buffer, mimeTypeFromPath(filepath));
};

export const classificarImagem = async (
  buffer: Buffer,
  mimeType = "image/jpeg",
): Promise<AnaliseGeminiResultado> => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Buffer da imagem é inválido");
  }

  return executarGemini(buffer, mimeType);
};
