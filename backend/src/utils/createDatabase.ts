import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const createDatabaseIfNotExists = async () => {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: 5432,
    database: process.env.DB_NAME,
  });

  await client.connect();

  const dbName = process.env.DB_NAME;

  const result = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName]
  );

  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Banco de dados '${dbName}' criado com sucesso.`);
  } else {
    console.log(`ℹ️  Banco de dados '${dbName}' já existe.`);
  }

  await client.end();
};
