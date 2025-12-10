import { Request, Response } from "express";
import { Totem } from "../database/models/totens.model";
import { TotenColeta } from "../database/models/totens_coletas.model";
import { Usuario } from "../database/models/usuarios.model";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

export const createSensorReading = async (req: Request, res: Response) => {
  console.log("--> Controller: Iniciando processamento...");

  try {
    const { temperatura, umidade, totem_id } = req.body;

    // 1. Validações Iniciais
    if (!req.file) {
      return res.status(400).json({ error: true, message: "Upload falhou." });
    }

    if (!totem_id || !temperatura || !umidade) {
      // Se faltar dados, apagamos a imagem temporária para não sujar o servidor
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: true, message: "Campos obrigatórios faltando." });
    }

    // 2. Lógica de Renomear o Arquivo
    // Pega o caminho antigo (temp_123.jpg)
    const oldPath = req.file.path;
    const pastaUploads = path.dirname(oldPath);
    const ext = path.extname(req.file.originalname);

    // Sanitiza o ID e cria o Timestamp
    const safeId = totem_id.toString().replace(/[^a-zA-Z0-9]/g, "");

    // Data Formatada (YYYYMMDD_HHmmss)
    const now = new Date();
    // Ajuste simples para fuso horário local (Brasil -3) se necessário, ou use UTC
    now.setHours(now.getHours() - 3);
    const timeString = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);

    // Novo Nome: ID_DATA.jpg
    const novoNomeArquivo = `${safeId}_${timeString}${ext}`;
    const newPath = path.join(pastaUploads, novoNomeArquivo);

    // Executa a renomeação no disco
    fs.renameSync(oldPath, newPath);

    console.log(`Arquivo renomeado de ${req.file.filename} para ${novoNomeArquivo}`);

    // 3. Caminho para salvar no Banco (Relativo para acesso web)
    const caminhoBanco = `uploads/${novoNomeArquivo}`;

    // 4. Conversão e Salvamento no DB
    const tempFloat = parseFloat(temperatura);
    const humFloat = parseFloat(umidade);

    if (!mongoose.Types.ObjectId.isValid(totem_id)) {
      return res.status(400).json({ error: true, message: "ID do Totem inválido." });
    }

    const novaLeitura = await TotenColeta.create({
      totem_id: totem_id,
      temperatura: tempFloat,
      umidade: humFloat,
      imagem: caminhoBanco,
    });

    console.log(`Leitura salva! ID: ${novaLeitura._id}`);

    return res.status(201).json({
      error: false,
      message: "Leitura registrada com sucesso",
      file: caminhoBanco
    });

  } catch (error) {
    console.error("Erro interno:", error);
    // Tenta limpar arquivo temporário se existir erro
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { }
    }
    return res.status(500).json({ error: true, message: "Erro interno." });
  }
};

// =========================
// READ ALL
// =========================
export const getAllReadings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // recebido do middleware de auth

    if (!userId) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não autenticado",
        data: []
      });
    }

    // Buscar usuário
    const usuario = await Usuario.findById(userId);

    if (!usuario) {
      return res.status(404).json({
        error: true,
        messageError: "Usuário não encontrado",
        data: []
      });
    }

    // Buscar totens vinculados ao usuário
    const totens = await Totem.find(
      { usuario_id: userId },
    );

    if (totens.length === 0) {
      return res.json({
        error: false,
        messageError: "",
        data: {
          totens: [],
          temperaturas: [],
          umidades: []
        }
      });
    }

    const totenIds = totens.map(t => t._id);

    // Buscar coletas dos últimos 7 dias
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const coletas = await TotenColeta.find({
      totem_id: { $in: totenIds },
      criado_em: { $gte: seteDiasAtras }
    })
      .sort({ criado_em: -1 });

    // Monta o array no formato solicitado
    const result = totens.map(totem => ({
      totem,
      coletas: coletas.filter(c => String(c.totem_id) === String(totem._id))
    }));

    return res.json({
      error: false,
      messageError: "",
      data: result
    });

  } catch (error) {
    console.error("❌ Inconsistência no dashboard:", error);
    return res.status(500).json({
      error: true,
      messageError: "Inconsistência ao carregar dados do dashboard: " + error,
      data: []
    });
  }
};

// =========================
// LAST READING
// =========================
export const getLastReading = async (req: Request, res: Response) => {
  try {
    const last = await TotenColeta.findOne().sort({ createdAt: -1 });

    return res.json({
      error: false,
      messageError: "",
      data: last ? [last] : []
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: "Inconsistência ao buscar última leitura.",
      data: []
    });
  }
};

// =========================
// STATS (para os cards)
// =========================
export const getReadingStats = async (req: Request, res: Response) => {
  try {
    const total = await TotenColeta.countDocuments();

    // totens que coletaram hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCollections = await TotenColeta.countDocuments({
      createdAt: { $gte: today },
    });

    return res.json({
      error: false,
      messageError: "",
      data: {
        totalColetas: total,
        coletasHoje: todayCollections
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: "Inconsistência ao buscar estatísticas.",
      data: []
    });
  }
};


