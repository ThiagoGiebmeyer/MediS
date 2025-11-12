import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Monitoramento de Plantas 🌱",
      version: "1.0.0",
      description:
        "Documentação da MediS - API de análise de crescimento e desenvolvimento de plantas",
      contact: {
        name: "Suporte MediS API",
        url: "https://medis.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de Desenvolvimento",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Token retornado no login",
        },
      },
    },
    tags: [
      {
        name: "Usuários",
        description: "Endpoints de autenticação e cadastro de usuários",
      },
      {
        name: "Totens",
        description: "Endpoints para gerenciamento de totens de monitoramento",
      },
      {
        name: "Leituras de Sensores",
        description: "Endpoints para gerenciamento das coletas dos sensores inclusos nos totens de monitoramento",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export default swaggerJsdoc(options);
