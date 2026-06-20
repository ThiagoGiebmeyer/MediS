import { Request, Response } from "express";
import mongoose from "mongoose";
import { Totem } from "../database/models/totens-model";

const getUserId = (req: Request) => (req as any).user?.id as string | undefined;

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeInterval = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 60;
  return Math.floor(parsed);
};

const buildTotemPayload = (body: Record<string, unknown>, userId: string) => {
  const payload: Record<string, unknown> = {
    nome: normalizeString(body.nome).toUpperCase(),
    latitude: normalizeString(body.latitude),
    longitude: normalizeString(body.longitude),
    intervalo_coleta: normalizeInterval(body.intervalo_coleta),
    usuario_id: userId,
  };

  if (typeof body._id === "string" && mongoose.Types.ObjectId.isValid(body._id)) {
    payload._id = body._id;
  }

  return payload;
};

const getOwnedTotem = async (totemId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(totemId)) {
    return null;
  }

  return Totem.findOne({ _id: totemId, usuario_id: userId });
};

export const createTotem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não autenticado.",
        data: [],
      });
    }

    const nome = normalizeString(req.body?.nome);

    if (!nome) {
      return res.status(400).json({
        error: true,
        messageError: "O nome do totem é obrigatório.",
        data: [],
      });
    }

    const totem = await Totem.create(buildTotemPayload(req.body || {}, userId));

    return res.status(201).json({
      error: false,
      messageError: "",
      data: [totem],
    });
  } catch (error) {
    return res.status(400).json({
      error: true,
      messageError: error instanceof Error ? error.message : "Inconsistência ao criar totem.",
      data: [],
    });
  }
};

export const getTotens = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não autenticado.",
        data: [],
      });
    }

    const totens = await Totem.find({ usuario_id: userId }).sort({ criado_em: -1 });

    return res.status(200).json({
      error: false,
      messageError: "",
      data: totens,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: error instanceof Error ? error.message : "Inconsistência ao listar totens.",
      data: [],
    });
  }
};

export const getTotemById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const totemId = req.params?.totemId;

    if (!userId) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não autenticado.",
        data: [],
      });
    }

    if (!totemId) {
      return res.status(400).json({
        error: true,
        messageError: "Totem não informado.",
        data: [],
      });
    }

    const totem = await getOwnedTotem(totemId, userId);

    if (!totem) {
      return res.status(404).json({
        error: true,
        messageError: "Totem não encontrado.",
        data: [],
      });
    }

    return res.status(200).json({
      error: false,
      messageError: "",
      data: [totem],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: error instanceof Error ? error.message : "Inconsistência ao buscar totem.",
      data: [],
    });
  }
};

export const updateTotem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const totemId = req.params?.totemId;

    if (!userId) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não autenticado.",
        data: [],
      });
    }

    if (!totemId) {
      return res.status(400).json({
        error: true,
        messageError: "Totem não informado.",
        data: [],
      });
    }

    const updates = buildTotemPayload(req.body || {}, userId);
    delete updates.usuario_id;
    delete updates._id;

    const totem = await Totem.findOneAndUpdate(
      { _id: totemId, usuario_id: userId },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!totem) {
      return res.status(404).json({
        error: true,
        messageError: "Totem não encontrado.",
        data: [],
      });
    }

    return res.status(200).json({
      error: false,
      messageError: "",
      data: [totem],
    });
  } catch (error) {
    return res.status(400).json({
      error: true,
      messageError: error instanceof Error ? error.message : "Inconsistência ao atualizar totem.",
      data: [],
    });
  }
};

export const deleteTotem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const totemId = req.params?.totemId;

    if (!userId) {
      return res.status(401).json({
        error: true,
        messageError: "Usuário não autenticado.",
        data: [],
      });
    }

    if (!totemId) {
      return res.status(400).json({
        error: true,
        messageError: "Totem não informado.",
        data: [],
      });
    }

    const deleted = await Totem.findOneAndDelete({ _id: totemId, usuario_id: userId });

    if (!deleted) {
      return res.status(404).json({
        error: true,
        messageError: "Totem não encontrado.",
        data: [],
      });
    }

    return res.status(200).json({
      error: false,
      messageError: "",
      data: [deleted],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      messageError: error instanceof Error ? error.message : "Inconsistência ao remover totem.",
      data: [],
    });
  }
};

export const getConfig = async (req: Request, res: Response) => {
  req.params.totemId = req.params.totemId || req.query.totemId?.toString() || "";
  return getTotemById(req, res);
};
