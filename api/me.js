// api/me.js — renvoie l'utilisateur connecté et son palier réel (depuis la base).
import jwt from "jsonwebtoken";
import { query } from "./_lib/db.js";

export default async function handler(req, res) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "non authentifié" });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    const r = await query(
      `SELECT u.id_utilisateur, u.email, u.pseudo, COALESCE(LOWER(o.nom),'gratuit') AS tier
         FROM utilisateur u
         LEFT JOIN abonnement a ON a.id_utilisateur = u.id_utilisateur AND a.statut = 'actif'
         LEFT JOIN offre o ON o.id_offre = a.id_offre
        WHERE u.id_utilisateur = $1
        ORDER BY o.niveau DESC NULLS LAST
        LIMIT 1`,
      [p.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: "introuvable" });
    return res.status(200).json({ user: r.rows[0] });
  } catch (e) {
    return res.status(401).json({ error: "token invalide" });
  }
}
