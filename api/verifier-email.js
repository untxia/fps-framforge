// api/verifier-email.js — confirme l'adresse email via le jeton envoyé par email.
// POST /api/verifier-email  body: { token }
import { query } from "./_lib/db.js";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { token } = body;
    if (!token) return res.status(400).json({ error: "token requis" });
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const r = await query(
      `SELECT id_jeton, id_utilisateur FROM jeton_action
        WHERE jeton_hash=$1 AND type='verification_email' AND utilise_le IS NULL AND expire_le > now()`,
      [hash]
    );
    if (!r.rows.length) return res.status(400).json({ error: "Lien invalide ou expiré" });
    const { id_jeton, id_utilisateur } = r.rows[0];

    await query(`UPDATE utilisateur SET email_verifie=TRUE WHERE id_utilisateur=$1`, [id_utilisateur]);
    await query(`UPDATE jeton_action SET utilise_le=now() WHERE id_jeton=$1`, [id_jeton]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
