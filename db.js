// api/db.js — connexion PostgreSQL partagée (Vercel/Netlify). npm i pg
import { Pool } from "pg";

// DATABASE_URL = postgres://user:pass@host:5432/frameforge
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);
export default pool;
