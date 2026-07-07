// api/tier.js — résout le palier réel (gratuit/pro/elite) d'un utilisateur à partir de son token JWT.
// Toujours vérifié côté serveur (jamais fait confiance au client) : lit la base d'abonnements.
import jwt from "jsonwebtoken";
import { query } from "./db.js";

export function tokenDe(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function tierServeur(token) {
  if (!token) return "gratuit";
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    const r = await query(
      `SELECT COALESCE(LOWER(o.nom),'gratuit') AS tier
         FROM utilisateur u
         LEFT JOIN abonnement a ON a.id_utilisateur=u.id_utilisateur AND a.statut='actif'
         LEFT JOIN offre o ON o.id_offre=a.id_offre
        WHERE u.id_utilisateur=$1 ORDER BY o.niveau DESC NULLS LAST LIMIT 1`, [p.id]);
    return r.rows[0] ? r.rows[0].tier : "gratuit";
  } catch (e) { return "gratuit"; }
}
