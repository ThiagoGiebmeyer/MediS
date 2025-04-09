// src/config/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Monitoramento de Plantas 🌱",
      version: "1.0.0",
      description:
        "Documentação da API de analise de crescimento e desenvolvimento da soja",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export default swaggerJsdoc(options);
