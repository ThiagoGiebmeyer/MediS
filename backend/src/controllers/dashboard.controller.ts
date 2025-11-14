import { Request, Response } from "express";
import { Usuario } from "../database/models/usuarios.model";
import { Totem } from "../database/models/totens.model";
import { TotenColeta } from "../database/models/totens_coletas.model";

export const getDashboardData = async (req: Request, res: Response) => {
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
      { _id: 1, nome: 1, localizacao: 1 }
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
    console.error("❌ Erro no dashboard:", error);
    return res.status(500).json({
      error: true,
      messageError: "Erro ao carregar dados do dashboard: " + error,
      data: []
    });
  }
};
