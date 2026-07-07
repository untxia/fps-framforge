// api/auth.js — inscription / connexion (bcrypt + JWT). npm i bcryptjs jsonwebtoken pg
// POST /api/auth  body: { action:"signup"|"login", email, pseudo?, password }  -> { token, user:{...,tier} }
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./db.js";

async function tierDe(id) {
  const r = await query(
    `SELECT COALESCE(LOWER(o.nom),'gratuit') AS tier
       FROM utilisateur u
       LEFT JOIN abonnement a ON a.id_utilisateur=u.id_utilisateur AND a.statut='actif'
       LEFT JOIN offre o ON o.id_offre=a.id_offre
      WHERE u.id_utilisateur=$1
      ORDER BY o.niveau DESC NULLS LAST LIMIT 1`, [id]);
  return r.rows[0] ? r.rows[0].tier : "gratuit";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  const SECRET = process.env.JWT_SECRET;
  if (!SECRET) return res.status(500).json({ error: "JWT_SECRET manquant" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { action, email, pseudo, password } = body;
    if (!email || !password) return res.status(400).json({ error: "email et mot de passe requis" });

    if (action === "signup") {
      const hash = await bcrypt.hash(password, 10);
      const r = await query(
        `INSERT INTO utilisateur (email, pseudo, mot_de_passe_hash)
         VALUES ($1,$2,$3) RETURNING id_utilisateur, email, pseudo`,
        [email.toLowerCase(), pseudo || email.split("@")[0], hash]
      );
      const u = r.rows[0];
      const token = jwt.sign({ id: u.id_utilisateur, email: u.email }, SECRET, { expiresIn: "7d" });
      return res.status(201).json({ token, user: { ...u, tier: "gratuit" } });
    }

    if (action === "login") {
      const r = await query(
        `SELECT id_utilisateur, email, pseudo, mot_de_passe_hash FROM utilisateur WHERE email=$1`,
        [email.toLowerCase()]
      );
      if (!r.rows.length) return res.status(401).json({ error: "Identifiants invalides" });
      const u = r.rows[0];
      const ok = await bcrypt.compare(password, u.mot_de_passe_hash);
      if (!ok) return res.status(401).json({ error: "Identifiants invalides" });
      const token = jwt.sign({ id: u.id_utilisateur, email: u.email }, SECRET, { expiresIn: "7d" });
      const tier = await tierDe(u.id_utilisateur);
      return res.status(200).json({ token, user: { id_utilisateur: u.id_utilisateur, email: u.email, pseudo: u.pseudo, tier } });
    }
    return res.status(400).json({ error: "action inconnue (signup|login)" });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Email déjà utilisé" });
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
