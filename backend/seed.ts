import mongoose from "mongoose";
import { Usuario, Totem, TotenColeta } from "./src/database/models/initModels";
import dotenv from "dotenv";
dotenv.config();

// 🔌 Conexão com MongoDB
const MONGO_URI = process.env.DB_URL || ''; // ajuste se necessário

async function runSeed() {
  await mongoose.connect(MONGO_URI);
  console.log("🔌 Conectado ao MongoDB");

  console.log("🧹 Limpando coleções...");
  await Usuario.deleteMany({});
  await Totem.deleteMany({});
  await TotenColeta.deleteMany({});

  // 👤 Criar usuário
  const usuario = await Usuario.create({
    nome: "Thiago",
    sobrenome: "Giebmeyer",
    email: "giebmeyerthiago@gmail.com",
    senha: "$2b$10$vACbo5gG8uGhEerzfDZ5E.GlMvN8LwEf/QdzeCk/BnrxRCaeMFAt.",
  });

  const usuario2 = await Usuario.create({
    nome: "Thiago",
    sobrenome: "Giebmeyer",
    email: "g@gmail.com",
    senha: "$2b$10$vACbo5gG8uGhEerzfDZ5E.GlMvN8LwEf/QdzeCk/BnrxRCaeMFAt.",
  });

  console.log("👤 Usuário criado:", usuario._id);
  console.log("👤 Usuário2 criado:", usuario2._id);

  // 🏢 Criar totem
  const totem = await Totem.create({
    nome: "Totem Central",
    latitude: "-27.5511",
    longitude: "-48.4567",
    usuario_id: usuario._id,
  });

  console.log("📟 Totem criado:", totem._id);

  const totem2 = await Totem.create({
    nome: "Totem Secundário",
    latitude: "-27.5511",
    longitude: "-48.4567",
    usuario_id: usuario._id,
  });

  console.log("📟 Totem2 criado:", totem2._id);

  const totem3 = await Totem.create({
    nome: "Totem Secundário",
    latitude: "-27.5511",
    longitude: "-48.4567",
    usuario_id: usuario2._id,
  });

  console.log("📟 Totem3 criado:", totem3._id);

  // 📊 Criar coleta

  const coletasData = [
    { temperatura: 22.5, umidade: 55, estagio: "normal", hora_coleta: "11:30" },
    { temperatura: 23.1, umidade: 50, estagio: "normal", hora_coleta: "11:35" },
    { temperatura: 24.0, umidade: 52, estagio: "alerta", hora_coleta: "11:40" },
    { temperatura: 25.2, umidade: 57, estagio: "alerta", hora_coleta: "11:45" },
    { temperatura: 26.4, umidade: 60, estagio: "critico", hora_coleta: "11:50" },
  ];

  const coletasData2 = [
    { temperatura: 50.0, umidade: 48, estagio: "alerta", hora_coleta: "23:40" },
    { temperatura: 15.5, umidade: 12, estagio: "normal", hora_coleta: "10:30" },
    { temperatura: -3.1, umidade: 10, estagio: "normal", hora_coleta: "05:35" },
  ];

  const coletasCriadas = [];
  const coletasCriadas2 = [];

  for (const c of coletasData) {
    const coleta = await TotenColeta.create({
      temperatura: c.temperatura,
      umidade: c.umidade,
      imagem: "imagem_base64_aqui",
      estagio: c.estagio,
      data_coleta: "2025-02-14",
      hora_coleta: c.hora_coleta,
      totem_id: totem._id,
    });

    coletasCriadas.push(coleta);
    console.log("📊 Coleta criada:", coleta._id);
  }

  for (const c of coletasData2) {
    const coleta = await TotenColeta.create({
      temperatura: c.temperatura,
      umidade: c.umidade,
      imagem: "imagem_base64_aqui",
      estagio: c.estagio,
      data_coleta: "2025-02-14",
      hora_coleta: c.hora_coleta,
      totem_id: totem2._id,
    });

    coletasCriadas2.push(coleta);
    console.log("📊 Coleta criada:", coleta._id);
  }

  console.log("Total de coletas criadas:", coletasCriadas.length);
  console.log("Total de coletas 2 criadas:", coletasCriadas2.length);


  console.log("✅ SEED FINALIZADO!");
  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error("Erro no seed:", err);
  mongoose.disconnect();
});
