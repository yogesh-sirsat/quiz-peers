import pg, { QueryResult, QueryResultRow } from "pg";
import "dotenv/config";

const { Pool } = pg;

const isProd = process.env.NODE_ENV === "production";

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : false,
    }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      ssl: isProd ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params as any[]); // pg type for params is any[], but unknown[] is safer for our callers
};
