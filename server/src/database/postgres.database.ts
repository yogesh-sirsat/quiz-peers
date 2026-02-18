import pg, { QueryResult, QueryResultRow } from "pg";
import "dotenv/config";

const { Pool } = pg;

const devConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
};
const isProd = process.env.NODE_ENV === "production";
const prodConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(
  isProd ? prodConfig : prodConfig
);

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params as any[]); // pg type for params is any[], but unknown[] is safer for our callers
};
